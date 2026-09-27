/* P0-5：仅供团期订单两页使用的独立原型；处理结果保留在本页，不自动回写客户订单或财务。 */
(function () {
  'use strict';
  const companies = { fj: '福建凯撒旅游有限公司', bj: '北京凯撒旅游有限公司' };
  const examples = {
    KSIC260901: { no: 'KSIC260901', sales: 'fj', fulfillment: 'bj', product: '西藏深度探索7日', schedule: 'BJ-XZ-20261015', date: '2026-10-15', end: '2026-10-21', customer: '林晓', companion: '林晨', owner: '软件园门店 / 王芳', channel: '门店', status: '已确认', resource: '已确认', contract: '已签署' },
    KSIC260902: { no: 'KSIC260902', sales: 'bj', fulfillment: 'fj', product: '福建闽南文化5日', schedule: 'FJ-MN-20261022', date: '2026-10-22', end: '2026-10-26', customer: '陈悦', companion: '陈宁', owner: '呼叫中心 / 陈刚', channel: '电销', status: '待确认', resource: '待确认', contract: '待生成' }
  };
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const company = key => companies[key];
  function currentCompany() {
    const ctx = typeof window.caesarCompanyContext === 'function' ? window.caesarCompanyContext() : {};
    return Object.keys(companies).find(key => ctx.company === companies[key] || ctx.company === companies[key].replace('旅游有限公司', '')) || '';
  }
  function related(order) { const id = currentCompany(); return !!order && (id === order.sales || id === order.fulfillment); }
  function detailHref(order) { return 'schedule-orders-detail.html?orderNo=' + encodeURIComponent(order.no); }
  function salesHref(order) { return '../sales/orders-detail.html?orderNo=' + encodeURIComponent(order.no); }
  function appendRows(host) {
    Object.values(examples).forEach(order => {
      if (host.querySelector('[data-order-no="' + order.no + '"]')) return;
      const row = document.createElement('tr');
      row.className = 'orders-normalized-row';
      Object.assign(row.dataset, { intercompany: 'true', orderNo: order.no, productType: '参团游', productName: order.product,
        productSource: '标准产品', channel: order.channel, store: order.channel === '门店' ? '软件园门店' : '', advisor: order.owner.split(' / ')[1],
        scheduleNo: order.schedule, travelDate: order.date, customer: order.customer, people: '2', orderStatus: order.status,
        paymentStatus: '未收款', contractStatus: order.contract, docStatus: '待补资料', resourceStatus: order.resource === '已确认' ? '资源已确认' : '资源待确认',
        tabStatus: order.status + ' 未收款', search: [order.no, order.product, order.schedule, order.customer, order.owner, company(order.sales), company(order.fulfillment), '集团内跨主体'].join(' ') });
      const href = detailHref(order);
      row.innerHTML = '<td class="orders-select-cell"><input type="checkbox" disabled aria-label="跨主体订单在详情中办理" title="跨主体订单在详情中办理"></td>' +
        '<td class="orders-order-cell"><a class="link-primary table-main-link" href="' + href + '">' + order.no + '</a><span class="orders-customer-line">' + esc(order.customer) + ' / 2人</span><span class="text-muted">关联销售订单</span></td>' +
        '<td class="orders-product-cell"><a class="link-primary table-main-link" href="' + href + '">' + esc(order.product) + '</a><span class="orders-plan-line">参团游 · ' + esc(order.date) + '出发</span><span class="text-muted">' + esc(order.schedule) + '</span></td>' +
        '<td class="orders-source-cell"><strong>' + esc(order.channel + ' · ' + order.owner) + '</strong><span class="text-muted ic-source-company">销售公司：' + esc(company(order.sales)) + '</span></td>' +
        '<td class="orders-status-cell"><span class="tag ' + (order.status === '已确认' ? 'tag-green' : 'tag-orange') + '">' + esc(order.status) + '</span></td>' +
        '<td class="orders-amount-cell"><strong>对客金额 ¥11,360</strong><span class="text-muted">由销售公司办理</span></td>' +
        '<td class="orders-docs-cell"><strong>' + esc(order.contract) + '</strong><span class="text-muted">' + esc(row.dataset.resourceStatus) + ' · 名单待核验</span></td>' +
        '<td class="orders-action-cell"><div class="table-action"><a class="table-action-primary" href="' + href + '">详情</a></div></td>';
      host.appendChild(row);
    });
  }
  const grid = items => '<div class="description-grid order-overview-grid">' + items.map(([name, value, html]) => '<div class="description-item"><span class="description-label">' + esc(name) + '</span><span class="description-value">' + (html ? value : esc(value)) + '</span></div>').join('') + '</div>';
  const button = (action, label) => '<button class="btn btn-secondary" type="button" data-ic-edit="' + action + '">' + label + '</button>';
  const field = (label, control) => '<label class="form-group"><span class="form-label">' + label + '</span>' + control + '</label>';
  const input = (name, value, extra = '') => '<input class="form-control" name="' + name + '" value="' + esc(value) + '" ' + extra + '>';
  const select = (name, values, selected) => '<select class="form-control" name="' + name + '">' + values.map(value => '<option' + (value === selected ? ' selected' : '') + '>' + value + '</option>').join('') + '</select>';
  function renderDetail() {
    const order = examples[new URLSearchParams(location.search).get('orderNo')];
    if (!order) return false;
    const main = document.querySelector('main.order-detail-page');
    // 此分支不挂载普通订单的收款、改价及通用保存处理器。
    document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
    const state = { resource: order.resource, reference: order.resource === '已确认' ? '团期实时可售，2个名额已确认' : '',
      travelers: [order.customer, order.companion].map(name => ({ name, checked: '待核验', arrangement: '' })),
      supplements: [], execution: '未出行', actualDate: '', result: '', logs: [], tab: 'overview' };
    let action = '', dirty = false;
    const editable = () => related(order) && currentCompany() === order.fulfillment && state.execution !== '已完成';
    const drawer = document.createElement('div');
    drawer.id = 'icWorkDrawer'; drawer.className = 'modal-overlay drawer-overlay'; drawer.hidden = true; drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = '<section class="modal drawer-modal drawer-md" role="dialog" aria-modal="true" aria-labelledby="icWorkTitle"><div class="modal-header"><div id="icWorkTitle" class="modal-title"></div><button class="modal-close" type="button" data-ic-close aria-label="关闭">×</button></div><div class="modal-body"><p id="icWorkContext" class="text-muted"></p><form id="icWorkForm"></form><p id="icWorkError" class="text-danger" role="alert"></p></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-ic-close>取消</button><button id="icWorkSave" class="btn btn-primary" type="button">保存</button></div></section>';
    document.body.appendChild(drawer);
    function hideDrawer(force) {
      if (!force && dirty && !window.confirm('当前内容未保存，确认离开吗？')) return;
      dirty = false; action = ''; window.caesarUI.closeLayer(drawer);
    }
    function draw() {
      main.classList.add('ic-fulfillment-page'); main.id = 'icFulfillment';
      const allowed = related(order), canEdit = editable();
      const sourceOrder = currentCompany() === order.sales ? '<a href="' + salesHref(order) + '" class="link-primary">' + order.no + '</a>' : order.no;
      const heading = '<section class="page-workbar"><div class="page-title-row"><a class="page-back-link" href="schedule-orders.html">返回</a><h1 class="page-title">团期订单详情</h1></div></section>';
      if (!allowed) { main.innerHTML = heading + '<section class="card ic-no-access"><h2 class="detail-section-title">当前公司与本单无履约或销售关系</h2><p>请切换到有权查看本单的公司节点。</p></section>'; return; }
      const stage = state.execution === '已完成' ? '已完成' : state.resource === '无位' ? '资源无位' : state.resource !== '已确认' ? '待资源确认' : state.execution === '出行中' ? '出行中' : '待出行';
      main.innerHTML = heading +
        '<section class="card ic-order-summary"><div class="ic-summary-top"><div><strong id="orderNo">' + order.no + '</strong><h2 id="orderProductName">' + esc(order.product) + '</h2><p class="text-muted">' + esc(order.schedule + ' / ' + order.date + ' 至 ' + order.end + ' / 2人') + '</p></div><div><span class="text-muted">履约状态</span><p id="icExecutionStatus"><span class="tag tag-blue">' + stage + '</span></p></div></div>' +
        grid([['联系人', order.customer], ['关联订单状态', order.status], ['对客成交金额', '¥11,360（销售公司办理）'], ['当前查看范围', currentCompany() === order.fulfillment ? '履约公司' : '销售公司 · 履约只读']]) + '</section>' +
        '<section class="card detail-tabs-card product-detail-unified-tabs"><nav class="tab-bar" aria-label="团期订单详情">' + [['overview','订单概览'],['travelers','游客名单'],['resources','资源安排'],['supplements','补差依据'],['execution','执行结果']].map(([id,label]) => '<button class="tab-item' + (state.tab === id ? ' active' : '') + '" type="button" data-ic-tab="' + id + '">' + label + '</button>').join('') + '</nav>' +
        panel('overview', '<h2 class="detail-section-title">跨主体订单来源</h2>' + grid([['来源销售公司',company(order.sales)],['关联销售订单',sourceOrder,true],['实际履约公司',company(order.fulfillment)],['来源门店／销售组',order.owner]]) + '<h2 class="detail-section-title">履约进度</h2>' + grid([['资源确认',state.resource],['名单核验',state.travelers.filter(x=>x.checked==='已核验').length + '/2人'],['补差依据',state.supplements.length ? state.supplements.length + '笔待销售方确认' : '无'],['执行结果',state.execution]])) +
        panel('travelers', sectionHead('游客名单',canEdit ? button('travelers','维护名单') : '') + table(['游客','证件核验','房型／交通安排'], state.travelers.map(x=>[x.name,x.checked,x.arrangement || '待安排']))) +
        panel('resources', sectionHead('本单资源',canEdit ? button('resources','确认资源') : '') + grid([['关联团期',order.schedule],['申请人数','2人'],['资源结果',state.resource],['已确认名额',state.resource==='已确认'?'2人':'0人'],['确认依据',state.reference || '待履约方确认']])) +
        panel('supplements', sectionHead('供货补差依据',canEdit ? button('supplements','提交补差') : '') + '<p class="text-muted">补差由' + esc(company(order.sales)) + '核对；对客金额调整在销售订单办理。</p>' + table(['事项','补差金额','依据','处理状态'],state.supplements.map(x=>[x.item,'¥'+x.amount.toLocaleString('zh-CN',{minimumFractionDigits:2}),x.basis,'待销售方确认']), '暂无补差依据。')) +
        panel('execution', sectionHead('执行结果',canEdit ? button('execution','登记结果') : '') + grid([['执行状态',state.execution],['实际服务日期',state.actualDate || '未登记'],['结果说明',state.result || '未登记']]) + '<h2 class="detail-section-title">处理记录</h2>' + table(['时间','处理公司','结果'],state.logs,'暂无处理记录。')) + '</section>';
    }
    function panel(id, content) { return '<section class="detail-tab-panel' + (state.tab === id ? ' active' : '') + '" data-ic-panel="' + id + '"><div class="product-detail-tab-inner">' + content + '</div></section>'; }
    function sectionHead(title, control) { return '<div class="ic-section-head"><h2 class="detail-section-title">' + title + '</h2>' + control + '</div>'; }
    function table(headers, rows, empty = '暂无记录。') { return '<div class="table-wrap order-detail-table"><table><thead><tr>' + headers.map(x=>'<th>'+esc(x)+'</th>').join('') + '</tr></thead><tbody>' + (rows.length ? rows.map(row=>'<tr>'+row.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('') : '<tr><td colspan="'+headers.length+'" class="table-empty-cell">'+empty+'</td></tr>') + '</tbody></table></div>'; }
    function openWork(kind) {
      if (!editable()) return;
      const titles = {resources:'确认资源',travelers:'维护名单',supplements:'提交补差',execution:'登记结果'};
      if (!titles[kind]) return;
      action = kind; dirty = false;
      document.getElementById('icWorkTitle').textContent = titles[kind];
      document.getElementById('icWorkContext').textContent = order.no + ' / ' + order.schedule + ' / ' + company(order.fulfillment);
      document.getElementById('icWorkError').textContent = '';
      document.getElementById('icWorkSave').textContent = kind === 'supplements' ? '提交依据' : '保存';
      let fields = '';
      if (kind === 'resources') fields = field('资源结果',select('resource',['待确认','已确认','无位'],state.resource)) + field('确认依据 / 无位原因', '<textarea class="form-control" name="reference" rows="3" required>'+esc(state.reference)+'</textarea>');
      if (kind === 'travelers') fields = state.travelers.map((x,i)=>'<h3 class="detail-section-title">'+esc(x.name)+'</h3>'+field('证件核验',select('checked'+i,['待核验','已核验'],x.checked))+field('房型 / 交通安排',input('arrangement'+i,x.arrangement,'placeholder="填写本单出行安排"'))).join('');
      if (kind === 'supplements') fields = field('补差事项',input('item','','required maxlength="80"')) + field('供货补差金额（元）',input('amount','','type="number" min="0.01" step="0.01" required')) + field('费用依据','<textarea class="form-control" name="basis" rows="3" required></textarea>');
      if (kind === 'execution') fields = field('执行状态',select('execution',['未出行','出行中','已完成'],state.execution)) + field('实际服务日期',input('actualDate',state.actualDate,'type="date" min="'+order.date+'"')) + field('结果说明','<textarea class="form-control" name="result" rows="3" required>'+esc(state.result)+'</textarea>');
      document.getElementById('icWorkForm').innerHTML = fields;
      window.caesarUI.openLayer(drawer);
    }
    function saveWork() {
      if (!editable() || !action) { hideDrawer(true); return; }
      const form = document.getElementById('icWorkForm');
      if (!form.reportValidity()) return;
      const values = new FormData(form), value = key => String(values.get(key) || '').trim();
      const fail = message => { document.getElementById('icWorkError').textContent = message; };
      let message = '';
      if (action === 'resources') {
        if (!value('reference')) return fail('请填写确认依据或无位原因。');
        if (state.execution !== '未出行' && value('resource') !== '已确认') return fail('订单已开始执行，资源变更请通过售后处理。');
        state.resource=value('resource'); state.reference=value('reference'); message='资源结果：'+state.resource;
      } else if (action === 'travelers') {
        state.travelers.forEach((x,i)=>{x.checked=value('checked'+i);x.arrangement=value('arrangement'+i);}); message='名单已保存，已核验'+state.travelers.filter(x=>x.checked==='已核验').length+'/2人';
      } else if (action === 'supplements') {
        const amount=Number(value('amount'));
        if (!value('item') || !value('basis') || !Number.isFinite(amount) || amount <= 0) return fail('请完整填写事项、有效补差金额及费用依据。');
        if (state.supplements.some(x=>x.item===value('item') && x.amount===amount && x.basis===value('basis'))) return fail('相同补差依据已提交，请勿重复提交。');
        state.supplements.push({item:value('item'),amount,basis:value('basis')}); message='补差依据已提交，待销售方确认；对客金额未变';
      } else if (action === 'execution') {
        if (state.execution === '出行中' && value('execution') === '未出行') return fail('已开始执行，不能退回未出行。');
        if (value('execution') !== '未出行' && (state.resource !== '已确认' || state.travelers.some(x=>x.checked!=='已核验'))) return fail('请先确认资源并完成2名游客的名单核验。');
        if (value('execution') !== '未出行' && order.status !== '已确认') return fail('关联销售订单尚未确认，请先由销售方完成订单确认。');
        if (!value('result') || (value('execution') !== '未出行' && !value('actualDate'))) return fail('请填写结果说明及实际服务日期。');
        state.execution=value('execution'); state.actualDate=value('actualDate'); state.result=value('result'); message='执行结果：'+state.execution;
      }
      state.logs.unshift([new Date().toLocaleString('zh-CN',{hour12:false}),company(order.fulfillment),message]);
      hideDrawer(true); draw();
    }
    main.addEventListener('click', event => {
      const tab=event.target.closest('[data-ic-tab]');
      if(tab){state.tab=tab.dataset.icTab;draw();return;}
      const edit=event.target.closest('[data-ic-edit]');if(edit)openWork(edit.dataset.icEdit);
    });
    drawer.addEventListener('input',()=>{dirty=true;});
    drawer.addEventListener('change',()=>{dirty=true;});
    drawer.addEventListener('click',event=>{if(event.target===drawer || event.target.closest('[data-ic-close]')){event.preventDefault();event.stopImmediatePropagation();hideDrawer(false);}},true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape' && drawer.classList.contains('show')){event.preventDefault();event.stopImmediatePropagation();hideDrawer(false);}},true);
    document.getElementById('icWorkSave').addEventListener('click',saveWork);
    document.getElementById('icWorkForm').addEventListener('submit',event=>{event.preventDefault();saveWork();});
    window.addEventListener('caesar-company-change',()=>{hideDrawer(true);document.getElementById('icWorkForm').innerHTML='';draw();});
    draw();
    return true;
  }
  window.ScheduleOrderIntercompany = { appendRows, renderDetail, relatedRow: row => !row.hasAttribute('data-intercompany') || related(examples[row.dataset.orderNo]) };
})();
