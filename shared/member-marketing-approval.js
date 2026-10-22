/* Member and marketing requests use the existing approval center and business store. */
(function(root){'use strict';
const M=root.CaesarCenters,C=root.ApprovalConfigModel;
const matters=C.scenes.filter(s=>s.group==='会员与营销').map(s=>s.name);
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'¥'+Number(n||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const marketing=a=>['活动报批','活动变更','券作废','券恢复'].includes(a.kind);
function records(view='todo'){
  const s=M.load();return s.approvals.map(a=>{
    const activity=s.activities.find(x=>x.id===a.target),u=s.users.find(x=>x.id===a.uid),isMarketing=marketing(a),pending=a.status==='审批中';
    const status=pending?(view==='mine'?'审批中':'待审批'):a.status==='已驳回'?'已拒绝':a.status;
    const detail=[['申请原因',a.reason],['申请附件',a.attachment||'无'],['审批模板',a.approvalTemplate?a.approvalTemplate.name+' V'+a.approvalTemplate.version:'原申请流程'],['审批进度',(Math.min(a.step+1,a.nodes.length))+' / '+a.nodes.length]];
    let sourceHref=u?'../member/member-detail.html?uid='+encodeURIComponent(u.id):'../member/members.html';
    if(isMarketing&&activity?.flowVersion>=2){
      sourceHref='../marketing/activity-detail.html?id='+encodeURIComponent(activity.id);const plan={...activity,...(a.payload.activityConfig||activity.approvedConfig||{})};
      detail.push(['活动名称',plan.name],['活动级别',plan.level],['活动周期',plan.start+' 至 '+plan.end],['应收目标',money(plan.target)],['负责人',plan.owner],['法人主体',plan.company],['销售范围',M.salesSummary(plan.salesScope||{})],['参与资格',M.eligibilitySummary(plan.eligibility||{})],['自动优惠',(plan.autoPromotions||[]).map(r=>r.name+'；'+(r.kind==='nth'?'第'+r.nth+'名成人优惠':M.priceSummary({threshold:r.threshold,amount:r.amount,pricing:{method:r.kind,rate:r.rate,cap:r.cap}}))+'；'+r.scope.productIds.join('、')+'；团期 '+r.scope.scheduleIds.join('、')+'；'+r.allocations.map(x=>M.partyName(x.party)+' '+x.percent+'%').join('／')).join('；')||'无'],['关联券',(plan.couponOffers||[]).map(o=>o.templateSnapshot.name+' V'+o.templateSnapshot.version+'；'+o.tierIds.join('、')+'；'+o.total+'张／每人'+o.perUser+'张；'+o.start+' 至 '+o.end).join('；')||'无'],['产品与团期',M.activityManifest(s,plan).map(r=>r.productName+' '+r.id+'；'+r.autoRules.join('、')+'；'+r.coupons.join('、')).join('；')],['团期准入',plan.schedulePolicy==='empty'?'启售且未收客':'启售'],['自动优惠叠加',plan.autoStrategy==='sum'?'累计优惠':'择优一条'],['券及积分叠加',plan.autoCouponStack===false?'不允许':'允许，仍遵守券与积分规则']);
      if(plan.flowVersion===3)for(let i=detail.length-1;i>=0;i--)if(['自动优惠','自动优惠叠加','券及积分叠加'].includes(detail[i][0]))detail.splice(i,1);
    }else if(isMarketing&&activity){
      sourceHref='../marketing/activity-detail.html?id='+encodeURIComponent(activity.id);
      detail.push(['销售范围',M.salesSummary(activity.salesScope)],['参与资格',M.eligibilitySummary(activity.eligibility)],['自动优惠',(activity.autoPromotions||[]).map(r=>r.name+'：'+(r.kind==='nth'?'第'+r.nth+'名成人'+(r.nthMode==='fixed'?'减'+r.amount+'元':r.rate+'折'):M.priceSummary({threshold:r.threshold,amount:r.amount,pricing:{method:r.kind,rate:r.rate,cap:r.cap}}))).join('；')||'无']);detail.push(['活动级别',activity.level],['活动周期',activity.start.replace('T',' ')+' 至 '+activity.end.replace('T',' ')],['应收目标',money(activity.target)],['负责人',activity.owner],['法人主体',activity.company],['产品范围',activity.sources.join('、')],['子公司',activity.branches.join('、')],['直降承担','产品 '+activity.shares.product+'% / 渠道 '+activity.shares.channel+'% / 供应商 '+activity.shares.supplier+'%'],['关联券',activity.coupons.map(id=>s.templates.find(t=>t.id===id)?.name||id).join('；')]);
      detail.push(['活动用券配置',(activity.couponOffers||[]).map(o=>o.templateSnapshot.name+' V'+(o.templateSnapshot.version||1)+'；'+o.tierIds.length+'档；额度'+o.total+'张；每人'+o.perUser+'张；'+o.start+' 至 '+o.end).join('；')||'无']);
      if(a.kind==='活动变更')detail.push(['调整后关联券',(a.payload.couponOffers||[]).map(o=>o.templateSnapshot.name+'：'+o.templateSnapshot.tiers.filter(r=>o.tierIds.includes(r.id)).map(r=>(r.points?r.points+'积分，':'')+'满'+r.threshold+'减'+r.amount).join('／')+'；总额度'+o.total+'张，每人'+o.perUser+'张；'+o.start+'至'+o.end+'；'+(o.expireWithActivity?'随活动结束失效':'按领取后有效期使用')).join('；')||'全部下架']);
    }else if(['券作废','券恢复'].includes(a.kind)){const w=s.wallet.find(w=>w.id===a.target);sourceHref='../marketing/coupon-ledger.html?tab='+encodeURIComponent('券查询')+'&coupon='+encodeURIComponent(a.target);detail.push(['券编号',a.target],['券名称',w?.name||'—'],['当前状态',w?.status||'—'],['申请时状态',a.payload.expectedStatus],['原有效期',w?.expires||'—'],['处理边界','不返还积分，不调整已使用及退款流水，恢复保留原有效期']);}else if(a.kind==='人工调级'){
      const target=(s.levelVersions.find(v=>v.status==='生效中')?.levels||M.levels).find(l=>l.name===(a.payload.grade||a.grade));
      detail.push(['会员',u?.name||a.uid],['原等级',a.old||a.payload.old],['目标等级',a.grade||a.payload.grade],['近12月消费',money(u?.spend)],['目标等级门槛',money(target?.min)],['差额',money(Math.max(0,(target?.min||0)-(u?.spend||0)))]);
    }else{
      const labels={amount:'补发积分',result:'处理方式',refund:'是否退还积分',mode:'重跑范围',uid:'会员UID'};
      Object.entries(labels).forEach(([key,label])=>{if(a.payload[key]!==undefined)detail.push([label,typeof a.payload[key]==='boolean'?(a.payload[key]?'是':'否'):a.payload[key]]);});
      const links={'等级规则发布':'level-rules','积分规则发布':'point-rules','章程发布':'charters','等级失败重跑':'level-tasks','积分发放处理':'point-dispatch','取消兑换':'shop-orders'};
      if(links[a.kind])sourceHref='../member/'+links[a.kind]+'.html';
    }
    return {memberMarketing:true,no:a.id,matter:a.kind,source:isMarketing?'营销中心':'会员中心',scopes:pending?['todo','mine','overview']:['mine','overview'],status,applicant:a.applicant,applicantRole:isMarketing?'营销运营':'会员运营',businessTitle:isMarketing?activity?.name||a.target:(u?.name?u.name+' · ':'')+a.kind,businessNo:a.target,context:isMarketing?activity?.company||'':a.uid,impact:['券作废','券恢复'].includes(a.kind)?a.kind:isMarketing?money(activity?.target):a.kind==='人工调级'?(a.old||a.payload.old)+' → '+(a.grade||a.payload.grade):a.payload.amount?Number(a.payload.amount).toLocaleString('zh-CN')+' 积分':a.kind,node:pending?a.nodes[a.step]:'审批结束',due:pending?'待处理':'已结束',appliedAt:a.time.slice(0,10),detail,sourceHref,flow:[['提交',a.time+' / '+a.applicant],...a.history.map(h=>[h.time,h.node+' / '+h.by+' / '+h.decision+' / '+h.opinion])],opinion:a.history.at(-1)?.opinion||''};
  });
}
function render(item){
  const s=M.load(),a=s.approvals.find(x=>x.id===item.no);if(!a)return '';
  const steps=a.nodes.map((n,i)=>'<span class="tag '+(a.status==='已通过'||i<a.step?'tag-green':a.status==='审批中'&&i===a.step?'tag-blue':'tag-gray')+'">'+(i+1)+'. '+e(n)+'</span>').join(' → ');
  let extra='';
  if(a.kind==='等级规则发布'){
    const v=s.levelVersions.find(x=>x.id===a.target);if(v)extra='<h3>本次等级规则</h3><table class="table"><thead><tr><th>等级</th><th>消费门槛</th><th>积分倍数</th><th>年度活动次数</th></tr></thead><tbody>'+v.levels.map(l=>'<tr><td>'+e(l.name)+'</td><td>'+money(l.min)+'</td><td>'+e(l.multiplier)+'</td><td>'+e(l.annual)+'</td></tr>').join('')+'</tbody></table>';
  }
  if(a.kind==='积分规则发布'){
    const v=s.pointVersions.find(x=>x.id===a.target);if(v)extra='<h3>本次积分规则</h3><p>'+e('基础积分 '+v.baseRate+'%；'+v.ratio+' 积分抵1元；单笔上限 '+v.cap+'%；有效期 '+v.days+' 天；适用 '+v.scope.join('、'))+'</p>';
  }
  if(a.kind==='章程发布'){const v=s.charters.find(x=>x.id===a.target);if(v)extra='<h3>章程内容</h3><pre style="white-space:pre-wrap;font:inherit;line-height:1.8">'+e(v.content)+'</pre>';}
  const attachment=s.attachments.find(x=>x.id===a.id||x.id===a.target),file=attachment&&/^data:[\w.+/-]+;base64,[\w+/=\r\n]+$/.test(attachment.data)?'<a class="btn btn-secondary" download="'+e(attachment.name)+'" href="'+e(attachment.data)+'">下载附件</a>':'';
  return '<section class="mm-approval-flow"><h3>审批节点</h3><div class="mm-approval-steps">'+steps+'</div>'+extra+'<p><a class="btn btn-secondary" href="'+e(item.sourceHref)+'">查看来源单据</a> '+file+' '+(a.approvalTemplate?'<a class="btn btn-secondary" href="../../admin/approval-template-edit.html?id='+e(a.approvalTemplate.id)+'&mode=view">查看审批模板</a>':'')+'</p></section>';
}
function controls(item){
  const a=M.load().approvals.find(x=>x.id===item.no),transfer=a?.approvalTemplate?.template.rules.transferAllowed!==false;
  return '<label><input type="radio" name="approvalDecision" value="通过" checked> 通过</label><label><input type="radio" name="approvalDecision" value="驳回"> 驳回</label>'+(transfer?'<label><input type="radio" name="approvalDecision" value="转交"> 转交</label><label>转交给 <select id="mmApprovalDelegate" class="form-control"><option>李佳</option><option>周宁</option><option>张敏</option><option>孙丽</option></select></label>':'');
}
function decide(id,decision,opinion,delegate){
  if(!['通过','驳回','转交'].includes(decision))throw Error('请选择有效审批结果');
  const s=M.load(),a=s.approvals.find(x=>x.id===id);
  if(decision==='转交'&&a?.approvalTemplate?.template.rules.transferAllowed===false)throw Error('该模板不允许转交');
  const result=M.approve(s,id,decision,opinion,delegate);M.save(s);return result;
}
root.MemberMarketingApproval={matters,records,render,controls,decide};
})(window);
