'use strict';

const babel = require('rollup-plugin-babel');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

rollup.rollup({
  entry: 'src/index.js',
  plugins: [
    nodeResolve({ jsnext: true, main: true }),
    commonjs({
      include: 'node_modules/**'
    }),
    babel({
      exclude: 'node_modules/**'
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
