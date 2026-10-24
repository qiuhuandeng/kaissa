const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../shared/mice-prototype-model.js');
const data = {settlements:[]};
const ctx = {MiceUI:{store:{data},M,actions:{},ready(){}}};
ctx.window = ctx;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../shared/mice-changes.js'),'utf8'),ctx);
const related = ctx.MiceChanges.relatedSettlement;
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
check('未核定最终价款不能用增减价代替首次定价',()=>assert.equal(ctx.MiceChanges.canChangeOrder({amount:null,status:'待结算确认'}),false));
check('取消及作废订单不可改价，已确认零金额仍允许追加',()=>{
  assert.equal(ctx.MiceChanges.canChangeOrder({amount:100,status:'已取消'}),false);
  assert.equal(ctx.MiceChanges.canChangeOrder({amount:100,status:'已作废'}),false);
  assert.equal(ctx.MiceChanges.canChangeOrder({amount:0,status:'已确认'}),true);
});
const a = {id:'A',projectId:'P'};
const o = {id:'O',projectId:'P',activities:['A']};
const c = {id:'C',projectId:'P',activityId:'A',amount:100,status:'已确认'};
check('同项目其他团的结算不能成为订单改价依据',()=>{
  data.settlements=[{id:'OTHER',projectId:'P',status:'已确认',activities:['B']}];
  assert.equal(related('order',o),undefined);
});
check('同项目其他团的结算不能成为成本调整依据',()=>assert.equal(related('cost',c),undefined));
check('未确认及其他项目的记录不引用',()=>{
  data.settlements=[{id:'PENDING',projectId:'P',status:'审批中',activities:['A']},{id:'WRONG',projectId:'Q',status:'已确认',activities:['A']}];
  assert.equal(related('activity',a),undefined);
});
check('有确认依据时按原订单识别，不能只按同团猜测',()=>{
  data.settlements=[{id:'S',projectId:'P',status:'已确认',activities:['A'],confirmedRecord:{financial:{incomeLines:[{id:'OTHER_ORDER'}]}}}];
  assert.equal(related('order',o),undefined);
  data.settlements[0].confirmedRecord.financial.incomeLines.push({id:'O'});
  assert.equal(related('order',o).id,'S');
});
check('已保存费用依据只匹配实际结算的原费用',()=>{
  data.settlements=[{id:'S',projectId:'P',status:'已确认',activities:['A'],confirmedRecord:{costs:[{costId:'OTHER_COST'}]}}];
  assert.equal(related('cost',c),undefined);
  data.settlements[0].confirmedRecord.costs.push({costId:'C'});
  assert.equal(related('cost',c).id,'S');
});
check('历史记录按明确范围匹配，优先最近一笔相关结算',()=>{
  data.settlements=[{id:'S1',projectId:'P',status:'已确认',activities:['A']},{id:'S2',projectId:'P',status:'已确认',activities:['A']}];
  assert.equal(related('order',o).id,'S2');
  assert.equal(related('cost',c).id,'S2');
  assert.equal(related('activity',a).id,'S2');
});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
