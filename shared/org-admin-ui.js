(function(){
'use strict';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const select=(name,items,value,extra='')=>`<select class="form-control" name="${name}" ${extra}>${items.map(([v,label])=>`<option value="${e(v)}" ${String(value)===String(v)?'selected':''}>${e(label)}</option>`).join('')}</select>`;
const input=(name,value,extra='')=>`<input class="form-control" name="${name}" value="${e(value)}" ${extra}>`;
const field=(name,html,wide=false)=>`<label class="form-group ${wide?'form-group-full':''}"><span class="form-label">${name}</span>${html}</label>`;
const section=(title,html)=>`<section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">${title}</h3></div>${html}</section>`;
function errors(host,values){const el=host.querySelector('[data-admin-errors]');el.hidden=!values.length;el.textContent=values.join('；');if(values.length)el.scrollIntoView?.({block:'nearest'});return values.length===0;}
function drawer(title,body,saveText,onSave){
 const el=document.createElement('div');el.className='modal-overlay drawer-overlay ac-layer aom-layer';el.dataset.static='true';el.innerHTML=`<div class="modal drawer-modal drawer-edit drawer-lg ac-drawer" role="dialog" aria-modal="true" aria-label="${e(title)}"><div class="modal-header"><h2 class="modal-title">${e(title)}</h2><button type="button" class="modal-close" data-admin-close aria-label="关闭">×</button></div><div class="modal-body"><div class="ac-error" data-admin-errors role="alert" hidden></div><form data-admin-form>${body}</form></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-admin-close>${saveText?'取消':'关闭'}</button>${saveText?`<button type="button" class="btn btn-primary" data-admin-save>${e(saveText)}</button>`:''}</div></div>`;
 document.body.append(el);window.caesarUI.openLayer(el);let dirty=false;
 const close=(force=false)=>{if(!force&&dirty&&!window.confirm('当前修改未保存，确认放弃吗？'))return;el.remove();};
 el.addEventListener('input',()=>dirty=true);el.addEventListener('change',()=>dirty=true);
 el.addEventListener('click',ev=>{if(ev.target.closest('[data-admin-close]')||ev.target===el){ev.preventDefault();ev.stopImmediatePropagation();close();}},true);
 el.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();close();}},true);
 const form=el.querySelector('form');form.addEventListener('submit',ev=>ev.preventDefault());if(saveText)el.querySelector('[data-admin-save]').onclick=()=>onSave({el,form,close:()=>close(true)});
 return {el,form,close:()=>close(true)};
}
window.OrgAdminUI={e,select,input,field,section,errors,drawer,toast:message=>window.caesarUI.toast(message)};
})();
