/* Resource and DOM regression only; not a browser timing or visual test. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),CSS=require('rrweb-cssom');
const {page,click,set,layer,close}=require('./check-approval-config-dom.cjs');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('admin/approval-template-edit.html'),bundle=read('shared/approval-editor-page.css');
const flatten=rules=>[...rules].flatMap(r=>r.selectorText?[r]:r.cssRules?flatten(r.cssRules):[]);
const bundled=new Set(flatten(CSS.parse(bundle).cssRules).map(r=>r.cssText));
const omitted=flatten(CSS.parse(read('shared/style.css')).cssRules).filter(r=>!bundled.has(r.cssText));
assert(!bundle.includes('@import'));assert(!html.includes('shared/style.css'));
assert.equal([...html.matchAll(/<script\b/g)].length,6);assert.equal([...html.matchAll(/<script defer src=/g)].length,6);
assert(html.indexOf('approval-config-model.js')<html.indexOf('approval-config.js'));
assert(html.indexOf('approval-config.js')<html.indexOf('approval-editor-boot.js'));
(async()=>{const p=await page('admin/approval-template-edit.html?id=template-0');let states=0;
 function check(){const classes=new Set([...p.d.querySelectorAll('[class]')].flatMap(e=>[...e.classList]));for(const r of omitted){const names=[...r.selectorText.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m=>m[1]);assert(!names.some(n=>classes.has(n)),'Excluded potentially relevant style: '+r.selectorText);}states++;}
 check();assert.equal(p.d.documentElement.dataset.fullPageNavigation,'true');click(p,'[data-ac=applicant]');check();click(p,'[name=departmentMode][value=selected]',layer(p));check();close(p);
 click(p,'[data-ac=edit-node]');for(const option of [...layer(p).querySelector('[name=source]').options]){set(p,'[name=source]',option.value,layer(p));check();}close(p);
 for(const step of [1,3,2]){click(p,'.ac-steps [data-step="'+step+'"]');check();}
 click(p,'.ac-branch-title');check();close(p);assert.deepEqual(p.errors,[]);p.w.close();
 const files=['shared/style.css',...Array.from(read('shared/style.css').matchAll(/@import url\("(?:\.\/)?([^\"]+)"\)/g),m=>'shared/'+m[1])];
 const before=files.reduce((n,f)=>n+Buffer.byteLength(read(f)),0),after=Buffer.byteLength(bundle);
 console.log(JSON.stringify({states,originalCSSBytes:before,editorCSSBytes:after,reduction:((1-after/before)*100).toFixed(1)+'%',originalGzipBytes:files.reduce((n,f)=>n+zlib.gzipSync(read(f)).length,0),editorGzipBytes:zlib.gzipSync(bundle).length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
