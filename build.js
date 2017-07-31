'use strict';

const babel = require('rollup-plugin-babel');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const glob = require('glob-all');

function generateFileList(options) {
  return {
    resolveId(id) {
      if (id === options.id) {
        return id;
      }
    },
    load(id) {
      if (id === options.id) {
        // Pass in relative filepaths to glob, then convert to appropriate URLs
        const files = glob.sync(options.patterns)
          .map(file => file.replace('public/', '/'));
        return `export default ${JSON.stringify(files)};`;
      }
    }
  }
}

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
        'public/images/emojione/*.svg'
      ]
    })
  ]
}).then(bundle => {
  bundle.write({
    format: 'umd',
    dest: 'public/build/bundle.js'
  })
}).catch(err => {
  console.error(err);
});
