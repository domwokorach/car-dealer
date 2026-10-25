import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../../config/config.module';
import { storageConfigured, type Env } from '../../config/env';

/** Boundary around object storage so the service logic is testable without Supabase. */
export abstract class StorageGateway {
  abstract createSignedUpload(path: string): Promise<{ uploadUrl: string; token: string }>;
  abstract download(path: string): Promise<Uint8Array | null>;
  abstract remove(path: string): Promise<void>;
  abstract publicUrl(path: string): string;
}

@Injectable()
export class SupabaseStorageGateway extends StorageGateway {
  private readonly client?: SupabaseClient;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(@Inject(ENV) env: Env) {
    super();
    this.bucket = env.SUPABASE_STORAGE_BUCKET;
    this.baseUrl = (env.SUPABASE_URL ?? 'https://storage.unconfigured.invalid').replace(/\/$/, '');
    if (storageConfigured(env)) {
      // Service-role key: server-only, never returned to clients.
      this.client = createClient(env.SUPABASE_URL as string, env.SUPABASE_SERVICE_ROLE_KEY as string, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
  }

  private requireClient(): SupabaseClient {
    if (!this.client) throw new ServiceUnavailableException('Image storage is not configured on this server');
    return this.client;
  }

  async createSignedUpload(path: string) {
    const { data, error } = await this.requireClient().storage.from(this.bucket).createSignedUploadUrl(path);
    if (error || !data) throw new Error(`Signed upload failed: ${error?.message}`);
    return { uploadUrl: data.signedUrl, token: data.token };
  }

  async download(path: string) {
    const { data, error } = await this.requireClient().storage.from(this.bucket).download(path);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  }

  async remove(path: string) {
    await this.requireClient().storage.from(this.bucket).remove([path]);
  }

  publicUrl(path: string) {
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${path}`;
  }
}
