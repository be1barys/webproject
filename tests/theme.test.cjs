const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname,'../dist/js/theme.js'),'utf8');
function run(value, prefersDark=false, blocked=false) {
  const document = {documentElement:{dataset:{}}};
  vm.runInNewContext(source,{document,localStorage:{getItem(){if(blocked) throw new Error('blocked'); return value;}},window:{matchMedia(){return {matches:prefersDark};}}});
  return document.documentElement.dataset.theme;
}
test('Saved light choice overrides a dark system preference',()=>assert.equal(run('"light"',true),'light'));
test('Saved dark choice survives a new document',()=>assert.equal(run('"dark"'),'dark'));
test('An empty store follows the system theme',()=>assert.equal(run(null,true),'dark'));
test('Invalid JSON and denied storage safely render a light page',()=>{assert.equal(run('{oops'),'light');assert.equal(run(null,true,true),'light');});
