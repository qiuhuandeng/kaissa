/* Membership benefits: eligibility, reservations and fulfilment; no external delivery. */
(function(root,factory){if(typeof module==='object'&&module.exports){require('./supplier-company-view.js');module.exports=factory(require('./member-marketing-model.js'),root);}else root.CaesarBenefits=factory(root.CaesarCenters,root);})(typeof window==='undefined'?globalThis:window,function(M,root){
'use strict';
const assert=(v,m)=>{if(!v)throw Error(m);};
const now=()=>M.businessNow().replace('T',' '), stamp=v=>String(v||'').replace('T',' ').slice(0,16), year=v=>stamp(v).slice(0,4);
const get=(s,k,id)=>{const r=s[k].find(x=>x.id===id);assert(r,'记录不存在');return r;};
const active=['已接受','已参与'];
const suppliers=()=>root.SupplierCompanyView||[];
const partner=(s,id)=>suppliers().find(p=>p.id===id)||s.partners.find(p=>p.id===id);
function supplierReason(id,at=now()){
 const p=suppliers().find(p=>p.id===id),date=stamp(at).slice(0,10);
 if(!p)return'请从资源管理的供应商中选择合作方';
 if(p.status!=='已准入')return'供应商尚未准入或已停用';
 if(!p.agreements.some(a=>a.status==='已归档'&&a.effective==='已确认'&&a.start<=date&&a.end>=date))return'供应商暂无有效合作协议';
 return'';
}
function ensure(s){
 s.gradeBenefits??=[{id:'GB-POINTS',name:'消费积分加速',kind:'points',description:'有效消费完成后，按会员等级计算积分倍率。',status:'生效中'},{id:'GB-EVENT',name:'会员活动特权',kind:'event',description:'按等级享有年度会员活动参与次数，报名冻结、核销使用。',status:'生效中'}];
 for(const e of s.ownEvents){e.grades??=[e.grade];e.end??=stamp(e.time).slice(0,10)+' 17:00';e.deadline??=stamp(e.time);e.location??=(e.name.split(' · ')[1]||'凯撒会员中心')+'活动区';e.description??='会员专属旅行交流活动';e.activity??='';}
 for(const r of s.invitations){r.year??=year(s.ownEvents.find(e=>e.id===r.event)?.time||r.time);r.delivery??='未接入';r.channel??='小程序消息';r.history??=[];r.quotaState=r.status==='已参与'?'已使用':r.status==='已接受'?'已冻结':'未占用';}
 for(const b of s.benefits){b.acquire??='免费领取';b.points??=0;b.perUser??=1;}
 for(const r of s.benefitUses){r.mode??='免费领取';r.points??=0;r.history??=[];const order=s.shopOrders.find(o=>o.id===r.order);if(order?.status==='已退回'&&r.status!=='已取消'){r.status='已取消';r.remark='兑换订单取消，权益资格已释放';}}
 return s;
}
function quota(s,uid,y=year(now())){ensure(s);const u=get(s,'users',uid),rule=s.levelVersions.find(v=>v.status==='生效中')?.levels.find(l=>l.name===u.grade),rows=s.invitations.filter(r=>r.uid===uid&&r.year===y);const used=rows.filter(r=>r.status==='已参与').length,held=rows.filter(r=>r.status==='已接受').length,total=rule?.annual||0;return{total,used,held,remaining:Math.max(0,total-used-held)};}
function eventStats(s,id){const rs=s.invitations.filter(r=>r.event===id),e=get(s,'ownEvents',id),booked=rs.filter(r=>active.includes(r.status)).length;return{invited:rs.length,booked,participated:rs.filter(r=>r.status==='已参与').length,remaining:Math.max(0,+e.total-booked)};}
function memberReason(s,e,u,at=now(),registration=false){if(!u?.member||u.status!=='正常')return'会员状态不可用';if(u.expires&&u.expires!=='长期有效'&&u.expires<stamp(at).slice(0,10))return'会员等级已过期';if(!e.grades.includes(u.grade))return'等级不适用';if(!quota(s,u.id,year(e.time)).remaining)return'年度活动次数已用完';const r=s.invitations.find(r=>r.event===e.id&&r.uid===u.id);if(!registration&&r)return'已邀请';return'';}
function openCheck(e,at){assert(e.status==='开放邀请','活动未开放邀请');assert(stamp(at)<=stamp(e.deadline),'已过报名截止时间');}
function saveEvent(s,id,f){ensure(s);const old=id?get(s,'ownEvents',id):null;assert(!old||!['已取消','已结束'].includes(old.status),'活动已结束，不能编辑');assert(f.name?.trim()&&f.location?.trim(),'请填写活动名称和地点');assert(f.grades?.length&&f.grades.every(g=>M.gradeNames.includes(g)),'请选择适用等级');assert(Number.isInteger(+f.total)&&+f.total>0,'名额须为正整数');assert(f.time&&f.end&&f.deadline&&stamp(f.time)<stamp(f.end)&&stamp(f.deadline)<=stamp(f.time),'截止时间须不晚于开始时间，结束时间须晚于开始时间');assert(!f.activity||s.activities.some(a=>a.id===f.activity),'关联营销活动不存在');if(old){assert(+f.total>=eventStats(s,id).booked,'名额不能少于已报名人数');if(s.invitations.some(r=>r.event===id)){assert(JSON.stringify(f.grades)===JSON.stringify(old.grades)&&stamp(f.time)===stamp(old.time),'已发邀请，适用等级和开始时间不可变更');}}
 const e=old||{id:M.id(s,'ZYQY'),status:'开放邀请'};Object.assign(e,{name:f.name.trim(),grades:f.grades,grade:f.grades[0],total:+f.total,time:stamp(f.time),end:stamp(f.end),deadline:stamp(f.deadline),location:f.location.trim(),description:f.description||'',activity:f.activity||''});if(!old)s.ownEvents.unshift(e);M.audit(s,e.id,old?'编辑会员活动':'新建会员活动',e.name);return e;
}
function invite(s,event,uids,channel,content,at=now()){ensure(s);const e=get(s,'ownEvents',event);openCheck(e,at);assert(['小程序消息','短信','小程序消息＋短信'].includes(channel),'请选择通知渠道');assert(content?.trim(),'请填写邀请内容');const ids=[...new Set(uids)];assert(ids.length,'请选择会员');for(const uid of ids){const reason=memberReason(s,e,s.users.find(u=>u.id===uid),at);assert(!reason,uid+'：'+reason);}for(const uid of ids){const r={id:M.id(s,'YQ'),event,uid,time:stamp(at),year:year(e.time),status:'已邀请',quotaState:'未占用',delivery:'待发送',channel,content:content.trim(),history:[{time:stamp(at),action:'创建邀请',by:'张三',remark:'生成通知任务'}]};s.invitations.unshift(r);s.messages.unshift({id:M.id(s,'MSG'),invitation:r.id,uid,title:e.name+' · 会员邀请',content:r.content,channel,time:stamp(at),status:'待发送'});M.audit(s,uid,'会员活动邀请',e.name+'；'+r.id);}return ids.length;}
function receipt(s,id,result,remark,at=now()){const r=get(s,'invitations',id);assert(['待发送','发送失败','未接入'].includes(r.delivery),'已有发送结果，请勿重复登记');assert(['已送达','发送失败'].includes(result),'发送结果无效');assert(remark?.trim(),'请填写回执依据');r.delivery=result;r.deliveryRemark=remark;r.history.push({time:stamp(at),action:'登记通知回执',by:'张三',remark:result+'；'+remark});const m=s.messages.find(m=>m.invitation===id&&m.status==='待发送');if(m){m.status=result;m.remark=remark;}M.audit(s,r.uid,'邀请通知回执',r.id+'；'+result);}
function retry(s,id){const r=get(s,'invitations',id);assert(r.delivery==='发送失败'&&r.status==='已邀请','当前记录不可重试');openCheck(get(s,'ownEvents',r.event),now());r.delivery='待发送';r.history.push({time:now(),action:'重试通知',by:'张三',remark:'重新排队'});s.messages.unshift({id:M.id(s,'MSG'),invitation:id,uid:r.uid,channel:r.channel,title:'会员活动邀请',content:r.content,time:now(),status:'待发送'});M.audit(s,r.uid,'重试邀请通知',id);}
function respond(s,id,status,reason,at=now()){ensure(s);const r=get(s,'invitations',id),e=get(s,'ownEvents',r.event);assert(reason?.trim(),'请填写办理依据');assert(!['已取消','已结束'].includes(e.status),'活动已取消或结束');const allowed={'已邀请':['已接受','已拒绝'],'已接受':['已参与','已取消'],'已参与':[],'已拒绝':[],'已取消':[]};assert(allowed[r.status]?.includes(status),'当前状态不能进行此操作');if(status==='已接受'){assert(stamp(at)<=stamp(e.deadline),'已过报名截止时间');const why=memberReason(s,e,get(s,'users',r.uid),at,true);assert(!why,why);assert(eventStats(s,e.id).remaining>0,'活动名额已满');}if(status==='已参与'){assert(stamp(at)>=stamp(e.time),'活动尚未开始，不能登记核销');r.checkedAt=stamp(at);}r.status=status;r.quotaState=status==='已接受'?'已冻结':status==='已参与'?'已使用':'未占用';r.history.push({time:stamp(at),action:status,by:'张三',remark:reason});M.audit(s,r.uid,'会员活动'+status,e.name+'；'+reason);return r;}
function eventStatus(s,id,status,reason){const e=get(s,'ownEvents',id);assert(reason?.trim(),'请填写办理原因');assert(!['已取消','已结束'].includes(e.status),'活动已取消或结束');assert(['开放邀请','停止邀请','已取消'].includes(status),'活动状态无效');if(status==='开放邀请')assert(stamp(now())<=stamp(e.deadline),'已过报名截止时间');if(status==='已取消'){assert(!s.invitations.some(r=>r.event===id&&r.status==='已参与'),'已有核销记录，不能取消整个活动');for(const r of s.invitations.filter(r=>r.event===id&&['已邀请','已接受'].includes(r.status))){r.status='已取消';r.quotaState='未占用';r.history??=[];r.history.push({time:now(),action:'活动取消',by:'张三',remark:reason});}}e.status=status;M.audit(s,id,status,reason);}
function benefitStats(s,id){const b=get(s,'benefits',id),held=s.benefitUses.filter(r=>r.benefit===id&&['已申请','已跳转','待使用'].includes(r.status)).length;return{held,remaining:b.stock==='不限'?'不限':Math.max(0,+b.stock-(+b.used||0)-held)};}
function claimReason(s,b,u,at=now()){if(!u?.member||u.status!=='正常')return'会员状态不可用';if(!b.grades.includes(u.grade))return'会员等级不适用';if(u.expires&&u.expires!=='长期有效'&&u.expires<stamp(at).slice(0,10))return'会员等级已过期';const p=partner(s,b.partner);if(suppliers().some(p=>p.id===b.partner)){const why=supplierReason(b.partner,at);if(why)return why;}else if(!p||p.status!=='合作中'||p.start>stamp(at).slice(0,10)||p.end<stamp(at).slice(0,10))return'合作方未在有效合作期';if(b.status!=='生效中'||b.start>stamp(at).slice(0,10)||b.end<stamp(at).slice(0,10))return'权益未生效或已到期';if(benefitStats(s,b.id).remaining!== '不限'&&benefitStats(s,b.id).remaining<1)return'权益库存不足';if(s.benefitUses.filter(r=>r.benefit===b.id&&r.uid===u.id&&r.status!=='已取消').length>=b.perUser)return'已达到个人领取上限';if(b.acquire==='积分兑换'&&u.balance-u.frozen<b.points)return'可用积分不足';return'';}
function claim(s,id,uid,remark,at=now()){ensure(s);const b=get(s,'benefits',id),u=get(s,'users',uid);assert(['免费领取','积分兑换'].includes(b.acquire),'领取方式配置无效');assert(b.acquire!=='积分兑换'||Number.isInteger(+b.points)&&+b.points>0,'兑换积分配置无效');const why=claimReason(s,b,u,at);assert(!why,why);assert(remark?.trim(),'请填写客户确认依据');const r={id:M.id(s,'QYSY'),uid,benefit:id,partner:b.partner,applied:stamp(at),jumped:'',status:'待使用',mode:b.acquire,points:b.acquire==='积分兑换'?+b.points:0,remark,history:[{time:stamp(at),action:'登记领取',by:'张三',remark}]};if(r.points){assert(Number.isInteger(r.points)&&r.points>0,'兑换积分配置无效');M.spend(s,uid,r.points,'兑换',r.id);r.order=r.id;s.shopOrders.unshift({id:r.id,uid,name:b.name,type:'第三方服务',points:r.points,time:stamp(at),status:'待使用',benefit:id,logistics:'合作方履约',logStatus:'无需物流',remark});}s.benefitUses.unshift(r);M.audit(s,uid,'领取第三方权益',b.name+'；'+r.id);return r;}
function fulfill(s,id,result,reference){const r=get(s,'benefitUses',id),b=get(s,'benefits',r.benefit);assert(['已申请','已跳转','待使用'].includes(r.status),'当前记录不可重复办理');assert(reference?.trim(),'请填写合作方凭证或办理原因');assert(['已使用','已取消'].includes(result),'结果无效');assert(!(result==='已取消'&&r.points>0),'积分兑换请在兑换订单发起取消审批');assert(!s.approvals.some(a=>a.kind==='取消兑换'&&a.target===r.order&&a.status==='审批中'),'兑换取消审批中，暂不可核销');if(result==='已使用'){b.used=(+b.used||0)+1;r.usedAt=now();const o=s.shopOrders.find(o=>o.id===r.order);if(o)o.status='已完成';}r.status=result;r.reference=reference;r.history.push({time:now(),action:result,by:'张三',remark:reference});M.audit(s,r.uid,'第三方权益'+result,r.id+'；'+reference);}
function gradeRights(s){
 ensure(s);const current=s.levelVersions.find(v=>v.status==='生效中');
 return s.gradeBenefits.map(r=>{
  const published=(current.benefitDefinitions||[]).find(d=>d.id===r.id);
  const pending=!published&&r.versioned?s.levelVersions.find(v=>v.benefitSource===r.id):null;
  const metadata=published||pending?.benefitDefinitions?.find(d=>d.id===r.id),row={...r,...metadata};
  if(r.kind==='service'){
   row.values=row.values||Object.fromEntries(M.gradeNames.map(g=>[g,row.grades?.includes(g)?row.description:'']));
   row.grades=M.gradeNames.filter(g=>row.values[g]);
   if(pending)row.status=pending.status==='已失效'?'停用':pending.status;
  }else{
   row.grades=current.levels.filter(l=>r.kind==='points'||+l.annual>0).map(l=>l.name);
   row.levels=M.clone(current.levels);
  }
  row.version=pending?.id||current.id;return row;
 });
}
function saveGradeRule(s,id,f,submit=true){
 ensure(s);const r=id?gradeRights(s).find(r=>r.id===id):{kind:'service'};
 assert(r,'等级权益不存在');
 assert(f.name?.trim()&&f.description?.trim(),'请填写权益名称和权益说明');
 assert(f.notice&&f.effective&&new Date(f.effective)-new Date(f.notice)>=7*86400000,'生效日期须在公示日期至少7天后');
 assert(f.summary?.trim(),'请填写变更原因');
 assert(!s.levelVersions.some(v=>v.benefitSource&&['审批中','待生效'].includes(v.status)),'已有等级权益变更待处理，请先完成审批及生效');
 const current=s.levelVersions.find(v=>v.status==='生效中'),draft=id&&s.levelVersions.find(v=>v.benefitSource===id&&v.status==='草稿'),v=M.clone(current);
 const definition={kind:r.kind,name:f.name.trim(),description:f.description.trim()};
 if(r.kind==='service'){
  definition.values=Object.fromEntries(M.gradeNames.map(g=>[g,String(f.values?.[g]??'').trim()]));
  definition.grades=M.gradeNames.filter(g=>definition.values[g]);
  definition.status=f.status||'生效中';
  assert(['生效中','停用'].includes(definition.status),'权益状态无效');
  assert(definition.grades.length,'请至少填写一个等级的权益待遇');
 }else{
  const key=r.kind==='points'?'multiplier':'annual';
  assert(M.gradeNames.every(g=>String(f.values?.[g]??'').trim()!==''),'请填写所有等级的权益标准');
  v.levels.forEach(l=>{l[key]=Number(f.values[l.name]);});
  const errors=M.validateLevels(v.levels);assert(!errors.length,errors.join('；'));
 }
 const benefitId=id||M.id(s,'GB');definition.id=benefitId;
 v.id=draft?.id||'LV-2026-V'+(Math.max(...s.levelVersions.map(x=>+(x.id.match(/-V(\d+)$/)?.[1]||0)))+1);
 Object.assign(v,{name:'会员等级规则 '+v.id,created:now(),by:'张三',notice:f.notice,effective:f.effective,summary:f.summary,status:submit?'审批中':'草稿',benefitSource:benefitId});
 v.benefitDefinitions=(v.benefitDefinitions||[]).filter(d=>d.id!==benefitId);v.benefitDefinitions.push(definition);
 if(!id)s.gradeBenefits.push({id:benefitId,kind:'service',name:definition.name,description:definition.description,grades:[],status:'草稿',versioned:true});
 if(draft)s.levelVersions[s.levelVersions.indexOf(draft)]=v;else s.levelVersions.unshift(v);
 if(submit)M.request(s,'等级规则发布',v.id,{},f.summary);
 M.audit(s,benefitId,submit?'提交等级权益审批':'保存等级权益草稿',v.id);return v;
}
return{suppliers,partner,supplierReason,gradeRights,saveGradeRule,ensure,quota,eventStats,memberReason,saveEvent,invite,receipt,retry,respond,eventStatus,benefitStats,claimReason,claim,fulfill,now,stamp};
});
