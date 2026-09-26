(function (root) {
  'use strict';
  function locked(row) { return row.paymentStatus === '已付款' || row.receiptStatus === '已回单' || !!row.applyNo || row.paymentStatus === '待付款' || row.approvalStatus === '审批中'; }
  function preview(contract, quantities, ratios) {
    var errors = [], lines = [], beforeAmount = 0, afterAmount = 0, beforeQty = 0, afterQty = 0;
    (contract.subtypes || []).forEach(function (spec, i) {
      var raw = quantities[i], qty = Number(raw), price = Number(spec.unitPrice), current = Number(spec.total);
      var allocations = (contract.allocations || []).filter(function (r) { return r.subtype === spec.name; });
      var allocated = Math.max(Number(spec.allocated || 0), allocations.reduce(function (sum, r) { return sum + Number(r.allocated || 0); }, 0));
      var floor = Math.max(allocated, Number(spec.sold || 0), Number(spec.issued || 0));
      if (raw === '' || raw == null || !Number.isInteger(qty) || qty < 0) errors.push(spec.name + '：请填写0或正整数数量');
      else if (qty < floor) errors.push(spec.name + '：少于已分配／已售／已确认的' + floor + spec.unit + '，涉及' + (allocations.map(function (r) { return r.scheduleNo; }).join('、') || '当前采购分配'));
      if (!Number.isFinite(price) || price < 0) errors.push(spec.name + '：合同单价待补');
      lines.push({ name: spec.name, before: current, after: qty, price: price, allocated: floor });
      beforeQty += current; afterQty += qty; beforeAmount += current * price; afterAmount += qty * price;
    });
    if (!lines.length) errors.push('采购规格待补');
    if (lines.every(function (r) { return r.before === r.after; })) errors.push('请修改至少一项采购数量');
    var payments = (contract.payments || []).map(function (row, i) {
      if (locked(row)) return { index: i, locked: true, amount: row.amount };
      var raw = ratios[i], ratio = Number(raw);
      if (raw === '' || raw == null || !Number.isFinite(ratio) || ratio < 0 || ratio > 100) errors.push(row.node + '：请按合同填写本节点付款比例');
      return { index: i, locked: false, ratio: ratio, amount: Math.round(afterAmount * ratio) / 100 };
    });
    var paid = (contract.payments || []).reduce(function (sum, row) { return sum + ((row.paymentStatus === '已付款' || row.receiptStatus === '已回单') ? Number(row.amount || 0) : 0); }, 0);
    var committed = (contract.payments || []).reduce(function (sum, row) { return sum + (locked(row) ? Number(row.amount || 0) : 0); }, 0);
    function units(field) {
      var counts = {};
      lines.forEach(function (line, i) { var unit = contract.subtypes[i].unit; counts[unit] = (counts[unit] || 0) + line[field]; });
      return Object.keys(counts).map(function (unit) { return counts[unit] + unit; }).join(' / ');
    }
    return { errors: errors, lines: lines, beforeQty: beforeQty, afterQty: afterQty, beforeText: units('before'), afterText: units('after'), beforeAmount: beforeAmount, afterAmount: afterAmount, payments: payments, overpaid: Math.max(paid - afterAmount, 0), committed: committed, overcommitted: Math.max(committed - afterAmount, 0) };
  }
  function apply(contract, result, reason) {
    if (result.errors.length) throw new Error(result.errors.join('；'));
    result.lines.forEach(function (line, i) { contract.subtypes[i].total = line.after; });
    result.payments.forEach(function (plan) {
      if (plan.locked) return;
      var row = contract.payments[plan.index];
      if (row.originalAmount == null) row.originalAmount = row.amount;
      row.ratio = plan.ratio; row.recalculatedAmount = plan.amount; row.amount = plan.amount;
      row.deduction = 0; row.effectiveQty = result.afterQty; row.reminder = result.overcommitted ? '已付及在途超出新采购金额，付款计划待复核' : '数量调整已核对';
    });
    contract.effectiveQty = result.afterQty;
    contract.changeOrders = contract.changeOrders || [];
    contract.changeOrders.unshift({ no: 'CHG-' + contract.contractNo + '-' + (contract.changeOrders.length + 1), type: '数量调整', beforeQty: result.beforeQty, afterQty: result.afterQty, beforeText: result.beforeText, afterText: result.afterText, beforeAmount: result.beforeAmount, afterAmount: result.afterAmount, overpaid: result.overpaid, deductionNode: '待处理余额', reason: reason, status: '已确认', lines: result.lines });
    return contract;
  }
  var api = { locked: locked, preview: preview, apply: apply };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.ProcurementQuantityChange = api;
})(typeof window === 'object' ? window : globalThis);
