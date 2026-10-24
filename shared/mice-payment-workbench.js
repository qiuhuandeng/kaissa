/* 将项目采购接入原履约付款申请表格及请款抽屉，不另开办理工作区。 */
(function(){
  'use strict';
  if(!window.MiceUI||!window.SupplierPaymentWorkbench)return;
  const U=MiceUI,S=U.store,D=S.data,M=MicePaymentModel,E=U.esc,H=SupplierPaymentWorkbench;
  const money=(n,c)=>U.M.money(n,c||'CNY'),today=()=>new Date().toLocaleDateString('en-CA');
  const unique=a=>[...new Set(a.filter(Boolean))].join('、');
  let active=null;
  function groups(){return D.costs.filter(c=>c.status==='已确认').map(c=>{
    const p=S.find('projects',c.projectId);if(!p)return null;
    const items=M.lines(c,D.requests,D.activities),available=M.balance(c,D.requests),draft=D.requests.find(r=>r.costId===c.id&&r.status==='草稿');
    if(!available&&c.conditionLimit!=null&&!draft)return null;
    return {id:'MICE-PAY-'+c.id,miceCostId:c.id,sourceType:'project',projectNo:p.id,projectName:p.name,customer:p.customer,supplier:c.supplier,entity:c.company||p.company,currency:c.currency||'CNY',account:c.verifiedAccount||'待财务核对供应商账户',node:c.paymentTerms||c.paymentBasis||(c.conditionLimit==null?'付款条件待核对':'按已登记可付额度'),status:draft?'草稿':c.paid?'部分付款':'待申请',expectedDate:draft?.date||today(),contract:c.basis,billNo:c.id,available,items:items.map((r,i)=>({...r,paid:i?0:Number(c.paid||0),applied:i?0:U.M.payable(c,D.requests).unpaid})),draft};
  }).filter(Boolean);}
  function record(r){
    const c=S.find('costs',r.costId);if(!c)return null;
    return {...r,miceRequestId:r.id,sourceType:'project',projectNo:r.projectId,groupId:'MICE-PAY-'+c.id,groupIds:['MICE-PAY-'+c.id],entity:r.company,account:r.verifiedAccount||r.accountStatus||'待财务核对',node:c.paymentTerms||c.paymentBasis||(c.conditionLimit==null?'付款条件待核对':'按已登记可付额度'),approvalStatus:r.status==='待财务复核'?'审批中':r.status==='已退回'?'已驳回':r.status,items:(r.allocations?.length?r.allocations:[{activityId:r.activityId,amount:r.amount}]).map(a=>({groupId:'MICE-PAY-'+c.id,costId:c.id,scheduleNo:a.activityId||'项目公共费用',route:S.find('activities',a.activityId)?.name||'项目公共费用',fee:c.name,supplier:c.supplier,entity:r.company,currency:r.currency,requestAmount:a.amount,remark:a.remark||''}))};
  }
  function sync(targetGroups,targetRecords){
    for(let i=targetGroups.length-1;i>=0;i--)if(targetGroups[i].sourceType==='project')targetGroups.splice(i,1);
    targetGroups.push(...groups());
    for(let i=targetRecords.length-1;i>=0;i--)if(targetRecords[i].sourceType==='project'||targetRecords[i].miceRequestId)targetRecords.splice(i,1);
    targetRecords.push(...D.requests.map(record).filter(Boolean));
  }
  function views(rows){const map=new Map();rows.filter(g=>g.miceCostId).forEach(g=>{
    const key=[g.projectNo,g.currency].join('|');if(!map.has(key))map.set(key,{key,label:g.projectName,subLabel:g.projectNo+' · '+g.customer+' · '+g.currency,currency:g.currency,groups:[],groupIds:[],amount:0,applied:0,paid:0,available:0});
    const v=map.get(key),c=S.find('costs',g.miceCostId);v.groups.push(g);v.groupIds.push(g.id);v.amount+=c.amount;v.paid+=c.paid||0;v.available+=g.available;v.applied+=U.M.payable(c,D.requests).unpaid;
  });return [...map.values()].map(v=>{
    const activities=new Set(v.groups.flatMap(g=>g.items.map(i=>i.activityId)).filter(Boolean)),suppliers=[...new Set(v.groups.map(g=>g.supplier).filter(Boolean))];
    const hasCommon=v.groups.some(g=>S.find('costs',g.miceCostId)?.scopeType==='common'),hasUnallocated=v.groups.some(g=>g.items.some(i=>!i.activityId)&&S.find('costs',g.miceCostId)?.scopeType==='shared');
    return {...v,projectNo:v.groups[0].projectNo,customer:v.groups[0].customer,node:unique(v.groups.map(g=>g.node)),relatedObjects:activities.size?activities.size+' 个项目团':'项目整体',relatedNote:[hasCommon?'含项目公共费用':'',hasUnallocated?'含未分配费用':''].filter(Boolean).join('、'),costScope:suppliers.length>1?suppliers.length+' 家供应商':suppliers[0]||'—',supplierNames:suppliers.join('、'),searchText:unique(v.groups.flatMap(g=>[g.projectNo,g.projectName,g.customer,g.supplier,...g.items.flatMap(i=>[i.scheduleNo,i.route,i.fee])])),expectedDate:v.groups.map(g=>g.expectedDate).sort()[0]};
  });}
  function handles(context){return context?.groups?.length&&context.groups.every(g=>g.miceCostId);}
  function termsHtml(context){
    const grouped=new Map();
    context.groups.forEach(g=>{
      const key=JSON.stringify([g.supplier,g.entity,g.currency,g.node]);
      if(!grouped.has(key))grouped.set(key,{...g,rows:[],total:0});
      const row=grouped.get(key);row.rows.push(g);row.total+=g.available;
    });
    return '<div class="project-payment-terms">'+[...grouped.values()].map(g=>{
      const rows=g.rows.map(r=>'<tr><td><strong>'+E(r.items[0]?.fee||'采购费用')+'</strong><small>'+E(r.billNo||r.miceCostId)+'</small></td><td>'+E(unique(r.items.map(i=>i.route))||'项目公共费用')+'</td><td class="terms-money">'+E(money(r.available,r.currency))+'</td></tr>').join('');
      return '<div class="project-payment-term"><div class="project-payment-term-head"><div class="project-payment-term-party"><strong>'+E(g.supplier)+'</strong><span>'+E(g.entity)+' · '+E(g.currency)+'</span></div><p>'+E(g.node)+'</p><div class="project-payment-term-amount"><span>可申请金额</span><strong>'+E(money(g.total,g.currency))+'</strong></div></div><details class="project-payment-term-detail"><summary>查看 '+g.rows.length+' 笔采购</summary><div class="project-payment-term-table"><table aria-label="付款条件对应采购"><thead><tr><th>采购费用</th><th>关联项目团</th><th class="terms-money">可申请金额</th></tr></thead><tbody>'+rows+'</tbody></table></div></details></div>';
    }).join('')+'</div>';
  }
  function opened(context){
    active=handles(context)?context:null;
    document.getElementById('projectPaymentError').textContent='';
    document.getElementById('applyReceiveAccount').disabled=!!active;
    const summary=document.getElementById('paymentApplySummary'),basis=document.getElementById('paymentAgreementBasis'),section=basis.closest('section');
    section.hidden=false;
    summary.classList.toggle('project-payment-overview',!!active);
    section.classList.toggle('project-payment-terms-section',!!active);
    basis.previousElementSibling.textContent=active?'付款条件':'公司协议与付款责任依据';
    if(!active){summary.before(section);return;}
    section.before(summary);
    basis.innerHTML=termsHtml(context);
    if(context.groups.some(g=>g.draft))context.items.forEach(i=>{if(!context.groups.find(g=>g.miceCostId===i.costId)?.draft)i.suggested=0;});
    context.items.sort((a,b)=>a.scheduleNo.localeCompare(b.scheduleNo)||a.costId.localeCompare(b.costId));
    H.renderLines(context);
    document.getElementById('paymentApplyDrawerTitle').textContent='请款';
    document.querySelector('#paymentApplyDrawer [role=dialog]').dataset.drawerTitleFixed='请款';
    const totals={};context.groups.forEach(g=>totals[g.currency]=(totals[g.currency]||0)+g.available);
    const mode=context.mode==='project'?'按项目':context.mode==='schedule'?'按团期':context.mode==='subject'?'按科目':'按供应商';
    summary.innerHTML='<div class="project-payment-overview-main"><div><span class="project-payment-overline">'+E(mode)+' · '+E(unique(context.groups.map(g=>g.projectNo)))+'</span><h3>'+E(unique(context.groups.map(g=>g.projectName)))+'</h3><p>'+E(unique(context.groups.map(g=>g.customer)))+'</p></div><div class="project-payment-overview-amount"><span>可申请金额</span>'+Object.entries(totals).map(([c,n])=>'<strong>'+E(money(n,c))+'</strong>').join('')+'</div></div><div class="project-payment-overview-meta"><div><span>付款对象</span><strong>'+E(context.supplier)+'</strong></div><div><span>结算主体</span><strong>'+E(context.entity)+'</strong></div></div>';
    document.getElementById('applyReceiveAccount').value='按原采购供应商账户，由财务核对';
    document.getElementById('applyPaymentMethod').value=context.groups.find(g=>g.draft)?.draft.paymentMethod||'线下转账';
    document.getElementById('applyReason').value=context.groups.find(g=>g.draft)?.draft.note||'';
    document.getElementById('paymentDetailScope').textContent='按子团选择费用并填写本次申请金额';
    update(context,[]);
  }
  function update(context,selected){if(!handles(context))return false;
    const totals={};selected.forEach(r=>totals[r.currency]=(totals[r.currency]||0)+r.requestAmount);
    document.getElementById('paymentApplyTotal').textContent=Object.keys(totals).length?Object.entries(totals).map(([c,n])=>money(n,c)).join(' / '):money(0);
    return true;
  }
  function save(context,items,status){
    if(context.saved)return null;
    const error=M.validate(D.costs,D.requests,D.activities,items);if(error){document.getElementById('projectPaymentError').textContent=error;return null;}
    document.getElementById('projectPaymentError').textContent='';
    context.saved=true;
    const submitted=status!=='草稿',created=[];
    for(const g of context.groups){
      const rows=items.filter(i=>i.costId===g.miceCostId),c=S.find('costs',g.miceCostId),old=D.requests.find(r=>r.costId===c.id&&r.status==='草稿');
      if(!rows.length){if(old){old.status='已撤回';old.returnReason='本次请款未选择该费用';}continue;}
      const r=old||{id:S.id('FK'),projectId:c.projectId,costId:c.id,paid:0,version:1,history:[]};
      Object.assign(r,{activityId:c.activityId||'',supplier:c.supplier,company:c.company||S.find('projects',c.projectId).company,currency:c.currency,amount:M.sum(rows.map(i=>({amount:i.requestAmount}))),date:document.getElementById('expectedPayDate').value,purpose:c.name,basis:c.paymentBasis||c.basis||c.paymentTerms,attachments:c.attachments||[],note:document.getElementById('applyReason').value,paymentMethod:document.getElementById('applyPaymentMethod').value,accountStatus:'待财务核对已审核账户',status:submitted?'待财务复核':'草稿',allocations:rows.map(i=>({activityId:i.activityId,amount:i.requestAmount,remark:i.remark}))});
      r.history.push({action:submitted?'提交付款申请':'保存付款草稿',reason:'按项目费用请款'});if(!old)D.requests.push(r);created.push(r);
    }
    for(const pid of new Set(created.map(r=>r.projectId)))S.log(pid,submitted?'提交项目付款申请':'保存项目付款草稿',created.filter(r=>r.projectId===pid).map(r=>r.id).join('、'));
    H.closePayment();H.refreshPayments();
    U.toast((submitted?'已提交':'已保存')+created.length+'笔付款申请'+(submitted?'，待财务复核':'草稿'));
    return {id:created.map(r=>r.id).join('、'),projectRequests:created};
  }
  window.MicePaymentWorkbench={sync,views,handles,opened,update,save,groups,money};
  U.ready(()=>{
    if(U.q.get('view')!=='payment'&&U.q.get('mode')!=='payment')return;
    H.refreshPayments();
    if(U.q.get('groupBy')==='project'||U.q.get('projectId'))H.groupMode('project');
    if(U.q.get('projectId')){document.getElementById('paymentKeyword').value=U.q.get('projectId');H.filterPayments();}
  });
})();
