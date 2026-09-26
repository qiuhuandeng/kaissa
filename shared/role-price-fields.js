(function () {
  'use strict';
  const P = window.PriceFieldPermissions, state = P.read();
  const e = s => String(s || '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
  const tbody = document.querySelector('[data-merchant-role-table]');
  const call = document.createElement('tr');
  call.dataset.source = 'preset'; call.dataset.scope = 'center'; call.dataset.status = 'enabled'; call.dataset.tabStatus = '启用';
  call.innerHTML = '<td><strong>直营呼叫中心销售</strong></td><td><span class="tag tag-blue">系统预置</span></td><td>业务中心</td><td>产品报价、客户与订单</td><td>授权呼叫中心销售数据</td><td><span class="tag tag-green">启用</span></td><td><div class="table-action"></div></td>';
  tbody.appendChild(call);
  function countRows() {
    const count = [...tbody.rows].filter(row => !row.hidden && row.style.display !== 'none').length;
    document.querySelector('.list-surface-pagination > span').textContent = '共 ' + count + ' 条';
  }
  new MutationObserver(countRows).observe(tbody, { attributes: true, subtree: true, attributeFilter: ['hidden', 'style'] });
  countRows();
  let current = '', original = false;
  const host = document.createElement('div'); host.className = 'modal-overlay drawer-overlay'; host.setAttribute('aria-hidden', 'true');
  host.innerHTML = '<div class="modal drawer-modal position-drawer" role="dialog" aria-modal="true" aria-labelledby="roleFieldTitle"><div class="modal-header"><div class="modal-title" id="roleFieldTitle">可见字段</div><button type="button" class="modal-close" data-close-price-role aria-label="关闭">×</button></div><div class="modal-body"><p id="roleFieldScope"></p><div id="roleFieldEditor"></div><p class="form-hint" id="roleFieldUsage"></p><p class="pf-error" id="roleFieldError" role="alert"></p></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-close-price-role>取消</button><button type="button" class="btn btn-primary" id="saveRoleFields">保存</button></div></div>';
  document.body.appendChild(host);
  const notice = document.createElement('p'); notice.className = 'pf-notice'; notice.setAttribute('role', 'status'); tbody.closest('.table-wrap').before(notice);
  [...tbody.querySelectorAll('tr')].forEach(row => {
    const role = state.roles.find(r => row.cells[0].textContent.trim() === r.name);
    if (!role) return;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = '可见字段'; b.dataset.priceRole = role.id;
    row.querySelector('.table-action').appendChild(b);
  });
  function close() {
    if (document.getElementById('roleSettlement').checked !== original && !confirm('当前内容未保存，确认离开吗？')) return;
    window.caesarUI.closeLayer(host);
  }
  document.addEventListener('click', event => {
    const b = event.target.closest('[data-price-role]');
    if (b) {
      current = b.dataset.priceRole;
      const state = P.read(), role = P.role(state, current); original = !!role.allowSettlement;
      document.getElementById('roleFieldTitle').textContent = role.name + ' · 可见字段';
      document.getElementById('roleFieldScope').textContent = '适用组织：' + role.context;
      document.getElementById('roleFieldEditor').innerHTML = '<table class="pf-fields"><thead><tr><th>数据字段</th><th>展示权限</th></tr></thead><tbody><tr><td>对客售价</td><td>沿用销售权限</td></tr><tr><td>门店结算价</td><td><label class="pf-field-choice"><input type="checkbox" id="roleSettlement" ' + (original ? 'checked ' : '') + (!P.ceiling(current) ? 'disabled' : '') + '>可见</label></td></tr><tr><td>供应商结算价／实际成本</td><td>独立授权</td></tr></tbody></table>';
      document.getElementById('roleFieldUsage').textContent = '采用此角色的岗位：' + state.positions.filter(p => p.roleId === current).map(p => p.name).join('、') + '。仅配置查看权限。';
      document.getElementById('roleFieldError').textContent = '';
      window.caesarUI.openLayer(host);
    }
    if (event.target.closest('[data-close-price-role]')) close();
  });
  document.getElementById('saveRoleFields').addEventListener('click', () => {
    const result = P.saveRole(current, document.getElementById('roleSettlement').checked);
    if (result.error) { document.getElementById('roleFieldError').textContent = result.error; return; }
    window.caesarUI.closeLayer(host);
    notice.textContent = result.durable ? '可见字段已保存，关联岗位采用相同设置（原型演示）' : '已保存在本页；浏览器未允许存储，离开后不保留。';
  });
})();
