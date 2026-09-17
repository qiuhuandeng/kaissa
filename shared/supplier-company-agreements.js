/* 公司合作协议原型样例。仅供当前页面表达业务，不读取或回写其他页面。 */
(function (root) {
  'use strict';
  var reviewDate = '2026-09-17';
  var records = [
    { no: 'AGR-EU-BJ-026', supplier: '欧洲联合地接社', company: '北京凯撒', name: '欧洲地接年度合作协议', service: '欧洲地接及完整线路', start: '2026-01-01', end: '2026-12-31', event: '出票确认', days: 30, status: '有效' },
    { no: 'AGR-EU-SH-016', supplier: '欧洲联合地接社', company: '上海凯撒', name: '欧洲地接年度合作协议', service: '欧洲地接及完整线路', start: '2026-01-01', end: '2026-12-31', event: '账单确认', days: 45, status: '有效' },
    { no: 'AGR-EU-SH-021', supplier: '欧洲联合地接社', company: '上海凯撒', name: '欧洲单团专项协议', service: '欧洲单团地接', start: '2026-06-01', end: '2026-12-31', event: '实际回团', days: 15, status: '有效' },
    { no: 'AGR-EU-BJ-027', supplier: '欧洲联合地接社', company: '北京凯撒', name: '欧洲地接新合作补充协议', service: '欧洲地接及完整线路', start: '2026-09-01', end: '2027-08-31', event: '账单确认', days: 60, status: '审批中' },
    { no: 'AGR-EU-FJ-015', supplier: '欧洲联合地接社', company: '福建凯撒', name: '欧洲地接原合作协议', service: '欧洲地接及完整线路', start: '2026-01-01', end: '2026-08-31', event: '账单确认', days: 30, status: '已到期' },
    { no: 'AGR-EU-FJ-028', supplier: '欧洲联合地接社', company: '福建凯撒', name: '欧洲地接续签协议', service: '欧洲地接及完整线路', start: '2026-09-01', end: '2027-08-31', event: '账单确认', days: 30, status: '有效' },
    { no: 'AGR-GL-BJ-012', supplier: '北京国旅地接部', company: '北京凯撒', name: '日韩线路合作协议', service: '日韩完整线路', start: '2026-01-01', end: '2026-12-31', event: '实际回团', days: 7, status: '有效' },
    { no: 'AGR-GL-FJ-013', supplier: '北京国旅地接部', company: '福建凯撒', name: '日韩线路合作协议', service: '日韩完整线路', start: '2026-01-01', end: '2026-12-31', event: '实际回团', days: 15, status: '有效' },
    { no: 'AGR-AIR-BJ-001', supplier: '中国国际航空', company: '北京凯撒', name: '航空资源年度合作协议', service: '国际机票采购；付款节点见采购合同', start: '2026-01-01', end: '2026-12-31', event: '出票确认', days: 30, status: '有效' },
    { no: 'AGR-AIR-FJ-001', supplier: '中国国际航空', company: '福建凯撒', name: '航空资源年度合作协议', service: '国际机票采购；付款节点见采购合同', start: '2026-01-01', end: '2026-12-31', event: '出票确认', days: 15, status: '有效' }
  ];
  records.forEach(function (a) {
    a.term = a.event + '后' + a.days + '天';
    a.department = '产品采购部'; a.owner = '王芳';
    a.tag = a.status === '有效' ? 'tag-green' : a.status === '审批中' ? 'tag-blue' : 'tag-gray';
  });
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function get(no) { return records.find(function (a) { return a.no === no; }); }
  function eligible(a, date) { date = date || reviewDate; return !!a && ['有效', '临期'].indexOf(a.status) >= 0 && a.start <= date && a.end >= date; }
  function list(supplier, company) { return records.filter(function (a) { return a.supplier === supplier && (!company || a.company === company); }); }
  function valid(no, supplier, company) { var a = get(no); return eligible(a) && a.supplier === supplier && a.company === company; }
  function usage(a) {
    if (eligible(a)) return '可新引用';
    if (a.end && a.end < reviewDate || a.status === '已到期') return '不可新引用；历史业务保留';
    return '未生效，不可新引用';
  }
  function options(supplier, company, selected) {
    var agreements = list(supplier, company);
    return '<option value="">请选择本次合作协议</option>' + agreements.map(function (a) {
      return '<option value="' + esc(a.no) + '"' + (eligible(a) ? '' : ' disabled') + (selected === a.no && eligible(a) ? ' selected' : '') + '>' + esc(a.no + ' · ' + a.name + ' · ' + a.term + (eligible(a) ? '' : '（' + a.status + '，不可新引用）')) + '</option>';
    }).join('');
  }
  function hint(supplier, company, no) {
    var a = get(no);
    if (valid(no, supplier, company)) return a.service + '；' + a.start + ' 至 ' + a.end + '；付款责任依据：' + a.company + '签约，' + a.term + '。';
    return list(supplier, company).some(function (a) { return eligible(a); }) ? '请按本次合作内容明确选择协议；其他公司协议不适用。' : '该公司暂无可新引用的合作协议，请先完成对应公司合作；原有成本及付款依据保留。';
  }
  function dueDate(a, eventDate) {
    if (!a || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate || '')) return '';
    var date = new Date(eventDate + 'T00:00:00Z');
    if (isNaN(date.getTime())) return '';
    date.setUTCDate(date.getUTCDate() + a.days);
    return date.toISOString().slice(0, 10);
  }
  function basisHtml(data) {
    var a = get(data.agreementNo), company = data.businessCompany || data.company || '待核实';
    var match = a && a.company === company && a.supplier === data.supplier;
    var lines = ['业务公司：' + company, '实际采购供应商：' + (data.supplier || '待核实')];
    if (data.contract) lines.push('采购合同／本次付款节点依据：' + data.contract);
    if (!match) {
      lines.push('合作协议：' + (a ? '与本次公司或供应商不符，待核对' : '待补核对') + '；原成本、应付及申请金额保留，不改用其他公司的协议。');
    } else {
      var due = dueDate(a, data.eventDate);
      lines.push('本次引用：' + a.no + ' · ' + a.name + '；合作范围：' + a.service);
      lines.push('签约及付款责任依据：' + a.company + '；付款执行公司：' + (data.paymentCompany || company) + '；代付安排另按批准依据处理。');
      lines.push('账期：' + a.term + '；起算日：' + (data.eventDate || '事件尚未确认') + '；应付日：' + (due || '起算事件确认后计算'));
      lines.push('引用日期：' + (data.usedOn || '待核对') + '；协议有效期：' + a.start + ' 至 ' + a.end + '；当前' + a.status);
      if (!eligible(a)) lines.push('当前不可新引用；本申请保留发生时的协议、成本和应付依据，到期存量处理待财务确认。');
      if (due && data.planDate && data.planDate < due) lines.push('计划付款早于应付日；请提交提前付款依据，由财务判断例外，不自动拒绝。');
      else if (!due) lines.push('本次付款按采购合同节点及审批依据核对；提前付款例外由财务确认。');
    }
    return lines.map(function (line) { return '<p class="form-hint">' + esc(line) + '</p>'; }).join('');
  }
  root.SupplierCompanyAgreements = { records: records, reviewDate: reviewDate, get: get, list: list, eligible: eligible, valid: valid, usage: usage, options: options, hint: hint, dueDate: dueDate, basisHtml: basisHtml };
})(typeof window === 'undefined' ? globalThis : window);
