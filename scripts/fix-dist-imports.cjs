const fs = require('fs');
const path = require('path');

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) addJsExtensions(full);
    else if (file.endsWith('.js')) {
      let contents = fs.readFileSync(full, 'utf8');
      // naive replace: import ... from "./something" -> "./something.js"
      contents = contents.replace(/from\s+(["'])(\.\/(?!.*\.js)([^"']+))\1/g, (m, q, p, p2) => {
        return `from ${q}${p}.js${q}`;
      });
      // Replace path alias imports like @shared/schema -> ../shared/schema.js
      contents = contents.replace(/from\s+(["'])@shared\/([^"']+)\1/g, (m, q, p) => {
        return `from ${q}../shared/${p}.js${q}`;
      });
      // also handle require('...') if any
      contents = contents.replace(/require\(\s*(["'])(\.\/(?!.*\.js)([^"']+))\1\s*\)/g, (m, q, p, p2) => {
        return `require(${q}${p}.js${q})`;
      });
      // and require('@shared/...') -> require('../shared/....js')
      contents = contents.replace(/require\(\s*(["'])@shared\/([^"']+)\1\s*\)/g, (m, q, p) => {
        return `require(${q}../shared/${p}.js${q})`;
      });
      fs.writeFileSync(full, contents, 'utf8');
    }
  }
}

const dist = path.resolve(__dirname, '..', 'dist', 'server');
if (fs.existsSync(dist)) {
  addJsExtensions(dist);
  console.log('Fixed imports in dist/server');
} else {
  console.error('dist/server not found');
  process.exit(1);
}
