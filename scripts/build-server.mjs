import { build } from 'esbuild';

await build({
  entryPoints: ['app.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  minify: true,
  sourcemap: true,
  outfile: 'dist/server.js',
  external: ['snarkjs', 'mongodb'],
});
