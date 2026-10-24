const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../shared/cruise-room-model.js'),F=require('../shared/cruise-fulfillment-model.js');
const checks=[];function test(name,fn){fn();checks.push(name);console.log('PASS '+name);}
const s=R.seed(),voyages=[{id:R.V,status:'完成',date:'2026-11-12',back:'2026-11-19'}];
const c=F.scope({voyage:R.V,schedule:'CZ20261112001',executionStatus:'已回团',settlementStatus:'未结算'},s,voyages);
test('船方已返航不代替本团收尾，未结束的本团可补录实际结果',()=>{
 assert(F.canEditTravel(c));F.saveTravel(s,c,'CRP-01',{ticket:'TEST',checkin:'已办理',boarding:'已登船'});
 assert.equal(s.travel['CRP-01'].boarding,'已登船');assert.equal(c.executionState,'已回团');assert.equal(c.settlementState,'未结算');
});
test('已结束团期、取消航次及取消团期保持只读',()=>{
 for(const extra of [{executionState:'已结束'},{executionState:'已回团',settlementState:'已结算'},{state:'取消'},{saleState:'已取消'}]){
  assert(!F.canEditTravel({...c,...extra}));assert.throws(()=>F.saveTravel(s,{...c,...extra},'CRP-01',{}),/仅保留查看/);
 }
});
test('同航次的结果补录不能越过销售团期范围',()=>assert.throws(()=>F.saveTravel(s,c,'CRP-04',{}),/不在当前团期/));
const state={voyages:[{id:'V1',date:'2026-11-12',products:['BJ']},{id:'V2',date:'2026-11-12',products:['SH']} ]};
const context={window:{CaesarCruiseInventory:{esc:String,read:()=>state,products:[{id:'BJ',schedule:'S1'},{id:'SH',schedule:'S2'}]}},document:{addEventListener(){}}};
vm.runInNewContext(fs.readFileSync('shared/cruise-schedule-view.js','utf8'),context);
const view=context.window.CaesarCruiseScheduleView,base={batchType:'邮轮航次',depart:'2026-11-12'};
test('明确采购航次优先于日期，已知团期按产品关联',()=>{
 assert.equal(view.relation({...base,code:'S1'}).v.id,'V1');
 assert.equal(view.relation({...base,code:'S1',cruiseVoyage:'V2'}).v.id,'V2');
});
test('未知、失效或同产品同日多航次不猜测关联',()=>{
 assert.equal(view.relation({...base,code:'UNKNOWN'}),null);
 assert.equal(view.relation({...base,code:'S1',cruiseVoyage:'DELETED'}),null);
 state.voyages.push({id:'V3',date:'2026-11-12',products:['BJ']});assert.equal(view.relation({...base,code:'S1'}),null);
});
console.log(JSON.stringify({passed:checks.length,checks}));
