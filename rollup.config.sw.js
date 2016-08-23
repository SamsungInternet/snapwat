/**
 * Rollup build for the service worker script. Thanks to Rich Harris:
 * https://gitlab.com/Rich-Harris/rollup-cache-manifest-example
 */
import fs from 'fs';
import path from 'path';
import glob from 'glob-all';

function generateCacheManifest(options) {
  return {
    resolveId(id) {
      if (id === options.id) {
        return id;
      }
    },
    load(id) {
      if (id === options.id) {
        // Pass in relative filepaths to glob, then prefix with '/' for cache list
        const files = glob.sync(options.patterns)
          .map(file => `/${file}`);
        return `export default ${JSON.stringify(files)};`;
      }
    }
  }
}

export default {
  entry: 'src/sw.js',
  plugins: [
    // \0 is a plugin convention indicating a 'virtual module' as opposed to stuff from the filesystem
    generateCacheManifest({
      id: '\0cache-manifest',
      patterns: [
        '.',
        'build/bundle.js',
        'css/styles.css',
        'images/**/*.svg',
        'images/**/*.png',
        'sounds/**/*.wav'
      ]
    })
  ]
};
