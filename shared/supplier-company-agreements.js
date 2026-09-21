/* 公司合作协议原型样例。仅供当前页面表达业务，不读取或回写其他页面。 */
(function (root) {
  'use strict';
  var reviewDate = '2026-09-21';
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
  // 同一份协议按签约公司分别引用；与供应商档案的多主体样例保持一致。
  [
    { no:'AGR-ABC-2026-01', supplier:'欧洲地接ABC', name:'亿步与体坛年度地接协议', start:'2026-01-01', end:'2026-08-31', status:'已到期', service:'旅游产品及地接服务', bodies:[{company:'亿步',kind:'月结',monthRule:''},{company:'体坛',kind:'月结',monthRule:''}] },
    { no:'AGR-ABC-2026-02', supplier:'欧洲地接ABC', name:'山西分公司单团合作协议', start:'2026-01-01', end:'2026-12-31', status:'有效', service:'旅游产品及地接服务', bodies:[{company:'亿步山西分公司',kind:'事件后付款',event:'实际回团',days:3}] }
  ].forEach(function (agreement) {
    agreement.bodies.forEach(function(body) {
      records.push(Object.assign({}, agreement, body, {bodies:undefined}));
    });
  });
  records.forEach(function (a) {
    a.kind = a.kind || '事件后付款';
    a.term = term(a);
    a.department = '产品采购部'; a.owner = '王芳';
    a.tag = a.status === '有效' ? 'tag-green' : a.status === '审批中' ? 'tag-blue' : 'tag-gray';
  });
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function get(no, company) {
    var matches = records.filter(function(a) { return a.no === no && (!company || a.company === company); });
    return matches.length === 1 ? matches[0] : undefined;
  }
  function eligible(a, date) { date = date || reviewDate; return !!a && ['有效', '临期'].indexOf(a.status) >= 0 && a.start <= date && a.end >= date; }
  function list(supplier, company) { return records.filter(function (a) { return a.supplier === supplier && a.company === company; }); }
  function valid(no, supplier, company) { var a = get(no, company); return eligible(a) && a.supplier === supplier && a.company === company; }
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
    var a = get(no, company);
    if (valid(no, supplier, company)) return a.service + '；' + a.start + ' 至 ' + a.end + '；付款责任依据：' + a.company + '签约，' + a.term + '。';
    return list(supplier, company).some(function (a) { return eligible(a); }) ? '请按本次合作内容明确选择协议；其他公司协议不适用。' : '该公司暂无可新引用的合作协议，请先完成对应公司合作；原有成本及付款依据保留。';
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    var date = new Date(value + 'T00:00:00Z');
    return !isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
  }
  function term(a) {
    if (!a) return '待确认';
    if (a.kind === '月结') return '月结；' + (a.monthRule || '结算日及付款日待确认');
    if (a.kind === '其他约定') return a.otherRule || '其他约定待确认';
    if (a.kind && a.kind !== '事件后付款') return '账期类型待确认';
    return a.event && a.days !== '' && a.days != null && Number.isInteger(Number(a.days)) && Number(a.days) >= 0
      ? a.event + '后' + Number(a.days) + '天' : '起算事件或天数待确认';
  }
  function dueDate(a, eventDate) {
    if (!a || a.kind && a.kind !== '事件后付款' || !a.event || a.days === '' || a.days == null || !Number.isInteger(Number(a.days)) || Number(a.days) < 0 || !validDate(eventDate)) return '';
    var date = new Date(eventDate + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + Number(a.days));
    return !isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '';
  }
  function capture(data) {
    var a = data.originalAgreement || get(data.agreementNo, data.businessCompany || data.company);
    if (!a || a.no !== data.agreementNo || a.company !== (data.businessCompany || data.company) || a.supplier !== data.supplier) return null;
    var result = {};
    ['no','supplier','company','name','service','start','end','status','kind','event','days','monthRule','otherRule'].forEach(function(key) { if(a[key] !== undefined) result[key] = a[key]; });
    return result;
  }
  function paymentBasis(data) {
    var company = data.businessCompany || data.company || '待核实';
    var a = capture(data), due = '', warnings = [];
    var rows = [['业务公司',company],['实际采购供应商',data.supplier || '待核实'],['付款执行公司',data.paymentCompany || '待核实']];
    if (data.contract) rows.push(['采购合同／付款节点',data.contract]);
    if (!a) {
      rows.push(['本次引用协议',data.agreementNo || '待补核对'],['账期','待确认'],['应付日','待确认']);
      warnings.push(data.agreementNo ? '合作协议与本次公司或供应商不符，或协议资料未找到，请核对原单据；不改用其他公司的协议。' : '本单尚未登记公司合作协议，账期待核对；原成本、应付及申请金额保留。');
      return {rows:rows,warnings:warnings,dueDate:'',matched:false};
    }
    rows.push(['本次引用',a.no + ' · ' + a.name],['签约主体',a.company],['合作范围',a.service || '待确认'],['账期',term(a)]);
    if (!['有效','临期','已到期'].includes(a.status)) {
      rows.push(['应付日','待确认']);
      warnings.push('本次协议尚未确认生效，账期仅供核对，不能据此确认付款日期。');
      return {rows:rows,warnings:warnings,dueDate:'',matched:true};
    }
    if (a.kind === '月结') {
      rows.push(['结算月份',/^\d{4}-(0[1-9]|1[0-2])$/.test(data.statementMonth || '') ? data.statementMonth : '待确认']);
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(data.statementMonth || '') && data.statementConfirmed === true && validDate(data.statementDueDate) && data.statementBasis) {
        due = data.statementDueDate;
        rows.push(['本期付款日期依据',data.statementBasis]);
      } else warnings.push('月结不等于固定30天；本期结算和付款日期待核对，不按回团日推算。');
    } else if (!a.kind || a.kind === '事件后付款') {
      var eventMatches = !data.eventName || data.eventName === a.event;
      var eventReady = data.eventConfirmed !== false && eventMatches && validDate(data.eventDate);
      rows.push(['起算事件',a.event || '待确认'],['起算日',eventReady ? data.eventDate : '待确认']);
      if (eventReady) due = dueDate(a,data.eventDate);
      if (!eventReady) warnings.push(eventMatches ? '起算资料尚未确认或日期无效，不能推算应付日。' : '起算资料与协议约定事件不一致，不能用其他日期代替。');
      if (eventReady && !due) warnings.push('协议起算事件或天数待确认，不能推算应付日。');
    } else warnings.push('按本次协议的具体付款约定核对，未明确日期时不推算应付日。');
    rows.push(['应付日',due || '待确认'],['计划付款日',validDate(data.planDate) ? data.planDate : '待确认'],['引用日期',validDate(data.usedOn) ? data.usedOn : '待核对'],['协议有效期',a.start + ' 至 ' + a.end]);
    if (!eligible(a)) warnings.push('当前不可新引用；本申请保留发生时的协议、成本和应付依据，到期存量处理待财务确认。');
    if (validDate(data.usedOn) && (data.usedOn < a.start || data.usedOn > a.end)) warnings.push('引用日期不在原协议有效期内，请核对发生时的合作依据。');
    if (due && validDate(data.planDate) && data.planDate < due) warnings.push('计划付款早于应付日；请提交提前付款依据，由财务判断例外，不自动拒绝。');
    if (data.paymentCompany && data.paymentCompany !== company) warnings.push('付款执行公司与业务公司不同，代付安排须按批准依据核对。');
    return {rows:rows,warnings:warnings,dueDate:due,matched:true};
  }
  function basisHtml(data) {
    var result = paymentBasis(data);
    return '<div class="supplier-payment-basis"><dl class="supplier-payment-fields">' + result.rows.map(function(row) {
      return '<div><dt>'+esc(row[0])+'</dt><dd>'+esc(row[1])+'</dd></div>';
    }).join('') + '</dl>' + result.warnings.map(function(line) { return '<p class="form-hint">'+esc(line)+'</p>'; }).join('') + '</div>';
  }
  // 当前页面独立付款样例；同一协议两个公司月结，另一协议为回团后3天。
  function paymentExamples() {
    return [
      {key:'YB',company:'亿步',agreementNo:'AGR-ABC-2026-01',amount:12000,eventDate:'',statementMonth:'2026-07',node:'7月地接结算款'},
      {key:'TT',company:'体坛',agreementNo:'AGR-ABC-2026-01',amount:18000,eventDate:'',statementMonth:'2026-07',node:'7月地接结算款'},
      {key:'SX',company:'亿步山西分公司',agreementNo:'AGR-ABC-2026-02',amount:9000,eventDate:'2026-07-28',node:'单团地接尾款'},
      {key:'WAIT',company:'亿步山西分公司',agreementNo:'AGR-ABC-2026-02',amount:6000,eventDate:'',node:'单团地接付款'}
    ].map(function(item) {
      item.supplier = '欧洲地接ABC'; item.businessCompany=item.company; item.paymentCompany=item.company;
      item.applyNo='FK-ABC-20260730-'+item.key; item.approvalNo='APR-ABC-20260730-'+item.key;
      item.contract='HT-ABC-2026-'+item.key;item.usedOn='2026-07-01';item.planDate='2026-07-30';
      item.eventName=item.key === 'SX' || item.key === 'WAIT' ? '实际回团' : '';
      item.originalAgreement=capture(item);
      return item;
    });
  }
  root.SupplierCompanyAgreements = { records:records, reviewDate:reviewDate, get:get, list:list, eligible:eligible, valid:valid, usage:usage, options:options, hint:hint, dueDate:dueDate, basisHtml:basisHtml, term:term, validDate:validDate, capture:capture, paymentBasis:paymentBasis, paymentExamples:paymentExamples };
})(typeof window === 'undefined' ? globalThis : window);
