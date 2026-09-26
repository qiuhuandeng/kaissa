/* 原对账的后补费用确认；只记录差额，不覆盖原费用，不自动生成财务单据。 */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),states={draft:'草稿',pending:'待供应商确认',disputed:'差异处理中',confirmed:'双方已确认',void:'已作废'};
function cents(x){if(!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(x)))throw Error('金额须为非负数，最多两位小数');const n=Math.round(Number(x)*100);if(!Number.isSafeInteger(n)||n>99999999999)throw Error('金额超出范围');return n;}
function createSession(parent){
 const rows=[];let serial=3;
 const base=id=>{const s=parent.get(id);if(s.state!=='confirmed')throw Error('原对账尚未双方确认，不能办理后补费用');return s;};
 function checkSource(r){const s=base(r.statement);if(s.revision!==r.sourceRevision||s.company!==r.company||s.supplier!==r.supplier||s.currency!==r.currency||s.agreement!==r.agreement||JSON.stringify(s.lines)!==r.sourceLines)throw Error('原对账依据或版本已变化，请重新核对');return s;}
 function find(id){const r=rows.find(x=>x.id===id);if(!r||(parent.role==='supplier'&&r.state==='draft'))throw Error('无权查看该后补费用');checkSource(r);return r;}
 function capture(r,action,actor){r.history.push({revision:r.revision,action,actor,time:'2026-09-26',kind:r.kind,amount:r.amount,reference:r.reference,reason:r.reason,claim:r.claim??null,claimReason:r.claimReason||''});}
 function newRecord(s,id,data){return {id,statement:s.id,sourceRevision:s.revision,sourceLines:JSON.stringify(s.lines),company:s.company,supplier:s.supplier,currency:s.currency,agreement:s.agreement,version:1,revision:1,state:'draft',history:[],...data};}
 // 两端各自演示相同原单的待确认和异议例子，不用角色切换模拟自动送达。
 try{const s=base('DZ20260926003');const a=newRecord(s,'HB-DZ003-01',{line:'C03',kind:'increase',amount:2000,reference:'ZJ-SEND-0926-01',reason:'原账未含的追加送机服务，追加服务确认单ZJ-SEND-0926-01'});a.state='pending';capture(a,'提交后补费用',s.company+'计调');rows.push(a);const b=newRecord(s,'HB-DZ003-02',{line:'C03',kind:'decrease',amount:500,reference:'JM-HOTEL-0926-02',reason:'酒店服务未达约定，另行减免500元，非原账已列减免'});b.state='pending';capture(b,'提交后补费用',s.company+'计调');b.state='disputed';b.version=2;b.claim=300;b.claimReason='供应商同意减免300元，另200元有服务凭据';capture(b,'供应商提出异议',s.supplier+'结算人员');rows.push(b);}catch(e){/* 其他供应商或无本原单时不借用示例。 */}
 function guard(r,version,role,allowed){checkSource(r);if(parent.role!==role)throw Error('当前岗位不能办理');if(version!==r.version)throw Error('后补费用记录已更新，请重新打开');if(!allowed.includes(r.state))throw Error('当前状态不能重复办理');}
 function validate(s,d,editing){
  if(d.company!==s.company||d.supplier!==s.supplier||d.currency!==s.currency)throw Error('采购公司、供应商及币种必须与原对账一致');
  const l=s.lines.find(l=>l.id===d.line);if(!l)throw Error('请选择原对账中的费用');if(!['increase','decrease'].includes(d.kind))throw Error('请选择增加或减免费用');const amount=cents(d.amount);if(!amount)throw Error('后补费用须大于零');const reference=String(d.reference||'').trim(),reason=String(d.reason||'').trim();if(!reference||!reason)throw Error('请填写独立依据单号及增减原因');
  if(rows.some(r=>r.statement===s.id&&r.id!==editing&&r.state!=='void'&&r.reference===reference))throw Error('该依据已登记后补费用，请查看原记录');
  if(s.lines.some(l=>[l.confirmation,l.basis].some(x=>String(x).includes(reference))))throw Error('该依据已在原对账中，不能重复登记');
  const other=rows.filter(r=>r.statement===s.id&&r.line===l.id&&r.id!==editing&&r.state!=='void');const balance=cents(l.amount)+other.reduce((n,r)=>n+(r.kind==='decrease'?-cents(r.amount):r.state==='confirmed'?cents(r.amount):0),0);
  if(d.kind==='decrease'&&amount>balance)throw Error('减免超过本项原金额及已确认调整后的可减金额');return {line:l.id,kind:d.kind,amount:amount/100,reference,reason};
 }
 function save(statement,sourceRevision,id,version,data,submit){
  if(parent.role!=='merchant')throw Error('后补费用由采购公司计调办理');const s=base(statement);if(sourceRevision!==s.revision)throw Error('原对账版本已变化');const old=id?find(id):null;if(old){guard(old,version,'merchant',['draft','disputed']);if(old.statement!==statement)throw Error('后补费用不属于本对账');}
  const d=validate(s,data,id),r=old?clone(old):newRecord(s,'HB-'+s.id+'-'+serial,d);Object.assign(r,d);
  if(submit){if(r.history.some(h=>h.action==='提交后补费用'))r.revision++;r.state='pending';delete r.claim;delete r.claimReason;capture(r,'提交后补费用',s.company+'计调');}else capture(r,'保存后补费用',s.company+'计调');
  if(old){r.version++;rows[rows.indexOf(old)]=r;}else{rows.push(r);serial++;}return clone(r);
 }
 function respond(id,version,result,amount,reason){const r=find(id);guard(r,version,'supplier',['pending']);if(result==='agree'){const s=checkSource(r);validate(s,r,r.id);r.state='confirmed';capture(r,'供应商确认后补费用',r.supplier+'结算人员');}else if(result==='dispute'){const claim=cents(amount)/100,basis=String(reason||'').trim();if(!basis||claim===r.amount)throw Error('请填写不同的主张金额及异议依据');r.claim=claim;r.claimReason=basis;r.state='disputed';capture(r,'供应商提出异议',r.supplier+'结算人员');}else throw Error('请选择核对结果');r.version++;return clone(r);}
 function voidDraft(id,version){const r=find(id);guard(r,version,'merchant',['draft','disputed']);r.state='void';r.version++;capture(r,'作废后补费用',r.company+'计调');return clone(r);}
 function list(id){base(id);return clone(rows.filter(r=>r.statement===id&&(parent.role==='merchant'||r.state!=='draft')));}
 function totals(id){const s=base(id),original=s.lines.reduce((n,l)=>n+cents(l.amount),0),confirmed=rows.filter(r=>r.statement===id&&r.state==='confirmed').reduce((n,r)=>n+(r.kind==='increase'?1:-1)*cents(r.amount),0);return {original:original/100,confirmedDelta:confirmed/100,afterConfirmed:(original+confirmed)/100};}
 return {role:parent.role,list,get:id=>clone(find(id)),base,save,respond,voidDraft,totals};
}
const api={createSession,states};root.SupplierAdjustmentModel=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
