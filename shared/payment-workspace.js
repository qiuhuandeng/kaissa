/* 付款工作区仅保留本次页面会话；旧地址可独立办理。 */
(function () {
  'use strict';
  const params=new URLSearchParams(location.search), file=location.pathname.split('/').pop(), embedded=params.get('embedded')==='payment';
  if(embedded) document.documentElement.dataset.paymentEmbedded='true';
  const current=file==='finance-payment-return.html'?'returns':'payments';
  const tabs=()=>'<div class="tab-bar pm-tabs" role="tablist" aria-label="付款管理"><button class="tab-item" role="tab" data-pm-tab="payments" type="button">付款执行</button><button class="tab-item" role="tab" data-pm-tab="returns" type="button">付款退回</button></div>';
  function init(){
    if(file==='finance-payment-management.html'){
      const host=document.querySelector('[data-payment-workspace]');if(!host)return;
      host.innerHTML=tabs()+'<section class="pm-panel" role="tabpanel" data-pm-panel="payments"><iframe title="付款执行" data-pm-frame="payments"></iframe></section><section class="pm-panel" role="tabpanel" data-pm-panel="returns" hidden><iframe title="付款退回" data-pm-frame="returns"></iframe></section>';
      const frames={payments:host.querySelector('[data-pm-frame="payments"]'),returns:host.querySelector('[data-pm-frame="returns"]')};
      let view=params.get('view')==='returns'||params.has('returnNo')?'returns':'payments';
      Object.entries(frames).forEach(([key,frame])=>{const q=new URLSearchParams(params);q.delete('view');q.set('embedded','payment');if(key!==view){['returnNo','paymentNo','applyNo','statementNo','revision'].forEach(k=>q.delete(k));}frame.src=(key==='returns'?'finance-payment-return.html':'finance-payment.html')+'?'+q;});
      const pending=[];let returnsReady=false;
      function show(name){view=name;host.querySelectorAll('[data-pm-tab]').forEach(b=>{const on=b.dataset.pmTab===view;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});host.querySelectorAll('[data-pm-panel]').forEach(p=>p.hidden=p.dataset.pmPanel!==view);const q=new URLSearchParams(location.search);q.set('view',view);history.replaceState(null,'','?'+q);}
      host.querySelector('.pm-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-pm-tab]');if(b)show(b.dataset.pmTab);});
      host.querySelector('.pm-tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();show(e.key==='Home'?'payments':e.key==='End'?'returns':view==='payments'?'returns':'payments');host.querySelector('[data-pm-tab="'+view+'"]').focus();}});
      window.addEventListener('message',e=>{
        if(!Object.values(frames).some(f=>f.contentWindow===e.source))return;
        const m=e.data;if(!m||m.channel!=='caesar-payment')return;
        if(m.action==='ready'&&e.source===frames.returns.contentWindow){returnsReady=true;pending.splice(0).forEach(request=>frames.returns.contentWindow.postMessage({channel:'caesar-payment',action:'request',request},'*'));}
        if(m.action==='request'&&e.source===frames.payments.contentWindow){if(returnsReady)frames.returns.contentWindow.postMessage(m,'*');else pending.push(m.request);show('returns');}
        if(m.action==='navigate'){const u=new URL(m.href,location.href);if(u.protocol===location.protocol&&(u.protocol==='file:'||u.origin===location.origin))location.href=u.href;}
      });show(view);return;
    }
    if(!['finance-payment.html','finance-payment-return.html'].includes(file))return;
    if(!embedded){const surface=document.querySelector('.list-surface');if(surface){surface.insertAdjacentHTML('beforebegin',tabs());document.querySelectorAll('[data-pm-tab]').forEach(b=>{const on=b.dataset.pmTab===current;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));b.addEventListener('click',()=>{if(!on)location.href='finance-payment-management.html?view='+b.dataset.pmTab;});});}}
    if(embedded){document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||a.getAttribute('href').startsWith('#'))return;const url=new URL(a.href,location.href);if(url.protocol!==location.protocol)return;e.preventDefault();parent.postMessage({channel:'caesar-payment',action:'navigate',href:url.href},'*');});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
