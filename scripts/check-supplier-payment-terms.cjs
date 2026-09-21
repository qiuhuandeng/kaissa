const assert = require('node:assert/strict');
require('../shared/supplier-company-agreements.js');
const A = global.SupplierCompanyAgreements;
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
const examples=A.paymentExamples();
const monthly=examples[0], days=examples[2];
test('同协议多公司准确查找，无公司不猜选第一主体',()=>{assert.equal(A.get('AGR-ABC-2026-01'),undefined);assert.equal(A.get('AGR-ABC-2026-01','亿步').company,'亿步');assert.equal(A.get('AGR-ABC-2026-01','体坛').company,'体坛');assert.equal(A.get('AGR-ABC-2026-01','北京凯撒'),undefined);});
test('月结不转换成30天',()=>{assert.equal(A.paymentBasis(monthly).dueDate,'');assert.match(A.basisHtml(monthly),/月结.*结算日及付款日待确认/);assert.doesNotMatch(A.basisHtml(monthly),/后30天/);assert.equal(A.dueDate(A.get(monthly.agreementNo,monthly.company),'2026-07-01'),'');});
test('两个签约公司只显示各自约定',()=>{assert.doesNotMatch(A.basisHtml(monthly),/<dd>体坛<\/dd>/);assert.match(A.basisHtml(examples[1]),/<dd>体坛<\/dd>/);assert.doesNotMatch(A.basisHtml(examples[1]),/<dd>亿步<\/dd>/);});
test('回团后3天计算且提前付款只提示',()=>{assert.equal(A.paymentBasis(days).dueDate,'2026-07-31');assert.match(A.basisHtml(days),/计划付款早于应付日/);assert.match(A.basisHtml(days),/不自动拒绝/);});
test('缺日期、无效日期和未确认不计算',()=>{for(const eventDate of ['', '2026-02-30','2026-13-01','07/28/2026'])assert.equal(A.paymentBasis({...days,eventDate}).dueDate,'');assert.equal(A.paymentBasis({...days,eventConfirmed:false}).dueDate,'');});
test('起算事件不匹配不计算',()=>{assert.equal(A.paymentBasis({...days,eventName:'出票确认'}).dueDate,'');assert.match(A.basisHtml({...days,eventName:'出票确认'}),/起算资料与协议约定事件不一致/);});
test('自然日跨月、跨年、闰年、零天',()=>{const term={kind:'事件后付款',event:'实际回团',days:3};assert.equal(A.dueDate(term,'2026-12-30'),'2027-01-02');assert.equal(A.dueDate(term,'2028-02-27'),'2028-03-01');assert.equal(A.dueDate({...term,days:0},'2026-07-28'),'2026-07-28');});
test('天数缺失、负数、小数及未知类型不计算',()=>{for(const n of [null,undefined,'',-1,1.5])assert.equal(A.dueDate({event:'实际回团',days:n},'2026-07-28'),'');assert.equal(A.dueDate({kind:'未知',event:'实际回团',days:3},'2026-07-28'),'');});
test('月结本期明确日期需已确认及具名依据',()=>{const full={...monthly,statementDueDate:'2026-08-12',statementConfirmed:true,statementBasis:'2026年7月结算单批准付款日'};assert.equal(A.paymentBasis(full).dueDate,'2026-08-12');for(const changed of [{statementConfirmed:false},{statementBasis:''},{statementMonth:''},{statementDueDate:'2026-02-30'}])assert.equal(A.paymentBasis({...full,...changed}).dueDate,'');});
test('其他约定不擅自推算日期',()=>{const originalAgreement={...days.originalAgreement,kind:'其他约定',otherRule:'双方确认付款节点'};assert.equal(A.paymentBasis({...days,originalAgreement}).dueDate,'');assert.match(A.basisHtml({...days,originalAgreement}),/双方确认付款节点/);});
test('错公司、错供应商、未知协议不显示别家公司账期',()=>{for(const changed of [{businessCompany:'北京凯撒'},{supplier:'其他供应商'},{agreementNo:'UNKNOWN'}]){const r=A.paymentBasis({...days,...changed});assert.equal(r.matched,false);assert.equal(r.dueDate,'');assert.doesNotMatch(A.basisHtml({...days,...changed}),/实际回团后3天/);}});
test('历史到期依据保留，不替换续签',()=>{const d={agreementNo:'AGR-EU-FJ-015',businessCompany:'福建凯撒',supplier:'欧洲联合地接社',eventDate:'2026-07-02',usedOn:'2026-07-02'};assert.equal(A.paymentBasis(d).dueDate,'2026-08-01');assert.match(A.basisHtml(d),/本申请保留发生时/);assert.doesNotMatch(A.basisHtml(d),/AGR-EU-FJ-028/);});
test('原引用条款不随当前目录变动',()=>{const record=A.get(days.agreementNo,days.company),before=record.days;try{record.days=99;assert.equal(A.paymentBasis(days).dueDate,'2026-07-31');}finally{record.days=before;}assert.notEqual(A.capture(days),days.originalAgreement);});
test('审批中协议不形成已确定应付日',()=>{const result=A.paymentBasis({agreementNo:'AGR-EU-BJ-027',businessCompany:'北京凯撒',supplier:'欧洲联合地接社',eventDate:'2026-09-01'});assert.equal(result.dueDate,'');assert.match(result.warnings.join(''),/尚未确认生效/);});
test('支付公司不替代业务公司取条款',()=>{assert.equal(A.paymentBasis({...days,paymentCompany:'福建凯撒'}).dueDate,'2026-07-31');assert.match(A.basisHtml({...days,paymentCompany:'福建凯撒'}),/代付安排/);});
test('协议到期不能新引用且未知公司无选项',()=>{assert.equal(A.valid(monthly.agreementNo,monthly.supplier,monthly.company),false);assert.equal(A.valid(days.agreementNo,days.supplier,days.company),true);assert.equal(A.list(monthly.supplier,'').length,0);});
test('输出转义及只保留所需条款',()=>{assert.doesNotMatch(A.basisHtml({...days,contract:'<script>alert(1)</script>'}),/<script>/);assert.equal(A.capture({...days,originalAgreement:{...days.originalAgreement,bank:'secret',fee:'secret',note:'secret'}}).bank,undefined);});
// 直接执行计调页的组装函数，验证单笔和批量路径不会丢失原协议。
const fs=require('node:fs'), vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../merchant/tour/fulfillment-cost.html'),'utf8');
function sourceFunction(name) { const start=html.indexOf('      function '+name+'('); assert(start>=0); const end=html.indexOf('\n      function ',start+1); return html.slice(start,end); }
const sandbox={SupplierCompanyAgreements:A,paymentSubject:()=> '团费',paymentRequestForGroup:()=>null,groupItemAvailable:(g,i)=>i.amount};
vm.createContext(sandbox);
vm.runInContext(['paymentContextRows','payableItemsForBatch','paymentAgreementsHtml'].map(sourceFunction).join('\n'),sandbox);
const group={id:'ABC',supplier:days.supplier,entity:days.company,agreementNo:days.agreementNo,agreementUsedOn:days.usedOn,agreementEventDate:days.eventDate,agreementEventName:days.eventName,originalAgreement:days.originalAgreement,expectedDate:days.planDate,contract:days.contract,items:[{scheduleNo:'EU-ABC',fee:'地接费',amount:9000}]};
test('计调单笔成本带入本公司原条款并隔离后续修改',()=>{const [item]=sandbox.paymentContextRows([group]);assert.equal(item.entity,'亿步山西分公司');assert.equal(item.originalAgreement.days,3);item.originalAgreement.days=99;assert.equal(group.originalAgreement.days,3);});
test('批量成本保留协议和日期并逐份显示',()=>{const [item]=sandbox.payableItemsForBatch(group);assert.equal(item.requestAmount,9000);assert.equal(item.agreementNo,'AGR-ABC-2026-02');assert.equal(item.agreementEventDate,'2026-07-28');assert.match(sandbox.paymentAgreementsHtml([item]),/2026-07-31/);assert.match(sandbox.paymentAgreementsHtml([item]),/计划付款早于/);});
test('修改计划日不改应付日，跨协议不能合并账期',()=>{const [item]=sandbox.paymentContextRows([group]);assert.doesNotMatch(sandbox.paymentAgreementsHtml([item],'2026-08-01'),/计划付款早于/);assert.match(sandbox.paymentAgreementsHtml([item],'2026-08-01'),/2026-07-31/);const other={...item,entity:'亿步',agreementNo:monthly.agreementNo,originalAgreement:monthly.originalAgreement,statementMonth:monthly.statementMonth};const result=sandbox.paymentAgreementsHtml([item,other]);assert.match(result,/实际回团后3天/);assert.match(result,/月结；/);});
console.log('完成 '+count+' 组供应商付款账期规则检查。');
