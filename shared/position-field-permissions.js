(function () {
  'use strict';
  const P = window.PriceFieldPermissions, form = document.getElementById('positionForm');
  const layer = document.querySelector('[data-position-drawer]');
  const q = id => document.getElementById(id);
  const e = value => String(value || '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
  let current = null, initial = '';
  const inputs = ['Code', 'Name', 'Type', 'Level', 'Salary', 'Source', 'Status', 'Sort', 'Duty'];
  function draft() { return JSON.stringify([...form.querySelectorAll('input,select,textarea')].map(el => el.type === 'checkbox' ? el.checked : el.value)); }
  function notify(message) { q('positionNotice').textContent = message; }
  function fields() {
    const state = P.read(), id = q('positionRole').value, role = P.role(state, id);
    q('positionRoleScope').textContent = role ? '适用组织：' + role.context : '未关联角色：结算价默认不可见';
    q('positionFieldEditor').innerHTML = '<table class="pf-fields"><thead><tr><th>数据字段</th><th>展示权限</th></tr></thead><tbody><tr><td>对客售价</td><td>沿用销售权限</td></tr><tr><td>门店结算价</td><td><label class="pf-field-choice"><input id="positionSettlement" type="checkbox" ' + (role?.allowSettlement && P.ceiling(id) ? 'checked ' : '') + (!P.ceiling(id) ? 'disabled ' : '') + '>可见</label></td></tr><tr><td>供应商结算价／实际成本</td><td>独立授权</td></tr></tbody></table>';
    const names = state.positions.filter(p => p.roleId === id && p.id !== current?.id).map(p => p.name);
    q('positionRoleUsage').textContent = role ? (!P.ceiling(id) ? '该角色不开放门店结算价。' : '仅允许查看，不授予改价或导出权限。') + (names.length ? '同用此角色的岗位：' + names.join('、') + '；保存后共同采用。' : '') : '';
  }
  function tab(name) {
    form.querySelectorAll('[data-position-tab]').forEach(x => x.classList.toggle('active', x.dataset.positionTab === name));
    form.querySelectorAll('[data-position-panel]').forEach(x => x.hidden = x.dataset.positionPanel !== name);
  }
  function open(id) {
    const state = P.read(); current = state.positions.find(p => p.id === id) || null;
    const value = current || { name: '', type: '销售岗', level: '部门/门店', status: '启用', source: '手动维护', sort: 120 };
    inputs.forEach(k => q('position' + k).value = k === 'Code' ? value.id || '保存后生成' : value[k[0].toLowerCase() + k.slice(1)] ?? '');
    q('positionRole').innerHTML = '<option value="">未关联</option>' + state.roles.map(r => '<option value="' + e(r.id) + '">' + e(r.name) + '</option>').join('');
    q('positionRole').value = value.roleId || '';
    q('positionRole').disabled = ['P009', 'P010', 'P011'].includes(value.id);
    q('positionDrawerTitle').textContent = current ? '编辑岗位' : '新增岗位';
    q('positionError').textContent = ''; fields(); tab('base'); initial = draft();
    window.caesarUI.openLayer(layer);
  }
  function close(force = false) {
    if (!force && draft() !== initial && !window.confirm('当前内容未保存，确认离开吗？')) return;
    window.caesarUI.closeLayer(layer);
  }
  const filters = document.querySelector('[aria-label="岗位筛选"]');
  function render() {
    const state = P.read(), term = filters.querySelector('input').value.trim();
    const selects = filters.querySelectorAll('select');
    const list = state.positions.filter(p => (!term || (p.name + p.id).includes(term)) && (!selects[0].selectedIndex || p.type === selects[0].value) && (!selects[1].selectedIndex || p.level === selects[1].value) && (!selects[2].selectedIndex || p.status === selects[2].value));
    q('positionRows').innerHTML = list.map(p => '<tr><td><strong>' + e(p.name) + '</strong><span>' + e(p.id) + '</span></td><td>' + e(p.type) + '</td><td>' + e(p.level) + '</td><td>' + e(P.role(state, p.roleId)?.name || '未关联') + '</td><td><span class="tag ' + (p.status === '启用' ? 'tag-green' : 'tag-gray') + '">' + e(p.status) + '</span></td><td class="pf-position-actions"><div class="table-action"><button class="table-action-primary" type="button" data-edit-position="' + e(p.id) + '">编辑</button><button type="button" data-toggle-position="' + e(p.id) + '">' + (p.status === '启用' ? '停用' : '启用') + '</button></div></td></tr>').join('') || '<tr><td colspan="6">暂无符合条件的岗位</td></tr>';
    q('positionCount').textContent = '共 ' + list.length + ' 条';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = { id: current?.id || '', roleId: q('positionRole').value };
    inputs.filter(k => k !== 'Code').forEach(k => value[k[0].toLowerCase() + k.slice(1)] = q('position' + k).value.trim());
    const result = P.savePosition(value, q('positionSettlement').checked);
    if (result.error) { q('positionError').textContent = result.error; return; }
    close(true); render(); notify(result.durable ? '岗位及可见字段已保存（原型演示）' : '已保存在本页；浏览器未允许存储，离开后不保留。');
  });
  q('positionRole').addEventListener('change', fields);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && layer.classList.contains('show')) { event.preventDefault(); event.stopImmediatePropagation(); close(); }
  }, true);
  document.addEventListener('click', event => {
    if (event.target === layer) { event.preventDefault(); event.stopImmediatePropagation(); close(); }
  }, true);
  document.addEventListener('click', event => {
    const b = event.target.closest('button');
    if (b?.hasAttribute('data-open-position-drawer')) open();
    if (b?.dataset.editPosition) open(b.dataset.editPosition);
    if (b?.hasAttribute('data-close-position-drawer')) close();
    if (b?.dataset.positionTab) tab(b.dataset.positionTab);
    if (b?.dataset.togglePosition) {
      const state = P.read(), p = state.positions.find(x => x.id === b.dataset.togglePosition);
      const action = p.status === '启用' ? '停用' : '启用';
      if (!window.confirm('确认' + action + '岗位“' + p.name + '”吗？')) return;
      const result = P.savePosition({ ...p, status: action }, !!P.role(state, p.roleId)?.allowSettlement);
      if (result.error) notify(result.error); else { render(); notify('岗位已' + action); }
    }
  });
  filters.querySelector('.btn-filter-search').addEventListener('click', render);
  filters.querySelectorAll('.filter-actions button')[1].addEventListener('click', () => { filters.querySelector('input').value = ''; filters.querySelectorAll('select').forEach(x => x.selectedIndex = 0); render(); });
  filters.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') render(); });
  window.addEventListener('storage', e => { if (e.key === P.key && !layer.classList.contains('show')) render(); });
  render();
})();
