/* 项目级办理集中在单团项目列表；详情只引用同一份结果。 */
(function () {
  'use strict';
  const U = MiceUI, { store: S, M, esc: E, field: F, grid: G, section: SEC, btn: B, action: A, link: L } = U, D = S.data;
  let currentId = '', menu;
  const project = () => S.find('projects', currentId);
  const isList = () => location.pathname.endsWith('product-custom-list.html');
  const editable = p => p && ['草稿', '待确认', '进行中'].includes(p.status);
  const refresh = () => isList() ? MiceProjects.render() : window.MiceProjectDetail?.render();
  function closeMenu() { menu?.remove(); menu = null; document.querySelectorAll('[data-project-menu-open]').forEach(b => { b.setAttribute('aria-expanded', 'false'); delete b.dataset.projectMenuOpen; }); }
  function openMenu(button, items) {
    const wasOpen = button.dataset.projectMenuOpen; closeMenu(); if (wasOpen) return;
    button.dataset.projectMenuOpen = '1'; button.setAttribute('aria-expanded', 'true');
    menu = document.createElement('div'); menu.className = 'mice-project-menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML = items.map(item => '<button type="button" role="menuitem" data-mice-action="' + E(item.action) + '" ' + Object.entries(item.data || {}).map(([k,v])=>'data-'+k+'="'+E(v)+'"').join(' ') + (item.disabled ? ' disabled' : '') + '><span>' + E(item.label) + '</span>' + (item.note ? '<small>' + E(item.note) + '</small>' : '') + '</button>').join('');
    document.body.append(menu); const r = button.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(r.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(r.bottom + 4, innerHeight - menu.offsetHeight - 8)) + 'px';
    menu.querySelector('button:not(:disabled)')?.focus();
  }
  document.addEventListener('click', e => { if (menu && !e.target.closest('[data-project-menu-open]')) closeMenu(); });
  document.addEventListener('keydown', e => { if (!menu) return; if (e.key === 'Escape') { const b=document.querySelector('[data-project-menu-open]'); closeMenu(); b?.focus(); } else if (['ArrowDown','ArrowUp'].includes(e.key)) { e.preventDefault(); const nodes=[...menu.querySelectorAll('button:not(:disabled)')], i=nodes.indexOf(document.activeElement); nodes[(i+(e.key==='ArrowDown'?1:nodes.length-1))%nodes.length]?.focus(); } });
  window.addEventListener('resize', closeMenu);
  function select(id) { currentId = id; return project(); }
  function rowActions(p) {
    return A('详情', 'project-detail', p.id) + (['草稿','待确认'].includes(p.status) ? A(p.status==='草稿'?'编辑':'核对','project-edit',p.id) : '') + A('更多', 'project-more-view', p.id);
  }
  function projectMenu(id, button) {
    const p=select(id); if(!p)return;
    const state=editable(p), items=[];
    if(state) items.push(
      {label:'分工额度',action:'project-assignments',data:{id}},
      {label:'项目成员',action:'project-members',data:{id}},
      {label:'合同资料',action:'project-contracts',data:{id}}
    );
    if(p.status==='进行中')items.push({label:'收款认领',action:'project-collection',data:{id}},{label:'客户结算确认',action:'project-acceptance',data:{id}});
    if(state)items.push({label:'项目附件',action:'project-files',data:{id}},{label:'结算期限',action:'project-deadline',data:{id}});
    items.push({label:'复制项目',action:'project-copy',data:{id}});
    if(p.status==='进行中')items.push({label:'结项检查',action:'project-closeout',data:{id}});
    if(['待结项','已结项'].includes(p.status))items.push({label:'结项记录',action:'project-closeout-view',data:{id}});
    openMenu(button,items);
  }
  function assignments(id) {
    const p=select(id); if(!editable(p))return;
    let rows=M.clone((p.delegations||[]).filter(d=>d.status!=='已结束'));
    // 未分配人员额度时，子团直接使用项目预算；小项目无需增加中间层。
    const ended=(p.delegations||[]).filter(d=>d.status==='已结束'); let host;
    const read=()=>{host.querySelectorAll('[data-assignment-row]').forEach(n=>{const i=+n.dataset.assignmentRow;rows[i][n.dataset.key]=n.value;});return rows;};
    const draw=()=>{host.innerHTML=U.table(['操作人员／期间','负责事项','费用额度','占用／可用','操作'],rows.map((d,i)=>{
      const usage=(window.MiceBudget?MiceBudget.state(p).people:MiceProjectFlow.budgetRows(p)).find(r=>r.d.id===d.id), field=(key,label,value,opts={})=>F('assignment-'+i+'-'+key,label,value,opts).replace('data-field=', 'data-assignment-row="'+i+'" data-key="'+key+'" data-field=');
      return [field('employee','操作人员',d.employee,{options:[...new Set([...MiceProjects.people(p.company,true),d.employee].filter(Boolean))].map(name=>({value:name,label:name+((p.members||[]).some(m=>!m.ended&&(m.name||m.employee)===name)?' · 项目成员':' · 添加为操作成员')})),disabled:!!d.id})+'<details class="mice-project-fold"><summary>负责期间</summary>'+field('start','开始日期',d.start,{type:'date'})+field('end','结束日期',d.end,{type:'date'})+'</details>',field('scope','负责事项',d.scope),field('currency','币种',d.currency||'CNY',{options:['CNY','EUR','USD'],disabled:!!d.id})+field('businessAmount','负责业务金额（参考）',d.businessAmount??'',{type:'number'})+field('costBudget','费用额度',d.costBudget??'',{type:'number'}),usage?U.lines('已占用 '+M.money(usage.occupied,d.currency),'可用 '+M.money(usage.remaining,d.currency)):'尚未承担项目团','<button type="button" class="mice-link" data-assignment-end="'+i+'">'+(d.id?'结束分工':'移除')+'</button>'];
    }),'mice-assignment-table');};
    U.drawer('项目分工与费用额度',U.summary([['项目',p.name],['项目负责人',p.owner]])+G(F('total','项目费用总预算（CNY）',p.originalBudget??500000,{type:'number'})+F('publicBudget','公共费用预算（CNY）',p.publicBudget??0,{type:'number'})+F('budgetControl','费用预算管理',p.budgetControl||'reference',{options:[{value:'reference',label:'预算参考'},{value:'enforced',label:'启用预算管控'}],blank:null})+F('manager','超期提醒部门经理',p.departmentManager||p.owner,{options:D.catalog.staff.map(s=>s.name)}))+SEC('操作人员分工','<div id="project-assignment-rows"></div><button type="button" class="btn btn-secondary" data-assignment-add>新增分工</button>')+'<p class="mice-muted">选已有项目成员，或选择其他操作人员并自动加入成员名册。业务金额用于核对负责的成交规模；费用额度控制成团及采购预算。公共费用单独保留，剩余额度作为项目预留。实际收付款不重复占用预算。</p>'+F('basis','本次调整依据','按项目执行安排调整分工及费用预算',{full:true})+'<span class="mice-error" data-error="assignments"></span>'+(ended.length?'<details class="mice-project-fold"><summary>已结束分工 '+ended.length+'人</summary>'+U.table(['人员','负责事项','原费用额度'],ended.map(d=>[E(d.employee),E(d.scope),M.money(d.costBudget,d.currency)]))+'</details>':''),{
      wide:true,buttons:[['保存分工','save']],onOpen({form,setClean}){host=form.querySelector('#project-assignment-rows');draw();setClean();
        form.querySelector('[data-assignment-add]').onclick=()=>{read();rows.push({employee:MiceProjects.people(p.company,true).find(n=>!rows.some(d=>d.employee===n))||'',scope:'负责子团执行及采购核对',currency:'CNY',start:p.start,end:p.end,costBudget:null,status:'有效'});draw();};
        host.onclick=e=>{const b=e.target.closest('[data-assignment-end]');if(!b)return;read();const d=rows[+b.dataset.assignmentEnd];if(d.id&&window.MiceBudgetModel){const issues=MiceBudgetModel.endAssignmentIssues(D,p,d.employee);if(issues.length)return U.toast(issues.join('；'),'warning');}if(d.id){d.status='已结束';d.endReason='本次项目分工调整，原项目团负责人及历史资料保留';}else rows.splice(+b.dataset.assignmentEnd,1);const next=rows.filter(d=>d.status!=='已结束');const stopped=rows.filter(d=>d.status==='已结束');ended.push(...stopped);rows=next;draw();};
      },submit(v,i,x){read();if(!editable(p))return x.errors({assignments:'项目状态已变化，请重新查看'});
        const total=M.num(v.total), seen=new Set();for(const d of rows){d.costBudget=M.num(d.costBudget);d.businessAmount=M.num(d.businessAmount);if(!d.employee||seen.has(d.employee)||d.start>d.end||d.costBudget!=null&&d.costBudget<0||d.businessAmount!=null&&d.businessAmount<0)return x.errors({assignments:'请核对人员、负责期间和非负费用额度；同一人员保留一份有效分工'});seen.add(d.employee);}
        if(total==null||total<0||M.sum(rows.filter(d=>d.currency==='CNY').map(d=>({amount:d.costBudget||0})))>total)return x.errors({total:'人民币分配合计不得超过项目费用总预算'});
        const candidate={...p,originalBudget:total,publicBudget:M.num(v.publicBudget),budgetControl:v.budgetControl,delegations:[...ended,...rows]};const budgetErrors=window.MiceBudget?MiceBudget.allocationIssues(candidate):[];if(budgetErrors.length)return x.errors({assignments:budgetErrors.join('；')});(p.budgetChanges||=[]).push({before:p.originalBudget,after:total,publicBefore:p.publicBudget??0,publicAfter:candidate.publicBudget,basis:v.basis,at:new Date().toISOString()});p.originalBudget=total;p.publicBudget=candidate.publicBudget;p.budgetControl=candidate.budgetControl;p.departmentManager=v.manager;
        p.delegations=[...ended,...rows.map(d=>{const old=p.delegations?.find(r=>r.id===d.id);return{canCreate:true,quoteMode:'draft',control:'reference',businessAmount:null,singleLimit:null,cities:[],services:['会议','旅游','会议加旅游'],...d,id:d.id||S.id('FG'),history:[...(old?.history||[]),{action:'调整分工额度',before:old?.costBudget??null,after:d.costBudget,basis:v.basis,at:new Date().toISOString()}]};})];
        if(window.MiceBudgetModel)MiceBudgetModel.syncMembers(p,()=>S.id('XM'));
        S.log(p.id,'调整项目分工额度',v.basis);x.close();refresh();
      }
    });
  }
  function contracts(id) {
    const p=select(id);if(!p)return;
    U.drawer('项目合同资料',U.summary([['项目',p.name],['客户',p.customer]])+SEC('框架合同',U.table(['合同／服务期间','金额性质／金额','签署情况','操作'],(p.frameworks||[]).map(f=>[U.lines(E(f.name||f.number),E(f.start)+' 至 '+E(f.end)),U.lines(E(f.nature),M.money(f.amount,f.currency)),U.tag(f.status),A(f.source==='OA'?'查看':'维护',f.source==='OA'?'flow-oa-view':'framework-edit',f.id)+L('原合同',U.url('merchant/sales/contracts.html',{mice:1,projectId:p.id,frameworkId:f.id}))])),editable(p)?B('登记框架合同','framework-new')+B('关联OA合同','flow-oa-link',{project:p.id}):''),{readonly:true,buttons:[]});
  }
  function members(id) { const p=select(id);if(!p)return;U.drawer('项目组成员',U.summary([['项目',p.name]])+MiceProjectFlow.members(p),{readonly:true,wide:true,buttons:[]}); }
  function closeoutView(id) { const p=select(id);if(!p)return;U.drawer('项目结项记录',U.summary([['项目',p.name],['状态',p.status],['结项说明',p.closeout?.reason||'尚未提交'],['遗留款票负责人',p.closeout?.pendingOwner||'—'],['处理安排',p.closeout?.pendingPlan||'—']])+(p.status==='待结项'?L('查看审批',U.url('merchant/approval/approvals.html',{mice:1,sourceId:p.id})):''),{readonly:true,buttons:[]}); }
  Object.assign(U.actions,{
    'project-more-view':({id},button)=>projectMenu(id,button),
    'project-assignments':({id})=>assignments(id),
    'project-contracts':({id})=>contracts(id),
    'project-members':({id})=>members(id),
    'project-acceptance':({id})=>{const p=select(id);if(p?.status!=='进行中')return;MiceSettlement.customerForm();},
    'project-collection':({id})=>{const p=select(id);if(p?.status==='进行中')location.href=U.url('merchant/sales/payment-claim.html',{mice:1,projectId:id,returnUrl:location.href});},
    'project-closeout-view':({id})=>closeoutView(id),
    'flow-budget':({project:id})=>assignments(id||project()?.id)
  });
  window.MiceProjectManagement={rowActions,openMenu,refresh,select,assignments,contracts,members,get project(){return isList()?project():null;}};
  U.ready(()=>{if(!isList())return;MiceProjects.render();const id=U.q.get('projectId'),work=U.q.get('work');if(id&&work){select(id);const actions={acceptance:()=>{if(project()?.status==='进行中')MiceSettlement.customerForm();},contracts:()=>contracts(id),assignments:()=>assignments(id)};actions[work]?.();const url=new URL(location.href);url.searchParams.delete('work');url.searchParams.delete('projectId');U.q.delete('projectId');history.replaceState(null,'',url);}});
})();
