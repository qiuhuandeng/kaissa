(function () {
  'use strict';
  const app = document.getElementById('leaderApp');
  const dialog = document.getElementById('leaderDialog');
  const key = 'caesarLeaderMobileDemoV1';
  const sessionKey = 'caesarLeaderMobileUser';
  const data = window.LeaderMobileData;
  let groups = data.seed();
  let user = null;
  let filter = '待确认';
  let search = '';
  let peopleSearch = '';
  let peopleFilter = false;
  let toastTimer;
  let dialogAction;
  let previousFocus;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (Array.isArray(saved) && saved.length === groups.length && saved.every(g => groups.some(s => s.id === g.id))) groups = saved;
    user = data.accounts.find(a => a.id === sessionStorage.getItem(sessionKey)) || null;
  } catch (_) {}
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const paths = {
    back: '<path d="m14 6-6 6 6 6"/>',
    arrow: '<path d="m9 6 6 6-6 6"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-11 4h3m3 0h3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    file: '<path d="M14 3H5v18h14V8ZM14 3v5h5M8 12h8m-8 4h6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    phone: '<path d="m8 3 3 5-3 2a13 13 0 0 0 6 6l2-3 5 3c-1 8-16 1-18-9Z"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    bag: '<rect x="4" y="6" width="16" height="15" rx="3"/><path d="M9 6V3h6v3M8 10v7m8-7v7"/>'
  };
  const icon = n => '<svg class="lm-icon" viewBox="0 0 24 24" aria-hidden="true">' + paths[n] + '</svg>';
  const owned = () => groups.filter(g => g.leaderId === user?.id);
  const pending = g => ['待确认', '调整待确认'].includes(g.status);
  const ended = g => ['已取消', '已更换'].includes(g.status);
  function save() { try { sessionStorage.setItem(key, JSON.stringify(groups)); } catch (_) {} }
  function tone(status) { return /取消|更换/.test(status) ? 'gray' : /待|部分|调整/.test(status) ? 'orange' : /中/.test(status) ? 'blue' : 'green'; }
  function tag(status) { return '<span class="lm-tag lm-' + tone(status) + '">' + esc(status) + '</span>'; }
  function row(label, value) { return '<div class="lm-fact"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>'; }
  function toast(message) {
    const el = document.getElementById('leaderToast');
    el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  function header(title, back) {
    return '<header class="lm-header">' + (back ? '<a class="lm-back" href="' + back + '">' + icon('back') + '返回</a>' : '<span class="lm-brand">CAISSA</span>') + '<h1>' + esc(title) + '</h1><span class="lm-capsule" aria-hidden="true">••• <i></i> ◉</span></header>';
  }
  function nav(active) {
    return '<nav class="lm-nav" aria-label="底部导航">' + [['groups', 'calendar', '排团'], ['messages', 'bell', '消息'], ['profile', 'user', '我的']].map(([id, glyph, name]) => '<a href="#' + id + '"' + (id === active ? ' aria-current="page"' : '') + '>' + icon(glyph) + '<span>' + name + '</span>' + (id === 'messages' && owned().some(g => !g.read) ? '<i class="lm-dot"></i>' : '') + '</a>').join('') + '</nav>';
  }
  function empty(title, text) { return '<section class="lm-empty">' + icon('bag') + '<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p></section>'; }
  function login() {
    app.innerHTML = header('领队端') + '<div class="lm-login"><div class="lm-login-brand">CAISSA <span>凯撒旅游</span></div><div class="lm-login-intro"><span class="lm-eyebrow">领队工作台</span><h2>每一段旅程，<br>从这里出发。</h2><p>确认排团 · 掌握行程 · 从容带团</p></div><form id="loginForm" novalidate><label for="phone">手机号</label><input id="phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" placeholder="请输入领队档案中的手机号" required><label for="code">验证码</label><div class="lm-code-row"><input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6位验证码" required><button type="button" data-action="get-code">获取验证码</button></div><p id="loginError" class="lm-error" role="alert"></p><button class="lm-primary lm-wide" type="submit">登录</button></form><div class="lm-demo"><p>原型演示 · 验证码 <b>123456</b></p><div><button type="button" data-account="0">张建国 · 有排团</button><button type="button" data-account="1">赵明 · 暂无排团</button></div><small>点击填入演示账号，不发送真实短信。</small></div></div>';
    document.getElementById('loginForm').addEventListener('submit', e => {
      e.preventDefault();
      const phone = document.getElementById('phone').value.trim();
      const code = document.getElementById('code').value.trim();
      const account = data.accounts.find(a => a.phone === phone);
      const error = !/^1\d{10}$/.test(phone) ? '请输入正确的11位手机号。' : !account ? '该手机号未关联领队档案，请联系计调。' : code !== '123456' ? '验证码不正确，请输入演示验证码123456。' : '';
      document.getElementById('loginError').textContent = error;
      if (error) return;
      user = account; filter = '待确认'; search = '';
      try { sessionStorage.setItem(sessionKey, user.id); } catch (_) {}
      location.hash = 'groups'; render();
    });
  }
  function groupCard(g) {
    return '<a class="lm-group-card" href="#group/' + encodeURIComponent(g.id) + '/overview"><div class="lm-card-top"><span>' + esc(g.start.slice(5).replace('-', '.')) + ' — ' + esc(g.end.slice(5).replace('-', '.')) + '</span>' + tag(g.status) + '</div><h2>' + esc(g.title) + '</h2><p class="lm-muted">' + esc(g.id) + '</p><div class="lm-card-meta"><span>' + icon('user') + (ended(g) ? '原安排 · ' : '') + esc(g.role) + '</span><span>' + (ended(g) ? '无需出团' : g.travelers.length + '名游客') + '</span></div>' + (g.status === '调整待确认' ? '<p class="lm-card-warning">集合时间、地点已调整，请重新确认</p>' : ended(g) ? '<p class="lm-card-ended">' + esc(g.reason) + '</p>' : '') + '<div class="lm-card-bottom"><span>' + (pending(g) ? '确认截止 ' + esc(g.deadline.slice(5)) : ended(g) ? esc(g.events.at(-1).time.slice(5)) : esc(g.stage)) + '</span><b>' + (pending(g) ? '查看并确认' : ended(g) ? '查看结果' : '查看团组') + icon('arrow') + '</b></div></a>';
  }
  function renderList() {
    const list = owned().filter(g => (filter === '全部' || filter === '待确认' && pending(g) || g.status === filter) && (g.title + g.id).toLowerCase().includes(search.toLowerCase()));
    document.getElementById('groupList').innerHTML = list.length ? list.map(groupCard).join('') : empty(search ? '未找到相关团组' : '暂无' + (filter === '全部' ? '排团' : filter + '排团'), search ? '试试其他线路名称或团号。' : '新的排团安排会在这里显示。');
  }
  function home() {
    app.innerHTML = header('我的排团') + '<section class="lm-greeting"><p>' + esc(user.name) + '，你好</p><h2>把下一程，准备好。</h2><span>' + owned().filter(pending).length + '项排团待确认</span></section><div class="lm-list-tools"><label class="lm-search">' + icon('search') + '<input id="groupSearch" type="search" value="' + esc(search) + '" placeholder="搜索线路名称、团号" aria-label="搜索团组"></label><div class="lm-filter-tabs" role="tablist" aria-label="排团状态">' + ['待确认', '已确认', '出团中', '全部'].map(s => '<button role="tab" aria-selected="' + (filter === s) + '" data-filter="' + s + '">' + s + (s === '待确认' ? '<small>' + owned().filter(pending).length + '</small>' : '') + '</button>').join('') + '</div></div><div id="groupList" class="lm-content"></div>' + nav('groups');
    renderList();
    document.getElementById('groupSearch').addEventListener('input', e => { search = e.target.value; renderList(); });
  }
  function timeline(g) {
    return '<section class="lm-section"><h3>排团记录</h3><ol class="lm-timeline">' + g.events.slice().reverse().map(e => '<li><span>' + esc(e.time) + '</span><h4>' + esc(e.title) + '</h4><p>' + esc(e.text) + '</p></li>').join('') + '</ol></section>';
  }
  function changes(g) {
    return '<section class="lm-section"><div class="lm-section-title"><h3>排团调整</h3>' + tag(g.status === '调整待确认' ? '待重新确认' : '已确认调整') + '</div><p class="lm-muted">' + esc(g.events.find(e => e.title === '排团调整')?.text || '') + '</p><div class="lm-compare-head"><span>调整前</span><span>调整后</span></div>' + g.changes.map(c => '<div class="lm-change"><h4>' + esc(c[0]) + '</h4><div><del>' + esc(c[1]) + '</del><strong>' + esc(c[2]) + '</strong></div></div>').join('') + '</section>';
  }
  function overview(g) {
    return (ended(g) ? '<section class="lm-notice lm-neutral"><b>' + esc(g.status === '已取消' ? '本次派团已取消' : '本团已更换领队') + '</b><p>' + esc(g.reason) + '</p></section>' : '') + (g.changes.length ? changes(g) : '') + '<section class="lm-section"><h3>' + (ended(g) ? '原排团安排' : '服务安排') + '</h3><dl>' + row('服务日期', g.start + ' 至 ' + g.end) + row('担任角色', g.role) + row('线路方案', g.route) + row('计调负责人', g.operator) + (ended(g) ? '' : row('团组状态', g.stage)) + '</dl></section>' + (!ended(g) ? '<section class="lm-section"><h3>集合信息</h3><div class="lm-meeting">' + icon('clock') + '<strong>' + esc(g.meeting) + '</strong></div><div class="lm-meeting">' + icon('pin') + '<span>' + esc(g.place) + '</span></div></section>' + (g.resources.some(r => r.status !== '已确认') || g.travelers.some(p => p.status !== '资料已齐') ? '<section class="lm-notice"><b>出团准备待跟进</b><p>' + g.resources.filter(r => r.status !== '已确认').map(r => esc(r.type + '：' + r.status)).concat(g.travelers.some(p => p.status !== '资料已齐') ? ['1名游客签证待回传'] : []).join('；') + '。计调' + esc(g.operator) + '正在跟进。</p></section>' : '') : '') + timeline(g);
  }
  function itinerary(g) {
    return '<div class="lm-subheading"><h3>每日行程</h3><span>' + g.itinerary.length + '天 · 行程V1</span></div><div class="lm-itinerary">' + g.itinerary.map((day, i) => {
      const date = new Date(g.start + 'T12:00:00'); date.setDate(date.getDate() + i);
      return '<details class="lm-day"' + (i === 0 ? ' open' : '') + '><summary><span class="lm-day-index">D' + (i + 1) + '</span><div><small>' + (date.getMonth() + 1) + '月' + date.getDate() + '日</small><h3>' + esc(day[0]) + '</h3></div>' + icon('arrow') + '</summary><div class="lm-day-body"><p>' + esc(day[1]) + '</p><dl>' + row('用餐', day[2]) + row('住宿', day[3]) + '</dl></div></details>';
    }).join('') + '</div>';
  }
  function people(g) {
    return '<div class="lm-people-tools"><label class="lm-search">' + icon('search') + '<input id="peopleSearch" type="search" placeholder="搜索游客姓名" value="' + esc(peopleSearch) + '" aria-label="搜索游客"></label><div class="lm-section-title"><span>' + g.travelers.length + '名游客 · 3间双人房</span><label class="lm-checkbox"><input id="peopleFilter" type="checkbox"' + (peopleFilter ? ' checked' : '') + '>只看需关注</label></div></div><div id="peopleList"></div>';
  }
  function renderPeople(g) {
    const list = g.travelers.filter(p => p.name.includes(peopleSearch.trim()) && (!peopleFilter || p.need || p.status !== '资料已齐'));
    document.getElementById('peopleList').innerHTML = list.length ? list.map(p => '<section class="lm-section lm-person"><div class="lm-section-title"><h3>' + esc(p.name) + '</h3>' + tag(p.status) + '</div><dl>' + row('证件', p.document) + row('住宿', p.room) + row('签证 / 保险', p.visa + ' · 已投保') + row('联系手机', p.phone.slice(0, 3) + '****' + p.phone.slice(-4)) + '</dl>' + (p.need ? '<p class="lm-person-need">' + esc(p.need) + '</p>' : '') + '<button class="lm-text-button" data-person="' + esc(p.name) + '">' + icon('phone') + '查看联系方式</button></section>').join('') : empty('暂无匹配游客', '调整姓名或关注条件后重试。');
  }
  function resources(g) {
    return '<div class="lm-subheading"><h3>资源安排</h3><span>' + g.resources.filter(r => r.status === '已确认').length + '/' + g.resources.length + '项已确认</span></div>' + g.resources.map(r => '<section class="lm-section"><div class="lm-section-title"><h3>' + esc(r.type) + '</h3>' + tag(r.status) + '</div><h4>' + esc(r.name) + '</h4><p class="lm-resource-text">' + esc(r.detail) + '</p></section>').join('');
  }
  function documents(g) {
    return '<div class="lm-subheading"><h3>出团资料</h3><span>以最新发布版本为准</span></div>' + g.docs.map(d => '<section class="lm-section lm-document">' + icon('file') + '<div><h3>' + esc(d.name) + '</h3><p>' + esc(d.version) + (d.date ? ' · ' + esc(d.date.slice(5)) : ' · 计调整理中') + '</p></div><button class="lm-text-button" data-doc="' + d.id + '"' + (!d.ready ? ' disabled' : '') + '>' + (d.ready ? '查看' : '待发布') + '</button></section>').join('');
  }
  function detail(g, tab) {
    if (!g) { app.innerHTML = header('团组详情', '#groups') + empty('未找到可查看的排团', '请返回我的排团，选择本人负责的团组。'); return; }
    if (!g.read) { g.read = true; save(); }
    if (ended(g)) tab = 'overview';
    const tabs = [['overview', '概览'], ['itinerary', '行程'], ['people', '名单'], ['resources', '资源'], ['documents', '资料']];
    if (!tabs.some(t => t[0] === tab)) tab = 'overview';
    const body = { overview, itinerary, people, resources, documents }[tab](g);
    app.innerHTML = header('团组详情', '#groups') + '<section class="lm-detail-hero"><div class="lm-card-top"><span>' + esc(g.id) + '</span>' + tag(g.status) + '</div><h2>' + esc(g.title) + '</h2><p>' + esc(g.start) + ' 至 ' + esc(g.end) + '</p><span>' + esc(g.role) + (ended(g) ? ' · 原安排' : ' · ' + g.travelers.length + '名游客') + '</span></section>' + (!ended(g) ? '<nav class="lm-detail-tabs" aria-label="团组资料">' + tabs.map(([id, label]) => '<a href="#group/' + encodeURIComponent(g.id) + '/' + id + '"' + (tab === id ? ' aria-current="page"' : '') + '>' + label + '</a>').join('') + '</nav>' : '') + '<div class="lm-content lm-detail-content">' + body + '</div><footer class="lm-actions"><button class="lm-secondary" data-action="contact">' + icon('phone') + '联系计调</button>' + (pending(g) ? '<button class="lm-primary" data-action="confirm">' + (g.status === '调整待确认' ? '确认最新安排' : '确认排团') + '</button>' : '<span class="lm-action-result">' + (ended(g) ? '无需出团' : icon('check') + esc(g.status)) + '</span>') + '</footer>';
    if (tab === 'people') {
      renderPeople(g);
      document.getElementById('peopleSearch').addEventListener('input', e => { peopleSearch = e.target.value; renderPeople(g); });
      document.getElementById('peopleFilter').addEventListener('change', e => { peopleFilter = e.target.checked; renderPeople(g); });
    }
  }
  function messages() {
    const list = owned().slice().sort((a, b) => b.events.at(-1).time.localeCompare(a.events.at(-1).time));
    app.innerHTML = header('排团消息') + '<div class="lm-message-head"><span>排团及变更通知</span><button class="lm-text-button" data-action="read-all">全部已读</button></div><div class="lm-content">' + (list.length ? list.map(g => '<a class="lm-message" data-read="' + g.id + '" href="#group/' + encodeURIComponent(g.id) + '/overview"><div class="lm-section-title"><h2>' + (!g.read ? '<i class="lm-unread"></i>' : '') + esc(g.events.at(-1).title) + '</h2>' + tag(g.status) + '</div><h3>' + esc(g.title) + '</h3><p>' + esc(g.events.at(-1).text) + '</p><time>' + esc(g.events.at(-1).time) + '</time></a>').join('') : empty('暂无排团消息', '收到排团或安排调整后，会在这里提醒。')) + '</div>' + nav('messages');
  }
  function profile() {
    app.innerHTML = header('我的') + '<section class="lm-profile"><span class="lm-eyebrow">领队档案</span><h2>' + esc(user.name) + '</h2><p>' + esc(user.type) + ' · ' + esc(user.phone.slice(0, 3) + '****' + user.phone.slice(-4)) + '</p></section><div class="lm-content"><section class="lm-section"><h3>基础信息</h3><dl>' + row('所属机构', '凯撒旅游') + row('可带区域', user.region) + row('联系计调', '张明 138****8866') + '</dl></section><div class="lm-profile-actions"><button data-action="help">使用帮助' + icon('arrow') + '</button><button data-action="reset">重置演示记录' + icon('arrow') + '</button><button data-action="logout">退出登录' + icon('arrow') + '</button></div><p class="lm-prototype-note">领队移动端 · 交互原型<br>演示记录仅保存在当前浏览器会话</p></div>' + nav('profile');
  }
  function current() { const parts = location.hash.slice(1).split('/'); return owned().find(g => g.id === parts[1]); }
  function closeDialog() { dialogAction = null; dialog.close(); previousFocus?.focus(); }
  function modal(title, body, action, label) {
    previousFocus = document.activeElement;
    dialog.innerHTML = '<div class="lm-dialog-head"><h2 id="leaderDialogTitle">' + esc(title) + '</h2><button data-action="close-dialog" aria-label="关闭">×</button></div><div class="lm-dialog-body">' + body + '</div><div class="lm-dialog-actions"><button class="lm-secondary" data-action="close-dialog">' + (action ? '暂不' : '关闭') + '</button>' + (action ? '<button class="lm-primary" data-action="dialog-submit">' + esc(label) + '</button>' : '') + '</div>';
    dialogAction = action; dialog.showModal();
  }
  function openDoc(g, id) {
    const d = g.docs.find(d => d.id === id && d.ready);
    if (!d || ended(g)) return;
    let body = '<p class="lm-muted">' + esc(g.title + ' · ' + g.id) + '</p><p class="lm-muted">' + esc(d.version + ' · ' + d.date) + '</p>';
    if (id === 'notice') body += '<dl>' + row('服务日期', g.start + ' 至 ' + g.end) + row('集合时间', g.meeting) + row('集合地点', g.place) + row('领队', user.name + ' / ' + user.phone) + '</dl><h3>行前提醒</h3><p>请携带有效证件原件，提前核对行李限额、航班及游客特殊需求；随团携带常用物品。具体安排以计调最新通知为准。</p>';
    if (id === 'itinerary') body += g.itinerary.map((d, i) => '<div class="lm-document-day"><h3>D' + (i + 1) + ' · ' + esc(d[0]) + '</h3><p>' + esc(d[1]) + '</p><p class="lm-muted">用餐：' + esc(d[2]) + '；住宿：' + esc(d[3]) + '</p></div>').join('');
    if (id === 'contact') body += '<dl>' + row('计调', g.operator + ' / ' + g.operatorPhone) + row('领队', user.name + ' / ' + user.phone) + '</dl><h3>游客联系表</h3>' + g.travelers.map(p => '<p>' + esc(p.name + ' · ' + p.phone) + '</p>').join('');
    modal(d.name, body);
  }
  function handle(e) {
    const target = e.target.closest('button, a'); if (!target) return;
    if (target.dataset.account) {
      const account = data.accounts[Number(target.dataset.account)];
      document.getElementById('phone').value = account.phone; document.getElementById('code').value = '123456'; document.getElementById('loginError').textContent = ''; return;
    }
    if (target.dataset.filter) { filter = target.dataset.filter; home(); return; }
    if (target.dataset.read) { const g = owned().find(g => g.id === target.dataset.read); if (g) { g.read = true; save(); } }
    const g = user ? current() : null;
    if (target.dataset.doc && g) openDoc(g, target.dataset.doc);
    if (target.dataset.person && g && !ended(g)) {
      const p = g.travelers.find(p => p.name === target.dataset.person);
      if (p) modal('游客联系方式', '<h3>' + esc(p.name) + '</h3><p class="lm-contact-number">' + esc(p.phone) + '</p><p>请按带团需要联系游客。</p>');
    }
    switch (target.dataset.action) {
      case 'get-code': {
        const phone = document.getElementById('phone').value.trim();
        document.getElementById('loginError').textContent = /^1\d{10}$/.test(phone) ? '演示验证码：123456（不发送真实短信）' : '请先输入正确的手机号。'; break;
      }
      case 'close-dialog': closeDialog(); break;
      case 'dialog-submit': { const action = dialogAction; closeDialog(); if (action) action(); break; }
      case 'contact': if (g) modal('联系计调', '<h3>' + esc(g.operator) + ' · 计调负责人</h3><p class="lm-contact-number">' + esc(g.operatorPhone) + '</p><p>涉及档期冲突、无法出团或资料缺失，请联系计调处理。</p>'); break;
      case 'confirm': {
        if (!g || !pending(g)) return;
        const version = g.version;
        const adjusted = g.status === '调整待确认';
        modal(adjusted ? '确认最新安排' : '确认排团', '<h3>' + esc(g.title) + '</h3><dl>' + row('服务日期', g.start + ' 至 ' + g.end) + row('服务范围', g.role) + row('集合时间', g.meeting) + row('集合地点', g.place) + '</dl><p>确认本人可按以上安排出团。</p>', () => {
          if (!user || !owned().includes(g) || !pending(g) || version !== g.version) { toast('排团状态已变化，请重新查看。'); return; }
          g.status = '已确认'; g.read = true;
          g.events.push({ time: new Date().toLocaleString('sv-SE').slice(0, 16), title: adjusted ? '领队确认调整' : '领队确认排团', text: user.name + (adjusted ? '已确认调整后的集合时间及地点。' : '已确认服务日期、范围及集合安排。') });
          save(); render(); toast(adjusted ? '已确认最新安排' : '排团确认成功');
        }, adjusted ? '确认最新安排' : '确认排团'); break;
      }
      case 'read-all': owned().forEach(g => { g.read = true; }); save(); messages(); toast('已全部标为已读'); break;
      case 'help': modal('使用帮助', '<h3>查看与确认排团</h3><p>在“排团”中查看本人安排，核对服务日期和集合信息后确认。调整后的安排需重新确认。</p><h3>资料与变更</h3><p>团组详情可查看行程、名单、资源和出团资料。“消息”保留排团调整、取消和更换结果。</p><h3>无法出团</h3><p>请通过团组详情联系计调，由计调重新安排。</p><h3>原型演示</h3><p>所有身份、游客和团组均为演示资料，操作不会通知他人或回写后台。</p>'); break;
      case 'reset': modal('重置演示记录', '<p>本次确认和已读记录将被清空，恢复初始演示场景。</p>', () => { groups = data.seed(); save(); profile(); toast('已恢复初始演示记录'); }, '确认重置'); break;
      case 'logout': modal('退出登录', '<p>确认退出当前领队账号？</p>', () => { user = null; try { sessionStorage.removeItem(sessionKey); } catch (_) {} location.hash = 'login'; render(); }, '退出登录'); break;
    }
  }
  function render() {
    if (dialog.open) closeDialog();
    if (!user) { login(); return; }
    const parts = location.hash.slice(1).split('/');
    if (parts[0] === 'group') detail(owned().find(g => g.id === parts[1]), parts[2] || 'overview');
    else if (parts[0] === 'messages') messages();
    else if (parts[0] === 'profile') profile();
    else home();
    window.scrollTo(0, 0);
  }
  app.addEventListener('click', handle);
  dialog.addEventListener('click', handle);
  dialog.addEventListener('cancel', () => { dialogAction = null; });
  window.addEventListener('hashchange', render);
  render();
})();
