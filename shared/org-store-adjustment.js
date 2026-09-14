(function () {
  'use strict';
  const M = window.CaesarStoreGovernance;
  const people = M.copy(M.employees), changes = [];
  const e = v => String(v || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  let current = people[0], dirty = false, sequence = 100, closeTimer = null, displayedStore = '软件园门店';
  const layer = document.createElement('div'); layer.id = 'orgAdjustmentDrawer'; layer.className = 'modal-overlay drawer-overlay sg-layer'; layer.dataset.static = 'true'; layer.setAttribute('aria-hidden','true'); document.body.appendChild(layer);
  const choices = [
    ['福建凯撒', '厦门分公司 / 厦门思明区门市部', '软件园门店'],
    ['福建凯撒', '厦门分公司 / 厦门思明区门市部', '观音山门店'],
    ['福建凯撒', '厦门分公司 / 厦门思明区门市部', '文灶门店'],
    ['福建凯撒', '泉州分公司 / 泉州丰泽门市部', '泉州丰泽门店'],
    ['福建凯撒', '泉州分公司 / 泉州丰泽门市部', '泉州鲤城门店'],
    ['福建凯撒', '泉州分公司 / 泉州丰泽门市部', '泉州东海门店']
  ];
  function close(force) {
    if (dirty && !force && !confirm('当前内容未保存，确认离开吗？')) return;
    layer.classList.remove('show'); layer.classList.add('closing');
    closeTimer = setTimeout(() => { layer.hidden = true; layer.classList.remove('closing'); layer.setAttribute('aria-hidden','true'); }, 360); dirty = false;
  }
  function identity() {
    const node = layer.querySelector('#orgEmployeeCurrent');
    node.innerHTML = '<dl class="sg-grid"><div><dt>员工</dt><dd>' + e(current.name + ' / ' + current.phone) + '</dd></div><div><dt>当前公司</dt><dd>' + e(current.company) + '</dd></div><div><dt>当前组织</dt><dd>' + e(current.org) + '</dd></div><div><dt>当前门店</dt><dd>' + e(current.store) + '</dd></div></dl>';
    const target = layer.querySelector('[name=target]'); target.value = String(Math.max(0, choices.findIndex(c => c[2] === current.store)));
  }
  function open(id) {
    clearTimeout(closeTimer);
    if (id) current = people.find(x => x.id === id) || current;
    layer.innerHTML = '<div class="modal drawer-modal" role="dialog" aria-modal="true" aria-labelledby="orgAdjustmentTitle"><div class="modal-header"><h2 class="modal-title" id="orgAdjustmentTitle">调整员工组织归属</h2><button type="button" class="table-link" data-org-adjust-close aria-label="关闭">×</button></div><form class="modal-body" id="orgAdjustmentForm"><label class="sg-field"><span>集团已有员工</span><select name="employee">' + people.map(p => '<option value="' + p.id + '"' + (p.id === current.id ? ' selected' : '') + '>' + e(p.name + ' / ' + p.company + ' / ' + p.store) + '</option>').join('') + '</select></label><section class="sg-summary" id="orgEmployeeCurrent"></section><div class="sg-form-grid"><label class="sg-field"><span>目标组织及门店</span><select name="target">' + choices.map((c,i) => '<option value="' + i + '">' + e(c.join(' / ')) + '</option>').join('') + '</select></label><label class="sg-field"><span>期望生效日期</span><input name="date" type="date" required value="' + M.day() + '"></label></div><label class="sg-field"><span>调整原因</span><textarea name="reason" rows="3" required></textarea></label><p class="sg-note">提交后保留当前归属，审批通过且到达生效日期后调整。门店角色另行授权；交接不改变原订单销售人员和历史业绩。</p><div class="sg-related"><a class="table-link" href="../merchant/system/staff-management.html">工作交接</a><a class="table-link" href="merchant-roles.html">业务角色</a></div></form><div class="sg-error" role="alert" hidden></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-org-adjust-close>取消</button><button type="submit" form="orgAdjustmentForm" class="btn btn-primary">核对并提交</button></div></div>';
    identity(); dirty = false; window.caesarUI.openLayer(layer);
  }
  function record(r) {
    clearTimeout(closeTimer);
    layer.innerHTML = '<div class="modal drawer-modal" role="dialog" aria-modal="true" aria-labelledby="orgAdjustmentTitle"><div class="modal-header"><h2 class="modal-title" id="orgAdjustmentTitle">组织调整申请</h2><button class="table-link" data-org-adjust-close>×</button></div><div class="modal-body"><dl class="sg-grid"><div><dt>申请单号</dt><dd>' + e(r.id) + '</dd></div><div><dt>申请状态</dt><dd>' + e(r.status) + '</dd></div><div><dt>员工</dt><dd>' + e(r.name) + '</dd></div><div><dt>期望生效日期</dt><dd>' + e(r.date) + '</dd></div><div><dt>当前组织</dt><dd>' + e(r.before) + '</dd></div><div><dt>申请目标组织</dt><dd>' + e(r.after) + '</dd></div><div><dt>申请原因</dt><dd>' + e(r.reason) + '</dd></div><div><dt>审核岗位</dt><dd>组织管理员及目标组织负责人</dd></div></dl><p class="sg-note">申请中不改变当前组织。批准延迟时从实际批准日期生效。</p><div class="sg-related"><a class="table-link" href="../merchant/approval/approvals.html?view=mine">审批中心</a></div></div><div class="modal-footer"><button class="btn btn-secondary" data-org-adjust-close>关闭</button>' + (r.status === '审批中' ? '<button class="btn btn-secondary" data-org-adjust-withdraw="' + r.id + '">撤回申请</button>' : '<button class="btn btn-primary" data-org-adjust-edit="' + r.employeeId + '">重新申请</button>') + '</div></div>';
    dirty = false; window.caesarUI.openLayer(layer);
  }
  function renderMembers(name) {
    displayedStore = name;
    const panel = document.querySelector('[data-org-panel="store-staff"]'); if (!panel) return;
    const rows = people.filter(p => p.store === name);
    panel.querySelector('tbody').innerHTML = rows.length ? rows.map(p => '<tr><td>' + e(p.name) + '</td><td>' + e(p.role) + '</td><td>' + e(p.scope) + '</td><td>' + e(p.status) + '</td><td><button class="table-link" data-org-adjust-employee="' + p.id + '">调整归属</button></td></tr>').join('') : '<tr><td colspan="5">当前门店暂无有效成员记录</td></tr>';
    panel.querySelector('thead').innerHTML = '<tr><th>员工</th><th>门店角色</th><th>当前范围</th><th>本店权限</th><th>操作</th></tr>';
    panel.querySelector('.pagination').textContent = '共 ' + rows.length + ' 位成员';
    let history = panel.querySelector('[data-org-adjust-history]');
    if (!history) { history = document.createElement('div'); history.dataset.orgAdjustHistory = 'true'; panel.appendChild(history); }
    history.innerHTML = '<div class="sg-section-head"><h2>组织调整申请</h2></div><div class="table-wrap sg-table"><table><thead><tr><th>申请单号</th><th>员工</th><th>申请状态</th><th>操作</th></tr></thead><tbody>' + (changes.length ? changes.map(r => '<tr><td>' + e(r.id) + '</td><td>' + e(r.name) + '</td><td>' + e(r.status) + '</td><td><button class="table-link" data-org-adjust-record="' + r.id + '">详情</button></td></tr>').join('') : '<tr><td colspan="4">暂无本次会话申请</td></tr>') + '</tbody></table></div>';
  }
  layer.addEventListener('change', event => { dirty = true; if (event.target.name === 'employee') { current = people.find(p => p.id === event.target.value); identity(); } });
  layer.addEventListener('input', () => { dirty = true; });
  layer.addEventListener('submit', event => {
    event.preventDefault(); const f = event.target; if (!f.reportValidity()) return;
    const target = choices[Number(f.elements.target.value)], date = f.elements.date.value, reason = f.elements.reason.value.trim();
    let message = '';
    if (!reason) message = '请填写调整原因';
    else if (date < M.day()) message = '期望生效日期不能早于今天';
    else if (target[2] === current.store) message = '目标组织与当前组织相同';
    else if (changes.some(r => r.employeeId === current.id && r.status === '审批中')) message = '该员工已有组织调整申请待审批';
    if (message) { const node = layer.querySelector('.sg-error'); node.hidden = false; node.textContent = message; return; }
    const r = { id: 'ZZ-MS-' + (++sequence), employeeId: current.id, name: current.name, before: [current.company,current.org,current.store].join(' / '), after: target.join(' / '), date, reason, status:'审批中' };
    changes.unshift(r); renderMembers(displayedStore); record(r);
  });
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-org-adjust-close],[data-open-org-adjustment],[data-org-adjust-employee],[data-org-adjust-record],[data-org-adjust-withdraw],[data-org-adjust-edit]'); if (!target) return;
    if (target.hasAttribute('data-org-adjust-close')) close();
    if (target.hasAttribute('data-open-org-adjustment')) open();
    if (target.dataset.orgAdjustEmployee) open(target.dataset.orgAdjustEmployee);
    if (target.dataset.orgAdjustEdit) open(target.dataset.orgAdjustEdit);
    if (target.dataset.orgAdjustRecord) record(changes.find(r => r.id === target.dataset.orgAdjustRecord));
    if (target.dataset.orgAdjustWithdraw) { const r = changes.find(r => r.id === target.dataset.orgAdjustWithdraw); r.status = '已撤回'; renderMembers(displayedStore); record(r); }
  });
  layer.addEventListener('click', event => { if (event.target === layer) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && layer.classList.contains('show')) { event.preventDefault(); close(); } });
  window.CaesarOrgAdjustment = { open, renderMembers };
  const node = document.querySelector('.org-admin-tree-row.active')?.closest('[data-node-name]'); renderMembers(node?.dataset.nodeName || '软件园门店');
  const employee = new URLSearchParams(location.search).get('employee');
  if (employee) { const ready = () => { if (window.caesarUI) open(employee); else setTimeout(ready, 50); }; ready(); }
})();
