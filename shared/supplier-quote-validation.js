(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SupplierQuoteValidation = api;
})(typeof window !== 'undefined' ? window : this, function () {
  function price(raw) {
    var value = String(raw == null ? '' : raw).trim().replace(/[¥￥,\s]/g, '');
    return /^\d+(\.\d{1,2})?$/.test(value) ? Number(value) : null;
  }
  function errors(items) {
    if (!items.length) return ['请填写本次规格报价'];
    return items.reduce(function (result, item) {
      if (price(item.public) == null) result.push(item.name + '：请填写有效的公开售价（可填0）');
      if (price(item.settlement) == null) result.push(item.name + '：请填写有效的结算价（可填0）');
      return result;
    }, []);
  }
  return { price: price, errors: errors };
});
