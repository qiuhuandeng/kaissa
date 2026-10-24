/* 项目团在团期结算原抽屉办理；沿用会奖金额范围及提交记录。 */
(function(){
'use strict';
const U=window.MiceUI,H=window.ProjectSettlementPage;
if(!U||!H||U.q.get('mice')==='1')return;
const {store:S,M,esc:E}=U,D=S.data,T=window.MiceTaxModel,$=id=>document.getElementById(id);
let current=null,selection=null,requestedRecord=U.q.get('settlementId'),costCurrent=null,readFiles=null,formBaseline='';
const recordFor=a=>{const rows=D.settlements.filter(r=>r.projectId===a.projectId&&r.activities.includes(a.id));return rows.find(r=>['审批中','已确认'].includes(r.status))||rows.at(-1);};
const ended=a=>['已完成','已取消'].includes(a?.status);
const section=(title,body)=>U.section(title,body),table=(heads,rows)=>U.table(heads,rows),money=(v,c='CNY')=>E(M.money(v,c));
function recordsFor(s){return D.settlements.filter(r=>r.projectId===s.projectNo&&(r.activities.includes(s.miceActivityId)||r.includeProjectCosts));}
function liveEvidence(s){const r=recordFor(S.find('activities',s.miceActivityId));return r&&['审批中','已确认'].includes(r.status)?MiceSettlement.recordEvidence(r):T.settlementEvidence(D,{projectId:s.projectNo,activities:[s.miceActivityId],includeProjectCosts:false});}
function sync(){
 for(const a of D.activities){
  const p=S.find('projects',a.projectId);if(!p)continue;
  let s=H.schedules.find(s=>s.miceActivityId===a.id||s.id===a.id);
  if(!s){s={id:a.id,miceActivityId:a.id,type:'项目团',typeClass:'tag tag-cyan',items:[],settlement:{},estimated:0,actual:0,income:0};H.schedules.push(s);}
  s.miceActivityId=a.id;
  const r=recordFor(a),orders=D.orders.filter(o=>o.projectId===p.id&&o.activities.includes(a.id)&&!['已取消','已作废'].includes(o.status));
  Object.assign(s,{route:a.name,plan:p.name,date:a.start+' / '+a.end,people:(a.confirmedPeople??a.people??'待确认')+'人',owner:a.planner||p.owner,projectNo:p.id,projectOrder:orders.map(o=>o.id).join('、'),customer:p.customer,providingCompany:p.company,status:a.status});
  Object.assign(s.settlement,{status:r?.status==='已确认'?'已结算':r?.status==='审批中'?'审批中':r?.status==='已退回'?'已驳回':ended(a)?r?.status==='草稿'?'草稿':'待提交':'未开始',todo:ended(a)?r?.id||'尚未提交结算':'服务尚未完成',confirmedPeople:s.people,returnStatus:ended(a)?'已回团':'未回团',incomeRows:[]});
 }
}
function metric(s,kind){
 const a=S.find('activities',s.miceActivityId),legacy=a?.legacyCostTotal;
 if(legacy!=null&&kind!=='income'){
  const total=M.sum(D.costs.filter(c=>c.activityId===a.id&&c.currency==='CNY'));
  if(total!==legacy)return kind==='profit'?'<span class="text-muted">成本差额待核</span>':'<span>原汇总 '+money(legacy)+'</span><span class="schedule-route-name text-muted">明细 '+money(total)+' · 差额待核</span>';
 }
 const amounts=liveEvidence(s)?.financial?.amounts||[];
 if(!amounts.length)return '<span class="text-muted">金额待确认</span>';
 return amounts.map(v=>'<span class="schedule-route-name">'+E(v.currency)+' '+money(v[kind==='income'?'grossIncome':kind==='cost'?'grossCost':'grossProfit'],v.currency)+'</span>'+(kind==='profit'?'<span class="text-muted">含税毛利率 '+(v.grossRate==null?'待确认':v.grossRate+'%')+'</span>':'')).join('');
}
function action(s){
 const a=S.find('activities',s.miceActivityId),r=recordFor(a),p=S.find('projects',s.projectNo);
 const readonly=!ended(a)||['已结项','已终止'].includes(p.status)||['审批中','已确认'].includes(r?.status);
 const editable=MiceCosts.canManage({projectId:p.id,activityId:a.id},'cost-new');
 const label=r?.status==='已退回'?'修改结算':r?.status==='草稿'?'继续结算':'结算';
 return '<div class="table-action">'+(!readonly?'<button type="button" class="table-action-primary" data-open-settlement-basis="'+E(s.id)+'">'+label+'</button>':'')+(editable?'<button type="button" class="table-link" data-open-cost="'+E(s.id)+'">维护成本</button>':'')+'<button type="button" class="'+(readonly?'table-action-primary':'table-link')+'" data-open-project-settlement-detail="'+E(s.id)+'" data-drawer-title="项目团结算详情">详情</button></div>';
}
// Reuse the ordinary cost-maintenance drawer. Its original form is restored for other products.
function detailReturnUrl(){
 const u=new URL(location.href);for(const [key,id]of [['Keyword','costKeyword'],['Type','costType'],['Status','costStatus'],['Progress','costProgress'],['Owner','costOwner']])u.searchParams.set('filter'+key,$(id).value);return u.href;
}
function resetCosts(){
 $('projectCostWorkspace')?.remove();
 document.querySelectorAll('[data-project-cost-hidden]').forEach(n=>{n.hidden=n.dataset.projectCostHidden==='true';delete n.dataset.projectCostHidden;});
 costCurrent=null;
}
function costRoot(schedule,ledger=false){
 resetCosts();costCurrent={schedule,ledger};
 const drawer=$('scheduleCostDrawer'),body=drawer.querySelector('.modal-body');
 for(const n of [...body.children,$('saveScheduleCost'),$('submitScheduleCost')]){n.dataset.projectCostHidden=String(n.hidden);n.hidden=true;}
 const node=document.createElement('div');node.id='projectCostWorkspace';node.className='mice-workspace project-cost-workspace';body.append(node);
 $('scheduleCostDrawerTitle').textContent=ledger?'项目费用':'成本明细维护';
 H.showCostShell(schedule);return node;
}
function costLedgerRoot(){return costRoot(null,true);}
function openCosts(schedule){
 const a=S.find('activities',schedule?.miceActivityId),p=S.find('projects',schedule?.projectNo);
 if(!a||!p)return U.toast('未找到对应项目团','error');
 const root=costRoot(schedule),canEdit=MiceCosts.canManage({projectId:p.id,activityId:a.id},'cost-new');
 const resources=(a.resources||[]).filter(r=>r.status!=='已取消'&&!D.costs.some(c=>c.projectId===p.id&&c.resourceId===r.id));
 const source=canEdit&&resources.length?'<div class="mice-cost-resource"><label for="projectCostResource">执行资源</label><select class="form-control" id="projectCostResource">'+U.options(resources.map(r=>({value:r.id,label:r.name+' / '+r.supplier})),resources[0].id,null)+'</select>'+U.btn('引用新增费用','cost-resource')+'</div>':'';
 U.render(root,U.summary([['所属项目',p.name],['项目团',a.name],['服务日期',a.start+' 至 '+a.end],['项目团状态',a.status]])+source+MiceCosts.section(p.id,a.id));
}
function refreshCosts(){
 sync();H.refresh();
 if(!costCurrent)return;
 if(costCurrent.ledger)MiceCosts.page();else openCosts(costCurrent.schedule);
}
U.actions['cost-resource']=()=>{
 const a=S.find('activities',costCurrent?.schedule?.miceActivityId),resource=a?.resources?.find(r=>r.id===$('projectCostResource')?.value);
 if(resource)MiceCosts.resource(resource,a.projectId,a.id);
};

function panel(name,html,{replace=false,first=false}={}){
 const parent=document.querySelector('[data-settlement-doc-panel="'+name+'"]');
 if(replace)for(const child of parent.children){child.dataset.projectSettlementHidden='1';child.hidden=true;}
 const node=document.createElement('div');node.className='project-settlement-content';node.innerHTML=html;
 if(first)parent.prepend(node);else parent.append(node);
 return node;
}
function reset(){
 document.querySelectorAll('.project-settlement-content').forEach(n=>n.remove());
 document.querySelectorAll('[data-project-settlement-hidden]').forEach(n=>{n.hidden=false;delete n.dataset.projectSettlementHidden;});
 for(const id of ['saveSettlementBasis','submitSettlementApply']){$(id).hidden=false;$(id).disabled=false;}
 current=null;selection=null;readFiles=null;formBaseline='';
}
function legacyEvidence(s){
 // Older example keeps its existing order and procurement amounts. Missing tax inputs remain unknown.
 const p={id:s.projectNo,name:s.route,company:s.providingCompany||'福建凯撒',customer:s.customer};
 const totals=H.totals(s),orders=[{id:s.projectOrder||s.id,projectId:p.id,activities:[s.id],currency:'CNY',amount:totals.ready?totals.settlementIncome:null,status:'已确认'}];
 const costs=s.items.map((row,i)=>({id:s.id+'-C'+i,name:row[0],supplier:row[1],projectId:p.id,activityId:s.id,currency:'CNY',amount:row[4],status:row[5]==='已确认'?'已确认':'待确认',basis:row[6]}));
 const evidence=T.settlementEvidence({projects:[p],activities:[{id:s.id,projectId:p.id,name:s.route,status:s.settlement.returnStatus}],orders,costs},{projectId:p.id,activities:[s.id]});
 const sum=M.sum(costs),amount=Number(s.actual||s.estimated);
 if(sum!==amount)evidence.financial.amounts.forEach(v=>v.issues.push('成本明细合计 '+M.money(sum,'CNY')+' 与原成本总额 '+M.money(amount,'CNY')+' 不一致，待复核'));
 return evidence;
}
function executionLink(a,tab='overview'){
 return '<a class="link-primary" data-project-execution="'+E(a.id)+'" data-execution-tab="'+E(tab)+'" href="'+E(U.activityUrl(a,{tab,returnUrl:detailReturnUrl()}))+'">查看执行详情</a>';
}
function acceptanceRows(){
 const ids=new Set(orders(selection.activities).map(o=>o.id));
 return D.customerSettlements.filter(r=>r.projectId===selection.projectId).flatMap(r=>(r.lines||[]).filter(l=>ids.has(l.orderId)&&(!l.activityIds?.length||l.activityIds.some(id=>selection.activities.includes(id)))).map(l=>({r,l})));
}
function acceptanceContent(){return section('客户认可依据',table(['原订单／客户对账单','本次核对内容','认可／争议金额','状态','客户确认依据'],acceptanceRows().map(({r,l})=>[U.lines(E(l.orderId),E(r.id)),E(r.mode),r.mode==='整包交付进度确认'?'仅确认交付范围，不确认分团收入':U.lines(money(l.accepted,r.currency),money(l.dispute,r.currency)),U.tag(r.status),U.lines(E(r.basis||'未登记'),E([r.confirmBy,r.confirmDate].filter(Boolean).join(' / ')))])))+'<p class="text-muted">草稿和待确认记录仅供核对；整包进度认可不拆分订单收入。</p>';}
function deliveryContent(){return section('完成与认可',table(['项目团／服务日期','完成情况','客户认可','操作'],D.activities.filter(a=>selection.activities.includes(a.id)).map(a=>[U.lines(E(a.name),E(a.start)+' 至 '+E(a.end)),U.lines(E(a.status),E(a.completion?.basis||'完成依据未登记')),E(a.acceptance?.status||'待客户确认'),executionLink(a)])));}
function relevantChanges(){
 const orderIds=new Set(orders(selection.activities).map(o=>o.id)),scope=M.costScope(D.costs,selection.projectId,selection.activities,selection.includeProjectCosts),costIds=new Set(scope.lines.map(c=>c.costId||c.id));
 return D.adjustments.filter(r=>r.projectId===selection.projectId&&(selection.activities.includes(r.activityId)||orderIds.has(r.orderId)||costIds.has(r.costId)||r.type==='activity'&&selection.activities.includes(r.targetId)||r.type==='order'&&orderIds.has(r.targetId)||r.type==='cost'&&costIds.has(r.targetId)));
}
function changeContent(){return section('变更记录',table(['变更单／来源','事项','状态','金额／数量／期间','依据'],relevantChanges().map(r=>[U.lines(E(r.id),E(r.orderId||r.costId||r.activityId||r.targetId||'')),E(({activity:'项目团变更',cancel:'取消项目团',cost:'费用变更',order:'订单金额变更'})[r.type]||U.businessLabel(r.type)),U.tag(r.status),E([r.amount!=null?'金额 '+M.money(r.amount,r.currency||S.find('orders',r.orderId||r.targetId)?.currency||S.find('costs',r.costId||r.targetId)?.currency):'',r.people!=null?'人数 '+r.people:'',r.start||'',r.end||''].filter(Boolean).join(' / ')||'见变更依据'),E(r.reason||r.basis||'未登记')])));}
function discountContent(){
 const relevant=relevantChanges().filter(r=>r.type==='order'&&r.status==='已批准');
 return section('优惠减免核对',table(['原订单','已登记优惠／折让','核对依据','操作'],orders(selection.activities).map(o=>[E(o.id),o.discountAmount==null?'原订单未单列，待核对':money(o.discountAmount,o.currency),E(o.discountBasis||'按原订单成交金额核对'),U.link('查看订单',U.url('merchant/sales/orders-detail.html',{mice:1,orderNo:o.id,projectId:o.projectId}))])))+section('已生效订单金额变更',table(['变更单','订单','批准增减金额','依据'],relevant.map(r=>[E(r.id),E(r.orderId||r.targetId),money(r.amount,S.find('orders',r.orderId||r.targetId)?.currency),E(r.reason||r.basis||'—')])))+'<p class="text-muted">原订单已含的优惠和已生效改价不再从本次收入重复扣减；未单列不等于没有优惠。</p>';
}
function receiptContent(){
 const ids=new Set(orders(selection.activities).map(o=>o.id)),claims=(D.claims||[]).filter(r=>r.projectId===selection.projectId||(r.allocations||[]).some(v=>ids.has(v.orderId)));
 return section('订单收款核对',orderMoneyTable(selection.activities))+section('认款与预收分配',table(['认款单／原流水','分配到原订单','分配金额','状态','依据'],claims.flatMap(r=>(r.allocations||[]).filter(v=>ids.has(v.orderId)).map(v=>[U.lines(E(r.id),E(r.flowId||'流水未登记')),U.lines(E(v.orderId),E(v.node||'未指定节点')),money(v.amount,r.currency),U.tag(r.status),E(r.basis||'未登记')]))))+'<p class="text-muted">已认款金额以原订单为准；待认款申请不计入已收。跨团整包款项不拆为本团已收，未分配预收及退款在原收款单核对。</p>';
}
function attachmentsContent(evidence){
 const costs=D.costs.filter(c=>(evidence.costs||[]).some(v=>v.costId===c.id)),entries=[];
 const add=(label,no,basis,files)=>{if(basis||files?.length)entries.push([E(label),E(no),E(basis||'—'),(files||[]).map(f=>E(f.name)).join('<br>')||'未附文件']);};
 D.activities.filter(a=>selection.activities.includes(a.id)).forEach(a=>{add('服务完成',a.id,a.completion?.basis,a.completion?.files);add('执行资料',a.id,'',a.attachments);});
 [...new Set(acceptanceRows().map(v=>v.r))].forEach(r=>add('客户认可 · '+r.status,r.id,r.basis,r.attachments));
 costs.forEach(c=>add('采购费用',c.id,c.basis,c.attachments));
 (D.reconciliations||[]).filter(r=>(r.lines||[]).some(l=>costs.some(c=>c.id===(l.costId||l.id)))||(r.costIds||[]).some(id=>costs.some(c=>c.id===id))).forEach(r=>add('供应商对账 · '+(({draft:'草稿',pending:'待供应商确认',disputed:'存在差异',confirmed:'已确认',cancelled:'已作废'})[r.state]||r.status||'待核对'),r.id,r.agreement||r.basis,r.sealFiles||r.attachments||(r.sealAttachment?[r.sealAttachment]:[])));
 return section('原单据及附件依据',table(['资料来源','原单号','核对依据','附件'],entries));
}
function refreshSources(evidence){
 $('projectSettlementAcceptance').innerHTML=acceptanceContent();
 $('projectSettlementDelivery').innerHTML=deliveryContent();
 $('projectSettlementSourceAttachments').innerHTML=attachmentsContent(evidence);
 for(const [name,html]of [['discount',discountContent()],['changes',changeContent()],['receipts',receiptContent()]])document.querySelector('[data-settlement-doc-panel="'+name+'"] .project-settlement-content').innerHTML=html;
}
function handlingHistory(r){
 if(!r)return '';
 const rows=(r.history||[]).map(h=>({...h}));
 for(const a of D.approvals.filter(a=>a.sourceId===r.id&&['已通过','已退回'].includes(a.status)))rows.push({at:a.decidedAt,action:a.status==='已通过'?'审批通过':'退回补充',by:a.decidedBy||a.approver,version:a.version,basis:a.opinion});
 rows.sort((a,b)=>(Date.parse(a.at)||0)-(Date.parse(b.at)||0));
 return section('办理记录',table(['办理时间','操作','经办人','版本','依据／意见'],rows.map(h=>[MiceTaxSummary.dateText(h.at,'原记录未登记'),h.action,h.by||'原记录未登记',h.version?'V'+h.version:'原版本',h.basis||'—'].map(E))));
}
function paint(s,detailOnly=false){
 if(s.type!=='项目团')return;
 current=s;
 if(!s.miceActivityId){
  let evidence=s.settlement.taxEvidence;
  if(!evidence||!['审批中','已结算'].includes(s.settlement.status))evidence=legacyEvidence(s);
  if(['审批中','已结算'].includes(s.settlement.status)&&!s.settlement.taxEvidence)s.settlement.taxEvidence=M.clone(evidence);
  paintTax(evidence);
  panel('cost',section('本次费用承担',table(['费用／供应商','费用归属','采购总额','本次承担','确认情况'],evidence.costs.map(c=>[U.lines(E(c.name),E(c.supplier)),'本团直接费用',money(c.originalAmount,c.currency),money(c.amount,c.currency),E(c.status)]))));
  return;
 }
 const a=S.find('activities',s.miceActivityId),p=S.find('projects',a.projectId),requested=S.find('settlements',requestedRecord);
 const r=requested&&requested.projectId===p.id&&(requested.activities.includes(a.id)||requested.contextActivityId===a.id)?requested:recordFor(a);
 requestedRecord=null;
 const locked=detailOnly||['审批中','已确认'].includes(r?.status)||['已结项','已终止'].includes(p.status)||!ended(a);
 selection={projectId:p.id,id:r?.id,activities:[...(r?.activities||[a.id])],includeProjectCosts:!!r?.includeProjectCosts,budgetComplete:!!r?.budgetComplete,contextActivityId:a.id,noCost:r?.noCost||'',basis:r?.basis||'客户交付确认、采购费用及税额核对资料（演示）',pending:r?.pending||'',attachments:M.clone(r?.attachments||[]),locked,detailOnly,record:r};
 if(!M.costScope(D.costs,p.id,selection.activities,selection.includeProjectCosts).lines.length&&!selection.noCost)selection.noCost='本次无采购费用（演示）';
 const evidence=locked&&r&&['审批中','已确认'].includes(r.status)?MiceSettlement.recordEvidence(r):T.settlementEvidence(D,selection);
 for(const id of ['settlementSummaryRows','settlementBasicInfo','projectSettlementPanel','projectSettlementActions']){const n=id==='settlementSummaryRows'?$(id).closest('section'):$(id);n.hidden=true;n.dataset.projectSettlementHidden='1';}
 $('settlementBasisTitle').dataset.drawerTitleLocked=detailOnly?'项目团结算详情':locked?'结算详情':'结算';
 $('settlementBasisTitle').textContent=$('settlementBasisTitle').dataset.drawerTitleLocked;
 $('settlementBasisSummary').innerHTML='<div class="drawer-object-main"><div><strong class="drawer-object-title">'+E(a.name)+'</strong><span class="drawer-object-subtitle">'+E(p.customer)+' / '+E(p.name)+'</span></div>'+U.tag(r?.status||'未结算')+'</div><div class="settlement-basis-summary-line"><span>我方公司 <strong>'+E(p.company)+'</strong></span><span>团号 <strong>'+E(a.id)+'</strong></span><span>人数 <strong>'+E(s.people)+'</strong></span><span>负责人 <strong>'+E(s.owner)+'</strong></span><span>结算范围 <strong id="projectSettlementScopeLabel">'+selection.activities.length+'团'+(selection.includeProjectCosts?'及项目承担费用':'')+'</strong></span></div>';
 $('settlementBasisSummary').insertAdjacentHTML('beforeend','<div class="settlement-basis-summary-line"><span>结算单 <strong>'+E(r?.id||'保存后生成')+'</strong></span>'+(r?'<span>版本 <strong>V'+E(r.version)+'</strong></span>':'')+(r?.status==='已退回'?'<span class="project-settlement-warning">退回原因：'+E(r.returnReason||'请核对审批意见')+'</span>':'')+'</div>');
 const overviewTitle=document.querySelector('[data-settlement-doc-panel="overview"] > .drawer-section-head');overviewTitle.hidden=true;overviewTitle.dataset.projectSettlementHidden='1';
 const acts=D.activities.filter(n=>n.projectId===p.id),others=D.settlements.filter(n=>n.id!==r?.id&&n.projectId===p.id&&['审批中','已确认'].includes(n.status));
 const ranges=acts.map(n=>{const occupied=others.some(v=>v.activities.includes(n.id));return '<label><input type="checkbox" data-settlement-activity="'+E(n.id)+'" '+(selection.activities.includes(n.id)?'checked ':'')+(locked||occupied||!ended(n)?'disabled':'')+'> <span>'+E(n.name)+' <small>'+E(n.status)+(occupied?' · 已纳入其他结算':'')+'</small></span></label>';}).join('');
 const scopeNode=panel('overview',section('结算范围','<div class="project-settlement-range">'+ranges+'</div><label class="project-settlement-project-cost"><input id="projectSettlementIncludeCosts" type="checkbox" '+(selection.includeProjectCosts?'checked ':'')+(locked||others.some(n=>n.includeProjectCosts||!n.submittedRecord&&!n.confirmedRecord?.scopeVersion&&n.activities.length===acts.length)?'disabled':'')+'> 同时核对项目承担费用</label>')+(locked&&r?.submittedAt&&['审批中','已确认'].includes(r.status)?'<p class="text-muted">金额依据：'+(r.status==='已确认'?'确认时结果':'提交时结果')+' · '+E(MiceTaxSummary.dateText(r.submittedAt))+'</p>':''),{first:true});
 scopeNode.addEventListener('change',()=>{readFields();selection.activities=[...scopeNode.querySelectorAll('[data-settlement-activity]:checked')].map(n=>n.dataset.settlementActivity);selection.includeProjectCosts=$('projectSettlementIncludeCosts').checked;updateScope();});
 paintTax(evidence);
 panel('overview','<div id="projectSettlementDelivery">'+deliveryContent()+'</div>');
 panel('overview',section('客户款项',orderMoneyTable(selection.activities)));
 panel('cost','<div id="projectSettlementScopeCosts">'+costScopeContent(evidence,locked)+'</div>',{replace:true});
 if(a.legacyCostTotal!=null)panel('cost',section('原成本核对',U.summary([['原成本总额',money(a.legacyCostTotal)],['当前费用明细合计',money(M.sum(D.costs.filter(c=>c.activityId===a.id)))],['待核差额',money(a.legacyCostTotal-M.sum(D.costs.filter(c=>c.activityId===a.id)))]])));

 // The original tab remains the income tab; show its source orders with the tax fields together.
 document.querySelector('[data-settlement-doc-panel="income"] > section').hidden=true;
 document.querySelector('[data-settlement-doc-panel="income"] > section').dataset.projectSettlementHidden='1';
 panel('income','<div id="projectSettlementAcceptance">'+acceptanceContent()+'</div>');
 panel('discount',discountContent(),{replace:true});
 panel('orders',section('订单明细',ordersTable(selection.activities)),{replace:true});
 panel('receipts',receiptContent(),{replace:true});
 panel('prepay',paymentContent(evidence),{replace:true});
 panel('changes',changeContent(),{replace:true});
 const field=(id,label,value)=>'<label class="project-settlement-field">'+E(label)+'<textarea id="'+id+'" rows="2" '+(locked?'readonly':'')+'>'+E(value)+'</textarea></label>';
 panel('attachments','<div id="projectSettlementGaps"></div>'+section('结算依据',field('projectSettlementBasis','业务结算依据',selection.basis)+field('projectSettlementNoCost','无费用说明',selection.noCost)+field('projectSettlementPending','款票及其他未结事项',selection.pending)+(window.MiceBudgetModel?.enabled(p)?'<label class="project-settlement-field"><span><input type="checkbox" id="projectSettlementBudgetComplete" '+(selection.budgetComplete?'checked ':'')+(locked?'disabled':'')+'> 本次费用已完整登记，无后续采购或增项</span></label><p class="text-muted">结算确认后释放本次范围的未使用预算，实际费用继续占用；未勾选则保留预算。</p>':''))+section('本次结算附件','<div id="projectSettlementFiles">'+MiceFiles.html(selection.attachments,'settlementAttachments')+'</div>')+'<div id="projectSettlementSourceAttachments">'+attachmentsContent(evidence)+'</div>',{replace:true});
 const fileRoot=$('projectSettlementFiles');readFiles=MiceFiles.bind(fileRoot,selection.attachments,'settlementAttachments');
 if(locked){fileRoot.querySelectorAll('input,p,[data-file-remove]').forEach(n=>n.hidden=true);if(!selection.attachments.length)fileRoot.insertAdjacentHTML('beforeend','<p class="text-muted">无本次补充附件，原单据依据见下方。</p>');}
 panel('logs',section('结算记录',table(['结算单／版本','范围','状态','提交时间','操作'],recordsFor(s).map(n=>[U.lines(E(n.id),'V'+n.version),n.activities.length+'团'+(n.includeProjectCosts?'／项目承担费用':''),U.tag(n.status),E(MiceTaxSummary.dateText(n.submittedAt,'尚未提交')),'<button type="button" class="link-primary" data-project-record="'+E(n.id)+'">查看</button>'])))+(r?'<div class="project-settlement-record-actions">'+U.link('查看审批',U.url('merchant/approval/approvals.html',{mice:1,sourceId:r.id}))+'　'+U.link('财务业务结算',U.url('merchant/finance/finance-settlement.html',{mice:1,projectId:p.id,settlementId:r.id}))+'　<button type="button" class="btn btn-secondary" data-project-export>导出结算单</button> <button type="button" class="btn btn-secondary" data-project-print>打印预览</button></div>':'')+'<p class="text-muted">结算审批通过后交财务承接，客户收款和供应商付款在原单据中办理。</p>',{replace:true});
 if(a.legacyReferences?.length)panel('logs',section('原关联记录',table(['记录','单号','核对情况','操作'],a.legacyReferences.map(n=>[E(n.label),E(n.no),'原记录保留，日期与状态待核对',U.link('查看',U.url(n.path,{projectNo:p.id,sourceNo:n.no,scheduleNo:a.id,mode:n.no.startsWith('PAY-')?'payment':null}))]))));
 if(r)panel('logs',handlingHistory(r));
 $('saveSettlementBasis').textContent='保存草稿';$('saveSettlementBasis').hidden=locked;
 $('submitSettlementApply').textContent=locked?'关闭':r?.status==='已退回'?'再次提交':'提交结算';
 showGaps();
 formBaseline=formValue();
}
function paintTax(evidence){
 const a=current&&S.find('activities',current.miceActivityId);
 if(a?.legacyCostTotal!=null){
  const sum=M.sum(D.costs.filter(c=>c.activityId===a.id&&c.currency==='CNY'));
  if(sum!==a.legacyCostTotal)for(const v of evidence.financial?.amounts||[])if(!v.issues.some(i=>i.includes('原成本总额')))v.issues.push('成本明细合计 '+M.money(sum,'CNY')+' 与原成本总额 '+M.money(a.legacyCostTotal,'CNY')+' 不一致，待复核');

 }

 const title=selection?.locked&&['审批中','已确认'].includes(selection.record?.status)?selection.record.status==='已确认'?'确认时结算金额':'提交时结算金额':'本次结算金额';
 panel('overview','<div id="projectSettlementTaxSummary">'+MiceTaxSummary.settlementSection(evidence,title,'summary')+'<p class="text-muted">预计税额用于业务测算，核定税额沿用财务核对结果；未明确金额显示待确认，各币种分别核对。</p></div>',{first:!selection});
 panel('income','<div id="projectSettlementIncomeTax">'+MiceTaxSummary.settlementSection(evidence,'收入与税额明细','income')+'</div>');
 if(!selection)panel('cost',MiceTaxSummary.settlementSection(evidence,'成本与抵扣明细','cost'));
}
function costScopeContent(evidence,locked){
 return MiceTaxSummary.settlementSection(evidence,'成本与抵扣明细','cost')+(locked?section('本次费用核对',MiceSettlement.costEvidenceTable(evidence?{...evidence,projectId:selection.projectId}:null)):MiceSettlement.scopePreview(S.find('projects',selection.projectId),selection.activities,selection.includeProjectCosts));
}
function orders(ids){return D.orders.filter(o=>o.projectId===selection.projectId&&o.activities.some(id=>ids.includes(id))&&!['已取消','已作废'].includes(o.status));}
function ordersTable(ids){return table(['客户订单','覆盖范围','订单含税金额','状态','操作'],orders(ids).map(o=>[E(o.id),E(o.activities.map(id=>S.find('activities',id)?.name||id).join('、')),money(o.amount,o.currency),U.tag(o.status),U.link('查看订单',U.url('merchant/sales/orders-detail.html',{mice:1,orderNo:o.id,projectId:o.projectId}))]));}
function orderMoneyTable(ids){return table(['客户订单','币种','原订单金额','原订单已认款','核对范围'],orders(ids).map(o=>[E(o.id),E(o.currency),money(o.amount,o.currency),money(o.received,o.currency),o.activities.every(id=>ids.includes(id))?'本次覆盖完整订单':'整包未分团，不拆分收款']));}
function paymentContent(evidence){
 const costIds=new Set((evidence?.costs||[]).map(c=>c.costId)),costs=D.costs.filter(c=>costIds.has(c.id)),requests=D.requests.filter(r=>costIds.has(r.costId));
 return section('原采购预付与付款',table(['采购费用／供应商','原采购总额','原采购已付／核销','本次承担','付款申请'],costs.map(c=>[U.lines(E(c.name),E(c.supplier)),money(c.amount,c.currency),U.lines(money(c.paid,c.currency),'核销 '+(c.offset==null?'未登记':money(c.offset,c.currency))),money((evidence.costs||[]).filter(v=>v.costId===c.id).some(v=>v.amount==null)?null:M.sum((evidence.costs||[]).filter(v=>v.costId===c.id)),c.currency),requests.filter(r=>r.costId===c.id).map(r=>U.link(E(r.id),U.url('merchant/finance/finance-payment-apply.html',{mice:1,requestId:r.id,projectId:r.projectId}))+' · '+E(r.status)).join('<br>')||(c.legacyRequested?'原记录已申请 '+money(c.legacyRequested,c.currency)+'，申请单待核对':'暂无申请')])))+section('付款执行记录',table(['付款申请','金额','办理日期','执行结果／回单','依据'],requests.flatMap(r=>(r.payments||[]).map(v=>[E(r.id),money(v.amount,r.currency),E(v.date),U.lines(E(v.result),E(v.reference||'未登记')),E(v.basis||'未登记')]))))+'<p class="text-muted">采购总额、已付及核销按原采购核对，本次承担按费用归属核对；申请中金额不计为已付。</p>';
}
function readFields(){if(!selection)return;for(const [key,id] of [['basis','projectSettlementBasis'],['noCost','projectSettlementNoCost'],['pending','projectSettlementPending']])if($(id))selection[key]=$(id).value;if($('projectSettlementBudgetComplete'))selection.budgetComplete=$('projectSettlementBudgetComplete').checked;if(readFiles)selection.attachments=readFiles();}
function formValue(){if(!selection)return '';readFields();const {activities,includeProjectCosts,budgetComplete,basis,noCost,pending,attachments}=selection;return JSON.stringify({activities,includeProjectCosts,budgetComplete,basis,noCost,pending,attachments});}
function confirmLeave(event){
 if(!selection||selection.locked||!formBaseline||formValue()===formBaseline||document.querySelector('.mice-confirm'))return;
 event.preventDefault();event.stopImmediatePropagation();
 U.confirm('放弃修改','当前结算范围、依据或附件尚未保存，确认离开吗？',()=>H.close(),'放弃修改');
}
document.addEventListener('click',event=>{const drawer=$('settlementBasisDrawer');if(drawer?.contains(event.target)&&(event.target===drawer||event.target.closest('[data-close-modal]')))confirmLeave(event);},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('settlementBasisDrawer')?.classList.contains('show'))confirmLeave(event);},true);
function showGaps(){
 if(!selection||!$('projectSettlementGaps'))return;
 const gaps=MiceSettlement.issues(S.find('projects',selection.projectId),selection.activities,selection.includeProjectCosts);
 $('projectSettlementGaps').innerHTML=section('核对缺项',selection.detailOnly?(['审批中','已确认'].includes(selection.record?.status)?'<p class="text-muted">当前记录只读，请核对提交或确认时保存的结算依据。</p>':gaps.map(g=>'<p>'+E(g.text)+'</p>').join('')||'<p class="text-muted">当前范围无业务缺项。</p>'):selection.locked?'<p class="text-muted">'+(['审批中','已确认'].includes(selection.record?.status)?'当前记录只读，请核对提交或确认时保存的结算依据。':'服务完成或取消后才能办理结算。')+'</p>':gaps.map(g=>'<p>'+U.link(E(g.text),g.href)+'</p>').join('')||'<p class="text-muted">当前范围无业务缺项。</p>');
 const noCosts=!M.costScope(D.costs,selection.projectId,selection.activities,selection.includeProjectCosts).lines.length;
 $('projectSettlementNoCost').closest('label').hidden=!noCosts;
}
function updateScope(){
 const scope=M.costScope(D.costs,selection.projectId,selection.activities,selection.includeProjectCosts);
 if(scope.lines.length)selection.noCost='';else if(!selection.noCost)selection.noCost='本次无采购费用（演示）';
 $('projectSettlementNoCost').value=selection.noCost;
 $('projectSettlementScopeLabel').textContent=selection.activities.length+'团'+(selection.includeProjectCosts?'及项目承担费用':'');
 const e=T.settlementEvidence(D,selection);
 $('projectSettlementTaxSummary').innerHTML=MiceTaxSummary.settlementSection(e,'本次结算金额','summary')+'<p class="text-muted">预计值仅作业务测算；未知税额不按零处理，各币种分别核对。</p>';
 $('projectSettlementIncomeTax').innerHTML=MiceTaxSummary.settlementSection(e,'收入与税额明细','income');
 $('projectSettlementScopeCosts').innerHTML=costScopeContent(e,false);
 // Refresh scope-dependent original tabs without reopening the drawer or losing form edits.
 for(const [name,html] of [['orders',section('订单明细',ordersTable(selection.activities))],['receipts',section('收款预收',orderMoneyTable(selection.activities))],['prepay',paymentContent(e)]])document.querySelector('[data-settlement-doc-panel="'+name+'"] .project-settlement-content').innerHTML=html;
 refreshSources(e);
 const moneySection=document.querySelector('[data-settlement-doc-panel="overview"] > .project-settlement-content:last-child');moneySection.innerHTML=section('客户款项',orderMoneyTable(selection.activities));
 showGaps();
}
function save(s,intent){
 if(!s?.miceActivityId)return false;
 if(!selection||selection.locked){H.close();return true;}
 const activeTab=document.querySelector('[data-settlement-doc-tab].active')?.dataset.settlementDocTab||'overview';
 readFields();const result=MiceSettlement.saveBusiness(selection,intent);
 if(result.error){H.tab('attachments');$('projectSettlementGaps').insertAdjacentHTML('afterbegin','<p role="alert" class="project-settlement-warning">'+E(result.error)+'</p>');return true;}
 requestedRecord=result.record.id;sync();H.refresh();H.repaint();H.tab(intent==='submit'?'logs':activeTab);
 U.toast(intent==='submit'?'结算已提交，等待审批':'结算草稿已保存');return true;
}
document.addEventListener('click',event=>{
 const execution=event.target.closest('[data-project-execution]');
 if(execution&&current){const a=S.find('activities',execution.dataset.projectExecution),back=new URL(detailReturnUrl());back.searchParams.set('activityId',current.miceActivityId);back.searchParams.set('projectId',current.projectNo);back.searchParams.set('detail',selection.detailOnly?'1':'0');if(selection.id)back.searchParams.set('settlementId',selection.id);else back.searchParams.delete('settlementId');back.searchParams.set('settlementTab',document.querySelector('[data-settlement-doc-tab].active')?.dataset.settlementDocTab||'overview');execution.href=U.activityUrl(a,{tab:execution.dataset.executionTab||'overview',returnUrl:back.href});}

 const recordButton=event.target.closest('[data-project-record]');
 if(recordButton&&current){requestedRecord=recordButton.dataset.projectRecord;H.repaint();}
 if(event.target.closest('[data-project-print]')&&selection?.record)MiceSettlement.outputRecord(selection.record,MiceSettlement.recordEvidence(selection.record),'print');
 if(event.target.closest('[data-project-export]')&&selection?.record)MiceSettlement.outputRecord(selection.record,MiceSettlement.recordEvidence(selection.record),'export');
});
window.MiceSettlementHost={detailReturnUrl,metric,action,reset,paint,save,sync,openCosts,refreshCosts,resetCosts,costLedgerRoot};
U.ready(()=>{
 sync();
 for(const [key,id]of [['Keyword','costKeyword'],['Type','costType'],['Status','costStatus'],['Progress','costProgress'],['Owner','costOwner']])if(U.q.has('filter'+key))$(id).value=U.q.get('filter'+key);
 H.refresh();
 $('openProjectCosts').onclick=()=>MiceCosts.page();
 const oldSchedule=U.q.get('scheduleNo')&&H.schedules.find(s=>s.miceActivityId===U.q.get('scheduleNo'));
 if(oldSchedule&&!U.q.get('activityId')&&U.q.get('work')!=='costs'&&U.q.get('mode')!=='payment'){openCosts(oldSchedule);return;}
 if(U.q.get('work')==='costs'){
  const activity=U.q.get('activityId'),s=H.schedules.find(s=>s.miceActivityId===activity),costId=U.q.get('costId'),c=S.find('costs',costId);
  if(activity){
   if(!s||U.q.get('projectId')&&s.projectNo!==U.q.get('projectId')||costId&&(!c||!MiceCosts.rowsFor(s.projectNo,activity).some(row=>row.id===costId)))return U.toast('项目团与费用范围不匹配','error');
   openCosts(s);if(costId)MiceCosts.openSource(costId,U.q.get('adjustmentId'));
  }else MiceCosts.page();
  return;
 }
 const r=S.find('settlements',requestedRecord),activity=U.q.get('activityId')||r?.contextActivityId||r?.activities[0];
 if(requestedRecord&&!r){U.toast('未找到结算记录','error');return;}
 const s=activity&&H.schedules.find(s=>s.miceActivityId===activity);
 if(s&&(!U.q.get('projectId')||s.projectNo===U.q.get('projectId'))&&(!r||r.projectId===s.projectNo)){H.open(s.id,U.q.get('detail')==='1');const tab=U.q.get('settlementTab');if(['overview','income','discount','cost','orders','receipts','prepay','changes','attachments','logs'].includes(tab))H.tab(tab);}
 else if(activity||requestedRecord)U.toast('未找到对应项目团结算，请从列表重新选择','error');
 else if(U.q.get('projectId')&&!U.q.has('filterKeyword')){$('costKeyword').value=U.q.get('projectId');H.refresh();}
});
})();
