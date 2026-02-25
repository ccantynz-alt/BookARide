'use strict';

// BookARide Doctor Report: prints key dependency versions and resolver paths.
// Run: node scripts/doctor-report.js

const path = require('path');

function pkgVersion(name) {
  try {
    const p = require(name + '/package.json');
    return p && p.version ? p.version : '(no version field)';
  } catch (e) {
    return '(not resolvable)';
  }
}

function resolvedPath(name) {
  try {
    return require.resolve(name);
  } catch (e) {
    return '(not resolvable)';
  }
}

// Resolve a module *as seen from* another package folder.
function resolveFrom(request, fromPkgName) {
  try {
    const fromMain = require.resolve(fromPkgName);
    const fromDir = path.dirname(fromMain);
    return require.resolve(request, { paths: [fromDir] });
  } catch (e) {
    return '(not resolvable)';
  }
}

function loadExports(modulePath) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(modulePath);
  } catch (e) {
    return null;
  }
}

const keys = [
  'react',
  'react-dom',
  'react-scripts',
  '@craco/craco',
  'webpack',
  'terser-webpack-plugin',
  'schema-utils',
  'ajv',
  'ajv-keywords',
  'babel-loader'
];

console.log('=== BOOKARIDE DOCTOR REPORT ===');
console.log('Node:', process.version);
console.log('Platform:', process.platform, process.arch);
console.log('');

for (const k of keys) {
  console.log(k + ':', pkgVersion(k));
}

console.log('');
console.log('--- resolve paths (first-hit) ---');
for (const k of ['webpack', 'terser-webpack-plugin', 'schema-utils', 'ajv', 'babel-loader']) {
  console.log(k + ':', resolvedPath(k));
}

console.log('');
console.log('--- schema-utils API shape (top-level) ---');
try {
  const su = require('schema-utils');
  console.log('schema-utils.validate:', typeof su.validate);
  console.log('schema-utils.validateOptions:', typeof su.validateOptions);
} catch (e) {
  console.log('schema-utils API check failed:', e && e.message ? e.message : String(e));
}

console.log('');
console.log('--- schema-utils as seen from babel-loader ---');
const suFromBabelPath = resolveFrom('schema-utils', 'babel-loader');
console.log('babel-loader -> schema-utils resolve:', suFromBabelPath);

if (suFromBabelPath && suFromBabelPath !== '(not resolvable)') {
  const suFromBabel = loadExports(suFromBabelPath);
  if (!suFromBabel) {
    console.log('babel-loader -> schema-utils exports: (failed to require)');
  } else {
    console.log('babel-loader schema-utils.validate:', typeof suFromBabel.validate);
    console.log('babel-loader schema-utils.validateOptions:', typeof suFromBabel.validateOptions);
  }
}

console.log('');
console.log('Tip: If build fails with "validateOptions is not a function", the block above will show which schema-utils babel-loader is actually getting.');