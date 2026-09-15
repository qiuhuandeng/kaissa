(function () {
  'use strict';
  const anchor = document.querySelector('[data-resource-cost]');
  if (!anchor || !window.CaesarResourceCost) return;
  const m = window.CaesarResourceCost;
  const productOnly = Boolean(document.querySelector('[data-report-page="products"]'));
  const query = q => {
    const result = m.query(q);
    return productOnly ? { ...result, sections: [] } : result;
  };
  window.CaesarReadonlyReport.mount(anchor, { title: productOnly ? '产品资源风险' : '资源成本与风险', views: productOnly ? { resources: '产品资源风险' } : m.views, defaults: { ...m.defaults, ...(productOnly ? { view: 'resources' } : {}) }, query, labels: { id: '分配确认号', batch: '采购批次号', company: '核算公司', supplier: '供应商', product: '产品', tour: '团期号', currency: '原币', unit: '数量单位', type: '成本项目', quantity: '分配数量', confirmedCost: '已确认分配成本', pendingCost: '待确认成本', status: '资料情况', evidence: '确认依据', committed: '承诺数量', sold: '已售', used: '已用', returnable: '可退未退', nonRefundableUnsold: '不可退未售', purchase: '确认采购额', estimated: '预估成本', allocated: '已确认分配', unallocated: '尚未确认分配', payable: '已确认应付', paid: '实际已付', confirmedLoss: '已确认损耗', pendingLoss: '待确认损耗', destination: '目的地', supply: '供应方式', date: '批次确认日', quantityStatus: '数量核对情况' }, money: ['confirmedCost', 'pendingCost', 'purchase', 'estimated', 'allocated', 'unallocated', 'payable', 'paid', 'confirmedLoss', 'pendingLoss'], columns: q => q.view === 'resources' ? ['batch', 'product', 'unit', 'committed', 'sold', 'used', 'returnable', 'nonRefundableUnsold', 'confirmedLoss', 'pendingLoss', 'quantityStatus'] : ['id', 'batch', 'tour', 'supplier', 'type', 'unit', 'quantity', 'currency', 'confirmedCost', 'pendingCost', 'status'], extras: ['company', 'evidence', 'destination', 'supply', 'date'], filters: [{ key: 'start', label: '确认开始日', type: 'date' }, { key: 'end', label: '确认结束日', type: 'date' }, { key: 'company', label: '核算公司' }, { key: 'product', label: '产品' }, { key: 'tour', label: '团期号' }, { key: 'batch', label: '采购批次号' }, { key: 'supplier', label: '供应商', more: true }, { key: 'unit', label: '数量单位', options: [['', '全部，分单位'], ['舱', '舱'], ['座', '座'], ['铺', '铺']], more: true }], definition: '已确认损耗包含在对应成本分配中，不再重复扣减。关联单团只展示该团分配，采购批次全额作为独立核对依据；机位、舱、铺不合计。正式分配及损耗政策待确认。' });
})();
