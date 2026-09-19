(function () {
  'use strict';

  var storageKey = 'caesarLeaderPrototypeRecordsV1';
  var seed = [
    {
      id: 'LD-20260312001', name: '张建国', phone: '13800004521', identity: '110101197805120018', type: '全职', status: '空闲', languages: '英语、法语', destinations: '欧洲、英国、地中海邮轮', guideNo: 'D-CAISSA-20260312', guideExpiry: '2027-05-31', passportNo: 'EJ1234567', passportExpiry: '2031-08-18', bank: '招商银行北京分行', bankAccount: '6225000000004521', bankStatus: '已校验', certificateHistory: [],
      history: [
        { schedule: 'EU20240715001', depart: '2024-07-15', back: '2024-07-26', product: '欧洲十国经典游', destination: '法国、德国、意大利', role: '全程领队', result: '计划派团' },
        { schedule: 'EU-UKI-20260716-001', depart: '2026-07-05', back: '2026-07-16', product: '英国爱尔兰12日', destination: '英国、爱尔兰', role: '全程领队', result: '实际带团' },
        { schedule: 'CR-MED-20250618-001', depart: '2026-06-18', back: '2026-06-25', product: '理想号地中海邮轮', destination: '地中海邮轮', role: '邮轮领队', result: '实际带团' },
        { schedule: 'EU-SWI-20250516-002', depart: '2026-05-16', back: '2026-05-28', product: '瑞士意大利13日', destination: '瑞士、意大利', role: '全程领队', result: '实际带团' },
        { schedule: 'EU-FRA-20260720-001', depart: '2026-10-20', back: '2026-11-01', product: '欧洲十国经典游', destination: '法国、德国、意大利', role: '全程领队', result: '计划派团' },
        { schedule: 'EU-FRA-20260410-002', depart: '2026-04-10', back: '2026-04-22', product: '欧洲十国经典游', destination: '法国、德国、意大利', role: '全程领队', result: '取消派团' },
        { schedule: 'EU-DE-20260312-002', depart: '2026-03-12', back: '2026-03-20', product: '德国深度9日', destination: '德国', role: '全程领队', result: '更换领队' }
      ],
      reviews: [
        { schedule: 'EU-UKI-20260716-001', date: '2026-07-20', source: '游客回访问卷', score: 4.8, status: '已复核', note: '服务评价正常' },
        { schedule: 'CR-MED-20250618-001', date: '2026-07-02', source: '游客投诉', score: null, status: '争议待复核', note: '岸上游改期责任待核对' }
      ]
    },
    { id: 'LD-20260418007', name: '李梅', phone: '13900008027', identity: '110101198004180027', type: '外聘', status: '不可用', languages: '英语、德语', destinations: '欧洲、英国、研学', guideNo: 'D-CAISSA-20260418', guideExpiry: '2026-07-15', passportNo: 'EK7654321', passportExpiry: '2028-03-15', bank: '民生银行北京分行', bankAccount: '6226000000008027', bankStatus: '待校验', certificateHistory: [], history: [{ schedule: 'ST-SG-20250812-001', depart: '2026-08-12', back: '2026-08-20', product: '新加坡研学', destination: '新加坡', role: '研学领队', result: '取消派团' }], reviews: [] },
    { id: 'LD-20260509012', name: '王强', phone: '13600000198', identity: '110101198205090036', type: '全职', status: '在途', languages: '英语、日语', destinations: '地中海邮轮、东南亚、日本', guideNo: 'D-CAISSA-20260509', guideExpiry: '2028-03-20', passportNo: 'EL0101980', passportExpiry: '2029-09-30', bank: '工商银行北京分行', bankAccount: '6222000000000198', bankStatus: '已校验', certificateHistory: [], history: [{ schedule: 'CR-MED-20250803-001', depart: '2026-07-08', back: '2026-07-18', product: '理想号地中海邮轮', destination: '地中海邮轮', role: '邮轮领队', result: '实际带团' }], reviews: [{ schedule: 'CR-MED-20250803-001', date: '2026-07-23', source: '游客回访问卷', score: 4.9, status: '已复核', note: '服务评价正常' }] },
    { id: 'LD-20260601009', name: '赵明', phone: '13700005612', identity: '110101198606010044', type: '外聘', status: '空闲', languages: '英语', destinations: '专列、国内、英国', guideNo: 'D-CAISSA-20260601', guideExpiry: '2028-01-12', passportNo: 'EM5600123', passportExpiry: '2030-01-12', bank: '招商银行北京分行', bankAccount: '6225000000005612', bankStatus: '已校验', certificateHistory: [], history: [{ schedule: 'TR-SILK-20250815-001', depart: '2026-06-08', back: '2026-06-20', product: '丝路专列', destination: '国内', role: '随车领队', result: '实际带团' }], reviews: [{ schedule: 'TR-SILK-20250815-001', date: '2026-06-25', source: '团控复核', score: 4.7, status: '已复核', note: '服务评价正常' }] }
  ];

  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function load() {
    try {
      var saved = JSON.parse(window.sessionStorage.getItem(storageKey) || 'null');
      if (Array.isArray(saved)) return saved;
    } catch (error) {}
    return copy(seed);
  }
  function save(records) {
    try { window.sessionStorage.setItem(storageKey, JSON.stringify(records)); } catch (error) {}
  }
  function digits(value) { return String(value || '').replace(/[\s-]/g, '').toUpperCase(); }
  function duplicate(records, candidate, exceptId) {
    return records.find(function (item) {
      if (item.id === exceptId) return false;
      return ['identity', 'guideNo', 'passportNo'].some(function (field) {
        if (!candidate[field]) return false;
        var matchedCurrent = item[field] && digits(candidate[field]) === digits(item[field]);
        var type = { identity: '身份依据', guideNo: '导游证', passportNo: '护照' }[field];
        var matchedHistory = (item.certificateHistory || []).some(function (version) {
          return version.type === type && [version.oldNo, version.newNo].some(function (number) { return number && digits(candidate[field]) === digits(number); });
        });
        return matchedCurrent || matchedHistory;
      });
    }) || null;
  }
  function mask(value, tail) {
    var text = String(value || '');
    if (!text) return '未填写';
    return '****' + text.slice(-(tail || 4));
  }
  function actualCount(record) {
    return (record.history || []).filter(function (item) { return item.result === '实际带团'; }).length;
  }
  function filterHistory(record, criteria) {
    criteria = criteria || {};
    var destination = String(criteria.destination || '').trim().toLowerCase();
    var product = String(criteria.product || '').trim().toLowerCase();
    return (record.history || []).filter(function (item) {
      return (!destination || String(item.destination || '').toLowerCase().includes(destination)) &&
        (!product || String(item.product || '').toLowerCase().includes(product)) &&
        (!criteria.start || item.depart >= criteria.start) && (!criteria.end || item.depart <= criteria.end);
    }).sort(function (a, b) { return b.depart.localeCompare(a.depart); });
  }
  function historyCsv(record, history) {
    var columns = ['领队', '来源团号', '出发日期', '回团日期', '产品', '目的地', '担任角色', '结果'];
    var rows = (history || []).map(function (item) { return [record.name, item.schedule, item.depart, item.back, item.product, item.destination, item.role, item.result]; });
    return '\uFEFF' + [columns].concat(rows).map(function (row) {
      return row.map(function (value) {
        var text = String(value || '');
        if (/^[=+@-]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\r\n');
  }
  window.CaesarLeaderPrototype = { load: load, save: save, duplicate: duplicate, mask: mask, actualCount: actualCount, filterHistory: filterHistory, historyCsv: historyCsv };
})();
