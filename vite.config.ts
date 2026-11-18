import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Writes dist/precache.json: every file of the built site plus a version hash, so the
 * service worker (public/sw.js) can save the whole site for offline play.
 */
function precacheList(): Plugin {
  let outDir = 'dist';
  return {
    name: 'brainplay-precache',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      const skip = new Set(['sw.js', 'precache.json', 'CNAME']);
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const p = join(dir, name);
          if (statSync(p).isDirectory()) walk(p);
          else if (!skip.has(relative(outDir, p))) files.push(p);
        }
      };
      walk(outDir);
      const hash = createHash('sha256');
      const urls = files.sort().map((p) => {
        hash.update(p).update(readFileSync(p));
        return '/' + relative(outDir, p).split('\\').join('/');
      });
      urls.push('/');
      writeFileSync(join(outDir, 'precache.json'), JSON.stringify({ version: hash.digest('hex').slice(0, 12), files: urls }));
    },
  };
}

export default defineConfig({
  plugins: [react(), precacheList()],
  base: '/',
  test: {
    environment: 'jsdom',
  },
});
