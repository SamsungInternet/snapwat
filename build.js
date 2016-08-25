'use strict';

let fs = require('fs');
let path = require('path');
let glob = require('glob-all');
let babel = require('rollup-plugin-babel');
let rollup = require('rollup');
let commonjs = require('rollup-plugin-commonjs');
let nodeResolve = require('rollup-plugin-node-resolve');
let replace = require('rollup-plugin-replace');

const TWITTER_CLIENT_PROD = 'bkMmxlirv04KxJtAbWSgekbVM';
const TWITTER_CLIENT_DEV = 'Eqrm5IQ5zgLUfZXrgpVuntjvA';

let nodeEnv = process.env.NODE_ENV;

function generateFileList(options) {
  return {
    resolveId(id) {
      if (id === options.id) {
        return id;
      }
    },
    load(id) {
      if (id === options.id) {
        // Pass in relative filepaths to glob, then adjust prefix appropriately for front-end
        const files = glob.sync(options.patterns)
          .map(file => `${file.replace('public/', '/')}`);
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
        'public/images/emojione/*.svg'
      ]
    }),
    replace({
      ENVIRONMENT: JSON.stringify(nodeEnv),
      TWITTER_CLIENT_ID: JSON.stringify(nodeEnv === 'development' ? TWITTER_CLIENT_DEV : TWITTER_CLIENT_PROD)
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
