/* 单团项目详情：项目档案、子团管理、只读业务汇总。 */
(function () {
  'use strict';
  const U=MiceUI,{store:S,M,esc:E,section:SEC,btn:B,action:A,link:L}=U,D=S.data;
  const normalizeTab=id=>({overview:'materials',agreements:'orders',receipts:'orders',business:'orders',costs:'settlement'}[id]||(['activities','orders','settlement','materials'].includes(id)?id:'activities'));
  const groups=p=>D.activities.filter(a=>a.projectId===p.id);
  const orders=p=>D.orders.filter(o=>o.projectId===p.id&&!['已取消','已作废'].includes(o.status));
  const orderUrl=(o,tab='overview')=>U.url('merchant/sales/orders-detail.html',{mice:1,projectId:o.projectId,orderNo:o.id,tab,returnUrl:location.href});
  const info=rows=>'<div class="project-description-grid">'+rows.map(([k,v,wide])=>'<div class="project-description-item'+(wide?' is-wide':'')+'"><span>'+E(k)+'</span><div>'+E(v??'未登记')+'</div></div>').join('')+'</div>';
  const fold=(title,body)=>'<details class="mice-project-fold"><summary>'+E(title)+'</summary><div>'+body+'</div></details>';
  function materials(p) {
    const team=p.members||[], budgets=MiceProjectFlow.budgetRows(p);
    return SEC('服务约定',info([['业务分类',p.kind],['客户类型',p.customerType||'未登记'],['组织方式',p.mode==='multi'?'大项目（多个子团）':'单个项目团'],['默认建团模式',MiceProjectFlow.mode(p)],['业务执行公司',M.executionCompany(p)],['合同签约公司',p.company],['负责部门',p.department],['客户联系人',p.contact],['联系电话',p.phone],['服务范围',p.scope,true],['客户需求依据',p.basis,true]]))+
      SEC('项目合同',U.table(['合同／编号','有效期间','合同金额／性质','签署情况','操作'],(p.frameworks||[]).map(f=>[U.lines(E(f.name||'框架合同'),E(f.number||f.no||'未登记编号')),E(f.start)+' 至 '+E(f.end),U.lines(M.money(f.amount,f.currency),E(f.nature)),U.tag(f.status),A('查看','project-framework-view',f.id)]),'project-contract-table'))+
      SEC('项目人员',U.table(['员工／职责','负责事项','参与期间','负责范围','费用额度'],team.map(m=>[U.lines(E(m.name||m.employee),E(m.role)+(m.ended?' · 已结束':'')),E(m.note||'未登记'),E(m.start||p.start)+' 至 '+E(m.end||p.end),E(m.activities?.length?m.activities.map(id=>S.find('activities',id)?.name||id).join('、'):'项目总体'),(()=>{const d=window.MiceBudgetModel?.memberAssignment(p,m);return d?M.money(d.costBudget,d.currency):'未分配';})()]),'project-team-table')+
      fold('操作分工与费用额度',info([['项目费用总预算',M.money(p.originalBudget,'CNY')],['已分配人民币额度',M.money(M.sum(budgets.filter(r=>r.d.currency==='CNY').map(r=>({amount:r.d.costBudget||0}))),'CNY')]])+U.table(['操作人员／负责事项','费用额度','已占用','可用额度'],budgets.map(r=>[U.lines(E(r.d.employee),E(r.d.scope)),M.money(r.d.costBudget,r.d.currency),M.money(r.occupied,r.d.currency),r.remaining==null?'待核对':U.lines(M.money(r.remaining,r.d.currency),r.remaining<0?'已超预算':'')]),'project-budget-table')))+
      SEC('归档资料',info([['业务结算期限',p.settlementRule?'完成后'+p.settlementRule.days+'天':'未约定'],['期限依据',p.settlementRule?.basis||'未登记'],['结项情况',p.closeout?.reason||'尚未结项',true]])+((p.attachments||[]).length?U.table(['附件名称','类型','大小'],p.attachments.map(f=>[E(f.name),E(f.type||'—'),E(f.size==null?'—':f.size+' B')])):'<p class="mice-muted">暂无项目附件</p>'))+
      fold('操作日志',U.table(['时间','操作','办理内容'],D.logs.filter(l=>l.projectId===p.id).slice().reverse().map(l=>[E(l.time),E(l.action),E(l.detail)]),'project-log-table'));
  }
  function customerOrders(p) {
    const os=orders(p),today=new Date().toLocaleDateString('en-CA');
    const overdue=o=>{const rows=(o.nodes||[]).filter(n=>(n.due||n.date)&&(n.due||n.date)<today&&(n.amount||0)>(n.received||0));return rows.length?'<span class="mice-line mice-muted">'+rows.length+'期逾期 · '+E(M.money(M.sum(rows.map(n=>({amount:n.amount-(n.received||0)}))),o.currency))+'</span>':'';};
    const orderRows=os.map(o=>[U.lines(L(E(o.id),orderUrl(o)),E(o.name||o.rule||p.name)),E(o.activities.map(id=>S.find('activities',id)?.name||id).join('、')),U.lines(M.money(o.amount,o.currency),o.activities.length>1?'整包成交':o.amount==null?'待最终定价':''),U.lines('已认款 '+M.money(o.received||0,o.currency),'待收 '+M.money(o.amount==null?null:Math.max(0,o.amount-(o.received||0)),o.currency))+overdue(o),M.money(o.invoiced||0,o.currency),L('订单详情',orderUrl(o))]);
    return SEC('客户订单',U.table(['订单／服务','覆盖项目团','成交金额','收款情况','已开票','操作'],orderRows,'project-order-table'))+
      SEC('客户结算确认记录',U.table(['确认单／核对期间','核对范围','认可／争议金额','状态','操作'],D.customerSettlements.filter(r=>r.projectId===p.id).map(r=>[U.lines(E(r.id),E(r.start)+' 至 '+E(r.end)),r.lines.length+'笔订单 · '+E(r.mode==='整包交付进度确认'?'交付进度':'服务与金额'),r.mode==='整包交付进度确认'?'仅确认交付范围':U.lines('认可 '+M.money(M.sum(r.lines,'accepted'),r.currency),'争议 '+M.money(M.sum(r.lines,'dispute'),r.currency)),U.tag(r.status),A('查看','customer-settlement-view',r.id)]),'project-acceptance-table'));
  }
  function costSettlement(p) {
    const today=new Date().toLocaleDateString('en-CA');
    const common=D.costs.filter(c=>c.projectId===p.id&&M.costType(c)!=='direct').map(c=>{const d=M.costDistribution(c);return[U.lines(E(c.name),E(c.supplier)),M.money(c.amount,c.currency),M.money(d.allocated,c.currency),M.money(d.common,c.currency),M.money(d.remaining,c.currency),E(c.status)];});
    const settlements=groups(p).map(a=>{
      const records=D.settlements.filter(r=>r.projectId===p.id&&r.activities.includes(a.id)),r=records.find(r=>['审批中','草稿','已退回'].includes(r.status))||records.find(r=>r.status==='已确认');
      const scope=M.costScope(D.costs,p.id,[a.id]),currencies=[...new Set(scope.lines.map(c=>c.currency||'CNY'))];
      const cost=currencies.map(currency=>{const rows=scope.lines.filter(c=>c.currency===currency);return rows.some(c=>c.amount==null||c.incomplete)?E(currency+' 承担待核对'):M.money(M.sum(rows.filter(c=>c.status==='已确认')),currency);}).join('<br>')||'未登记';
      return[U.lines(E(a.name),E(a.id)),E(a.status),E(a.acceptance?.status||'待客户认可'),cost,U.lines(r?U.tag(r.status):'未提交',r?E(r.id):'',a.settlementDue?'截止 '+E(a.settlementDue)+(a.settlementDue<today&&r?.status!=='已确认'?' · 已超期':''):'结算期限未设置'),L('结算详情',U.url('merchant/tour/fulfillment-cost.html',{type:'project',projectId:p.id,activityId:a.id,detail:1,returnUrl:location.href}))];
    });
    return (window.MiceBudget?MiceBudget.summary(p):'')+SEC('项目团结算',U.table(['项目团','执行阶段','客户认可','已确认承担费用','结算进度／期限','操作'],settlements,'project-settlement-table'))+
      (common.length?SEC('公共费用归属',U.table(['费用／供应商','采购总额','已分配各团','项目承担','未分配','确认情况'],common,'project-common-cost-table')):'')+
      (window.MiceTaxSummary?.section(p.id)||'');
  }
  function shell(p,tab,activities) {
    const acts=groups(p),content=tab==='activities'?activities:tab==='orders'?customerOrders(p):tab==='settlement'?costSettlement(p):materials(p);
    return '<section class="project-detail-identity"><div class="project-detail-name"><a class="page-back-link" href="'+E(U.q.get('returnUrl')||U.url('merchant/tour/product-custom-list.html'))+'">返回</a><h1>'+E(p.name)+'</h1>'+U.tag(p.status)+'</div><div class="project-detail-subtitle"><span>'+E(p.id)+'</span><span>'+E(p.customer)+'</span></div><div class="project-detail-meta">'+[
        ['服务期间',(p.start||'待定')+' 至 '+(p.end||'待定')],['销售',p.sales||'待分配'],['项目负责人',p.owner||'待分配'],['项目团',acts.length+' 团 · 草稿 '+acts.filter(a=>a.status==='草稿').length+' · 进行中 '+acts.filter(a=>a.status==='进行中').length+' · 已完成 '+acts.filter(a=>a.status==='已完成').length]
      ].map(([label,value])=>'<div><span>'+E(label)+'</span><strong>'+E(value)+'</strong></div>').join('')+'</div></section>'+
      U.tabs([['activities','项目团'],['orders','客户订单'],['settlement','费用与结算'],['materials','项目资料']],tab)+'<div class="mice-tab-content" id="mice-project-body">'+content+'</div>';
  }
  function groupActions(a,p) {
    return L('详情',U.url('merchant/tour/schedules-detail.html',{mice:1,id:a.id,projectId:p.id,returnUrl:location.href}))+(window.MiceOrderEntry?.groupAction(a)||'')+A('更多','project-group-more-view',a.id);
  }
  function groupMenu(id,button) {
    const a=S.find('activities',id),p=S.find('projects',a?.projectId);if(!a||!p)return;
    const items=[],open=!['已结项','已终止','待结项'].includes(p.status);
    if(open&&a.status==='草稿'){items.push({label:'编辑团资料',action:'activity-edit',data:{id}});items.push({label:MiceOrderEntry.ordersFor(a).length&&Object.keys(MiceOrderEntry.executionState(a).errors).length?'补齐执行资料':'确认成团',action:'activity-form',data:{id}});}
    items.push({label:'报价',action:'project-group-quotes-view',data:{id}});
    if(open&&['草稿','进行中','已完成'].includes(a.status))items.push({label:'调整预算',action:'budget-group-adjust',data:{id}});
    if(open)items.push({label:'复制项目团',action:'activity-copy',data:{id}});
    MiceProjectManagement.openMenu(button,items);
  }
  function batchMenu(button) {
    const p=MiceProjectDetail.project,rows=groups(p).filter(a=>MiceProjectDetail.selected.has(a.id));if(!rows.length)return;
    const draft=rows.every(a=>a.status==='草稿'),data={project:p.id};
    const billed=rows.filter(a=>MiceOrderEntry.ordersFor(a).length),closed=rows.filter(a=>!['草稿','进行中'].includes(a.status));
    const quoted=rows.filter(a=>D.commitments.some(c=>c.projectId===p.id&&c.activities.includes(a.id)&&!['已取消','已作废'].includes(c.status)));
    const pending=quoted.filter(a=>D.commitments.some(c=>c.projectId===p.id&&c.activities.includes(a.id)&&c.status==='待审批'));
    const projectBlocked=['待结项','已结项','已终止'].includes(p.status);
    const orderBlocked=projectBlocked||billed.length>0||closed.length>0||pending.length>0;
    const quoteBlocked=projectBlocked||billed.length>0||closed.length>0||quoted.length>0;
    MiceProjectManagement.openMenu(button,[
      {label:'修改团资料',action:'work-batch-edit',data,disabled:projectBlocked||!draft},
      {label:'创建订单',action:'deal-batch',data,disabled:orderBlocked},
      {label:'报价',action:'work-batch-quote',data,disabled:quoteBlocked},
      {label:'分配计调',action:'activity-assign',disabled:projectBlocked||closed.length===rows.length},
      {label:'移交项目团',action:'activity-handover',disabled:projectBlocked||closed.length===rows.length}
    ]);
  }
  Object.assign(U.actions,{
    'project-group-more-view':({id},button)=>groupMenu(id,button),
    'project-group-batch':(data,button)=>batchMenu(button),
    'project-group-quotes-view':({id})=>{const a=S.find('activities',id),p=S.find('projects',a?.projectId);if(a&&p)U.drawer('项目团报价',U.summary([['项目团',a.name]])+MiceWork.quoteSection(p,a),{wide:true,readonly:true,buttons:[]});},
    'project-framework-view':({id})=>{const p=MiceProjectDetail.project,f=p.frameworks?.find(f=>f.id===id);if(f)U.drawer('合同资料',info([['合同',f.name],['合同编号',f.number||f.no],['状态',f.status],['金额性质',f.nature],['合同金额',M.money(f.amount,f.currency)],['有效期间',f.start+' 至 '+f.end],['约定服务',f.scope,true],['签署依据',f.basis,true]])+L('原合同资料',U.url('merchant/sales/contracts.html',{mice:1,projectId:p.id,frameworkId:f.id})),{readonly:true,buttons:[]});}
  });
  window.MiceProjectPage={shell,normalizeTab,groupActions};
})();
