(function () {
  var page = document.querySelector('[data-schedule-builder]');
  if (!page) return;
  var panels = page.querySelectorAll('[data-builder-panel]');
  var executionPanel = panels[1];
  if (!executionPanel) return;

  var section = document.createElement('section');
  section.className = 'schedule-builder-section schedule-visa-inherit-section';
  section.innerHTML = [
    '<div class="schedule-builder-section-head"><div><h2 class="schedule-builder-section-title">签证节点</h2><span class="schedule-muted">继承产品签证配置</span></div><a class="btn btn-secondary btn-sm" href="../resource/visa-library.html">查看签证国家</a></div>',
    '<div class="schedule-visa-source-grid">',
    '<div><span>办理国家</span><strong id="scheduleVisaCountry">法国</strong></div>',
    '<div><span>签证类型</span><strong id="scheduleVisaType">申根旅游签证</strong></div>',
    '<div><span>材料版本</span><strong id="scheduleVisaVersion">v6 / 2026-06-20</strong></div>',
    '<div><span>本人到场</span><strong id="scheduleVisaPresence">需要录指纹</strong></div>',
    '</div>',
    '<div class="schedule-builder-grid three">',
    '<div class="form-group"><label class="form-label" for="scheduleVisaRuleMode">规则来源</label><select id="scheduleVisaRuleMode" class="form-control"><option selected>继承产品规则</option><option>团期覆盖</option></select></div>',
    '<div class="form-group"><label class="form-label" for="scheduleVisaDeadlineDays">最晚提交（出发前N天）</label><input id="scheduleVisaDeadlineDays" class="form-control" type="number" min="1" value="21"></div>',
    '<div class="form-group"><label class="form-label" for="scheduleVisaDeadlineDate">材料截止日期</label><input id="scheduleVisaDeadlineDate" class="form-control" type="date" readonly></div>',
    '<div class="form-group"><label class="form-label" for="scheduleVisaReminderDate">首次催收日期</label><input id="scheduleVisaReminderDate" class="form-control" type="date" readonly></div>',
    '<div class="form-group schedule-builder-full"><label class="form-label" for="scheduleVisaOverrideReason">覆盖原因</label><textarea id="scheduleVisaOverrideReason" class="form-control" rows="2" placeholder="仅团期覆盖时填写，如签证中心高峰期、领区临时调整"></textarea></div>',
    '</div>'
  ].join('');

  var firstSection = executionPanel.querySelector('.schedule-builder-section');
  if (firstSection && firstSection.nextSibling) executionPanel.insertBefore(section, firstSection.nextSibling);
  else executionPanel.appendChild(section);

  var profiles = {
    outbound: ['法国', '申根旅游签证', 'v6 / 2026-06-20', '需要录指纹', 21],
    cruise: ['法国', '申根旅游签证', 'v6 / 2026-06-20', '需要录指纹', 21],
    free: ['法国', '申根旅游签证', 'v6 / 2026-06-20', '需要录指纹', 21],
    study: ['新加坡', '新加坡旅游电子签', 'v3 / 2026-05-26', '无需本人到场', 10]
  };

  function formatDate(date) {
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function activeType() {
    var button = page.querySelector('[data-schedule-type].active');
    return button ? button.dataset.scheduleType : 'outbound';
  }

  function syncDates() {
    var depart = new Date((document.getElementById('departDate').value || '') + 'T00:00:00');
    var days = Number(document.getElementById('scheduleVisaDeadlineDays').value || 0);
    if (Number.isNaN(depart.getTime()) || !days) return;
    var deadline = new Date(depart);
    deadline.setDate(deadline.getDate() - days);
    var reminder = new Date(deadline);
    reminder.setDate(reminder.getDate() - 7);
    document.getElementById('scheduleVisaDeadlineDate').value = formatDate(deadline);
    document.getElementById('scheduleVisaReminderDate').value = formatDate(reminder);
  }

  function syncType() {
    var type = activeType();
    var profile = profiles[type];
    section.hidden = !profile;
    if (!profile) return;
    document.getElementById('scheduleVisaCountry').textContent = profile[0];
    document.getElementById('scheduleVisaType').textContent = profile[1];
    document.getElementById('scheduleVisaVersion').textContent = profile[2];
    document.getElementById('scheduleVisaPresence').textContent = profile[3];
    document.getElementById('scheduleVisaDeadlineDays').value = profile[4];
    syncDates();
  }

  document.getElementById('departDate').addEventListener('change', syncDates);
  document.getElementById('scheduleVisaDeadlineDays').addEventListener('input', syncDates);
  page.querySelectorAll('[data-schedule-type]').forEach(function (button) {
    button.addEventListener('click', function () { window.setTimeout(syncType, 0); });
  });
  syncType();
})();
