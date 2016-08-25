'use strict';

let fs = require('fs');
let path = require('path');
let glob = require('glob-all');
let babel = require('rollup-plugin-babel');
let rollup = require('rollup');
let commonjs = require('rollup-plugin-commonjs');
let nodeResolve = require('rollup-plugin-node-resolve');

function generateFileList(options) {
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

// Main app code
rollup.rollup({
  entry: 'src/index.js',
  plugins: [ 
    nodeResolve({ jsnext: true, main: true }),
    commonjs({
      include: 'node_modules/**'
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    generateFileList({
      id: '\0emoji-images',
      patterns: [
        'images/**/*.svg'
      ]
    })     
  ]
}).then(bundle => {

  bundle.write({
    format: 'umd',
    dest: 'build/bundle.js'
  })

}).catch(err => {
  console.error(err);
});

// Service worker
rollup.rollup({
  entry: 'src/sw.js',
  plugins: [
    // \0 is a plugin convention indicating a 'virtual module' as opposed to stuff from the filesystem
    generateFileList({
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
}).then(bundle => {

  bundle.write({
    dest: 'build/sw.js'
  });

}).catch(err => {
  console.error(err);
});
