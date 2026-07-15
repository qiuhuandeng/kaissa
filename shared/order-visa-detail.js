(function () {
  'use strict';

  var section = document.getElementById('orderVisaSection');
  var travelerRows = document.getElementById('travelerTableRows');
  if (!section || !travelerRows) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function getProfile(productName) {
    if (/专列|境内|国内/.test(productName)) return null;
    if (/日本签证/.test(productName)) {
      return {
        country: '日本', type: '个人旅游签证', version: '材料版本v4', deadline: '2026-07-10', days: '出发前15天',
        districts: ['广州领区', '广州领区'], residences: ['广东深圳', '广东广州'], totals: [10, 10], completed: [8, 10], statuses: ['材料收集中', '待送签']
      };
    }
    if (/新加坡/.test(productName)) {
      return {
        country: '新加坡', type: '旅游电子签', version: '材料版本v3', deadline: '2025-08-02', days: '出发前10天',
        districts: ['北京领区', '北京领区'], residences: ['北京', '河北石家庄'], totals: [8, 8], completed: [6, 8], statuses: ['材料收集中', '待送签']
      };
    }
    return {
      country: '法国', type: '申根旅游签证', version: '材料版本v6', deadline: '2026-06-24', days: '出发前21天',
      districts: ['北京领区', '上海领区'], residences: ['北京', '江苏南京'], totals: [12, 12], completed: [8, 10], statuses: ['材料收集中', '材料收集中']
    };
  }

  function statusTag(status) {
    var className = status === '待送签' ? 'tag tag-blue' : 'tag tag-orange';
    return '<span class="' + className + '">' + escapeHtml(status) + '</span>';
  }

  var productName = document.getElementById('orderProductName').textContent.trim();
  var orderNo = document.getElementById('orderNo').textContent.trim();
  var productTags = document.getElementById('orderHeroTags').textContent;
  if (/单团项目/.test(productTags)) return;
  var profile = getProfile(productName);
  if (!profile) return;

  var names = Array.prototype.map.call(travelerRows.querySelectorAll('tr'), function (row) {
    var cell = row.querySelector('td');
    return cell ? cell.textContent.trim() : '';
  }).filter(Boolean);
  if (!names.length) return;

  section.hidden = false;
  document.getElementById('orderVisaContext').textContent = profile.country + ' / ' + profile.type + ' / ' + profile.version;
  document.getElementById('orderVisaWorkbenchLink').href = '../tour/visa-processing.html?orderNo=' + encodeURIComponent(orderNo);
  document.getElementById('orderVisaSummary').innerHTML = [
    ['办理方式', '旅行社代办'],
    ['规则来源', '产品签证方案'],
    ['材料截止', profile.deadline],
    ['截止口径', profile.days]
  ].map(function (item) {
    return '<div><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(item[1]) + '</strong></div>';
  }).join('');

  document.getElementById('orderVisaRows').innerHTML = names.map(function (name, index) {
    var district = profile.districts[index] || profile.districts[0];
    var residence = profile.residences[index] || profile.residences[0];
    var total = profile.totals[index] || profile.totals[0];
    var completed = profile.completed[index] == null ? profile.completed[0] : profile.completed[index];
    var status = profile.statuses[index] || profile.statuses[0];
    return '<tr>' +
      '<td><strong>' + escapeHtml(name) + '</strong></td>' +
      '<td><div class="table-cell-main"><strong>' + escapeHtml(residence) + '</strong><span>' + escapeHtml(district) + '</span></div></td>' +
      '<td><div class="table-cell-main"><strong>' + escapeHtml(profile.country + ' / ' + profile.type) + '</strong><span>' + escapeHtml(profile.version) + '</span></div></td>' +
      '<td><strong>' + completed + '/' + total + '项</strong></td>' +
      '<td>' + escapeHtml(profile.deadline) + '</td>' +
      '<td>' + statusTag(status) + '</td>' +
      '<td><button class="table-action-primary" type="button" data-open-drawer="travelerDrawer" data-traveler-mode="material" data-traveler-name="' + escapeHtml(name) + '">维护资料</button></td>' +
      '</tr>';
  }).join('');
})();
