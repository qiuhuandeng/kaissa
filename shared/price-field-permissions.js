/* Prototype-only permission configuration shared by positions and roles.
 * Stores configuration only; never acts as production authentication. */
(function (root) {
  'use strict';
  const key = 'caesar-price-field-permissions-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const roleDefaults = [
    { id: 'call-sales', name: '直营呼叫中心销售', context: '直营呼叫中心', allowSettlement: false },
    { id: 'franchise-manager', name: '加盟门店店长', context: '加盟门店', allowSettlement: true },
    { id: 'franchise-staff', name: '加盟门店店员', context: '加盟门店', allowSettlement: false }
  ];
  const positions = [
    ['P001', '集团汇总视角', '管理岗', '集团'], ['P002', '主体负责人', '管理岗', '主体公司'],
    ['P003', '产品总监', '管理岗', '中心'], ['P004', '产品经理', '产品岗', '部门/门店'],
    ['P005', '计调', '运营岗', '部门/门店'], ['P006', '门店店长', '管理岗', '部门/门店'],
    ['P007', '销售顾问', '销售岗', '部门/门店'], ['P008', 'OTA渠道运营', '渠道岗', '中心'],
    ['P009', '直营电销顾问', '销售岗', '中心', 'call-sales'],
    ['P010', '加盟门店店长', '管理岗', '部门/门店', 'franchise-manager'],
    ['P011', '加盟门店店员', '销售岗', '部门/门店', 'franchise-staff']
  ].map(([id, name, type, level, roleId = ''], index) => ({ id, name, type, level, roleId, status: '启用', salary: ['¥20,000-35,000','¥18,000-30,000','¥16,000-28,000','¥12,000-20,000','¥8,000-15,000','¥10,000-18,000','¥6,000-12,000','¥8,000-14,000'][index] || '', source: index === 5 || index === 6 ? '旧HR同步' : '手动维护', duty: '', sort: (index + 1) * 10 }));
  const seed = () => ({ version: 1, roles: clone(roleDefaults), positions: clone(positions), changes: [] });
  let memory = seed();
  function read() {
    try {
      const raw = root.localStorage && root.localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.version === 1 && Array.isArray(saved.roles) && Array.isArray(saved.positions)) return clone(saved);
      }
    } catch (_) { /* Local-file browsers can deny storage; keep this page's configuration. */ }
    return clone(memory);
  }
  function persist(state) {
    memory = clone(state);
    let durable = false;
    try { if (root.localStorage) { root.localStorage.setItem(key, JSON.stringify(state)); durable = true; } } catch (_) {}
    if (root.dispatchEvent) root.dispatchEvent(new Event('price-permissions-changed'));
    return durable;
  }
  function role(state, id) { return state.roles.find(item => item.id === id); }
  function ceiling(id) { return id === 'franchise-manager'; }
  function validateRole(state, id, allowed) {
    if (!role(state, id)) return '请选择有效的业务角色';
    if (allowed && !ceiling(id)) return '该角色不可查看门店结算价';
    return '';
  }
  function setRole(state, id, allowed) {
    const error = validateRole(state, id, allowed);
    if (error) return { error };
    const value = role(state, id);
    const before = value.allowSettlement;
    value.allowSettlement = allowed === true;
    if (before !== value.allowSettlement) {
      state.changes.unshift({ at: new Date().toISOString(), role: value.name, before, after: value.allowSettlement, by: '权限管理员（演示）' });
      state.changes = state.changes.slice(0, 50);
    }
    return { error: '' };
  }
  function saveRole(id, allowed) {
    const state = read(), result = setRole(state, id, allowed);
    if (result.error) return result;
    return { error: '', durable: persist(state) };
  }
  function savePosition(value, allowed) {
    const state = read(), existing = state.positions.find(p => p.id === value.id);
    if (!String(value.name || '').trim()) return { error: '请填写岗位名称' };
    if (state.positions.some(p => p.id !== value.id && p.name === value.name.trim())) return { error: '岗位名称已存在' };
    // The three preset identities keep their approved role boundary when renamed.
    const locked = positions.find(p => p.id === value.id && p.roleId);
    if (locked && locked.roleId !== value.roleId) return { error: '请保留该岗位对应的业务角色' };
    if (value.roleId) {
      const result = setRole(state, value.roleId, allowed);
      if (result.error) return result;
    } else if (allowed) return { error: '请先选择业务角色' };
    const next = { ...value, name: value.name.trim(), id: existing ? existing.id : 'P' + String(Math.max(...state.positions.map(p => Number(p.id.slice(1)) || 0)) + 1).padStart(3, '0') };
    if (!['启用', '停用'].includes(next.status)) return { error: '请选择岗位状态' };
    if (existing) Object.assign(existing, next); else state.positions.push(next);
    return { error: '', id: next.id, durable: persist(state) };
  }
  const identities = [
    { id: 'call', label: '直营呼叫中心', positionId: 'P009', company: 'fj', org: 'call-fj', context: '直营呼叫中心' },
    { id: 'manager', label: '加盟门店店长', positionId: 'P010', company: 'fj', org: 'store-a', context: '加盟门店' },
    { id: 'staff', label: '加盟门店店员', positionId: 'P011', company: 'fj', org: 'store-a', context: '加盟门店' }
  ].map(item => ({ ...item, active: true, start: '2020-01-01', end: '' }));
  function canView(state, identity, target, date = new Date().toLocaleDateString('sv-SE')) {
    if (!identity || !target || identity.active !== true || identity.start > date || (identity.end && identity.end < date)) return false;
    if (identity.company !== target.company || identity.org !== target.org) return false;
    const position = state.positions.find(p => p.id === identity.positionId && p.status === '启用');
    const selectedRole = position && role(state, position.roleId);
    return !!(selectedRole && ceiling(selectedRole.id) && selectedRole.context === identity.context && selectedRole.allowSettlement === true);
  }
  root.PriceFieldPermissions = { key, seed, read, role, ceiling, saveRole, savePosition, canView, identities: clone(identities) };
  if (typeof module !== 'undefined') module.exports = root.PriceFieldPermissions;
})(typeof window === 'undefined' ? globalThis : window);
