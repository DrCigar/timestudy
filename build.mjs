// Inlines logo.png into each source page and writes the built pages to dist/.
// Usage: node build.mjs
import fs from 'fs';
const dir = process.cwd();
const logo = 'data:image/png;base64,' + fs.readFileSync(dir + '/logo.png').toString('base64');
fs.mkdirSync(dir + '/dist', { recursive: true });
for (const name of ['artifact.html', 'sheet.html']) {
  const html = fs.readFileSync(`${dir}/src/${name}`, 'utf8').split('{{LOGO}}').join(logo);
  fs.writeFileSync(`${dir}/dist/${name}`, html);
  console.log('built dist/' + name, html.length);
}
