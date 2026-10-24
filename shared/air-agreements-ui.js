(function(){
  'use strict';
  const M=window.AirAgreements,drawer=document.getElementById('agreementDrawer'),confirm=document.getElementById('agreementConfirm'),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let db=M.load(),draft,dirty=false,filters={},opener,filesPending=false;
  const $=s=>document.querySelector(s);
  function render(){
    const rows=db.records.filter(r=>(!filters.q||[r.name,r.airline,r.supplier,r.owner,r.flights].join(' ').includes(filters.q))&&(!filters.airline||r.airline===filters.airline)&&(!filters.method||r.method.includes(filters.method))&&(!filters.state||r.state===filters.state));
    $('#agreementRows').innerHTML=rows.map(r=>'<tr><td><strong>'+E(r.name)+'</strong><br><span class="text-muted">'+E(r.start+' 至 '+r.end)+'</span></td><td>'+E(r.airline)+'</td><td>'+E(r.supplier)+'</td><td>'+E(r.owner||'待补')+'</td><td>'+E(r.method)+'</td><td><span class="agreement-rule-summary" title="'+E(r.deposit+'；'+r.release+'；'+r.ticketing)+'">'+E(r.deposit+'；'+r.release+'；'+r.ticketing)+'</span></td><td>'+E(r.currency)+'</td><td><span class="tag '+(r.state==='有效'?'tag-green':'tag-gray')+'">'+E(r.state)+'</span></td><td><div class="table-action"><button class="table-action-primary" data-agreement-edit="'+E(r.id)+'">编辑</button>'+(!['草稿','待审核','终止'].includes(r.state)?'<button data-agreement-renew="'+E(r.id)+'">续约</button>':'')+'</div></td></tr>').join('')||'<tr><td colspan="9">当前条件没有协议</td></tr>';
    $('#agreementCount').textContent='共 '+rows.length+' 条';
  }
  function attachments(){
    $('#agreementAttachments').innerHTML=draft.attachments.map(f=>'<p><a download="'+E(f.name)+'" href="'+E(f.data)+'">'+E(f.name)+'</a> · '+E(f.size)+' 字节</p>').join('')||'<span class="text-muted">尚未附原件，可先维护协议资料</span>';
  }
  function open(id,renew){
    draft=M.draft(db,id,renew);dirty=false;opener=document.activeElement;
    const title=renew?'登记协议续约':id?'航司协议维护':'新增航司协议';
    drawer.querySelector('.drawer-modal').dataset.drawerTitleFixed=title;$('#agreementDrawerTitle').textContent=title;
    drawer.querySelectorAll('[data-agreement-field]').forEach(el=>{const v=draft[el.dataset.agreementField]||'';if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===v))el.add(new Option(v,v));el.value=v;});
    $('#agreementHistory').innerHTML=(draft.previous?'<p>续约来源：'+E(db.records.find(r=>r.id===draft.previous)?.name)+'；原协议资料保留。</p>':'')+(draft.history.map(h=>'<details><summary>'+E(h.at+' · '+h.action+' · '+h.by)+'</summary>'+(h.before?'<p>'+E(h.before.name+' · '+h.before.start+' 至 '+h.before.end+' · '+h.before.owner+' · '+h.before.state)+'</p><p>'+E(h.before.basis)+'</p><p>'+E(h.before.deposit+'；'+h.before.release+'；'+h.before.ticketing)+'</p>'+(h.before.attachments||[]).map(f=>'<a download="'+E(f.name)+'" href="'+E(f.data)+'">'+E(f.name)+'</a>').join(' '):h.next?'<p>续约协议：'+E(db.records.find(r=>r.id===h.next)?.name)+'</p>':'')+'</details>').join('')||'<p class="text-muted">首次资料登记，保存后保留记录</p>');
    $('#agreementFiles').value='';$('#agreementFileNote').textContent='';$('#agreementError').hidden=true;attachments();window.caesarUI.openLayer(drawer);requestAnimationFrame(()=>{drawer.querySelector('.modal-body').scrollTop=0;drawer.querySelector('.modal-close').focus({preventScroll:true});});window.caesarUI.syncDrawerTitle?.(drawer,{title:renew?'登记协议续约':id?'航司协议维护':'新增航司协议'});
  }
  function close(){if(filesPending)return;if(dirty){window.caesarUI.openLayer(confirm);return;}window.caesarUI.closeLayer(drawer);opener?.focus();}
  function error(message){$('#agreementError').hidden=false;$('#agreementError').textContent=message;}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    try{
      if(b.hasAttribute('data-open-agreement-drawer'))open();
      if(b.dataset.agreementEdit)open(b.dataset.agreementEdit);
      if(b.dataset.agreementRenew)open(b.dataset.agreementRenew,true);
      if(b.hasAttribute('data-close-agreement-drawer'))close();
      if(b.hasAttribute('data-agreement-stay'))window.caesarUI.closeLayer(confirm);
      if(b.hasAttribute('data-agreement-leave')){dirty=false;window.caesarUI.closeLayer(confirm);close();}
      if(b.hasAttribute('data-agreement-save')){if(filesPending)return;drawer.querySelectorAll('[data-agreement-field]').forEach(el=>draft[el.dataset.agreementField]=el.value.trim());const next=M.copy(db);M.saveRecord(next,draft);if(!M.save(next))throw Error('协议资料未保存，请减少附件大小后重试');db=next;dirty=false;close();render();}
      if(b.hasAttribute('data-agreement-search')){filters={q:$('#agreementKeyword').value.trim(),airline:$('#agreementAirline').selectedIndex?$('#agreementAirline').value:'',method:$('#agreementMethod').selectedIndex?$('#agreementMethod').value:'',state:$('#agreementStatus').selectedIndex?$('#agreementStatus').value:''};render();}
      if(b.hasAttribute('data-agreement-reset')){filters={};$('#agreementKeyword').value='';['Airline','Method','Status'].forEach(s=>$('#agreement'+s).selectedIndex=0);render();}
    }catch(err){error(err.message);}
  });
  drawer.addEventListener('input',()=>dirty=true);
  drawer.addEventListener('click',e=>{if(e.target===drawer)close();});
  $('#agreementFiles').addEventListener('change',async e=>{
    const files=[...e.target.files],total=files.reduce((n,f)=>n+f.size,0)+draft.attachments.reduce((n,f)=>n+f.size,0);
    if(total>2500000){$('#agreementFileNote').textContent='附件超过本地演示容量，请选择较小文件；原资料保留。';return;}
    filesPending=true;
    try{const incoming=[];for(const f of files){if(!/\.(pdf|png|jpe?g|webp)$/i.test(f.name))throw Error('请选择PDF或图片，原资料保留');const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);});incoming.push({name:f.name,size:f.size,data});}draft.attachments.push(...incoming);dirty=true;attachments();$('#agreementFileNote').textContent='已读取 '+files.length+' 份原件，保存后可下载。';}catch(err){$('#agreementFileNote').textContent=err.message||'文件读取失败，原资料保留';}finally{filesPending=false;}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('show')){e.preventDefault();e.stopImmediatePropagation();if(confirm.classList.contains('show'))window.caesarUI.closeLayer(confirm);else close();}},true);
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  render();
})();
