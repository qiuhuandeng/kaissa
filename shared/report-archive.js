(function(){
  'use strict';
  document.title='历史方案（已归档） · '+document.title;
  const banner=document.createElement('section');banner.className='report-archive-notice';banner.setAttribute('role','note');
  banner.innerHTML='<strong>历史方案 · 已归档</strong><span>保留原方案供查阅，不作为当前经营或财务结果。</span><a href="performance-reports.html">经营总览</a><a href="monthly-profit-reports.html">月度经营损益</a>';
  const content=document.querySelector('.content')||document.body;content.prepend(banner);
})();
