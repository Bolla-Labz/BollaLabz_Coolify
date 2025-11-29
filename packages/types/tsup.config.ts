import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/api.ts', 'src/contacts.ts', 'src/voice.ts', 'src/productivity.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  skipNodeModulesBundle: true,
  tsconfig: './tsconfig.json'
});