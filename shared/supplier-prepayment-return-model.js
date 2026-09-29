/* 外采供应商预付款退回：金额均以分计算，原付款记录只读保留。 */
(function (root) {
  'use strict';

  var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  var cents = function (value) {
    var text = String(value == null ? '' : value).trim();
    if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(text)) throw Error('金额须为非负数，最多两位小数');
    var amount = Math.round(Number(text) * 100);
    if (!Number.isSafeInteger(amount) || amount > 99999999999) throw Error('金额超出范围');
    return amount;
  };
  var sum = function (items, field) {
    return items.reduce(function (total, item) { return total + cents(item[field] || 0); }, 0);
  };

  function seed(scenario) {
    var record = {
      id: 'PP-GRD-20260918001',
      applicationId: 'RET-PP-20260929001',
      approved: true,
      company: '福建凯撒',
      supplier: '北京国旅地接部',
      supplierType: '地接',
      currency: 'CNY',
      account: '中国银行北京分行 · 6688',
      business: '日本关西深度游 / JP20260908003',
      source: '外采成本预付申请 FK-PP-20260918001',
      invoiceStatus: '未开票',
      refundAccount: '福建凯撒 / 工商银行 · 0888（已核准）',
      version: 1,
      payments: [
        { id: 'PAY-PP-20260918001', date: '2026-09-18', amount: 50000, state: '已付款', offset: 20000, returned: 0, account: '中国银行北京分行 · 6688' },
        { id: 'PAY-PP-20260922002', date: '2026-09-22', amount: 30000, state: '已付款', offset: 5000, returned: 0, account: '中国银行北京分行 · 6688' },
        { id: 'PAY-PP-20260926003', date: '-', amount: 15000, state: '付款中', offset: 0, returned: 0, account: '中国银行北京分行 · 6688' },
        { id: 'PAY-PP-20260912004', date: '2026-09-12', amount: 12000, state: '已付款', offset: 12000, returned: 0, account: '中国银行北京分行 · 6688' },
        { id: 'PAY-PP-20260910005', date: '2026-09-10', amount: 6000, state: '已付款', offset: 0, returned: 0, account: '中国银行北京分行 · 6688' }
      ],
      applications: [
        { id: 'RET-PP-20260924001', createdAt: '2026-09-24 09:30', reason: '酒店房量减少，退回多付定金', status: '已到账', lines: [{ paymentId: 'PAY-PP-20260922002', amount: 2000 }], proof: { reference: 'SUP-REF-0924', date: '2026-09-24', file: '定金退回回单.pdf', amount: 2000 }, receipts: [{ flowId: 'CMB-IN-20260924001', date: '2026-09-24', amount: 2000, lines: [{ paymentId: 'PAY-PP-20260922002', amount: 2000 }], basis: '银行流水已核对' }] },
        { id: 'RET-PP-20260915001', createdAt: '2026-09-15 09:00', reason: '取消预订，全额退回', status: '已到账', lines: [{ paymentId: 'PAY-PP-20260910005', amount: 6000 }], proof: { reference: 'SUP-REF-0915', date: '2026-09-15', file: '取消预订回单.pdf', amount: 6000 }, receipts: [{ flowId: 'CMB-IN-20260915001', date: '2026-09-15', amount: 6000, lines: [{ paymentId: 'PAY-PP-20260910005', amount: 6000 }], basis: '银行流水已核对' }] }
      ],
      flows: [
        { id: 'CMB-IN-20260929001', amount: 6000, date: '2026-09-29', company: '福建凯撒', supplier: '北京国旅地接部', currency: 'CNY', direction: '收入', used: false },
        { id: 'CMB-IN-20260930002', amount: 7000, date: '2026-09-30', company: '福建凯撒', supplier: '北京国旅地接部', currency: 'CNY', direction: '收入', used: false },
        { id: 'CMB-IN-20260930003', amount: 5000, date: '2026-09-30', company: '北京凯撒', supplier: '北京国旅地接部', currency: 'CNY', direction: '收入', used: false }
      ],
      logs: []
    };
    record.payments.forEach(function (p) { p.reference = p.state === '已付款' ? 'BANK-' + p.id.slice(4) : '尚无成功付款流水'; });
    if (scenario === 'invoiced') record.invoiceStatus = '已开票';
    if (scenario === 'foreign') record.currency = 'EUR';
    if (scenario === 'unapproved') record.approved = false;
    return record;
  }

  function createSession(role, scenario) {
    if (['merchant', 'supplier', 'finance', 'workflow'].indexOf(role) < 0) throw Error('无效的办理角色');
    var record = typeof scenario === 'object' ? clone(scenario) : seed(scenario);
    var sequence = 0;
    var initializing = false;

    function application(id) { return id ? record.applications.find(function (item) { return item.id === id; }) : record.applications[0] || null; }
    function receivedFor(paymentId) {
      return record.applications.reduce(function (total, item) {
        return total + item.receipts.reduce(function (receiptTotal, receipt) {
          var line = receipt.lines.find(function (value) { return value.paymentId === paymentId; });
          return receiptTotal + cents(line ? line.amount : 0);
        }, 0);
      }, 0) / 100;
    }
    function occupiedFor(paymentId) {
      return record.applications.filter(function (item) { return item.status !== '已撤销'; }).reduce(function (total, item) {
        var line = item.lines.find(function (value) { return value.paymentId === paymentId; });
        var received = item.receipts.reduce(function (receivedTotal, receipt) {
          var receiptLine = receipt.lines.find(function (value) { return value.paymentId === paymentId; });
          return receivedTotal + cents(receiptLine ? receiptLine.amount : 0);
        }, 0);
        return total + Math.max(0, cents(line ? line.amount : 0) - received);
      }, 0) / 100;
    }
    function paymentView(payment) {
      var received = cents(payment.returned) / 100 + receivedFor(payment.id);
      var processing = occupiedFor(payment.id);
      var available = payment.state === '已付款'
        ? Math.max(0, cents(payment.amount) - cents(payment.offset) - cents(payment.transferred || 0) - cents(received) - cents(processing)) / 100
        : 0;
      return Object.assign(clone(payment), { returned: received, processing: processing, available: available });
    }
    function totals() {
      var payments = record.payments.map(paymentView);
      var paid = record.payments.filter(function (item) { return item.state === '已付款'; }).reduce(function (total, item) { return total + cents(item.amount); }, 0);
      var offset = sum(record.payments, 'offset');
      var transferred = sum(record.payments, 'transferred');
      var returned = payments.reduce(function (total, item) { return total + cents(item.returned); }, 0);
      var processing = payments.reduce(function (total, item) { return total + cents(item.processing); }, 0);
      return {
        paid: paid / 100,
        offset: offset / 100,
        transferred: transferred / 100,
        returned: returned / 100,
        processing: processing / 100,
        balance: (paid - offset - transferred - returned) / 100,
        available: payments.reduce(function (total, item) { return total + cents(item.available); }, 0) / 100,
        netPaid: (paid - returned) / 100
      };
    }
    function log(action, basis) {
      record.logs.push({ action: action, basis: basis, time: new Date().toLocaleString('sv-SE').slice(0, 16) });
      record.version += 1;
    }
    function guard(version, allowedRoles) {
      if (!initializing && allowedRoles.indexOf(role) < 0 && role !== 'workflow') throw Error('当前角色不能办理此操作');
      if (version !== record.version) throw Error('办理记录已更新，请重新打开');
    }
    function basis(value, message) {
      value = String(value || '').trim();
      if (!value) throw Error(message || '请填写本次办理依据');
      return value;
    }

    function apply(version, data) {
      guard(version, ['merchant']);
      if (!record.approved) throw Error('预付款申请尚未通过，不能要求供应商退回');
      if (record.invoiceStatus === '已开票') throw Error('已开发票，须先按财务要求完成作废或红字处理；具体政策待确认');
      if (record.currency !== 'CNY') throw Error('外币退款汇率口径待财务确认，本原型暂不提交');
      var reason = basis(data.reason, '请填写退回原因及业务依据');
      var lines = (data.lines || []).map(function (line) {
        return { paymentId: line.paymentId, amount: cents(line.amount) / 100 };
      }).filter(function (line) { return cents(line.amount) > 0; });
      if (!lines.length) throw Error('请至少填写一笔本次退回金额');
      var seen = {};
      lines.forEach(function (line) {
        if (seen[line.paymentId]) throw Error('同一付款明细不能重复填写');
        seen[line.paymentId] = true;
        var payment = record.payments.find(function (item) { return item.id === line.paymentId; });
        if (!payment) throw Error('原付款明细不存在，请重新打开');
        if (payment.state !== '已付款') throw Error(payment.id + ' 尚未付款成功，不能申请供应商退款');
        var view = paymentView(payment);
        if (!cents(view.available)) throw Error(payment.id + ' 已全额冲抵、退回或被其他申请占用');
        if (cents(line.amount) > cents(view.available)) throw Error(payment.id + ' 本次退回超过可退金额');
      });
      var item = {
        id: record.applicationId + (sequence ? '-' + String(sequence + 1).padStart(2, '0') : ''),
        createdAt: new Date().toLocaleString('sv-SE').slice(0, 16),
        reason: reason,
        status: '待供应商退款',
        lines: lines,
        proof: null,
        attachments: clone(data.attachments || []),
        refundAccount: record.refundAccount,
        receipts: []
      };
      sequence += 1;
      record.applications.unshift(item);
      log('发起预付款退回（占用可退余额）', reason);
      return get();
    }

    function submitProof(version, data) {
      guard(version, ['supplier']);
      var item = application(data.applicationId);
      if (!item || item.proof || item.status === '已撤销') throw Error('当前退回申请无需重复提交凭据');
      var reference = basis(data.reference, '请填写退款交易号');
      var date = basis(data.date, '请选择退款日期');
      var file = basis(data.file, '请上传退款凭据');
      var amount = cents(data.amount);
      var requestAmount = sum(item.lines, 'amount');
      if (!amount || amount !== requestAmount) throw Error('退款凭据金额须等于本次申请金额');
      item.proof = { reference: reference, date: date, file: file, amount: amount / 100, basis: String(data.basis || '').trim() };
      if (!item.receipts.length) item.status = '退款凭据待核对';
      log(item.receipts.length ? '供应商补齐退款凭据（保留已到账记录）' : '供应商提交退款凭据（尚未到账）', reference);
      return get();
    }

    function confirmReceipt(version, data) {
      guard(version, ['finance']);
      var item = application(data.applicationId);
      if (!item) throw Error('未找到退回申请');
      if (item.status === '已到账' || item.status === '已撤销') throw Error('本退回已全部到账，请勿重复核对');
      var flow = record.flows.find(function (value) { return value.id === data.flowId; });
      if (!flow) throw Error('请选择实际到账流水');
      if (flow.used || item.receipts.some(function (value) { return value.flowId === flow.id; })) throw Error('该到账流水已核对，请勿重复使用');
      if (flow.company !== record.company || flow.supplier !== record.supplier || flow.currency !== record.currency || flow.direction !== '收入') {
        throw Error('到账公司、付款方、币种或收支方向与本退回不符');
      }
      var lines = (data.lines || []).map(function (line) { return { paymentId: line.paymentId, amount: cents(line.amount) / 100 }; })
        .filter(function (line) { return cents(line.amount) > 0; });
      if (!lines.length) throw Error('请按原付款明细分配本次到账金额');
      var total = lines.reduce(function (value, line) { return value + cents(line.amount); }, 0);
      if (total !== cents(flow.amount)) throw Error('付款明细分配合计须等于所选实际到账流水');
      var seen = {};
      var receiptBasis = basis(data.basis, '请填写到账核对依据');
      lines.forEach(function (line) {
        if (seen[line.paymentId]) throw Error('同一付款明细不能重复分配到账');
        seen[line.paymentId] = true;
        var requestLine = item.lines.find(function (value) { return value.paymentId === line.paymentId; });
        if (!requestLine) throw Error('到账不能分配到本申请之外的付款明细');
        var received = item.receipts.reduce(function (value, receipt) {
          var match = receipt.lines.find(function (receiptLine) { return receiptLine.paymentId === line.paymentId; });
          return value + cents(match ? match.amount : 0);
        }, 0);
        if (received + cents(line.amount) > cents(requestLine.amount)) throw Error(line.paymentId + ' 累计到账超过申请退回金额');
      });
      flow.used = true;
      item.receipts.push({ flowId: flow.id, date: flow.date, amount: total / 100, lines: lines, basis: receiptBasis });
      var receivedTotal = sum(item.receipts, 'amount');
      item.status = receivedTotal === sum(item.lines, 'amount') ? '已到账' : '部分到账';
      log('核对实际退款到账', flow.id);
      return get();
    }

    function cancel(version, data) {
      guard(version, ['merchant']);
      var item = application(data.applicationId);
      if (!item || item.status !== '待供应商退款' || item.proof || item.receipts.length) throw Error('仅未退款且未到账的申请可以撤销');
      var reason = basis(data.reason, '请填写撤销原因');
      item.status = '已撤销'; item.cancelReason = reason;
      log('撤销退回申请（释放占用）', reason);
      return get();
    }
    function syncUsage(paymentId, offset, transferred) {
      var payment = record.payments.find(function (item) { return item.id === paymentId; });
      if (!payment) throw Error('原付款明细不存在');
      var moved = cents(transferred || 0);
      var used = cents(offset);
      if (used + moved + cents(paymentView(payment).returned) + cents(occupiedFor(paymentId)) > cents(payment.amount)) throw Error('金额已被退回申请占用，请核对可用余额');
      if (used !== cents(payment.offset) || moved !== cents(payment.transferred || 0)) { payment.offset = used / 100; payment.transferred = moved / 100; record.version += 1; }
      return get();
    }

    function prepare(stage) {
      initializing = true;
      if (stage === 'supplier' || stage === 'finance') {
        apply(record.version, { reason: '对账后多付，按原付款明细退回', lines: [{ paymentId: 'PAY-PP-20260918001', amount: 5000 }, { paymentId: 'PAY-PP-20260922002', amount: 8000 }] });
      }
      if (stage === 'finance') {
        submitProof(record.version, { reference: 'SUP-REF-20260929-001', date: '2026-09-29', file: '供应商退款回单.pdf', amount: 13000, basis: '已按要求原路退回' });
      }
      initializing = false;
    }

    function get() {
      var result = clone(record);
      result.payments = record.payments.map(paymentView);
      result.totals = totals();
      result.applications.forEach(function (item) {
        item.amount = sum(item.lines, 'amount') / 100;
        item.received = sum(item.receipts, 'amount') / 100;
        item.remaining = (sum(item.lines, 'amount') - sum(item.receipts, 'amount')) / 100;
      });
      return result;
    }

    if (role === 'supplier') prepare('supplier');
    if (role === 'finance') prepare('finance');
    return { get: get, apply: apply, submitProof: submitProof, confirmReceipt: confirmReceipt, cancel: cancel, syncUsage: syncUsage };
  }

  var api = { cents: cents, seed: seed, createSession: createSession };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SupplierPrepaymentReturnModel = api;
})(typeof window === 'object' ? window : globalThis);
