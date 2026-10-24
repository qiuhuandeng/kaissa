/* 客户线下成交一次登记到原订单；报价可选，收款仍由原认领办理。 */
(function () {
  'use strict';
  if (!window.MiceUI) return;
  const U = MiceUI, { store: S, M, esc: E, field: F, grid: G, section: SEC, btn: B, action: A, link: L } = U, D = S.data;
  const active = o => !['已取消', '已作废'].includes(o.status);
  const ordersFor = a => D.orders.filter(o => active(o) && o.projectId === a.projectId && o.activities.includes(a.id));
  const editable = p => p && !['待结项', '已结项', '已终止'].includes(p.status);
  const available = p => D.activities.filter(a => a.projectId === p.id && ['草稿','进行中'].includes(a.status) && !ordersFor(a).length);
  const orderUrl = (o, tab = 'overview') => U.url('merchant/sales/orders-detail.html', { mice: 1, orderNo: o.id, projectId: o.projectId, tab, returnUrl: location.href });
  const refresh = () => window.MiceActivity?.activity || /schedules\.html$/.test(location.pathname) ? window.MiceActivity?.render() : window.MiceProjectDetail && /product-custom-detail\.html$/.test(location.pathname) ? MiceProjectDetail.render() : window.MiceOrders?.render();
  const today = () => new Date().toLocaleDateString('en-CA');
  const number = v => v !== '' && v != null && Number.isFinite(Number(v)) ? Number(v) : null;
  function paymentRow(n, i) {
    const mode = n.mode || (n.ratio != null ? '比例' : '金额');
    return '<tr data-deal-node><td>' + F('dealNodeName' + i, '收款阶段', n.name) + '</td><td>' + F('dealNodeMode' + i, '金额或比例', mode, { options: ['金额', '比例'], blank: null }) + '</td><td>' + F('dealNodeValue' + i, '金额／比例%', mode === '金额' ? n.amount : n.ratio, { type: 'number' }) + '</td><td>' + F('dealNodeDue' + i, '到期日', n.due || n.date || '', { type: 'date' }) + F('dealNodeTrigger' + i, '收款条件', n.trigger || '').replace('type="text"','type="text" placeholder="收款条件（选填）"') + '</td><td><button type="button" class="mice-link" data-deal-node-remove>删除</button></td></tr>';
  }
  function fields(p, a = {}, c = {}) {
    const pricing = c.pricing === 'quantity' && c.quantityKind === '预计' ? 'actual' : c.pricing || 'fixed';
    const nodes = c.nodes?.length ? c.nodes : [{ name: '订金', mode: '比例', ratio: 30, due: a.start || p.start }, { name: '尾款', mode: '比例', ratio: 70, due: a.end || p.end }];
    return '<div class="mice-deal-fields">' + SEC('客户已确认的成交', G(
      F('dealName', '订单服务名称', c.name || a.name || p.name, { full: true }) +
      F('dealPricing', '计价方式', pricing, { options: [{ value: 'fixed', label: '固定总价' }, { value: 'quantity', label: '确定数量 × 单价' }, { value: 'actual', label: '按实际数量最终定价' }], blank: null }) +
      F('dealCurrency', '币种', c.currency || 'CNY', { options: ['CNY', 'EUR', 'USD'], blank: null }) +
      '<div data-deal-pricing="fixed">' + F('dealAmount', '客户确认含税总价', c.amount ?? 30000, { type: 'number' }) + '</div>' +
      '<div data-deal-pricing="quantity actual">' + F('dealQuantity', '计价数量（按实际计价时为预计）', c.quantity ?? a.people ?? 60, { type: 'number' }) + '</div>' +
      '<div data-deal-pricing="quantity actual">' + F('dealUnitPrice', '客户确认含税单价', c.unitPrice ?? 500, { type: 'number' }) + '</div>' +
      '<div data-deal-pricing="quantity actual">' + F('dealUnit', '计量单位', c.unit || '人', { options: ['人', '场', '间夜', '次', '项', '辆天'], blank: null }) + '</div>' +
      F('dealScope', '约定服务及计价说明', c.rule || a.scope || p.scope || '按客户确认的服务内容执行', { type: 'textarea', full: true }) +
      F('dealFramework', '合同依据（选填）', c.frameworkId || '', { options: (p.frameworks || []).map(f => ({ value: f.id, label: (f.name || f.number || f.no) + ' · ' + f.status })) }) +
      F('dealConfirmBy', '客户确认人', c.confirmBy || '客户项目负责人（演示）') +
      F('dealConfirmDate', '客户确认日期', c.confirmDate || today(), { type: 'date' }) +
      F('dealBasis', '成交依据', c.basis || '客户已在线下确认本次服务及价格，确认单待归档（演示）', { type: 'textarea', full: true })
    ) + '<p class="mice-muted" data-deal-total></p>') +
    SEC('收款计划', '<div class="mice-table-wrap"><table class="mice-table mice-deal-nodes"><thead><tr><th>阶段</th><th>计算方式</th><th>金额／比例%</th><th>期限／条件</th><th>操作</th></tr></thead><tbody data-deal-nodes>' + nodes.map(paymentRow).join('') + '</tbody></table></div><button type="button" class="btn btn-secondary" data-deal-node-add>增加收款阶段</button><span class="mice-error" data-error="dealNodes"></span>') +
    '<details class="mice-deal-extra"><summary>计税参考与成交附件</summary>' + (window.MiceTaxUI?.salesFields(c, p) || '') + SEC('成交附件', window.MiceFiles?.html(c.attachments || [], 'dealFiles') || '') + '</details></div>';
  }
  function bind(form, p, c = {}) {
    const root = form.querySelector('.mice-deal-fields'); if (!root) return;
    const files = window.MiceFiles?.bind(root, c.attachments || [], 'dealFiles') || (() => []);
    let seq = root.querySelectorAll('[data-deal-node]').length;
    const update = () => {
      const v = Object.fromEntries(new FormData(form)), mode = v.dealPricing;
      root.querySelectorAll('[data-deal-pricing]').forEach(n => n.hidden = !n.dataset.dealPricing.split(' ').includes(mode));
      root.querySelector('label[for="mice-f-dealQuantity"]').textContent = mode === 'actual' ? '预计数量（最终按实际核定）' : '确定的计价数量';
      const amount = mode === 'actual' ? null : mode === 'quantity' ? M.round(Number(v.dealQuantity) * Number(v.dealUnitPrice)) : number(v.dealAmount);
      root.querySelector('[data-deal-total]').textContent = mode === 'actual' ? '订单金额待最终定价；按已确认单价和实际数量核定，预计金额不计入成交。' : '本次订单金额 ' + M.money(amount, v.dealCurrency) + '；费用预算不作为成交价格。';
      const fw=p.frameworks?.find(f=>f.id===v.dealFramework);
      if(fw?.nature==='上限'&&(amount==null||D.orders.some(o=>active(o)&&o.projectId===p.id&&o.frameworkId===fw.id&&o.amount==null)))root.querySelector('[data-deal-total]').textContent+=' 合同存在待定金额，上限余额待最终定价后核对。';
      window.MiceTaxUI?.updateSales(form, amount, v.dealCurrency);
      return amount;
    };
    root.querySelector('[data-deal-node-add]').onclick = () => { root.querySelector('[data-deal-nodes]').insertAdjacentHTML('beforeend', paymentRow({ name: '阶段款', mode: '比例', ratio: 0, due: p.end }, seq++)); };
    root.addEventListener('click', e => { if (e.target.closest('[data-deal-node-remove]')) e.target.closest('tr').remove(); });
    root.addEventListener('input', update); root.addEventListener('change', update); update();
    return { files, nodes: () => [...root.querySelectorAll('[data-deal-node]')].map(row => {
      const input = suffix => row.querySelector('[name^=dealNode' + suffix + ']').value;
      const mode = input('Mode'), value = number(input('Value'));
      return { name: input('Name'), mode, ratio: mode === '比例' ? value : null, amount: mode === '金额' ? value : null, due: input('Due'), trigger: input('Trigger') };
    }) };
  }
  function nodeAmounts(nodes, total) {
    const result = M.clone(nodes).map(n => ({...n, mode:n.mode || (n.ratio != null ? '比例' : '金额')}));
    for (const n of result) if (n.mode === '比例') n.amount = total == null ? null : M.round(total * n.ratio / 100);
    if (total != null && result.length && result.every(n => n.mode === '比例') && M.sum(result, 'ratio') === 100) result.at(-1).amount = M.round(total - M.sum(result.slice(0, -1)));
    return result;
  }
  function prepare(p, acts, v, binding, quoteId = '') {
    const errors = {}, mode = v.dealPricing, q = number(v.dealQuantity), price = number(v.dealUnitPrice);
    if (!editable(p)) errors.dealName = '项目已结束，请查看原订单';
    if (!acts.length || acts.some(a => a.projectId !== p.id || !['草稿','进行中'].includes(a.status))) errors.dealName = '请选择本项目尚未完成且未建单的子团';
    if (acts.some(a => ordersFor(a).length)) errors.dealName = '所选子团已有关联订单，请查看原订单，价格变化从原单办理';
    if (quoteId && !quotesFor(p, acts.map(a=>a.id)).some(c=>c.id===quoteId)) errors.dealName = '引用报价与本次订单覆盖范围不一致或已失效，请重新选择';
    if (D.commitments.some(c => c.projectId === p.id && c.status === '待审批' && c.activities.some(id => acts.some(a => a.id === id)))) errors.dealName = '所选子团已有审批中的成交，请继续原办理，避免重复建单';
    if (!['fixed', 'quantity', 'actual'].includes(mode)) errors.dealPricing = '请选择计价方式';
    const amount = mode === 'actual' ? null : mode === 'quantity' && q != null && price != null ? M.round(q * price) : number(v.dealAmount);
    if (mode === 'fixed' && (amount == null || amount < 0)) errors.dealAmount = '请填写有效非负成交总价';
    if (mode !== 'fixed' && (price == null || price < 0 || mode === 'quantity' && !(q > 0))) errors.dealUnitPrice = '请核对客户确认单价及计价数量';
    let nodes = binding.nodes();
    if (!nodes.length || nodes.some(n => !n.name || n.mode === '比例' && (n.ratio == null || n.ratio < 0) || n.mode === '金额' && (n.amount == null || n.amount < 0))) errors.dealNodes = '请核对收款阶段及金额／比例';
    nodes = nodeAmounts(nodes, amount);
    if (amount != null && M.sum(nodes) !== amount) errors.dealNodes = '收款阶段合计应等于订单金额 ' + M.money(amount, v.dealCurrency);
    if (amount == null && (!nodes.every(n => n.mode === '比例') || M.sum(nodes, 'ratio') !== 100)) errors.dealNodes = '最终总价待定时按比例约定阶段，合计100%；提前到账从原预收管理承接';
    const framework = p.frameworks?.find(f => f.id === v.dealFramework);
    if(v.dealFramework&&!framework)errors.dealFramework='合同依据已变化，请重新选择';
    if (framework && !['已签署', '已签归档', '已归档'].includes(framework.status)) errors.dealFramework = '请引用有效的已签合同';
    if (framework && acts.some(a => a.start < framework.start || a.end > framework.end)) errors.dealFramework = '本次服务日期未被合同期间覆盖';
    if (framework?.nature === '上限' && framework.amount != null) {
      const used = D.orders.filter(o => o.projectId === p.id && o.frameworkId === framework.id && active(o));
      if (framework.currency !== v.dealCurrency) errors.dealFramework = '合同和本次订单币种不同，请核对合同依据';
      else if (amount != null && used.every(o => o.amount != null) && M.round(M.sum(used) + amount) > framework.amount) errors.dealFramework = '本次成交超过合同上限，请核对有效合同';
    }
    const data = { projectId: p.id, name: v.dealName || acts.map(a => a.name).join('、'), customer: p.customer, company: p.company, currency: v.dealCurrency || 'CNY', amount, estimate: mode === 'actual' && q != null && price != null ? M.round(q * price) : null, activities: acts.map(a => a.id), nodes, status: amount == null ? '待结算确认' : '已确认', pricing: mode, quantity: mode === 'quantity' ? q : null, estimatedQuantity: q, unit: v.dealUnit, unitPrice: price, rule: v.dealScope || p.scope, basis: v.dealBasis, confirmationBasis: v.dealBasis, confirmBy: v.dealConfirmBy, confirmDate: v.dealConfirmDate, registeredBy: window.MiceAccess?.current().name || p.sales, source: '成交登记', version: 1, received: 0, invoiced: 0, contractNo: '', frameworkId: v.dealFramework || '', commitmentId: quoteId, taxEstimate: window.MiceTaxUI?.readSales(v) || { method: 'pending' }, attachments: binding.files(), responsiblePlanner: acts.length===1?acts[0].planner:'', history: [] };
    if(window.MiceTaxModel)Object.assign(errors,MiceTaxModel.salesErrors(data.taxEstimate,amount,D,p.company));
    return { errors, data };
  }
  function executionState(a) {
    const p=S.find('projects',a?.projectId),o=a&&ordersFor(a)[0];
    if(!a||!p)return {errors:{activity:'项目团不存在'}};
    const next={...a,...(o?{formationSource:'order:'+o.id}:{}),basis:a.basis||o?.confirmationBasis||o?.basis||'',scope:a.scope||(o?.activities.length===1?o.rule:'')||''};
    return {next,p,o,errors:M.validateActivity(next,p,'execute',D)};
  }
  function startExecution(a) {
    const state=executionState(a);
    if(!M.canAdvanceActivity(a,state.p,'进行中')||Object.keys(state.errors).length)return false;
    Object.assign(a,state.next,{status:'进行中',formation:{source:state.next.formationSource||'直接建团',basis:state.next.basis,by:window.MiceAccess?.current().name||state.p.owner,time:new Date().toLocaleString('zh-CN')}});
    return true;
  }
  function executionAction(a) {
    const p=S.find('projects',a.projectId);
    if(a.status==='草稿'&&editable(p))return B(executionState(a).errors.originalBudget?'核对成团预算':Object.keys(executionState(a).errors).length?'补齐执行资料':'确认成团','deal-execution',{id:a.id});
    return L('进入团控',U.activityUrl(a,{returnUrl:location.href}));
  }
  function continueExecution(id) {
    const a=S.find('activities',id),p=S.find('projects',a?.projectId);
    if(!a||!p)return;
    const enter=()=>{location.href=U.activityUrl(a,{returnUrl:location.href});};
    if(a.status!=='草稿'||!editable(p))return enter();
    if(!Object.keys(executionState(a).errors).length)return U.confirm('确认成团',a.name+'将进入进行中，可维护执行安排、报名名单和资源。此操作不生成订单或收款。',()=>{if(!startExecution(a))return U.toast('项目团状态或资料已变化，请重新查看','warning');S.log(p.id,'确认成团',a.name+'／进入进行中');refresh();enter();},'确认成团');
    const state=executionState(a),errors=state.errors,keys=new Set(Object.keys(errors));
    if(keys.has('start')||keys.has('end')){keys.add('start');keys.add('end');}
    const options={service:{options:['会议','旅游','会议加旅游']},start:{type:'date'},end:{type:'date'},planner:{options:D.catalog.staff.filter(s=>s.canPlan&&s.companies.includes(p.company)).map(s=>s.name)},people:{type:'number',step:'1'},scope:{type:'textarea',full:true},basis:{type:'textarea',full:true}};
    const labels={name:'项目团名称',service:'服务类型',start:'开始日期',end:'结束日期',city:'城市／地点',planner:'主责计调',people:'计划人数',scope:'本团服务范围',basis:'客户委托依据'},fields=[...keys].filter(k=>labels[k]);
    if(errors.originalBudget)return U.drawer('成团预算待核对',U.summary([['项目团',a.name],['客户订单',state.o?.id||'未创建订单']])+'<p>'+E(errors.originalBudget)+'</p>'+B('调整费用预算','budget-group-adjust',{id:a.id})+'<p class="mice-muted">人员额度或项目总预算不足时，请在单团项目列表的分工额度中调整，完成后再确认成团。</p>',{readonly:true,buttons:[]});
    if(!fields.length)return U.drawer('执行资料待核对',U.summary([['项目团',a.name]])+'<p>'+E(Object.values(errors).join('；'))+'</p>'+(state.o?L('查看原订单',orderUrl(state.o)):''),{readonly:true,buttons:[]});
    U.drawer('补齐执行资料',U.summary([['项目团',a.name],['客户订单',state.o?.id||'未创建订单'],['已登记的服务日期',(a.start||'待补')+' 至 '+(a.end||'待补')],['主责计调',a.planner||'待补']])+'<p class="mice-muted">只需补齐以下执行资料，原团号和已有订单保留。</p>'+G(fields.map(k=>F(k,labels[k],state.next?.[k]??'',options[k]||{})).join('')),{buttons:[['保存并进入团控','execute']],submit(v,i,x){
      if(a.status!=='草稿'||!editable(p))return x.errors({_submit:'团或订单状态已变化，请重新查看'});
      const candidate={...a,...Object.fromEntries(fields.map(k=>[k,k==='people'?M.num(v[k]):v[k]]))},next=executionState(candidate);
      if(Object.keys(next.errors).length)return x.errors(next.errors);
      Object.assign(a,next.next);if(!startExecution(a))return x.errors({_submit:'当前无法进入执行，请核对原订单'});
      S.log(p.id,'补齐资料进入执行',a.name+(next.o?'／'+next.o.id:''));x.close();refresh();enter();
    }});
  }
  function save(data, acts, options = {}) {
    if (acts.some(a => ordersFor(a).length)) throw Error('该子团已有关联订单，请查看原单');
    const o = { ...data, id: S.id('KS') };
    D.orders.push(o);
    acts.forEach(a => { a.formationSource = 'order:' + o.id; a.basis = a.basis || o.confirmationBasis; if(options.startExecution!==false)startExecution(a); });
    const c = S.find('commitments', o.commitmentId); if (c) c.orderId = o.id;
    o.history.push({ action: '登记成交并创建订单', by: o.registeredBy, date: o.confirmDate, basis: o.confirmationBasis, amount: o.amount });
    S.log(o.projectId, '登记成交并创建订单', o.id + '／' + o.name + '／' + (o.amount == null ? '按实际数量最终定价' : M.money(o.amount, o.currency)));
    return o;
  }
  function result(o, title = '订单已创建') {
    const p = S.find('projects', o.projectId), acts = o.activities.map(id => S.find('activities', id));
    U.drawer(title, U.summary([['订单号', o.id], ['客户', o.customer], ['订单金额', M.money(o.amount, o.currency)], ['订单状态',o.status], ['已收款',M.money(o.received||0,o.currency)], ['待收款',M.money(o.amount==null?null:Math.max(0,o.amount-(o.received||0)),o.currency)], ['计价方式', o.pricing === 'actual' ? '按实际数量最终定价' : o.pricing === 'quantity' ? '确定数量 × 单价' : '固定总价']]) + '<div class="mice-toolbar">' + L('查看订单', orderUrl(o)) + L('收款计划', orderUrl(o, 'receivable')) + L('收款认领',collectionUrl(o)) + '</div>' + SEC('关联项目团', U.table(['项目团', '执行阶段', '操作'], acts.map(a => [E(a.name), E(a.status), executionAction(a)]))) + '<p class="mice-muted">成交已登记；资料齐全的项目团已进入进行中，可继续安排人员、资源和交付。缺项只需补齐执行资料。创建订单不代表已收款或服务已完成。</p>', { readonly: true, buttons: [] });
  }
  // Only a quote covering exactly this order can supply its price and payment terms.
  function quotesFor(p, ids) {
    const scope = [...ids].sort().join('|');
    return D.commitments.filter(c => c.projectId === p.id && ['草稿','已报价','已确认'].includes(c.status)
      && [...c.activities].sort().join('|') === scope
      && !D.orders.some(o => active(o) && o.commitmentId === c.id));
  }
  function batchErrors(p, prepared) {
    const errors = [];
    for (const f of p.frameworks || []) {
      if (f.nature !== '上限' || f.amount == null) continue;
      const rows = [...D.orders.filter(o => active(o) && o.projectId === p.id && o.frameworkId === f.id),
        ...prepared.map(r => r.data).filter(o => o.frameworkId === f.id)];
      if (rows.every(o => o.amount != null && o.currency === f.currency) && M.round(M.sum(rows)) > f.amount)
        errors.push((f.name || f.number || '合同') + '：本批合计超过合同上限');
    }
    return errors;
  }
  function open(pid, aid = '', quoteId = '', groupIds = null) {
    const p = S.find('projects', pid); if (!editable(p)) return U.toast('项目已结束，请查看原订单', 'warning');
    const a = S.find('activities', aid), quote = S.find('commitments', quoteId);
    if (a && ordersFor(a).length) return result(ordersFor(a)[0], '已有客户订单');
    const used = quote && D.orders.find(o => active(o) && o.commitmentId === quote.id);
    if (used) return result(used, '已有客户订单');
    const ids = quote ? quote.activities : a ? [a.id] : groupIds || available(p).slice(0,1).map(a => a.id);
    orderWorkspace(p, ids, { quoteId, mode: ids.length > 1 ? 'package' : 'each' });
  }
  function batch(pid) {
    const p = S.find('projects', pid), selected = /product-custom-detail\.html$/.test(location.pathname) ? window.MiceProjectDetail?.selected : window.MiceWork?.selected;
    if (!editable(p) || !selected?.size) return U.toast('请先选择需要建单的项目团', 'warning');
    orderWorkspace(p, [...selected]);
  }
  function orderWorkspace(p, ids, options = {}) {
    const rows = ids.map(id => S.find('activities', id));
    if (!rows.length || rows.some(a => !a || a.projectId !== p.id || !['草稿','进行中'].includes(a.status) || ordersFor(a).length))
      return U.toast('请仅选择本项目尚未完成、未建单的项目团；已有订单继续原单办理', 'warning');
    if (D.commitments.some(c => c.projectId === p.id && c.status === '待审批' && c.activities.some(id => ids.includes(id))))
      return U.toast('所选项目团有审批中的成交，请继续原办理', 'warning');
    const multiple = rows.length > 1, states = new Map();
    const packageQuote = quotesFor(p, ids).at(-1);
    let mode = multiple ? options.mode || (packageQuote ? 'package' : 'each') : 'each', current = rows[0].id, binding, form, context;
    const stateKey = () => mode === 'package' ? 'package' : current;
    const scopeFor = key => key === 'package' ? rows : [rows.find(a => a.id === key)];
    function newState(key, quoteId) {
      const acts = scopeFor(key), choices = quotesFor(p, acts.map(a => a.id));
      const quote = quoteId === '' ? null : choices.find(c => c.id === quoteId) || choices.at(-1);
      const seed = quote ? M.clone(quote) : {};
      // A quotation remark is not evidence that the customer has agreed to buy.
      if (quote && quote.status !== '已确认') { seed.basis = ''; seed.confirmBy = ''; seed.confirmDate = ''; }
      const a = acts.length === 1 ? acts[0] : { name: acts.map(a => a.name).join('、'), start: p.start, end: p.end, people: acts.reduce((n,a) => n + (a.people || 0), 0), scope: p.scope };
      const draft = document.createElement('form'); draft.innerHTML = fields(p, a, seed);
      const values = Object.fromEntries(new FormData(draft));
      const nodes = seed.nodes?.length ? M.clone(seed.nodes) : [{name:'订金',mode:'比例',ratio:30,due:a.start||p.start},{name:'尾款',mode:'比例',ratio:70,due:a.end||p.end}];
      return { a, seed, values, nodes, files: M.clone(seed.attachments || []), quoteId: quote?.id || '', error: '' };
    }
    for (const a of rows) states.set(a.id, newState(a.id, options.quoteId || undefined));
    if (multiple) states.set('package', newState('package', options.quoteId || undefined));
    const amountOf = state => state.values.dealPricing === 'actual' ? null : state.values.dealPricing === 'quantity'
      ? M.round(Number(state.values.dealQuantity) * Number(state.values.dealUnitPrice)) : number(state.values.dealAmount);
    function capture() {
      if (!binding) return;
      const state = states.get(stateKey());
      state.values = Object.fromEntries(new FormData(form)); state.nodes = binding.nodes(); state.files = binding.files(); state.error = '';
    }
    function overview() {
      const host = form.querySelector('[data-order-overview]');
      if (!multiple) { host.innerHTML = U.summary([['项目团',rows[0].name],['执行状态',rows[0].status]]); return; }
      host.innerHTML = mode === 'package' ? U.summary([['覆盖项目团',rows.map(a=>a.name).join('、')],['本次创建','1笔订单']])
        : U.table(['项目团','本团订单金额','收款计划','操作'],rows.map(a=>{
          const state=states.get(a.id), quote=S.find('commitments',state.quoteId);
          return [U.lines(E(a.name),quote?E('报价 '+quote.id+' · V'+(quote.version||1)):''),
            M.money(amountOf(state),state.values.dealCurrency),E(state.nodes.map(n=>n.name).join('／')),
            '<button type="button" class="mice-link" data-order-edit="'+E(a.id)+'" aria-pressed="'+(current===a.id)+'">'+(current===a.id?'当前编辑':'编辑')+'</button>'+(state.error?'<span class="mice-error">'+E(state.error)+'</span>':'')];
        }),'mice-order-review');
      const count = mode === 'package' ? 1 : rows.length;
      form.querySelector('button[value=create]').textContent = '创建'+count+'笔订单'+(rows.some(a=>a.status==='草稿')?'并成团':'');
    }
    function mount() {
      const state = states.get(stateKey()), acts = scopeFor(stateKey()), choices = quotesFor(p, acts.map(a=>a.id));
      form.querySelector('[data-order-editor]').innerHTML = (multiple && mode==='each'?'<div class="mice-order-edit-title">'+E(state.a.name)+'</div>':'')
        + (choices.length?F('orderQuote','引用报价',state.quoteId,{options:[{value:'',label:'直接填写成交价'},...choices.map(c=>({value:c.id,label:c.name+' · V'+(c.version||1)+' · '+M.money(c.amount,c.currency)}))],blank:null,full:true}):'')
        + fields(p,state.a,{...state.seed,nodes:state.nodes,attachments:state.files});
      for (const [name,value] of Object.entries(state.values)) {
        const input=form.elements[name]; if(input && input.type!=='file' && name!=='orderQuote' && name!=='orderMode') input.value=value;
      }
      binding=bind(form,p,{...state.seed,attachments:state.files});
      form.querySelector('[name=orderQuote]')?.addEventListener('change',()=>{
        const quoteId=form.elements.orderQuote.value; states.set(stateKey(),newState(stateKey(),quoteId)); mount(); overview();
      });
      overview();
    }
    const chooser=multiple?'<fieldset class="mice-order-mode"><legend>建单方式</legend><label><input type="radio" name="orderMode" value="each" '+(mode==='each'?'checked':'')+'>每团一单</label><label><input type="radio" name="orderMode" value="package" '+(mode==='package'?'checked':'')+'>多团合并一单</label></fieldset>':'';
    U.drawer('创建订单',U.summary([['所属项目',p.name],['客户',p.customer],['销售',p.sales]])+chooser+'<div data-order-overview></div><div data-order-editor></div>',{
      wide:true,buttons:[[rows.some(a=>a.status==='草稿')?'创建订单并成团':'创建订单','create']],
      onOpen(x){
        context=x;form=x.form;mount();x.setClean();
        form.querySelectorAll('[name=orderMode]').forEach(input=>input.addEventListener('change',()=>{capture();mode=input.value;mount();context.errors({});}));
        form.querySelector('[data-order-overview]').addEventListener('click',e=>{const button=e.target.closest('[data-order-edit]');if(!button)return;capture();current=button.dataset.orderEdit;mount();context.errors({});});
        form.querySelector('[data-order-editor]').addEventListener('input',()=>{capture();overview();});
        form.querySelector('[data-order-editor]').addEventListener('change',()=>{capture();overview();});
      },
      submit(v,intent,x){
        capture();
        const keys=mode==='package'?['package']:rows.map(a=>a.id);
        const prepared=keys.map(key=>{const state=states.get(key);return{key,...prepare(p,scopeFor(key),state.values,{nodes:()=>state.nodes,files:()=>state.files},state.quoteId)};});
        prepared.forEach(r=>states.get(r.key).error=Object.values(r.errors).join('；'));
        const invalid=prepared.find(r=>Object.keys(r.errors).length);
        if(invalid){if(mode==='each')current=invalid.key;mount();overview();return x.errors(invalid.errors);}
        const errors=batchErrors(p,prepared);if(errors.length)return x.errors({_submit:errors.join('；')});
        const orders=prepared.map(r=>save(r.data,scopeFor(r.key)));
        rows.forEach(a=>{window.MiceProjectDetail?.selected?.delete(a.id);window.MiceWork?.selected?.delete(a.id);});
        x.close();refresh();
        if(orders.length===1)return result(orders[0]);
        U.drawer('订单已创建',U.table(['项目团','订单','订单金额','已收／待收','下一步'],orders.map(o=>[
          E(o.name),L(E(o.id),orderUrl(o)),M.money(o.amount,o.currency),U.lines('已收 '+M.money(o.received||0,o.currency),'待收 '+M.money(o.amount,o.currency)),
          L('收款计划',orderUrl(o,'receivable'))+L('收款认领',collectionUrl(o))
        ])),{readonly:true,buttons:[]});
      }
    });
  }
  const collectionUrl=o=>U.url('merchant/sales/payment-claim.html',{mice:1,projectId:o.projectId,orderNo:o.id});
  function groupCell(a) {
    const rows = ordersFor(a);
    const quote=D.commitments.filter(c=>c.projectId===a.projectId&&c.activities.includes(a.id)&&['草稿','已报价'].includes(c.status)).at(-1);
    return rows.length ? rows.map(o => L(E(o.id), orderUrl(o)) + '<br><span class="mice-muted">' + E(o.activities.length > 1 ? '整包覆盖' + o.activities.length + '团 · ' : '') + E(o.amount == null ? '已建单 · 待最终定价' : M.money(o.amount, o.currency)) + '</span>').join('<br>')+(a.status==='草稿'?'<br><span class="mice-muted">已有订单 · '+(Object.keys(executionState(a).errors).length?'执行资料待补':'待确认成团')+'</span>':'') : (quote?A('报价'+' · '+M.money(quote.amount,quote.currency),'agreement-view',quote.id)+'<br>':'')+'<span class="mice-muted">未创建订单</span>';
  }
  function groupAction(a) {
    const p = S.find('projects', a.projectId);
    return editable(p) && ['草稿','进行中'].includes(a.status) && !ordersFor(a).length ? A('创建订单', 'deal-new', a.id) : '';
  }
  function projectSection(p) {
    const rows = D.orders.filter(o => o.projectId === p.id && active(o));
    return SEC('客户订单', U.table(['订单／服务', '覆盖子团', '成交金额', '收款', '操作'], rows.map(o => [U.lines(E(o.id), E(o.name || o.rule || p.name)), E(o.activities.map(id => S.find('activities', id)?.name || id).join('、')), U.lines(M.money(o.amount, o.currency), o.activities.length > 1 ? '整包成交，只计一次' : o.amount == null ? '按实际数量最终定价' : ''), U.lines('已认款 ' + M.money(o.received || 0, o.currency), '待收 ' + M.money(o.amount == null ? null : M.round(o.amount - (o.received || 0)), o.currency)), L('详情', orderUrl(o)) + (o.amount == null && editable(p) ? A('最终定价', 'deal-final', o.id) : '')])) + (!rows.length ? '<p class="mice-muted">客户已确认服务及价款时可直接创建订单，无需先建立报价单。</p>' : ''), editable(p) && available(p).length ? B('创建订单', 'deal-project-new', { project: p.id }, true) : '');
  }
  function finalPrice(id) {
    const o = S.find('orders', id), p = S.find('projects', o?.projectId), c = S.find('commitments', o?.commitmentId);
    if (!o || !active(o) || !editable(p) || o.amount != null || !['actual', 'quantity'].includes(o.pricing || c?.pricing)) return U.toast('当前订单无需最终定价，请查看原单或办理改价', 'warning');
    if (D.settlements.some(r => r.projectId === p.id && ['审批中', '已确认'].includes(r.status) && r.activities.some(id => o.activities.includes(id)))) return U.toast('关联结算已提交，请先处理原结算后核定价款', 'warning');
    const unitPrice = o.unitPrice ?? c?.unitPrice, unit = o.unit || c?.unit || '人', recognition = (D.customerSettlements || []).flatMap(r => r.lines || []).find(l => l.orderId === o.id && l.quantity != null);
    const originalNodes = o.nodes?.length ? M.clone(o.nodes) : [{name:'服务款',mode:'比例',ratio:100,due:p.end}];
    U.drawer('确认订单最终价款', U.summary([['原订单', o.id], ['客户', o.customer], ['已确认单价', M.money(unitPrice, o.currency) + '／' + unit], ['确认依据', o.confirmationBasis || c?.basis || '原报价资料']]) + G(F('actualQuantity', '客户认可的实际数量（' + unit + '）', recognition?.quantity ?? o.estimatedQuantity ?? o.activities.reduce((s, id) => s + (S.find('activities', id)?.confirmedPeople || S.find('activities', id)?.people || 0), 0), { type: 'number' }) + F('finalDate', '确认日期', today(), { type: 'date' }) + F('finalBy', '客户确认人', o.confirmBy || c?.confirmBy || '客户项目负责人（演示）') + F('finalBasis', '实际数量及价款确认依据', '客户已认可实际服务数量，结算确认资料（演示）', { type: 'textarea', full: true })) + '<div data-final-preview></div>'+SEC('核对收款计划',U.table(['阶段','最终应收金额','期限／约定'],originalNodes.map((n,i)=>[E(n.name),F('finalNode'+i,'阶段金额',n.amount??0,{type:'number',readonly:n.mode==='比例'}),E(n.due||n.date||n.trigger||'待确认')]))+'<p class="mice-muted">比例阶段按最终金额重算；原来约定固定金额的阶段可在这里核对。合计须等于最终价款。</p>')+'<span class="mice-error" data-error="finalTotal"></span>', { wide: true, buttons: [['确认最终价款', 'final']], onOpen({ form }) {
      const update = () => {
        const q = number(form.elements.actualQuantity.value), computed = q == null || unitPrice == null ? null : M.round(q * unitPrice), nodes = nodeAmounts(originalNodes, computed);
        nodes.forEach((n,i)=>{if(n.mode==='比例'||nodes.length===1)form.elements['finalNode'+i].value=n.mode==='比例'?n.amount??'':computed??'';});
        form.querySelector('[data-final-preview]').innerHTML = SEC('核定结果', U.summary([['原订单最终金额', M.money(computed, o.currency)], ['计价', (q ?? '待确认') + ' × ' + M.money(unitPrice, o.currency)]])) + '<p class="mice-muted">确认后更新同一订单，保留原单价及历史依据；不生成新订单，不增加已收款。</p>';
      };
      form.elements.actualQuantity.addEventListener('input', update); update();
    }, submit(v, intent, x) {
      if(!active(o)||!editable(p)||D.settlements.some(r=>r.projectId===p.id&&['审批中','已确认'].includes(r.status)&&r.activities.some(id=>o.activities.includes(id))))return x.errors({finalTotal:'订单或结算状态已变化，请关闭后重新核对'});
      if (o.amount != null) return x.errors({ finalTotal: '订单已完成定价，请刷新查看原单' });
      const q = number(v.actualQuantity), price = number(unitPrice), amount = q == null || price == null ? null : M.round(q * price), nodes = nodeAmounts(originalNodes, amount).map((n,i)=>({...n,amount:n.mode==='比例'?n.amount:number(v['finalNode'+i])}));
      if (q == null || q < 0 || price == null || price < 0 || amount == null) return x.errors({ actualQuantity: '请核对有效的实际数量及原约定单价' });
      if (!nodes.length || nodes.some(n=>n.amount==null||n.amount<0||n.amount<(n.received||0)) || M.sum(nodes) !== amount) return x.errors({ finalTotal: '原收款计划与最终金额不一致，请核对下方各收款阶段' });
      if ((o.received || 0) > amount || (o.invoiced || 0) > amount) return x.errors({ finalTotal: '最终价款小于已有收款或开票，请先核对退款及原票据' });
      const framework=p.frameworks?.find(f=>f.id===o.frameworkId), others=D.orders.filter(row=>row.id!==o.id&&active(row)&&row.projectId===p.id&&row.frameworkId===o.frameworkId);
      if(framework?.nature==='上限'&&framework.amount!=null&&framework.currency===o.currency&&M.round(M.sum(others)+amount)>framework.amount)return x.errors({finalTotal:'最终价款加已有成交超过合同上限，请先核对有效合同依据'});
      o.finalPricing = { quantity: q, unitPrice: price, amount, date: v.finalDate, confirmBy: v.finalBy, basis: v.finalBasis, by: window.MiceAccess?.current().name || p.sales };
      o.amount = amount; o.quantity = q; o.nodes = nodes; o.status = '已确认'; o.version = (o.version || 1) + 1;
      (o.history ||= []).push({ action: '确认最终价款', ...o.finalPricing });
      S.log(p.id, '确认订单最终价款', o.id + '／' + M.money(amount, o.currency)); x.close(); refresh(); result(o, '最终价款已确认');
    } });
  }
  function detail(o) {
    const c = S.find('commitments', o.commitmentId), p = S.find('projects', o.projectId);
    return SEC('成交依据', U.summary([['成交来源', o.source || '原报价确认'], ['服务内容', o.rule || c?.rule || p.scope], ['客户确认人', o.confirmBy || c?.confirmBy || '历史资料'], ['确认日期', o.confirmDate || c?.confirmDate || '历史资料'], ['登记经办人', o.registeredBy || c?.quoteOwner || p.sales], ['合同依据', p.frameworks?.find(f=>f.id===o.frameworkId)?.number || p.frameworks?.find(f=>f.id===o.frameworkId)?.name || '按本次成交资料办理'], ['依据', o.confirmationBasis || c?.basis || '历史客户确认资料'], ['计价方式', (o.pricing || c?.pricing) === 'actual' ? '按实际数量' : (o.pricing || c?.pricing) === 'quantity' ? '确定数量 × 单价' : '固定总价']]) + (o.amount == null ? '<p class="mice-muted">最终金额待定，当前不按预计金额计收入。提前到账由原预收管理承接，最终定价后继续本订单收款认领。</p>' : '') + (o.finalPricing ? U.summary([['最终数量', o.finalPricing.quantity], ['最终价款', M.money(o.finalPricing.amount, o.currency)], ['最终确认依据', o.finalPricing.basis]]) : '') + ((o.attachments || []).length ? B('查看成交附件','deal-files',{id:o.id}) : ''), o.amount == null && editable(p) ? B('确认最终价款', 'deal-final', { id: o.id }, true) : '');
  }
  function collectionPlan(p) {
    const orders = D.orders.filter(o => o.projectId === p.id && active(o));
    return SEC('收款计划', U.table(['订单／服务', '阶段／期限', '应收金额', '财务已认款', '待收'], orders.flatMap(o => (o.nodes || []).map(n => [U.lines(L(E(o.id), orderUrl(o, 'receivable')), E(o.name || p.name)), U.lines(E(n.name), E(n.due || n.date || n.trigger || '待确定')), M.money(n.amount, o.currency), M.money(n.received || 0, o.currency), M.money(n.amount == null ? null : M.round(n.amount - (n.received || 0)), o.currency)]))), L('收款认领与分配', U.url('merchant/sales/payment-claim.html', { mice: 1, projectId: p.id })) + L('预收管理', U.url('merchant/finance/finance-advance-receipts.html')));
  }
  Object.assign(U.actions, {
    'deal-batch': ({project}) => batch(project),
    'deal-files': ({id}) => { const o=S.find('orders',id); if(o)U.drawer('成交附件',MiceFiles.html(o.attachments),{readonly:true,buttons:[],onOpen({el}){MiceFiles.bind(el,o.attachments);el.querySelector('[data-mice-files] > input').remove();el.querySelector('[data-mice-files] > p').remove();el.querySelectorAll('[data-file-remove]').forEach(n=>n.remove());}}); },
    'deal-new': ({ id, project }) => { const a = S.find('activities', id); open(project || a?.projectId, id); },
    'deal-project-new': ({ project }) => open(project),
    'deal-from-quote': ({ id }) => open(S.find('commitments', id)?.projectId, '', id),
    'deal-final': ({ id }) => finalPrice(id),
    'deal-execution':({id})=>continueExecution(id),
    'deal-form-group':({id})=>continueExecution(id)
  });
  window.MiceOrderEntry = { quotesFor, batchErrors, executionState, startExecution, executionAction, continueExecution, fields, bind, prepare, save, result, open, ordersFor, groupCell, groupAction, projectSection, detail, collectionPlan, finalPrice, orderUrl };
})();
