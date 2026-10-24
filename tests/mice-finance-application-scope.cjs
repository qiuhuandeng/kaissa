const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const M = require('../shared/mice-prototype-model.js');
const checks = [];
function fixture(query = '') {
  const projects = ['P1', 'P2'].map(id => ({id, name:id, customer:'同一客户', company:'北京凯撒', status:'进行中', businessMode:'会议专票团'}));
  const activities = [{id:'A1',projectId:'P1',businessMode:'会议专票团'}, {id:'A2',projectId:'P1',businessMode:'旅游单团'}, {id:'A3',projectId:'P2'}];
  const orders = activities.map((a,i) => ({id:'O'+(i+1), projectId:a.projectId, customer:'同一客户', company:'北京凯撒', currency:'CNY', activities:[a.id], amount:10000*(i+1), status:'已确认', nodes:[]}));
  const data = {projects,activities,orders,invoices:[],claims:[],catalog:{}};
  const fields = [];
  const U = {M, q:new URLSearchParams(query), actions:{}, ready(){}, esc:String,
    store:{data,find:(type,id)=>data[type]?.find(r=>r.id===id)},
    field:(name,label,value,options)=>{fields.push({name,label,value,options});return name;},
    grid:x=>x, section:(name,x)=>x, summary:()=>'', table:(head,rows)=>JSON.stringify(rows), lines:(...v)=>v.join(' '),
    btn:()=>'', action:()=>'', link:()=>'', drawer(){}, toast(){}};
  const ctx = {MiceUI:U, MiceModel:M, MiceFiles:{html:()=>''}, location:{pathname:'/merchant/finance/finance-invoice.html'}};
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../shared/mice-tax-model.js'),'utf8'),ctx);
  // Deliberately no MiceProjectFlow: finance pages do not load project interaction scripts.
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../shared/mice-finance.js'),'utf8'),ctx);
  return {data,fields,api:ctx.MiceFinance,ids:prefix=>fields.filter(f=>f.name.startsWith(prefix)).map(f=>f.name),value:name=>fields.find(f=>f.name===name)?.value};
}
function check(name,fn){fn();checks.push(name);}
check('订单开票只包含当前订单，不混入同项目或其他项目',()=>{const f=fixture('orderNo=O1&projectId=P1');f.api.invoice();assert.deepEqual(f.ids('invoice-'),['invoice-O1']);});
check('会议订单在独立发票页默认专票与会务服务',()=>{const f=fixture('orderNo=O1');f.api.invoice();assert.equal(f.value('invoiceKind'),'增值税专用发票');assert.equal(f.value('service'),'会务服务');});
check('旅游团覆盖父项目会议模式，仍默认普票与旅游服务',()=>{const f=fixture('orderNo=O2');f.api.invoice();assert.equal(f.value('invoiceKind'),'增值税普通发票');assert.equal(f.value('service'),'旅游服务');});
check('项目入口保留本项目合并开票，不带其他项目',()=>{const f=fixture('projectId=P1');f.api.invoice();assert.deepEqual(f.ids('invoice-'),['invoice-O1','invoice-O2']);});
check('无已定价订单的项目不回落到别的项目',()=>{const f=fixture('projectId=EMPTY');f.api.invoice();assert.equal(f.fields.length,0);});
check('修正原合并申请保持原两单和金额，不加入第三单',()=>{const f=fixture('orderNo=O1');f.data.invoices.push({id:'I',status:'已退回',allocations:[{orderId:'O1',amount:1000},{orderId:'O3',amount:2000}]});f.api.invoice('I');assert.deepEqual(f.ids('invoice-'),['invoice-O1','invoice-O3']);assert.equal(f.value('invoice-O1'),1000);assert.equal(f.value('invoice-O3'),2000);});
check('订单收款认领只列当前订单',()=>{const f=fixture('orderNo=O2&projectId=P1');f.api.claim();assert.deepEqual(f.ids('alloc-'),['alloc-O2']);});
check('项目收款入口保留本项目多单分配',()=>{const f=fixture('projectId=P1');f.api.claim();assert.deepEqual(f.ids('alloc-'),['alloc-O1','alloc-O2']);});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
