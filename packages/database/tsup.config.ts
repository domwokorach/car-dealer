import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@prisma/client'],
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.js' }),
});
