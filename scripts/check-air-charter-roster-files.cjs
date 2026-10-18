/* 名单模板编解码检查，不控制浏览器。 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),C=require('../shared/air-charter-order-model.js');
const deps='/Users/qiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const JSZip=require(deps+'jszip'),xml=require(deps+'xml-js');
class Element{constructor(x){this.x=x;}getAttribute(k){return this.x.attributes?.[k]||null;}get textContent(){return this.x.type==='text'?this.x.text:(this.x.elements||[]).map(x=>new Element(x).textContent).join('');}getElementsByTagName(n){return (this.x.elements||[]).flatMap(x=>[...(x.type==='element'&&x.name===n?[new Element(x)]:[]),...new Element(x).getElementsByTagName(n)]);}querySelector(n){return this.getElementsByTagName(n)[0]||null;}}
class DOMParser{parseFromString(s){try{return new Element(xml.xml2js(s,{compact:false}));}catch(_){return new Element({elements:[{type:'element',name:'parsererror'}]});}}}
const ctx={window:{AirCharterOrder:C},JSZip,DOMParser,Blob,Date,URL,setTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync('shared/air-orders-excel.js','utf8'),ctx);const X=ctx.window.AirOrdersExcel;
const dir='docs/evidence/air-charter-order-20261018/',checks=[];
const file=(name,buf)=>({name,size:buf.length,arrayBuffer:async()=>buf,text:async()=>buf.toString('utf8')});
(async()=>{
 const first=await X.readRoster(file('首批12人.csv',fs.readFileSync(dir+'首批12人.csv')));assert.equal(first.length,12);assert.equal(first[0].name,'张建国');checks.push('真实CSV首批12人读取');
 const second=await X.readRoster(file('第二批.csv',fs.readFileSync(dir+'第二批8人及重复冲突.csv')));const rows=C.preview(C.demo(),second);assert.equal(rows.filter(r=>r.status==='新增').length,8);assert.equal(rows.filter(r=>r.status==='重复').length,1);assert.equal(rows.filter(r=>r.status==='资料冲突').length,1);checks.push('真实CSV补充8人及重复/冲突分类');
 const blob=await X.workbook([],null,[C.importHeaders,...first.map(p=>C.importFields.map(k=>p[k]))]),buffer=Buffer.from(await blob.arrayBuffer());fs.writeFileSync(dir+'首批12人.xlsx',buffer);const xlsx=await X.readRoster(file('首批12人.xlsx',buffer));assert.equal(xlsx.length,12);assert.equal(xlsx[0].birth,'1988-05-20');assert.equal(xlsx[0].docNo,'E96121901');checks.push('XLSX首批12人往返读取，证件日期保持');
 const downloaded='/Users/qiu/Downloads/包机乘客名单模板.xlsx';assert.ok(fs.existsSync(downloaded));const original=fs.readFileSync(downloaded);fs.writeFileSync(dir+'浏览器下载的名单模板.xlsx',original);const grid=await X.readGrid(file('名单模板.xlsx',original));assert.deepEqual(Array.from(grid[0]),C.importHeaders);checks.push('浏览器实际下载9列名单模板，原文件落盘');
 const old=fs.readFileSync('/Users/qiu/Downloads/票务日报模板.xlsx');assert.ok((await X.read(file('日报.xlsx',old))).length>0);checks.push('既有BSP日报解析仍可使用');
 const zip=await JSZip.loadAsync(buffer);let sheet=await zip.file('xl/worksheets/sheet1.xml').async('string');sheet=sheet.replace(/<c r="E2"[\s\S]*?<\/c>/,'<c r="E2"><v>32283</v></c>').replace(/<c r="A3"[\s\S]*?<\/c>/,'<c r="A3"><f>1+1</f><v>2</v></c>');zip.file('xl/worksheets/sheet1.xml',sheet);const read=await X.readRoster(file('日期及公式.xlsx',await zip.generateAsync({type:'nodebuffer'})));assert.match(read[0].birth,/^\d{4}-\d{2}-\d{2}$/);assert.equal(C.preview(C.demo(),read)[1].status,'不可导入');checks.push('Excel日期数字转换与公式不执行');
 fs.writeFileSync(dir+'file-checks.json',JSON.stringify({checks,total:checks.length,filePicker:'Chrome扩展文件访问权限拦截，实际选文件仍待人工补验'},null,2));console.log(JSON.stringify({passed:checks.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
