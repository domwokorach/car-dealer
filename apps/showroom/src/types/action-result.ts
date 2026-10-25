/** Serializable result returned by Server Actions to client components. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function failure(message: string, fieldErrors?: Record<string, string>): { ok: false; message: string; fieldErrors?: Record<string, string> } {
  return fieldErrors ? { ok: false, message, fieldErrors } : { ok: false, message };
}
