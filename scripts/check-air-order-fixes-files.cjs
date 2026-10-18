const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const deps='/Users/qiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const JSZip=require(deps+'jszip'),xml=require(deps+'xml-js');
class Element{constructor(x){this.x=x;}getAttribute(k){return this.x.attributes?.[k]||null;}get textContent(){return this.x.type==='text'?this.x.text:(this.x.elements||[]).map(x=>new Element(x).textContent).join('');}getElementsByTagName(n){return (this.x.elements||[]).flatMap(x=>[...(x.type==='element'&&x.name===n?[new Element(x)]:[]),...new Element(x).getElementsByTagName(n)]);}querySelector(n){return this.getElementsByTagName(n)[0]||null;}}
class DOMParser{parseFromString(s){try{return new Element(xml.xml2js(s,{compact:false}));}catch(_){return new Element({elements:[{type:'element',name:'parsererror'}]});}}}
const ctx={window:{},JSZip,DOMParser,Blob,Date,URL,setTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync('shared/air-orders-excel.js','utf8'),ctx);const X=ctx.window.AirOrdersExcel;

const out='docs/evidence/air-order-fixes-20261017/',checks=[];
const r={type:'出票',issuedDate:'2026-10-17',ticket:'9998888000001',name:'演示乘客',docNo:'E88880001',date:'2026-11-23',flight:'CA1501',from:'PEK',to:'SHA',fare:'1300',tax:'200',cost:'1500',sale:'1800',customer:'演示客户',currency:'CNY',amountScope:'整票',changeReason:'账单版本 DEMO-02'};
const file=(name,buf)=>({name,size:buf.length,arrayBuffer:async()=>buf,text:async()=>buf.toString('utf8')});
(async()=>{
 const blob=await X.workbook([r]),buf=Buffer.from(await blob.arrayBuffer());fs.writeFileSync(out+'同票导入字段核对.xlsx',buf);
 const rows=await X.read(file('test.xlsx',buf));assert.equal(rows[0].amountScope,'整票');assert.equal(rows[0].changeReason,r.changeReason);assert.equal(rows[0].ticket,r.ticket);checks.push('XLSX新增金额口径及更正依据往返读取一致');
 const oldHeaders=Array.from(X.headers).slice(0,20),oldFields=Array.from(X.fields).slice(0,20),csv=oldHeaders.join(',')+'\n'+oldFields.map(k=>r[k]||'').join(',');const old=await X.read(file('legacy.csv',Buffer.from(csv)));assert.equal(old[0].amountScope,'');assert.equal(old[0].sale,'1800');checks.push('旧20列CSV仍可读取，新口径留空待核而非猜测');
 const errors=await X.workbook([r],[['金额口径待确认']]),zip=await JSZip.loadAsync(await errors.arrayBuffer()),text=await zip.file('xl/worksheets/sheet1.xml').async('string');assert.match(text,/更正依据/);assert.match(text,/金额口径待确认/);assert.match(text,/原文件行号/);checks.push('错误行导出保留新增字段、原行号与原因');
 fs.writeFileSync(out+'file-checks.json',JSON.stringify({checks,passed:checks.length},null,2));console.log(JSON.stringify({passed:checks.length,checks}));
})().catch(e=>{console.error(e);process.exitCode=1;});
