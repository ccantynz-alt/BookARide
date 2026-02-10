'use strict';
// BookARide Doctor Report: prints key dependency versions and resolver paths.
// Run: node scripts/doctor-report.js

function pkgVersion(name) {
  try { const p = require(name + '/package.json'); return p && p.version ? p.version : '(no version field)'; }
  catch (e) { return '(not resolvable)'; }
}
function resolvedPath(name) {
  try { return require.resolve(name); }
  catch (e) { return '(not resolvable)'; }
}

const keys = [
  'react','react-dom','react-scripts','@craco/craco',
  'webpack','terser-webpack-plugin','schema-utils','ajv','ajv-keywords'
];

console.log('=== BOOKARIDE DOCTOR REPORT ===');
console.log('Node:', process.version);
console.log('Platform:', process.platform, process.arch);
console.log('');

for (const k of keys) console.log(k + ':', pkgVersion(k));

console.log('');
console.log('--- resolve paths (first-hit) ---');
for (const k of ['webpack','terser-webpack-plugin','schema-utils','ajv']) console.log(k + ':', resolvedPath(k));

console.log('');
console.log('Tip: If build fails with "validate is not a function", compare schema-utils/ajv versions above with webpack/terser-webpack-plugin majors.');