(function (root) {
  'use strict';
  // 当前结算页的独立示例：应收已包含已批准优惠／退订调整，收款与退款为实际发生额。
  var examples = {
    EU20260818001: [
      { no: 'ORD6081800101', customer: '门店/小程序散客', people: '12人', receivable: 250000, received: 250000, refund: 0, discount: 4400, receiptNo: 'SK20260818001' },
      { no: 'ORD6081800102', customer: '华东同业', people: '10人', receivable: 136200, received: 104800, refund: 2000, discount: 2000, receiptNo: 'SK20260818002', refundNo: 'TK20260818002' }
    ],
    EU20240715001: [
      { no: 'KS20240715001', customer: '北京门店客户', people: '15人', receivable: 200000, received: 210000, refund: 10000, discount: 0, receiptNo: 'SK20240715001', refundNo: 'TK20240715001' },
      { no: 'KS20240715002', customer: '华北同业', people: '12人', receivable: 186200, received: 186200, refund: 0, discount: 0, receiptNo: 'SK20240715002' }
    ],
    'CR-MED-20250720-001': [
      { no: 'KSCR20250720001', customer: '上海邮轮同业', people: '118人', receivable: 2058000, received: 1520000, refund: 0, discount: 0, receiptNo: 'SKCR20250720001' }
    ],
    CZ20260912001: [
      { no: 'KSCZ20260912001', customer: '华东邮轮渠道', people: '19间', receivable: 758000, received: 711200, refund: 0, discount: 0, receiptNo: 'SKCZ20260912001' }
    ],
    'TR-SILK-20250805-001': [
      { no: 'KSTR20250805001', customer: '西北专列渠道', people: '92人', receivable: 1469000, received: 1248600, refund: 0, discount: 0, receiptNo: 'SKTR20250805001' }
    ],
    TR20260920001: [
      { no: 'KSTR20260920001', customer: '西安专列同业', people: '16铺', receivable: 368000, received: 336400, refund: 0, discount: 0, receiptNo: 'SKTR20260920001' }
    ],
    'PRJ-MICE-20260915-001': [
      { no: 'KSMICE20260704001', customer: '北京某科技有限公司', people: '80人', receivable: 1906000, received: 1524800, refund: 0, discount: 0, receiptNo: 'SKMICE20260915001' }
    ],
    'ST-SG-20250812-001': [
      { no: 'KSST20250812001', customer: '北京研学客户', people: '26人', receivable: 265200, received: 266400, refund: 1200, discount: 0, receiptNo: 'SKST20250812001', refundNo: 'TKST20250812001' }
    ],
    JP20260801001: [
      { no: 'KSJP20260801001', customer: '王女士家庭团', people: '8人', receivable: 72000, received: 0, refund: 0, discount: 0, receiptNo: '' },
      { no: 'KSJP20260801002', customer: '上海亲子同业', people: '10人', receivable: 90000, received: 0, refund: 0, discount: 0, receiptNo: '' }
    ]
  };
  function amount(value) { return Math.round(Number(value) * 100) / 100; }
  function rows(input) {
    return (input || []).map(function (source) {
      var row = Object.assign({}, source);
      row.ready = ['receivable', 'received', 'refund', 'discount'].every(function (key) {
        return source[key] !== '' && source[key] != null && Number.isFinite(Number(source[key])) && Number(source[key]) >= 0;
      }) && Number(source.refund) <= Number(source.received);
      ['receivable', 'received', 'refund', 'discount'].forEach(function (key) { row[key] = row.ready ? amount(source[key]) : 0; });
      row.netReceived = amount(row.received - row.refund);
      row.unreceived = Math.max(0, amount(row.receivable - row.netReceived));
      row.refundable = Math.max(0, amount(row.netReceived - row.receivable));
      row.balanceGap = amount(row.receivable - row.netReceived - row.unreceived + row.refundable);
      row.type = row.refund ? '含退款' : '订单';
      row.subject = '团费';
      return row;
    });
  }
  function totals(input) {
    var list = rows(input);
    var result = { ready: list.length > 0 && list.every(function (r) { return r.ready; }), count: list.length };
    ['receivable', 'received', 'refund', 'discount', 'netReceived', 'unreceived', 'refundable', 'balanceGap'].forEach(function (key) {
      result[key] = amount(list.reduce(function (sum, r) { return sum + r[key]; }, 0));
    });
    return result;
  }
  var api = { examples: examples, rows: rows, totals: totals };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SettlementIncomeBasis = api;
})(typeof window === 'object' ? window : globalThis);
