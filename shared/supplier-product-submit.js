(function () {
  var controller, complete;
  window.caesarSupplierProductSubmit = function (context, callback) {
    complete = callback;
    var types = { group: '参团游', cruise: '邮轮', train: '专列', free: '自由行', study: '研学' };
    if (!controller) controller = window.caesarSupplierScheduleDrawer.init({ products: [{ product: context.product, route: context.route, typeKey: context.kind }], onSubmitted: function (items) {
      var values = document.querySelectorAll('.route-success-summary > div');
      if (values[2]) { values[2].querySelector('span').textContent = '本次日期报价'; values[2].querySelector('strong').textContent = items.length + '个日期 · ' + items[0].priceItems.length + '项规格'; }
      if (values[3]) values[3].querySelector('strong').textContent = '产品及日期报价待凯撒确认';
      complete();
    } });
    Object.assign(controller.products[0], { product: context.product, route: context.route, routeOptions: [context.route], typeKey: context.kind, type: types[context.kind] || '参团游', unit: ({ cruise: '间', train: '铺', free: '间夜', study: '名' })[context.kind] || '位' });
    controller.open({ product: context.product, route: context.route, prefill: true, title: '提交产品 · 本次日期报价' });
  };
})();
