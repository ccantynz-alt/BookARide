const fs = require('fs');
const path = require('path');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function tryResolve(name) {
  try { return require.resolve(name, { paths: [process.cwd()] }); } catch { return null; }
}

function pkgVersion(name) {
  try {
    const p = tryResolve(path.join(name, 'package.json'));
    if (!p) return null;
    return readJson(p).version || null;
  } catch {
    return null;
  }
}

const report = {
  node: process.version,
  npm_config_user_agent: process.env.npm_config_user_agent || null,
  ci: process.env.CI || null,
  react_scripts: pkgVersion('react-scripts'),
  craco: pkgVersion('@craco/craco'),
  webpack: pkgVersion('webpack'),
  terser_webpack_plugin: pkgVersion('terser-webpack-plugin'),
  schema_utils: pkgVersion('schema-utils'),
  ajv: pkgVersion('ajv'),
  ajv_keywords: pkgVersion('ajv-keywords')
};

console.log("=== DOCTOR REPORT ===");
console.log(JSON.stringify(report, null, 2));
