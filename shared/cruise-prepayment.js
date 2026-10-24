/* 在原预付管理抽屉补多航次用途；原款、冲抵确认和退回入口继续复用。 */
(function (root) {
  'use strict';
  const M = root.CruiseFinanceModel, records = new Map(), rows = new Map();
  let record = M.seed();
  const E = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const cash = n => '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const q = id => document.getElementById(id), set = (id, value) => { q(id).value = value; };
  const id = 'PP-CRU-20260701005';
  let row, draft = [], activeAction = '';
  const opts = selected => M.voyages.map(v => '<option value="' + v.id + '"' + (v.id === selected ? ' selected' : '') + '>' + E(v.name + ' / ' + v.id) + '</option>').join('');
  const match = r => r && records.has(r.dataset.prepayNo);
  const activate = r => { if (match(r)) { row = r; record = records.get(r.dataset.prepayNo); } };
  const reserved = () => Number(row.dataset.refundOccupied || 0);
  function mount() {
    const source = q('prepaymentRows').querySelector('[data-prepay-no="PP-CRU-20260520002"]');
    row = source.cloneNode(true);
    Object.assign(row.dataset, { prepayNo: id, paymentNo: 'PAY-CRU-20260701005', remittanceNo: 'CMBCPAY20260701005', contractNo: 'CRU-ADV-2026-005', company: '上海凯撒', business: '理想号 · 多航次包舱预付', businessNo: 'MED-20261112 / MED-20261126', source: '船方年度包舱定金', payableNo: 'AP-CRU-20261112', billNo: 'CRU-BILL-1112', settlementNo: '待航次结算', originalAmount: '¥1,000,000', localAmount: '¥1,000,000', balance: '¥1,000,000', currentAmount: '¥700,000', afterBalance: '¥1,000,000', currentAction: '用途待分摊', status: '待分摊', prepayDate: '2026-07-01', basis: 'CRU-ADV-2026-005 / 船方多航次用款安排', settlement: '用途分摊后，按已确认应付逐笔冲抵', attachments: '包舱年度协议、定金付款回单、船方用途确认函' });
    source.before(row);
    row.children[0].innerHTML = '<div class="table-cell-main"><strong>' + id + '</strong><span>' + E(row.dataset.supplier) + '</span></div>';
    row.children[2].innerHTML = '<div class="table-cell-main"><strong>理想号多航次</strong><span>11月12日 / 11月26日</span></div>';
    row.children[3].innerHTML = '<div class="table-cell-main"><strong>¥1,000,000</strong><span>CNY / 1.0000</span></div>';
    records.set(id, record); rows.set(id, row);
    // 已有单航次包舱预付也使用同一用途表，保留它的原金额、原付款和应付。
    const original = M.money(source.dataset.localAmount), offset = M.money(source.dataset.offset);
    const existing = { amount: original, offset, balance: M.money(source.dataset.balance), pending: null, history: [], uses: [{ id: source.dataset.businessNo, item: '舱位包销尾款', allocated: original, offset }] };
    M.voyages.push({ id: source.dataset.businessNo, name: '理想号 · 原地中海航次', payable: source.dataset.payableNo, due: original });
    records.set(source.dataset.prepayNo, existing); rows.set(source.dataset.prepayNo, source);
    q('prepaymentWorkDrawer').querySelector('[data-work-section="allocate"]').insertAdjacentHTML('beforeend', '<div id="cruiseAllocationEditor" hidden></div>');
    q('prepaymentWorkDrawer').querySelector('[data-work-section="offset"]').insertAdjacentHTML('afterbegin', '<div id="cruiseOffsetUse" class="form-group" hidden><label class="form-label" for="cruiseOffsetVoyage">本次冲抵航次</label><select class="form-control" id="cruiseOffsetVoyage"></select><p class="form-hint" id="cruisePayableHint"></p></div>');
    q('prepaymentWorkDrawer').querySelector('[data-work-section="balance"]').insertAdjacentHTML('afterbegin', '<div id="cruiseTransferUses" hidden><div class="form-row"><div class="form-group"><label class="form-label" for="cruiseTransferFrom">转出用途</label><select class="form-control" id="cruiseTransferFrom"></select></div><div class="form-group"><label class="form-label" for="cruiseTransferTo">转入航次</label><select class="form-control" id="cruiseTransferTo"></select></div></div><p class="form-hint">同付款公司、同船方、同币种，按船方确认转用；原付款及预付余额保留。</p></div>');
    q('overviewGrid').insertAdjacentHTML('afterend', '<div id="cruisePrepayUses" hidden></div>');
    q('cruiseOffsetVoyage').addEventListener('change', offsetFields);
    q('cruiseAllocationEditor').addEventListener('input', e => { const r = e.target.closest('[data-use-index]'); if (r && e.target.dataset.useField) { draft[+r.dataset.useIndex][e.target.dataset.useField] = e.target.value; allocationTotal(); } });
    q('cruiseAllocationEditor').addEventListener('change', e => { const r = e.target.closest('[data-use-index]'); if (r && e.target.dataset.useField) { draft[+r.dataset.useIndex][e.target.dataset.useField] = e.target.value; allocationTotal(); } });
    q('cruiseAllocationEditor').addEventListener('click', e => {
      if (e.target.closest('[data-add-use]')) { const available = M.voyages.find(v => !draft.some(d => d.id === v.id)); if (available) draft.push({ id: available.id, item: '包舱费', allocated: 0 }); renderAllocation(); }
      const del = e.target.closest('[data-delete-use]'); if (del) { draft.splice(+del.closest('[data-use-index]').dataset.useIndex, 1); renderAllocation(); }
    });
  }
  function allocationTotal() {
    let total = draft.reduce((n, d) => n + (Number(d.allocated) || 0), 0), rest = M.round(record.amount - total);
    q('cruiseAllocationTotal').textContent = '用途合计 ' + cash(total) + ' · 未分配 ' + cash(rest) + ' · 已冲抵 ' + cash(record.offset) + ' · 预付余额 ' + cash(record.balance);
    q('cruiseAllocationTotal').classList.toggle('amount-red', rest < 0);
  }
  function renderAllocation() {
    q('cruiseAllocationEditor').innerHTML = '<div class="cruise-allocation-actions"><button class="btn btn-secondary" type="button" data-add-use' + (draft.length >= M.voyages.length ? ' disabled' : '') + '>添加用途</button></div><div class="table-wrap cruise-finance-table"><table><colgroup><col><col style="width:120px"><col style="width:150px"><col style="width:90px"></colgroup><thead><tr><th>航次</th><th>费用项目</th><th>分摊金额（元）</th><th class="sticky-action">操作</th></tr></thead><tbody>' + draft.map((u, i) => '<tr data-use-index="' + i + '"><td><select class="form-control" aria-label="航次' + (i + 1) + '" data-use-field="id">' + opts(u.id) + '</select></td><td><input class="form-control" aria-label="费用项目' + (i + 1) + '" data-use-field="item" value="' + E(u.item) + '"></td><td><input class="form-control" aria-label="分摊金额' + (i + 1) + '" type="number" min="0" step="0.01" data-use-field="allocated" value="' + E(u.allocated) + '"></td><td class="sticky-action"><button class="table-link" type="button" data-delete-use' + (u.offset > 0 ? ' disabled' : '') + '>删除</button></td></tr>').join('') + '</tbody></table></div><p class="form-hint" id="cruiseAllocationTotal"></p><p class="form-hint">分摊仅明确用途，不减少预付余额；已冲抵金额保留在对应航次。</p>';
    allocationTotal();
  }
  function actions(r) {
    if (!match(r)) return null;
    const current = records.get(r.dataset.prepayNo);
    let entries = [];
    if (r.dataset.status === '待确认') entries = [['confirm', '确认']];
    else if (r.dataset.status === '差异待处理') entries = [['diff', '处理']];
    else if (r.dataset.status !== '已关闭' && current.balance > 0) entries = [['allocate', '分摊'], ['offset', '冲抵'], ['transfer', '转款'], ['return', '申请退回']];
    return '<div class="table-action">' + (entries.length ? '<span class="dropdown table-action-more"><button class="table-more-toggle table-action-primary" type="button">处理</button><span class="dropdown-menu action-dropdown-menu">' + entries.map(x => '<button class="dropdown-item" type="button" data-open-work="' + x[0] + '">' + x[1] + '</button>').join('') + '</span></span>' : '') + '<button type="button" data-open-detail>详情</button></div>';
  }
  function offsetFields() {
    const u = record.uses.find(x => x.id === q('cruiseOffsetVoyage').value), v = M.voyages.find(x => x.id === u?.id);
    const available = u ? Math.max(0, Math.min(u.allocated - u.offset, v.due - u.offset, record.balance - reserved())) : 0;
    set('workOffsetTarget', v?.payable || '请先分摊到航次'); set('workOffsetAvailable', cash(available)); set('workOffsetAmount', Math.min(200000, available));
    q('workOffsetTarget').readOnly = true;
    q('cruisePayableHint').textContent = v ? v.payable + ' · ' + row.dataset.company + ' · ' + row.dataset.supplier + ' · CNY · 应付未冲抵 ' + cash(v.due - u.offset) : '尚无航次用途，请从原分摊入口维护。';
  }
  function work(r, action) {
    const on = match(r); activeAction = on ? action : '';
    if (on) activate(r);
    const allocate = q('cruiseAllocationEditor'); allocate.hidden = !on;
    allocate.parentElement.querySelectorAll(':scope > .form-row').forEach(n => { n.hidden = on; });
    q('cruiseOffsetUse').hidden = !on;
    q('cruiseTransferUses').hidden = !on || action !== 'transfer';
    q('workOffsetTarget').readOnly = on;
    ['workOffsetType', 'workOffsetBalanceMethod', 'workBalanceMethod', 'workBalanceTransferTarget'].forEach(key => { q(key).closest('.form-group').hidden = on; });
    q('workSubmitButton').disabled = false;
    document.querySelector('label[for="workDiffAmount"]').textContent = on ? '本次拟冲抵金额' : '差异金额';
    if (!on) return;
    q('workBasisGrid').innerHTML = '<div class="description-item full"><div class="description-label">原付款</div><div class="description-value">' + E(r.dataset.paymentNo + ' / ' + r.dataset.remittanceNo) + '</div></div><div class="description-item full"><div class="description-label">船方依据</div><div class="description-value">' + E(r.dataset.basis.includes(r.dataset.contractNo) ? r.dataset.basis : r.dataset.contractNo + ' / ' + r.dataset.basis) + '</div></div>';
    if (action === 'allocate') { draft = record.uses.length ? record.uses.map(u => ({ ...u })) : [{ id: M.voyages[0].id, item: '包舱费', allocated: 300000 }, { id: M.voyages[1].id, item: '包舱费', allocated: 400000 }]; renderAllocation(); }
    if (action === 'offset') {
      q('cruiseOffsetVoyage').innerHTML = record.uses.filter(u => u.allocated > u.offset).map(u => '<option value="' + u.id + '">' + E(M.voyages.find(v => v.id === u.id).name) + '</option>').join('');
      offsetFields(); q('workSubmitButton').disabled = !q('cruiseOffsetVoyage').value;
      q('workCandidateRows').innerHTML = record.uses.map(u => { const v = M.voyages.find(x => x.id === u.id); return '<tr><td>' + v.payable + '</td><td>' + E(r.dataset.supplier) + '</td><td>' + cash(Math.min(u.allocated - u.offset, v.due - u.offset)) + '</td><td>¥0.00</td><td>已确认应付 / CNY</td></tr>'; }).join('');
    }
    if (action === 'confirm' && record.pending) { set('workConfirmAmount', cash(record.pending.amount)); set('workConfirmAfterBalance', cash(record.balance - record.pending.amount)); }
    if (action === 'diff' && record.difference) set('workDiffAmount', record.difference.amount);
    if (action === 'transfer') {
      q('cruiseTransferFrom').innerHTML = '<option value="unassigned">未分配余额 ' + cash(M.totals(record).unassigned - reserved()) + '</option>' + record.uses.filter(u => u.allocated > u.offset).map(u => '<option value="' + u.id + '">' + E(u.id) + ' / ' + cash(u.allocated - u.offset) + '</option>').join('');
      q('cruiseTransferTo').innerHTML = opts('MED-20261210'); set('workBalanceAmount', 100000); set('workRemark', r.dataset.contractNo + ' / 船方跨航次转用确认（演示）');
      q('workSubmitButton').textContent = '确认转用';
    }
  }
  function sync() {
    row.dataset.offset = cash(record.offset); row.dataset.balance = cash(record.balance);
    row.dataset.afterBalance = cash(record.balance - (record.pending?.amount || 0));
    row.dataset.currentAmount = cash(record.pending?.amount || M.totals(record).unused);
    row.dataset.currentAction = record.pending ? '待确认 ' + cash(record.pending.amount) : '已分摊未冲抵 ' + cash(M.totals(record).unused);
    row.dataset.balanceStatus = record.balance ? '有余额' : '余额为零';
    row.dataset.status = record.pending ? '待确认' : record.difference ? '差异待处理' : record.balance === 0 ? '已结清' : record.uses.length ? '待冲抵' : '待分摊';
    if (record.difference) row.dataset.currentAction = '冲抵差异待复核';
    if (record.pending) row.dataset.payableNo = record.pending.payable;
  }
  function submit(r, action) {
    if (!match(r)) return false;
    activate(r);
    if (activeAction !== action || ['已关闭', '已结清'].includes(r.dataset.status)) throw Error('本次处理已结束，请重新打开');
    if (action === 'allocate') M.allocate(record, draft, reserved());
    else if (action === 'offset') M.submit(record, q('cruiseOffsetVoyage').value, q('workOffsetAmount').value, reserved());
    else if (action === 'confirm') {
      const result = q('workConfirmResult').value, pending = record.pending && { ...record.pending };
      M.confirm(record, result, reserved());
      if (result === '标记差异') record.difference = pending;
    }
    else if (action === 'transfer') M.transfer(record, q('cruiseTransferFrom').value, q('cruiseTransferTo').value, q('workBalanceAmount').value, reserved());
    else if (action === 'diff' && record.difference) {
      const method = q('workDiffMethod').value;
      if (['部分冲抵', '调整金额后冲抵'].includes(method)) M.submit(record, record.difference.id, q('workDiffAmount').value, reserved());
      else if (!['重新匹配', '退回修改'].includes(method)) throw Error('请核对本次应付，选择退回修改或重新匹配；有余额的预付不能关闭');
      record.history.push({ action: '差异处理', text: method, amount: 0, balance: record.balance, sequence: record.history.length + 1 });
      record.difference = null;
    }
    else throw Error('请从分摊、冲抵或预付退回入口办理');
    sync(); activeAction = '';
    return true;
  }
  function detail(r) {
    q('cruisePrepayUses').hidden = !match(r); if (!match(r)) return;
    activate(r);
    const t = M.totals(record);
    q('cruisePrepayUses').innerHTML = '<div class="drawer-section-head"><h3 class="drawer-section-title">航次用途</h3></div><p>已分摊未冲抵 ' + cash(t.unused) + ' · 未分配 ' + cash(t.unassigned) + ' · 退回占用 ' + cash(reserved()) + '</p><div class="table-wrap cruise-finance-table"><table><thead><tr><th>航次 / 费用</th><th>分摊金额</th><th>已冲抵</th><th>未冲抵</th></tr></thead><tbody>' + (record.uses.map(u => '<tr><td>' + E(u.id + ' / ' + u.item) + '</td><td>' + cash(u.allocated) + '</td><td>' + cash(u.offset) + '</td><td>' + cash(u.allocated - u.offset) + '</td></tr>').join('') || '<tr><td colspan="4">尚未分摊用途</td></tr>') + '</tbody></table></div>';
    q('offsetRows').innerHTML = record.history.filter(h => h.action === '已冲抵').map(h => '<tr><td>' + E(h.text) + '</td><td>已确认应付</td><td>' + cash(-h.amount) + '</td><td>' + cash(h.balance) + '</td><td>已冲抵</td></tr>').join('') || '<tr><td colspan="5">暂无已确认冲抵' + (record.pending ? '；待确认 ' + E(record.pending.payable) + ' / ' + cash(record.pending.amount) : '') + '</td></tr>';
    q('balanceRows').innerHTML = '<tr><td>' + r.dataset.prepayDate + '</td><td>原付款</td><td>' + cash(record.amount) + '</td><td>' + cash(record.amount) + '</td><td>' + E(r.dataset.paymentNo) + '</td></tr>' + record.history.map(h => '<tr><td>第' + h.sequence + '次处理</td><td>' + E(h.action) + '</td><td>' + cash(h.amount) + '</td><td>' + cash(h.balance) + '</td><td>' + E(h.text) + '</td></tr>').join('');
    q('logTimeline').innerHTML = record.history.map(h => '<div class="timeline-item"><div class="timeline-title">' + E(h.action) + '</div><div class="timeline-desc">' + E(h.text) + ' · 预付余额 ' + cash(h.balance) + '</div></div>').join('') || '暂无用途处理记录';
    q('ncRows').innerHTML = '<tr><td>—</td><td>会计事项另行核对</td><td>—</td><td>未生成</td><td>—</td></tr>';
  }
  function refundLimit(prepayId) { const r = records.get(prepayId); return r ? Math.max(0, M.totals(r).unassigned - Number(rows.get(prepayId).dataset.refundOccupied || 0)) : null; }
  function guardRefund(prepayId, value) { const r = records.get(prepayId); if (!r) return; if (r.pending || r.difference || Number(value) > refundLimit(prepayId)) throw Error('退回仅使用未分配余额；已分摊部分请先调整用途，待确认冲抵须先处理'); }
  root.CruisePrepayment = { mount, match, actions, work, submit, detail, refundLimit, guardRefund, get record() { return record; } };
})(window);
