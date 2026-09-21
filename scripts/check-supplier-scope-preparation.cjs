const assert=require('node:assert/strict');
require('../shared/supplier-management-data.js');
require('../shared/supplier-contract-tools.js');
const D=global.SupplierManagementData,T=global.SupplierContractTools;
let count=0;const test=(name,run)=>{run();count++;console.log('PASS '+name);};
test('地区留空不代表全区域，已知国家城市不能跨区混填',()=>{
  for(const p of [['欧洲','',''],['欧洲','日本',''],['欧洲','法国','罗马'],['欧洲','全区域','巴黎']])assert.ok(D.validatePlace(p));
  assert.equal(D.validatePlace(['欧洲','法国','']),'');assert.equal(D.validatePlace(['欧洲','全区域','']),'');
});
test('扩大地区合并重复项，多个地区保留，已覆盖范围不重复添加',()=>{
  let p=D.addPlace([],['欧洲','法国','巴黎']);p=D.addPlace(p,['亚洲','日本','东京']);p=D.addPlace(p,['欧洲','法国','']);assert.equal(p.length,2);assert.throws(()=>D.addPlace(p,['欧洲','法国','尼斯']),/已包含/);
  p=D.addPlace(p,['欧洲','全区域','']);assert.equal(p.length,2);assert.throws(()=>D.addPlace(p,['欧洲','意大利','罗马']),/已包含/);
});
test('全国和全区域按覆盖范围搜索，不跨区域或跨国家误命中',()=>{
  assert.ok(D.placeMatches(['欧洲','法国',''],{city:'尼斯'}));assert.ok(!D.placeMatches(['欧洲','法国',''],{city:'罗马'}));
  assert.ok(D.placeMatches(['欧洲','全区域',''],{country:'法国',city:'巴黎'}));assert.ok(!D.placeMatches(['欧洲','全区域',''],{country:'法国',city:'罗马'}));assert.ok(!D.placeMatches(['欧洲','全区域',''],{country:'日本'}));
});
test('供应商区域自动汇总，删除服务地区后不残留原区域',()=>{
  const S=D.createSession([], '2026-09-21'),d=D.copy(S.find('SUP-GRP-0009'));d.places=[['欧洲','法国','']];d.regions=['亚洲','国内'];const saved=S.saveProfile(d,false,d.id).supplier;assert.deepEqual(saved.regions,['欧洲']);saved.places=[];assert.deepEqual(S.saveProfile(saved,false,saved.id).supplier.regions,[]);
});
const S=D.createSession([], '2026-09-21'),s=D.copy(S.find('SUP-GRP-0007'));
const a={name:'验收协议',start:'2026-09-21',end:'2027-01-01',service:'仅法国巴黎定制团',bodies:[D.body('福建凯撒')],contractMode:'template',templateId:T.templates[0].id};
test('生成取本次协议范围，服务能力改动不覆盖已确认范围',()=>{
  s.service='全欧洲地接';s.places=[['欧洲','全区域','']];assert.match(D.cooperationText(s),/全区域/);
  a.contract=T.generate(T.templates[0],s,a,S.today);assert.match(a.contract.text,/仅法国巴黎定制团/);assert.doesNotMatch(a.contract.text,/全欧洲地接/);s.service='地接及酒店服务';assert.ok(T.current(a.contract,s,a));
  a.service='仅意大利定制团';assert.ok(!T.current(a.contract,s,a));a.service='仅法国巴黎定制团';
});
test('更换模板后旧稿不能送审，按新模板重生成后恢复',()=>{
  const d=D.copy(a);d.templateId=T.templates[1].id;assert.ok(!T.current(d.contract,s,d));assert.throws(()=>S.saveAgreement(s.id,d,true),/重新生成/);
  d.contract=T.generate(T.templates[1],s,d,S.today);assert.ok(T.current(d.contract,s,d));assert.equal(S.validateAgreement(d,true),'');
});
test('标准模板和已有协议互斥，缺合同不能提交',()=>{
  assert.match(S.validateAgreement({...a,contract:null},true),/生成稿/);assert.match(S.validateAgreement({...a,contract:{name:'上传.pdf'}},true),/重新生成/);
  assert.match(S.validateAgreement({...a,contractMode:'upload'},true),/上传已有协议/);assert.equal(S.validateAgreement({...a,contractMode:'upload',contract:{name:'上传.pdf'}},true),'');
});
test('模板只匹配适用类型与全部签约公司，已停用稿不能继续送审',()=>{
  const t=T.templates[0],status=t.status;try{t.status='停用';assert.ok(!T.current(a.contract,s,a));}finally{t.status=status;}
  assert.ok(T.matches(T.templates[1],s,a));assert.ok(!T.matches(T.templates[1],{categories:['国内旅行社']},a));assert.ok(!T.matches({...t,companies:['北京凯撒']},s,a));
});
test('提交时生成当前模板协议，重复提交准备不重复归档旧稿',()=>{
  const d=D.copy(a);d.contract=null;T.prepareForSubmission(s,d,S.today);assert.ok(d.contract.generated);assert.equal(S.validateAgreement(d,true),'');
  const previous=d.contract;T.prepareForSubmission(s,d,S.today);assert.strictEqual(d.contract,previous);assert.equal((d.contractHistory||[]).length,0);
  d.service='新版合作范围';T.prepareForSubmission(s,d,S.today);assert.match(d.contract.text,/新版合作范围/);assert.equal(d.contractHistory.length,1);assert.equal(d.contractHistory[0].text,previous.text);
});
test('提交准备缺模板或不适用时拦截，上传附件保持不变',()=>{
  assert.throws(()=>T.prepareForSubmission(s,{...a,templateId:''},S.today),/请选择协议模板/);
  assert.throws(()=>T.prepareForSubmission(s,{...a,templateId:'SUP-COOP-000'},S.today),/模板未启用/);
  const d={...a,contractMode:'upload',contract:{name:'已签协议.pdf'}};const original=d.contract;T.prepareForSubmission(s,d,S.today);assert.strictEqual(d.contract,original);
});
console.log('完成 '+count+' 组服务地区与协议准备检查。');
