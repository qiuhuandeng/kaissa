/* 会奖业务主线：复用项目、原订单、原采购及团期结算，不另造财务流程。 */
(function () {
  'use strict';
  const U = window.MiceUI;
  if (!U) return;
  const style=document.createElement('link');style.rel='stylesheet';style.href=U.url('shared/mice-project-flow.css');document.head.append(style);
  const { M, store: S, esc: E, field: F, grid: G, section: SEC, btn: B, action: A, link: L } = U, D = S.data;
  const modes = ['旅游单团', '会议专票团'];
  const roles = ['销售', '项目负责', '操作', '资源岗', '助理岗', '签证专员', '酒店专员', '现场支持'];
  const project = id => id ? S.find('projects',id) : window.MiceProjectManagement?.project || S.find('projects', U.q.get('id') || U.q.get('projectId'));
  const editable = p => p && !['已结项', '已终止'].includes(p.status);
  const mode = (p, a) => a?.businessMode || p?.businessMode || (/会议/.test(a?.service || D.activities.filter(x=>x.projectId===p?.id).map(x=>x.service).join('、')) ? '会议专票团' : '旅游单团');
  const refresh = () => location.pathname.endsWith('product-custom-list.html') ? MiceProjects.render() : window.MiceProjectDetail && location.pathname.endsWith('product-custom-detail.html') ? MiceProjectDetail.render() : window.MiceCosts?.page();
  const settlementLink = (p, a) => U.url('merchant/tour/fulfillment-cost.html',{type:'project',projectId:p.id,activityId:a?.id||'',returnUrl:location.href});
  const modeField = (p, a) => F('businessMode', '建团模式', mode(p, a), { options: modes, blank: null });
  function setupFields(p) {
    return SEC('建团与预算', G(modeField(p) + F('originalBudget', '项目费用总预算（CNY）', p.originalBudget ?? '', { type: 'number' }) + F('publicBudget','公共费用预算（CNY）',p.publicBudget??0,{type:'number'}) + F('budgetControl','费用预算管理',p.budgetControl||'reference',{options:[{value:'enforced',label:'启用预算管控'},{value:'reference',label:'预算参考'}],blank:null})) + '<p class="mice-muted">各团可单独调整模式。会议专票团按含税费用及预计可扣税额核对，开票申请可按客户要求选择票种。</p>') +
      SEC('项目组', '<div id="mice-project-team"></div>' + B('添加成员', 'flow-team-add'));
  }
  function bindTeam(form, p) {
    let members = M.clone(p.members || []);
    if (!members.length) members = [{ name: p.sales || '陈刚', role: '销售', note: '客户关系、合同、开票及收款' }, { name: p.owner || '张三', role: '项目负责', note: '项目统筹与执行交付' }];
    const host = form.querySelector('#mice-project-team');
    const read = () => { host.querySelectorAll('[data-team-row]').forEach(n => { members[+n.dataset.teamRow][n.dataset.teamKey] = n.value; }); return members; };
    const draw = () => { host.innerHTML = U.table(['员工', '职责', '负责事项', '操作'], members.map((m, i) => [
      '<select aria-label="成员' + (i + 1) + '员工" data-team-row="' + i + '" data-team-key="name">' + U.options(D.catalog.staff.map(s => s.name), m.name || m.employee) + '</select>',
      '<select aria-label="成员' + (i + 1) + '职责" data-team-row="' + i + '" data-team-key="role">' + U.options([...new Set([...roles, m.role].filter(Boolean))], m.role) + '</select>',
      '<input aria-label="成员' + (i + 1) + '负责事项" data-team-row="' + i + '" data-team-key="note" value="' + E(m.note || '') + '">',
      '<button type="button" class="mice-link" data-team-remove="' + i + '">移除</button>'
    ])); };
    host.onclick = e => { const b = e.target.closest('[data-team-remove]'); if (b) { read(); members.splice(+b.dataset.teamRemove, 1); draw(); } };
    form.querySelector('[data-mice-action="flow-team-add"]').onclick = e => { e.stopPropagation(); read(); members.push({ name: D.catalog.staff[0]?.name, role: '操作', note: '执行安排与供应商采购' }); draw(); };
    draw();
    return () => read().filter(m => m.name && m.role).map(m => ({ ...m, start: m.start || form.elements.start.value, end: m.end || form.elements.end.value, activities: m.activities || [] }));
  }
  function memberBudget(p,m){const d=window.MiceBudgetModel?.memberAssignment(p,m);return d?M.money(d.costBudget,d.currency):'未分配';}
  function members(p) {
    return SEC('项目组成员', U.table(['员工／职责', '负责项目团', '参与期间', '负责事项', '费用额度', '操作'], (p.members || []).map((m, i) => [
      U.lines(E(m.name || m.employee), E(m.role), m.ended ? '已结束参与' : ''),
      E(m.activities?.length ? m.activities.map(id => S.find('activities', id)?.name || id).join('、') : '项目总体'),
      E((m.start || p.start) + ' 至 ' + (m.end || p.end)), E(m.note || '—'), memberBudget(p,m),
      !editable(p) || m.ended ? '—' : A('编辑', 'flow-member-edit', i) + A('结束参与', 'flow-member-end', i)
    ])), (editable(p) ? B('新增成员', 'flow-member-new', { project: p.id }) : '') + B('导出参与记录', 'flow-member-export', { project: p.id }));
  }
  function memberEdit(index) {
    const p = project(); if (!editable(p)) return;
    const old = index === undefined ? null : p.members?.[Number(index)], m = old || { name: '李梅', role: '操作', start: p.start, end: p.end, activities: [] };
    if (m.ended) return;
    const acts = D.activities.filter(a => a.projectId === p.id),linked=old&&(window.MiceBudgetModel?.memberAssignment(p,m)||acts.some(a=>a.planner===(m.name||m.employee)));
    U.drawer(old ? '编辑项目成员' : '新增项目成员', G(F('name', '员工', m.name || m.employee, { options: D.catalog.staff.map(s => s.name),disabled:!!linked }) + F('role', '职责', m.role, { options: [...new Set([...roles, m.role])] }) + F('start', '参与开始', m.start, { type: 'date' }) + F('end', '参与结束', m.end, { type: 'date' })) + SEC('负责项目团', '<p class="mice-muted">未选具体团时，登记为项目总体参与。</p><div class="mice-checklist">' + acts.map(a => '<label><input type="checkbox" name="scope-' + E(a.id) + '" ' + (m.activities?.includes(a.id) ? 'checked' : '') + '>' + E(a.name) + '</label>').join('') + '</div>'), {
      submit(v, i, x) { if (!editable(p)) return;const name=linked?(m.name||m.employee):v.name;if((!old||name!==(old.name||old.employee))&&(p.members||[]).some(other=>other!==old&&!other.ended&&(other.name||other.employee)===name))return x.errors({name:'该员工已在项目成员中，请编辑原记录'}); const n = { ...m, ...v,name, activities: acts.filter(a => v['scope-' + a.id]).map(a => a.id) }; if (old) { n.history = [...(old.history || []), { name: old.name, role: old.role, note: old.note, start: old.start, end: old.end }]; Object.assign(old, n); } else (p.members ||= []).push(n); S.log(p.id, old ? '编辑项目成员' : '新增项目成员', n.name + '／' + n.role); x.close(); refresh(); }
    });
  }
  function budgetRows(p) {
    if(window.MiceBudget)return MiceBudget.state(p).people.map(r=>({...r,count:r.groups.length,planned:M.sum(r.groups.map(g=>({amount:g.budget}))),committed:M.sum(r.groups.map(g=>({amount:g.cost})))}));
    return (p.delegations || []).filter(d => d.status !== '已结束').map(d => {
      const acts = D.activities.filter(a => a.projectId === p.id && a.planner === d.employee && a.status !== '已取消');
      const planned = M.sum(acts.map(a => ({ amount: a.originalBudget || 0 }))), scope = M.costScope(D.costs.filter(c => c.currency === d.currency), p.id, acts.map(a => a.id));
      const committed = M.sum(scope.lines.filter(c => c.status === '已确认'));
      const occupied = M.round(acts.reduce((sum, a) => sum + Math.max(a.originalBudget || 0, M.sum(M.costScope(D.costs.filter(c => c.currency === d.currency), p.id, [a.id]).lines.filter(c => c.status === '已确认'))), 0));
      const unknown=scope.lines.some(c=>c.amount==null||c.incomplete)||acts.some(a=>a.originalBudget==null);
      return { d, count: acts.length, planned: d.currency==='CNY'?planned:null, committed, occupied: d.currency==='CNY'&&!unknown?occupied:null, remaining: d.currency!=='CNY'||d.costBudget == null||unknown ? null : M.round(d.costBudget - occupied) };
    });
  }
  function budgets(p) {
    return SEC('操作人员费用额度', U.table(['操作人员', '支出额度', '各团预算合计', '已确认承担费用', '可用额度'], budgetRows(p).map(({ d, planned, committed, remaining }) => [E(d.employee), M.money(d.costBudget, d.currency), M.money(planned, d.currency), M.money(committed, d.currency), U.lines(M.money(remaining, d.currency), remaining < 0 ? '超出额度，请调整分配或本团预算' : '')])) + '<p class="mice-muted">逐团按预算与已确认承担费用较大值占用额度；未分配费用在费用总览另核，不代表可付款余额。</p>', editable(p) ? B('分配费用额度', 'flow-budget', { project: p.id }) : '');
  }
  function budgetEdit(pid) {
    const p = project(pid); if (!editable(p)) return;
    const names = [...new Set([...D.catalog.staff.filter(s => s.canPlan && s.companies.includes(p.company)).map(s => s.name), ...(p.delegations || []).filter(d => d.status !== '已结束' && d.currency === 'CNY').map(d => d.employee)])].filter(name=>!p.delegations?.some(d=>d.employee===name&&d.status!=='已结束'&&d.currency!=='CNY'));
    U.drawer('分配操作人员费用额度', U.summary([['大项目', p.name], ['客户', p.customer]]) + G(F('total', '项目总预算（CNY）', p.originalBudget ?? 500000, { type: 'number' }) + F('manager', '超期提醒部门经理', p.departmentManager || '张三', { options: D.catalog.staff.map(s => s.name) })) + U.table(['操作人员', '可分配费用额度（CNY）', '负责事项'], names.map((name, i) => {
      const d = p.delegations?.find(d => d.employee === name && d.status !== '已结束' && d.currency === 'CNY');
      return [E(name), F('limit-' + i, name + '费用额度', d?.costBudget ?? (i === 0 && !p.delegations?.length ? 100000 : ''), { type: 'number' }), F('scope-' + i, name + '负责事项', d?.scope || '负责本人子团的采购与执行结算')];
    }), 'mice-flow-budget-table') + '<p id="mice-budget-balance"></p>' + F('basis', '本次分配依据', '销售按项目执行计划分配操作人员费用额度（演示）', { full: true }), {
      wide: true, buttons: [['保存分配', 'save']], onOpen({ form }) { const update = () => { const sum = names.reduce((s, _, i) => s + (+form.elements['limit-' + i].value || 0), 0); form.querySelector('#mice-budget-balance').textContent = '已分配 ' + M.money(sum) + ' · 项目保留 ' + M.money((+form.elements.total.value || 0) - sum); }; form.addEventListener('input', update); update(); },
      submit(v, i, x) {
        const limits = names.map((name, index) => ({ name, amount: M.num(v['limit-' + index]), scope: v['scope-' + index] })), total = M.num(v.total);
        if (total == null || total < 0 || limits.some(d => d.amount != null && d.amount < 0) || M.sum(limits) > total) return x.errors({ total: '分配合计不得超过项目总预算；预算及额度不能为负' });
        p.originalBudget = total; p.departmentManager = v.manager; p.delegations ||= [];
        for (const item of limits) {
          let d = p.delegations.find(d => d.employee === item.name && d.status !== '已结束' && d.currency === 'CNY');
          if (!d && item.amount == null) continue;
          if (!d) { d = { id: S.id('FG'), employee: item.name, status: '有效', currency: 'CNY', canCreate: true, quoteMode: 'draft', control: 'reference', businessAmount: null, singleLimit: null, cities: [], services: ['会议', '旅游', '会议加旅游'], start: p.start, end: p.end }; p.delegations.push(d); }
          (d.history ||= []).push({ action: '分配费用额度', before: d.costBudget ?? null, after: item.amount, basis: v.basis, date: new Date().toISOString() }); d.costBudget = item.amount; d.scope = item.scope;
        }
        S.log(p.id, '分配操作人员费用额度', '总预算 ' + M.money(total) + '；' + v.basis); x.close(); refresh();
      }
    });
  }
  function overview(p) {
    const acts = D.activities.filter(a => a.projectId === p.id), ds = budgetRows(p), allocated = M.sum(ds.filter(r => r.d.currency === 'CNY').map(r => ({ amount: r.d.costBudget || 0 })));
    const childRows = acts.map(a => {
      const orders = D.orders.filter(o => o.projectId === p.id && o.activities.includes(a.id) && !['已作废', '已取消'].includes(o.status)), currencies = [...new Set([...orders, ...D.costs.filter(c => c.projectId === p.id && (c.activityId === a.id || c.allocations?.some(r => r.activityId === a.id)))].map(r => r.currency))];
      const income = currencies.map(c => { const rows = orders.filter(o => o.currency === c); return rows.some(o => o.activities.length !== 1) ? E(c + ' 整包未分团') : M.money(rows.length && rows.every(o => o.amount != null) ? M.sum(rows) : null, c); }).join('<br>');
      const costs = currencies.map(c => { const rows = M.costScope(D.costs.filter(x => x.currency === c), p.id, [a.id]).lines; return M.money(rows.length && rows.every(r => r.amount != null && r.status === '已确认') ? M.sum(rows) : null, c); }).join('<br>');
      return [U.lines(E(a.name), E(a.id)), U.lines(E(a.city || '待定'), E((a.start||'待定') + ' 至 ' + (a.end||'待定'))), String(a.confirmedPeople ?? a.people ?? '待定'), E(a.planner || '未分配'), window.MiceOrderEntry?.groupCell(a)||income||'待确认', costs || '待录入', L('执行详情', U.activityUrl(a, { returnUrl: location.href })) + ' ' + L('结算详情', U.url('merchant/tour/fulfillment-cost.html', { type: 'project', projectId: p.id, activityId: a.id, detail: 1, returnUrl: location.href }))];
    });
    return SEC(p.mode === 'multi' ? '大项目总览' : '项目总览', U.summary([['客户类型', p.customerType || '待核对'], ['项目分类', p.kind], ['默认建团模式', mode(p)], ['总预算（CNY）', M.money(p.originalBudget)], ['已分配费用额度（CNY）', M.money(allocated)], ['项目保留额度（CNY）', M.money(p.originalBudget == null ? null : p.originalBudget - allocated)], ['总合同', (p.frameworks || []).map(f => (f.number || f.no || f.name) + ' · ' + M.money(f.amount, f.currency) + '（' + f.nature + '）').join('；') || '未关联'], ['子团进度', acts.filter(a => a.status === '已完成').length + ' / ' + acts.length + '团完成']]), (editable(p) ? B('分配费用额度', 'flow-budget', { project: p.id }) : '') + L('项目采购', U.url('merchant/tour/fulfillment-cost.html', { mice: 1, projectId: p.id, returnUrl: location.href }))) +
      SEC('子团与订单汇总', U.table(['子团／团号', '目的地／期间', '人数', '操作人员', '客户订单／金额', '已确认承担费用', '操作'], childRows)) + (window.MiceTaxSummary?.section(p.id) || '') + overdue(p);
  }
  function groupBudgetNote(p, a) {
    if(window.MiceBudget)return MiceBudget.groupNote(p,a);
    const row = budgetRows(p).find(r => r.d.employee === a.planner);
    if (!row) return '尚未登记该操作的费用预算，可从单团项目列表的分工额度维护。';
    if(row.d.currency!=='CNY')return '本团费用预算为 CNY，人员额度为 '+row.d.currency+'；折算依据未明确，可用额度待核对。';
    const current = D.activities.find(x => x.id === a.id), base = row.planned - (current?.originalBudget || 0) + (+a.originalBudget || 0);
    return '费用预算 ' + M.money(row.d.costBudget, row.d.currency) + ' · 本次建团后各团预算 ' + M.money(base, row.d.currency) + (row.d.costBudget != null && base > row.d.costBudget ? ' · 超出预算 ' + M.money(base - row.d.costBudget, row.d.currency) : '');
  }
  function oaRecords(p) {
    // 默认资料只作为可选择的回传演示；不自动关联、不自动形成成交。
    return D.oaContractReturns?.filter(r => r.customer === p.customer && r.company === p.company) || [];
  }
  function contractLink(pid) {
    const p = project(pid); if (!editable(p)) return;
    const records = oaRecords(p), first = records.find(r => r.status === '盖章完成') || records[0];
    U.drawer('关联OA合同', U.summary([['项目', p.name], ['客户', p.customer], ['我方公司', p.company]]) + F('oaId', 'OA回传合同', first?.id || '', { options: records.map(r => ({ value: r.id, label: r.number + ' · V' + r.version + ' · ' + r.status })), full: true }) + '<div id="mice-oa-return"></div><p class="mice-muted">致远OA回传资料演示。已盖章版本关联后直接作为合同依据，不在ERP重复发起审批。</p>', {
      buttons: [['关联合同', 'link']], onOpen({ form }) {
        const draw = () => { const r = records.find(r => r.id === form.elements.oaId.value); form.querySelector('#mice-oa-return').innerHTML = r ? U.summary([['合同名称', r.name], ['状态', r.status], ['金额', M.money(r.amount, r.currency)], ['金额性质', r.nature], ['签订日期', r.signedAt || '尚未盖章'], ['服务期间', r.start + ' 至 ' + r.end], ['回传附件', r.file]]) : '<p class="mice-muted">暂无匹配客户及公司的OA回传合同。</p>'; }; form.elements.oaId.onchange = draw; draw();
      }, submit(v, i, x) {
        const r = oaRecords(p).find(r => r.id === v.oaId); if (!r || r.status !== '盖章完成') return x.errors({ oaId: '请选择已盖章完成的回传版本；未完成合同继续在OA办理' });
        p.frameworks ||= []; if (p.frameworks.some(f => f.oaId === r.id)) { x.close(); U.toast('该合同版本已关联'); return; }
        p.frameworks.push({ id: S.id('FW'), source: 'OA', oaId: r.id, oaVersion: r.version, number: r.number, name: r.name, amount: r.amount, currency: r.currency, nature: r.nature, signedDate:r.signedAt, attachments:[], start: r.start, end: r.end, scope: r.scope, terms: r.terms, basis: r.number + '／V' + r.version + '／OA盖章完成（演示）', status: '已签归档', oaFile: r.file });
        S.log(p.id, '关联OA已签合同', r.number + '／V' + r.version); x.close(); refresh();
      }
    });
  }
  function receipts(p) {
    const orders = D.orders.filter(o => o.projectId === p.id && !['已作废', '已取消'].includes(o.status));
    return SEC('客户订单', U.table(['订单／项目团', '确认金额', '财务已认款／待收', '已开票／可申请', '操作'], orders.map(o => [
      U.lines(L(E(o.id), U.url('merchant/sales/orders-detail.html', { mice: 1, orderNo: o.id, returnUrl: location.href })), E(o.activities.map(id => S.find('activities', id)?.name || id).join('、'))),
      M.money(o.amount, o.currency), U.lines(M.money(o.received || 0, o.currency), '待收 ' + M.money(o.amount == null ? null : Math.max(0, o.amount - (o.received || 0)), o.currency)),
      U.lines(M.money(o.invoiced || 0, o.currency), '可申请 ' + M.money(o.amount == null ? null : MiceFinance.invoiceAvailable(o), o.currency)),
      editable(p) && o.amount != null ? (MiceFinance.invoiceAvailable(o)>0?A('开票申请', 'flow-invoice', o.id):'') + ((o.amount||0)>(o.received||0)+M.sum(D.claims.filter(r=>r.status==='待财务认款').flatMap(r=>r.allocations).filter(a=>a.orderId===o.id))?A('收款认领', 'flow-claim', o.id):'') : o.amount==null&&editable(p)&&window.MiceOrderEntry?A('最终定价','deal-final',o.id):L('详情',U.url('merchant/sales/orders-detail.html',{mice:1,orderNo:o.id}))
    ]))) + (window.MiceOrderEntry?.collectionPlan(p)||'') + SEC('开票申请与结果', U.table(['申请／发票', '金额／种类', '状态', '操作'], D.invoices.filter(r => r.projectId === p.id || r.allocations?.some(a => orders.some(o => o.id === a.orderId))).map(r => [U.lines(E(r.id), E(r.invoiceNo || '尚未返回发票号码')), U.lines(M.money(M.sum(r.allocations.filter(a => orders.some(o => o.id === a.orderId))), r.currency), E(r.invoiceKind)), U.tag(r.status), A('详情', 'einvoice-view', r.id) + (['已退回', '开具失败'].includes(r.status) ? A('修正', 'flow-invoice-edit', r.id) : '') + (r.status === '已开具' ? A(r.demoPdf ? 'PDF样例' : 'PDF', 'einvoice-download', r.id) + A('交付客户', 'flow-invoice-delivery', r.id) : '')]))) +
      SEC('收款认领记录', U.table(['认领／流水', '本项目金额', '状态', '操作'], D.claims.filter(r => r.projectId === p.id || r.allocations?.some(a => orders.some(o => o.id === a.orderId))).map(r => [U.lines(E(r.id), E(r.flowId)), M.money(M.sum(r.allocations.filter(a => orders.some(o => o.id === a.orderId))), r.currency), U.tag(r.status), A('详情', 'flow-claim-view', r.id) + (['已退回', '已撤回'].includes(r.status) ? A('修正', 'flow-claim-edit', r.id) : '')]))) + overdue(p);
  }
  function overdue(p) {
    const today = new Date().toLocaleDateString('en-CA'), rows = [];
    for (const o of D.orders.filter(o => o.projectId === p.id && !['已取消', '已作废'].includes(o.status))) for (const n of o.nodes || []) {
      const due = n.due || n.date, left = (n.amount || 0) - (n.received || 0);
      if (due && due < today && left > 0) rows.push([E(o.id + ' · ' + n.name), E(due), M.money(left, o.currency), E(p.sales || '待分配'), E(p.departmentManager || '部门经理（待指定）'), L('订单详情', U.url('merchant/sales/orders-detail.html', { mice: 1, orderNo: o.id, tab: 'receivable' }))]);
    }
    for (const a of D.activities.filter(a => a.projectId === p.id && a.status === '已完成' && a.settlementDue && a.settlementDue < today)) if (!D.settlements.some(s => s.status === '已确认' && s.activities.includes(a.id))) rows.push([E(a.name + ' · 结算未确认'), E(a.settlementDue), '—', E(a.planner), E(p.departmentManager || '部门经理（待指定）'), L('团期结算', settlementLink(p, a))]);
    return SEC('超期事项', U.table(['单据／事项', '截止日期', '未收金额', '经办人', '提醒经理', '操作'], rows) + (rows.length ? '<p class="mice-muted">按期限和未结结果展示提醒对象；原型不发送实际消息。</p>' : ''));
  }
  function settlementSummary(p) {
    const acts = D.activities.filter(a => a.projectId === p.id), costs = D.costs.filter(c => c.projectId === p.id), rows = acts.map(a => {
      const records = D.settlements.filter(s => s.projectId === p.id && s.activities.includes(a.id)), r = records.find(s => ['审批中', '草稿', '已退回'].includes(s.status)) || records.find(s => s.status === '已确认');
      return [U.lines(E(a.name), E(a.planner)), E(a.status), r ? U.lines(U.tag(r.status), E(r.id)) : '未提交', E(a.settlementDue || '未设置'), L('结算详情', U.url('merchant/tour/fulfillment-cost.html',{type:'project',projectId:p.id,activityId:a.id,detail:1,returnUrl:location.href}))];
    });
    return SEC('项目结算汇总', U.summary([['项目团', acts.length + '团'], ['结算已确认', acts.filter(a => D.settlements.some(s => s.status === '已确认' && s.activities.includes(a.id))).length + '团'], ['采购待确认', costs.filter(c => c.status !== '已确认').length + '笔']]) + U.table(['项目团／操作', '执行阶段', '结算记录', '结算期限', '操作'], rows), L('进入团期结算', settlementLink(p))) + overdue(p);
  }
  function delivery(id) {
    const r = S.find('invoices', id); if (!r || r.status !== '已开具') return;
    U.drawer('发票交付客户', U.summary([['发票号码', r.invoiceNo], ['客户', r.customer], ['发票金额', M.money(r.amount, r.currency)]]) + F('recipient', '收票资料', r.recipient, { full: true }) + B(r.demoPdf ? (location.protocol==='file:'?'查看PDF样例':'下载PDF样例') : '下载发票PDF', 'einvoice-download', { id }) + '<p class="mice-muted">下载后通过现有渠道交付；下方仅登记演示交付记录，不会实际发送邮件。</p>' + U.table(['时间', '收票资料'], (r.deliveries || []).map(d => [E(d.at), E(d.recipient)])), { buttons: [['登记交付记录', 'save']], submit(v, i, x) { (r.deliveries ||= []).push({ at: new Date().toLocaleString('zh-CN'), recipient: v.recipient, demo: true }); S.log(r.projectId, '登记发票交付（演示）', r.id); x.close(); refresh(); } });
  }
  function bootstrap() {
    D.oaContractReturns ||= [];
    for (const [index, name, amount, nature] of [[0, '北京科技发展有限公司', 106000, '客户承诺'], [1, '华辰医药有限公司', 5000000, '上限']]) for (const [version, status] of [[1, '盖章完成'], [2, '审批中']]) {
      const id = 'OA-DEMO-' + index + '-' + version;
      if (!D.oaContractReturns.some(r => r.id === id)) D.oaContractReturns.push({ id, customer: name, company: '北京凯撒', number: 'OA-2026-' + (index + 1), name: index ? '年度会议服务框架合同' : '企业奖励旅游服务合同', version, status, amount, currency: 'CNY', nature, start: '2026-01-01', end: '2026-12-31', scope: index ? '年度区域会议服务，按场确认金额' : '约定线路及执行服务', terms: '按原合同收款节点办理', signedAt: status === '盖章完成' ? '2026-10-01' : '', file: 'OA已签合同回传资料（演示）.pdf' });
    }
    // 回传演示目录独立于已关联的业务记录，不重置现有办理状态。
    S.save();
    if (!location.pathname.endsWith('product-custom-detail.html')) return;
    const X = window.MiceProjectExtensions ||= {}, agreements = X.agreements, costs = X.costs;
    X.agreements = p => (agreements?.(p) || '').replace(B('登记框架合同','framework-new'),B('登记框架合同','framework-new')+(editable(p)?B('关联OA合同','flow-oa-link',{project:p.id}):''));
    const frameworkEdit=U.actions['framework-edit'];U.actions['framework-edit']=data=>{const f=project()?.frameworks?.find(f=>f.id===data.id);return f?.source==='OA'?U.actions['flow-oa-view'](data):frameworkEdit(data);};
    X.costs = p => settlementSummary(p) + (costs?.(p) || '');
    X.receipts = receipts;
    X.overview = overview;
    MiceProjectDetail.render();
  }
  Object.assign(U.actions, {
    'flow-budget': ({ project: pid }) => budgetEdit(pid),
    'flow-member-new': () => memberEdit(), 'flow-member-edit': ({ id }) => memberEdit(id),
    'flow-member-end': ({ id }) => { const p = project(), m = p?.members?.[+id]; if (!editable(p) || !m || m.ended) return;const issues=window.MiceBudgetModel?.endAssignmentIssues(D,p,m.name||m.employee)||[];if(issues.length)return U.toast(issues.join('；'),'warning'); U.drawer('结束成员参与', U.summary([['员工', m.name || m.employee], ['职责', m.role]])+'<p class="mice-muted">结束后收回未使用的人员额度，原项目团预算、费用和参与记录继续保留。</p>' + G(F('end', '结束日期', new Date().toLocaleDateString('en-CA'), { type: 'date' }) + F('reason', '交接说明', '本阶段工作完成，历史参与记录保留', { full: true })), { submit(v, i, x) { const issues=window.MiceBudgetModel?MiceBudgetModel.endMember(D,p,m,v.end,v.reason):[];if(issues.length)return x.errors({reason:issues.join('；')});m.ended = true; m.end = v.end; m.endReason = v.reason; S.log(p.id, '结束成员参与', (m.name || m.employee) + '／' + v.reason); x.close(); refresh(); } }); },
    'flow-member-export': ({ project: pid }) => { const p = project(pid); U.download(p.name + '-项目参与记录.csv', M.csv([['项目', '项目团', '员工', '职责', '参与开始', '参与结束', '移交前后', '负责事项'], ...M.memberRows(p, D.activities)])); },
    'flow-oa-link': ({ project: pid }) => contractLink(pid),
    'flow-oa-view': ({ id }) => { const p = project(), f = p?.frameworks?.find(f => f.id === id); if (f) U.drawer('OA回传合同资料', U.summary([['合同', f.number], ['版本', 'V' + f.oaVersion], ['状态', f.status], ['客户', p.customer], ['合同金额', M.money(f.amount, f.currency)], ['金额性质', f.nature], ['回传附件', f.oaFile], ['关联依据', f.basis]]), { readonly: true, buttons: [] }); },
    'flow-invoice': ({ id }) => MiceFinance.invoice(null, { orderId: id }), 'flow-claim': ({ id }) => MiceFinance.claim(null, { orderId: id }),
    'flow-invoice-edit': ({ id }) => MiceFinance.invoice(id), 'flow-claim-edit': ({ id }) => MiceFinance.claim(id),
    'flow-claim-view': ({ id }) => { const r = S.find('claims', id); if (r) U.drawer('收款认领详情', U.summary([['认领编号', id], ['到账流水', r.flowId], ['状态', r.status], ['认领依据', r.basis]]) + U.table(['订单', '金额', '收款阶段'], r.allocations.map(a => [E(a.orderId), M.money(a.amount, r.currency), E(a.node)])), { readonly: true, buttons: [] }); },
    'flow-invoice-delivery': ({ id }) => delivery(id)
  });
  window.MiceProjectFlow = { mode, modeField, setupFields, bindTeam, members, budgets, budgetRows, groupBudgetNote, refresh, receipts, settlementSummary };
  U.ready(bootstrap);
})();
