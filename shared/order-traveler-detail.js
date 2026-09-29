(function () {
  'use strict';
  const context = window.OrderTravelerContext;
  if (!context || !document.getElementById('travelerDetailForm')) return;
  const config = context.config, project = context.project;
  const drawer = document.getElementById('travelerDrawer');
  const form = document.getElementById('travelerDetailForm');
  const error = document.getElementById('travelerFormError');
  const save = document.getElementById('saveTravelerDetail');
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = (value, cls = '') => '<span class="ot-line ' + cls + '">' + esc(value) + '</span>';
  const section = (title, content) => '<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">' + title + '</h3></div>' + content + '</section>';
  const fold = (title, content, open = false) => '<details class="ot-fold"' + (open ? ' open' : '') + '><summary>' + title + '</summary>' + content + '</details>';
  // Explicit prototype product facts. Unknown products never inherit a default visa country.
  const visaProducts = {
    '欧洲十国经典游·12天': ['法国', '申根旅游签证', '材料版本v6', '2026-06-24'],
    '理想号地中海邮轮': ['法国', '申根旅游签证', '材料版本v6', '2025-06-29'],
    '巴黎自由行5日': ['法国', '申根旅游签证', '材料版本v6', '2025-06-27'],
    '日本签证代办': ['日本', '个人旅游签证', '材料版本v4', '2026-07-10'],
    '新加坡科技创新研学6日': ['新加坡', '旅游电子签', '材料版本v3', '2025-08-02']
  };
  const profile = project ? null : visaProducts[config.productName] || null;
  const allowed = config.productType === '单项服务' ? ['随团代办'] : ['游客自办', '随团代办'];
  const passport = ['邮轮','自由行'].includes(config.productType) || !!profile;
  const minor = config.productType === '研学';
  const oldKey = 'caesar-order-visa-modes-' + config.orderNo;
  let oldVisa = {};
  try { oldVisa = JSON.parse(sessionStorage.getItem(oldKey) || '{}'); } catch (_) {}
  const rows = config.travelers.rows.map((row, index) => {
    const value = expression => { const at = config.travelers.head.findIndex(x => expression.test(x)); return at < 0 ? '' : String(row[at] || ''); };
    const identity = value(/^证件$/), sourcePerson = context.people && context.people[index];
    const p = {
      id: config.orderNo + '-T' + (index + 1), name: row[0],
      category: minor ? '儿童' : /儿童|未成年/.test(value(/人群|年龄类别|类型/)) ? '儿童' : '成人',
      docType: passport ? '护照' : '身份证', docNo: '', savedIdentity: identity,
      hasSavedDoc: /\*|已填/.test(identity) && (passport ? /护照/.test(identity) && !/护照待补/.test(identity) : !/待补/.test(identity)),
      phone: value(/联系电话/), birthday: '', englishName: value(/英文姓名/), nationality: '',
      issuedAt: '', expiresAt: '', residence: '', emergencyName: '', emergencyPhone: '',
      guardian: value(/监护人/), guardianPhone: '', school: '', grade: value(/年级/),
      room: value(/房型/), roommate: '', preference: value(/入住需求/), health: '',
      boarding: value(/上下车站/), trafficPreference: '', address: '',
      resource: value(/舱型|席别/), count: project ? row[1] : '',
      transport: project ? row[2] : '', materials: {}, history: [],
      mode: profile ? (index === 0 && allowed.includes('游客自办') ? '游客自办' : '随团代办') : '',
      visaStatus: '', fee: 0, taskPending: '', sourceReady: !!(sourcePerson && sourcePerson.ready)
    };
    if (project) return p;
    if (minor && value(/健康表/) === '已上传') p.materials.healthForm = { name: '原健康表', status: '待审核' };
    if (profile) {
      const old = oldVisa.records && oldVisa.records[p.name];
      if (old && ['未选择'].concat(allowed).includes(old.mode)) {
        p.mode = old.mode; p.visaStatus = old.status; p.fee = old.fee || 0;
        p.history = (oldVisa.history || []).filter(h => h.name === p.name);
      } else { p.visaStatus = p.mode === '随团代办' ? '材料收集中' : '证件待核验'; p.fee = p.mode === '随团代办' ? 800 : 0; }
    }
    return p;
  });
  let current = null, draft = null, dirty = false, lastTrigger = null, pendingClose = false;
  const materialItems = p => {
    const items = [];
    if (p.mode === '随团代办') items.push(['passportCopy','护照扫描件'],['photo','照片'],['application','申请表'],['employment','在职／在读证明'],['assets','资产证明']);
    if (p.mode === '游客自办') items.push(['selfVisa','自办签证／入境证件']);
    if (config.productType === '邮轮') items.push(['boardingForm','登船表']);
    if (minor) items.push(['guardianConsent','监护人授权书'],['healthForm','健康表']);
    return items;
  };
  function gaps(p) {
    if (project) return ['游客名单待导入'];
    const items = [];
    if (!p.docNo && !p.hasSavedDoc) items.push(p.docType + '号码待补');
    if (p.docType === '护照') {
      if (!p.englishName) items.push('英文姓名待补');
      if (!p.expiresAt) items.push('护照有效期待补');
      if (p.expiresAt && context.start && /^\d{4}-\d{2}-\d{2}$/.test(context.start) && p.expiresAt < context.start) items.push('护照出发前已过期');
    }
    if (!p.phone && !p.guardianPhone) items.push('联系电话待补');
    if ((p.docType === '护照' || minor) && !p.birthday) items.push('出生日期待补');
    if (minor && !p.guardian) items.push('监护人待补');
    if (profile && p.mode === '未选择') items.push('签证办理方式待选择');
    materialItems(p).forEach(([key,label]) => { if (!p.materials[key]) items.push(label + '待补'); });
    return items;
  }
  const expanded = new Set();
  const display = value => value ? esc(value) : '<span class="ot-muted">未填写</span>';
  const facts = items => '<dl class="ot-facts">' + items.map(([label,value]) => '<div><dt>' + esc(label) + '</dt><dd>' + display(value) + '</dd></div>').join('') + '</dl>';
  function detailContent(p) {
    const identity = [['姓名',p.name],['出生日期',p.birthday],['证件类型',p.docType],['证件号码',p.docNo || (p.hasSavedDoc ? p.savedIdentity : '')]];
    if (p.docType === '护照') identity.push(['英文姓名',p.englishName],['国籍',p.nationality],['签发地',p.issuedAt],['有效期至',p.expiresAt]);
    const contact = [['联系电话',p.phone],['紧急联系人',p.emergencyName],['紧急联系电话',p.emergencyPhone]];
    if (minor) contact.push(['监护人',p.guardian],['监护人电话',p.guardianPhone],['学校／年级',[p.school,p.grade].filter(Boolean).join(' / ')]);
    const needs = config.productType === '单项服务' ? [['回寄地址',p.address],['交付备注',p.preference]] : [['房型偏好',p.room],['同住人',p.roommate],['餐食及其他需求',p.preference],['健康及照顾需求',p.health]];
    if (config.productType === '专列') needs.push(['上下车站',p.boarding],['铺位偏好',p.trafficPreference]);
    if (p.resource) needs.push(['当前资源安排',p.resource]);
    const materials = materialItems(p);
    return '<div class="ot-expanded-grid"><section><h4>身份与证件</h4>' + facts(identity) + '</section><section><h4>联系方式</h4>' + facts(contact) + '</section><section><h4>' + (config.productType === '单项服务' ? '交付资料' : '出行需求') + '</h4>' + facts(needs) + '</section>' +
      (materials.length || profile ? '<section class="ot-expanded-materials"><h4>材料与办理</h4>' + (profile ? facts([['签证方案',profile[0] + ' / ' + profile[1]],['办理方式',p.mode],['常住地',p.residence],['办理结果',p.taskPending || p.visaStatus]]) : '') + '<ul class="ot-material-read">' + materials.map(([key,label]) => '<li><span>' + esc(label) + '</span><span>' + (p.materials[key] ? esc(p.materials[key].name) + ' · ' + esc(p.materials[key].status) : '<span class="ot-muted">未提交</span>') + '</span></li>').join('') + '</ul></section>' : '') + '</div>';
  }
  function render() {
    const table = document.getElementById('travelerTableHead').closest('table');
    table.classList.add('ot-table'); table.closest('.table-wrap').classList.add('ot-table-wrap');
    const heads = project ? ['分组','人数','交通需求','住宿需求','资料状态','操作'] : ['','游客','证件资料','联系方式',config.productType === '单项服务' ? '交付资料' : '出行需求','资料与材料'].concat(profile ? ['签证办理'] : []).concat(['操作']);
    const kind = (h, i) => h === '操作' ? 'ot-action' : h === '' ? 'ot-toggle-col' : h === '游客' || (project && i === 0) ? 'ot-identity' : /出行需求|交付资料|住宿需求/.test(h) ? 'ot-flex' : h === '证件资料' ? 'ot-document-col' : h === '资料与材料' || h === '资料状态' ? 'ot-status-col' : 'ot-info';
    let cols = table.querySelector('colgroup'); if (!cols) { cols = document.createElement('colgroup'); table.prepend(cols); }
    cols.innerHTML = heads.map((h,i) => '<col class="' + kind(h,i) + '">').join('');
    document.getElementById('travelerTableHead').innerHTML = '<tr>' + heads.map((h,i) => '<th class="' + kind(h,i) + '">' + (h || '<span class="sr-only">展开资料</span>') + '</th>').join('') + '</tr>';
    document.getElementById('travelerTableRows').innerHTML = rows.map((p, i) => {
      if (project) return '<tr data-ot-person="' + i + '"><td>' + text(p.name) + '</td><td>' + esc(p.count) + '</td><td>' + text(p.transport) + '</td><td>' + text(p.room) + '</td><td>游客名单待导入</td><td class="ot-action"><button type="button" class="table-action-primary" data-ot-edit="' + i + '">编辑</button></td></tr>';
      const missing = gaps(p), materials = materialItems(p), received = materials.filter(([key]) => p.materials[key]);
      const state = missing.length ? '待补资料' : received.length ? '待审核' : '已填写';
      const cert = p.docNo ? p.docNo.slice(0, 2) + '****' + p.docNo.slice(-2) : p.hasSavedDoc ? p.savedIdentity.replace(p.docType,'') : '号码未填写';
      const docLines = [p.docType + ' · ' + cert];
      if (p.docType === '护照') docLines.push(p.englishName || '英文姓名未填写', p.expiresAt ? '有效期至 ' + p.expiresAt : '有效期未填写');
      else if (p.birthday) docLines.push('出生日期 ' + p.birthday);
      const needs = (config.productType === '单项服务' ? [p.address,p.preference] : [p.room || p.resource, p.roommate ? '同住：' + p.roommate : '', p.preference, p.boarding, p.trafficPreference, p.health]).filter(Boolean);
      const needHtml = needs.length ? needs.slice(0,3).map((n,index) => '<span class="ot-line ot-long ' + (index ? 'ot-muted' : '') + '" title="' + esc(n) + '">' + esc(n) + '</span>').join('') : text('未填写','ot-muted');
      const visa = profile ? '<td>' + text(p.mode) + text(p.taskPending || p.visaStatus,'ot-muted') + (p.mode === '随团代办' ? text('截止 ' + profile[3],'ot-muted') : '') + '</td>' : '';
      const materialSummary = materials.length ? '材料已交 ' + received.length + ' / ' + materials.length + ' 项' : '无专项材料';
      const materialDetail = received.length ? '已交：' + received.map(([,label]) => label).join('、') : missing[0] || '基础资料已填写';
      return '<tr data-ot-person="' + i + '" class="' + (expanded.has(i) ? 'ot-is-expanded' : '') + '"><td class="ot-toggle-col"><button type="button" class="ot-expand" data-ot-expand="' + i + '" aria-label="' + (expanded.has(i) ? '收起' : '展开') + esc(p.name) + '全部资料" aria-expanded="' + expanded.has(i) + '" aria-controls="ot-detail-' + i + '"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg></button></td><td>' + text(p.name,'ot-name') + text(p.category,'ot-muted') + (p.birthday ? text(p.birthday,'ot-muted') : '') + '</td><td>' + docLines.map((line,n) => text(line,n ? 'ot-muted' : '')).join('') + '</td><td>' + text(p.phone || p.guardianPhone || '未填写',p.phone || p.guardianPhone ? '' : 'ot-muted') + (p.guardian ? text('监护人：' + p.guardian,'ot-muted') : p.emergencyName ? text('紧急联系人：' + p.emergencyName,'ot-muted') : '') + (p.guardianPhone || p.emergencyPhone ? text(p.guardianPhone || p.emergencyPhone,'ot-muted') : '') + '</td><td>' + needHtml + '</td><td><span class="tag ' + (missing.length ? 'tag-orange' : 'tag-blue') + '">' + state + '</span>' + text(materialSummary,'ot-muted') + '<span class="ot-line ot-long ' + (received.length ? 'ot-muted' : 'ot-gap') + '" title="' + esc(materialDetail) + '">' + esc(materialDetail) + '</span></td>' + visa + '<td class="ot-action"><button type="button" class="table-action-primary" data-ot-edit="' + i + '" data-drawer-title="维护游客资料" aria-label="编辑' + esc(p.name) + '资料">编辑</button></td></tr>' + (expanded.has(i) ? '<tr id="ot-detail-' + i + '" class="ot-detail-row"><td colspan="' + heads.length + '">' + detailContent(p) + '</td></tr>' : '');
    }).join('') || '<tr><td colspan="' + heads.length + '" class="table-empty-cell">本单暂无游客名单</td></tr>';
  }
  function field(label, key, type = 'text', options) {
    const value = draft[key] || '', id = 'ot-' + key;
    let control = options ? '<select class="form-control" id="' + id + '" name="' + key + '">' + options.map(x => '<option' + (x === value ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>' : '<input class="form-control" id="' + id + '" name="' + key + '" type="' + type + '" value="' + esc(value) + '">';
    return '<div class="form-group"><label class="form-label" for="' + id + '">' + label + '</label>' + control + '</div>';
  }
  const grid = content => '<div class="form-grid ot-fields">' + content + '</div>';
  function materialContent() {
    return '<div class="ot-materials">' + materialItems(draft).map(([key,label]) => {
      const file = draft.materials[key];
      return '<div class="ot-material"><div>' + text(label) + text(file ? file.name + ' · ' + file.status : '未提交', 'ot-muted') + '</div><label class="btn btn-secondary ot-upload">' + (file ? '替换' : '上传') + '<input type="file" accept=".pdf,.png,.jpg,.jpeg" data-ot-file="' + key + '" aria-label="上传' + label + '"></label></div>';
    }).join('') + '</div>';
  }
  function visaContent() {
    if (!profile) return '';
    return '<div class="ot-visa-facts">' + text(profile[0] + ' / ' + profile[1]) + text(profile[2] + ' · ' + draft.visaStatus, 'ot-muted') + (draft.taskPending ? text(draft.taskPending, 'ot-gap') : '') + '</div>' + grid(field('办理方式','mode','text',['未选择'].concat(allowed)) + field('常住地','residence')) +
      '<div id="otVisaChange" hidden>' + grid(field('变更原因','reason') + '<div id="otVisaTask">' + field('原代办任务处理','task','text',['请选择','结束未开始任务并保留记录','申请撤回送签并保留原送签记录','保持任务待签证专员处理']) + '</div>') +
      '<label class="checkbox-row"><input type="checkbox" name="feeChanged"> 涉及签证费用调整</label><div id="otVisaFee" hidden><p class="ot-muted">原签证费用 ¥' + esc(draft.fee) + '</p>' + grid(field('申请调整金额','feeDelta','number')) + '<p class="ot-muted">审批通过前，订单金额保持不变。</p></div></div>' +
      '<div id="otMaterialContent">' + materialContent() + '</div>' +
      '<a class="ot-workbench" href="../tour/visa-processing.html?orderNo=' + encodeURIComponent(config.orderNo) + '">查看签证办理</a>' +
      (draft.history.length ? fold('办理方式变更记录（' + draft.history.length + '）', '<ul class="ot-history">' + draft.history.map(h => '<li><strong>' + esc(h.from + ' → ' + h.to) + '</strong>' + text(h.reason, 'ot-muted') + text(h.task + '；' + h.fee, 'ot-muted') + text(h.time, 'ot-muted') + '</li>').join('') + '</ul>') : '');
  }
  function populate() {
    error.hidden = true;
    document.getElementById('travelerDrawerSummary').textContent = draft.name + ' / ' + (project ? draft.count : draft.category) + ' / ' + config.orderNo;
    if (project) {
      form.innerHTML = section('分组需求', grid(field('交通需求','transport') + field('住宿需求','room') + field('特殊需求','preference'))) + '<p class="ot-muted">游客名单待导入</p>';
      return;
    }
    let base = field('证件类型','docType','text',['身份证','护照','港澳通行证','台湾通行证','其他证件']) + field('证件号码','docNo') + field('联系电话','phone','tel') + field('出生日期','birthday','date');
    let doc = field('英文姓名','englishName') + field('国籍','nationality') + field('签发地','issuedAt') + field('有效期至','expiresAt','date');
    form.innerHTML = section('基本资料', grid(base) + (draft.hasSavedDoc && !draft.docNo ? '<p class="ot-muted">已留存证件：' + esc(draft.savedIdentity) + '；未填写新号码时保留原资料。</p>' : '') + '<div id="otPassportFields"' + (draft.docType === '护照' ? '' : ' hidden') + '>' + grid(doc) + '</div>') +
      (minor ? section('监护人与学员', grid(field('监护人姓名','guardian') + field('监护人电话','guardianPhone','tel') + field('学校','school') + field('年级','grade'))) : '') +
      (profile ? fold('签证与材料', visaContent()) : materialItems(draft).length ? fold('材料', '<div id="otMaterialContent">' + materialContent() + '</div>') : '') +
      fold(config.productType === '单项服务' ? '交付资料' : '出行需求', grid(config.productType === '单项服务' ? field('资料回寄地址','address') + field('交付备注','preference') : field('紧急联系人','emergencyName') + field('紧急联系电话','emergencyPhone','tel') + field('房型偏好','room') + field('同住人','roommate') + field('餐食及其他需求','preference') + field('健康及照顾需求','health') + (config.productType === '专列' ? field('上下车站','boarding') + field('铺位偏好','trafficPreference') : '')) + (draft.resource ? '<p class="ot-muted">当前资源安排：' + esc(draft.resource) + '</p>' : ''));
  }
  function open(index) {
    current = rows[index]; if (!current) return;
    draft = JSON.parse(JSON.stringify(current)); dirty = false;
    document.getElementById('travelerDrawerTitle').textContent = project ? '维护分组需求' : '维护游客资料';
    save.hidden = false; populate();
    window.caesarUI.openLayer(drawer);
  }
  function openPicker() {
    if (rows.length === 1) return open(0);
    current = null; dirty = false; save.hidden = true; error.hidden = true;
    document.getElementById('travelerDrawerTitle').textContent = project ? '项目名单' : '游客资料';
    document.getElementById('travelerDrawerSummary').textContent = config.orderNo;
    form.innerHTML = rows.length ? '<div class="ot-picker">' + rows.map((p,i) => '<button type="button" class="btn btn-secondary" data-ot-edit="' + i + '">' + esc(p.name) + ' · ' + (project ? esc(p.count) : esc(gaps(p)[0] || '资料已填写')) + '</button>').join('') + '</div>' : '<p>本单暂无游客名单</p>';
    window.caesarUI.openLayer(drawer);
  }
  function syncChanges() {
    if (!draft || !current) return;
    const change = document.getElementById('otVisaChange');
    if (change) {
      change.hidden = draft.mode === current.mode;
      document.getElementById('otVisaTask').hidden = !(current.mode === '随团代办' && draft.mode !== '随团代办');
      const flag = form.elements.feeChanged;
      document.getElementById('otVisaFee').hidden = !flag.checked;
    }
  }
  function showError(message, name) {
    error.textContent = message; error.hidden = false;
    const control = name && form.elements[name];
    if (control) { control.closest('details')?.setAttribute('open',''); control.setAttribute('aria-invalid','true'); control.focus(); }
  }
  function submit() {
    if (!current) return;
    error.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
    if (!project) {
      if (draft.docNo && !/^[A-Za-z0-9 -]{5,30}$/.test(draft.docNo)) return showError('请核对证件号码，不能包含星号或说明文字。','docNo');
      for (const key of ['phone','guardianPhone','emergencyPhone']) {
        if (draft[key] && draft[key] !== current[key] && !/^\+?[\d ()-]{7,24}$/.test(draft[key])) return showError('请填写有效的联系电话。',key);
      }
      if (draft.birthday && draft.birthday > new Date().toISOString().slice(0,10)) return showError('出生日期不能晚于今天。','birthday');
      if (profile && draft.mode !== current.mode) {
        if (!draft.reason || !draft.reason.trim()) return showError('请填写签证办理方式变更原因。','reason');
        if (current.mode === '随团代办' && (!draft.task || draft.task === '请选择')) return showError('请选择原代办任务处理方式。','task');
        const feeChanged = form.elements.feeChanged.checked, delta = Number(draft.feeDelta);
        if (feeChanged && (!Number.isFinite(delta) || !delta || Math.abs(delta * 100 - Math.round(delta * 100)) > 0.000001)) return showError('请填写非零调整金额，最多两位小数。','feeDelta');
        draft.history.unshift({name:draft.name,from:current.mode,to:draft.mode,reason:draft.reason.trim(),task:current.mode === '随团代办' ? draft.task : '不涉及原代办任务',fee:feeChanged ? '申请调整 ¥' + delta.toFixed(2) + '，待审批' : '订单价格不变',time:new Date().toLocaleString('zh-CN')});
        draft.taskPending = current.mode === '随团代办' ? '原代办任务待签证专员处理' : current.taskPending;
        draft.visaStatus = draft.mode === '随团代办' ? '材料收集中' : draft.mode === '游客自办' ? '证件待核验' : '待选择';
      }
    }
    delete draft.reason; delete draft.task; delete draft.feeDelta;
    Object.assign(current, draft); dirty = false;
    render(); window.caesarUI.closeLayer(drawer); window.caesarUI.toast('已保存' + current.name + '的资料');
    document.querySelector('[data-ot-edit="' + rows.indexOf(current) + '"]')?.focus();
  }
  document.getElementById('travelerTableRows').addEventListener('click', event => {
    const toggle = event.target.closest('[data-ot-expand]');
    if (toggle) { const i = Number(toggle.dataset.otExpand); expanded.has(i) ? expanded.delete(i) : expanded.add(i); render(); document.querySelector('[data-ot-expand="' + i + '"]')?.focus(); return; }
    const button = event.target.closest('[data-ot-edit]'); if (button) { lastTrigger = button; open(Number(button.dataset.otEdit)); }
  });
  form.addEventListener('click', event => {
    const button = event.target.closest('[data-ot-edit]'); if (button) open(Number(button.dataset.otEdit));
  });
  form.addEventListener('submit', event => {event.preventDefault();submit();});
  form.addEventListener('input', event => {
    const input = event.target; if (!draft || !input.name) return;
    if (input.type !== 'checkbox') draft[input.name] = input.value;
    dirty = true; syncChanges();
  });
  form.addEventListener('change', event => {
    const input = event.target;
    if (input.name === 'docType') {
      document.getElementById('otPassportFields').hidden = input.value !== '护照';
      if (input.value !== current.docType) { draft.hasSavedDoc = false; draft.docNo = ''; form.elements.docNo.value = ''; }
    }
    if (input.name === 'mode') { document.getElementById('otMaterialContent').innerHTML = materialContent(); syncChanges(); }
    if (!input.dataset.otFile || !input.files.length) return;
    const file = input.files[0];
    if (!/\.(pdf|png|jpe?g)$/i.test(file.name) || file.size > 10 * 1024 * 1024) { showError('请上传不超过10MB的PDF或图片。'); input.value = ''; return; }
    draft.materials[input.dataset.otFile] = {name:file.name,status:'待审核'}; dirty = true; error.hidden = true;
    document.getElementById('otMaterialContent').innerHTML = materialContent();
  });
  save.addEventListener('click', submit);
  // Preserve unsaved edits for close button, mask and Escape without changing shared drawers.
  document.body.insertAdjacentHTML('beforeend','<div id="otDiscard" class="modal-overlay" aria-hidden="true"><div class="modal modal-sm modal-confirm" role="dialog" aria-modal="true" aria-labelledby="otDiscardTitle"><div class="modal-header"><h2 id="otDiscardTitle" class="modal-title">放弃未保存的修改？</h2></div><div class="modal-body">当前游客的资料尚未保存。</div><div class="modal-footer"><button type="button" class="btn btn-secondary" id="otKeep">继续编辑</button><button type="button" class="btn btn-primary" id="otDrop">放弃修改</button></div></div></div>');
  const discard = document.getElementById('otDiscard');
  const requestClose = () => { if (!dirty) return false; pendingClose = true; window.caesarUI.openLayer(discard); return true; };
  document.addEventListener('click', event => {
    if (drawer.classList.contains('show') && (event.target === drawer || event.target.closest('#travelerDrawer [data-close-modal]')) && requestClose()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && pendingClose) { event.preventDefault(); event.stopImmediatePropagation(); window.caesarUI.closeLayer(discard); pendingClose = false; }
    else if (event.key === 'Escape' && drawer.classList.contains('show') && requestClose()) {event.preventDefault();event.stopImmediatePropagation();}
  }, true);
  document.getElementById('otKeep').onclick = () => {pendingClose=false;window.caesarUI.closeLayer(discard);};
  document.getElementById('otDrop').onclick = () => {pendingClose=false;dirty=false;window.caesarUI.closeLayer(discard);window.caesarUI.closeLayer(drawer);lastTrigger?.focus();};
  window.addEventListener('beforeunload', event => {if(dirty){event.preventDefault();event.returnValue='';}});
  window.OrderTravelers = {render,openPicker};
  render();
})();
