(function(){
  'use strict';
  const groups=[
    [['[data-report-page="products"]','primary','经营业绩'],['[data-contribution="product"]','contribution','经营贡献'],['[data-resource-cost]','resources','产品资源风险']],
    [['[data-channel-report]','primary','渠道业绩'],['[data-contribution="channel"]','contribution','经营贡献']],
    [['[data-settlement-report]','primary','业务毛利'],['[data-resource-cost]','resources','资源成本与风险']],
    [['[data-report-page="overview"]','primary','经营规模'],['[data-overview-finance]','finance','财务与资源观察']],
    [['[data-budget-targets]','primary','经营任务'],['[data-profit-budget]','budget','损益与费用预算']],
    [['[data-report-management]','primary','口径与数据核对'],['[data-report-governance]','governance','版本与权限']],
    [['[data-accounting-confirmations]','confirmations','确认发生明细'],['#finance-accounting-report','checks','结算与核算差异']]
  ];
  const group=groups.find(g=>document.querySelector(g[0][0]));if(!group)return;
  const entries=group.map(([selector,key,title])=>({element:document.querySelector(selector),key,title})).filter(r=>r.element);if(entries.length<2)return;
  const nav=document.createElement('nav');nav.className='report-section-switch';nav.setAttribute('aria-label','报表查询范围');
  nav.innerHTML=entries.map(r=>'<button type="button" data-report-section="'+r.key+'">'+r.title+'</button>').join('');entries[0].element.before(nav);
  const activate=key=>{const chosen=entries.some(r=>r.key===key)?key:entries[0].key;for(const e of entries)e.element.hidden=e.key!==chosen;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.reportSection===chosen)));};
  nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b)activate(b.dataset.reportSection);});activate(new URLSearchParams(location.search).get('section'));
})();
