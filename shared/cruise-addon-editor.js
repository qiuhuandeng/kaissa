(function(){
 'use strict';const R=window.CaesarCruiseSalesRules,e=R.escape;
 function samples(){return R.templates.map(t=>Object.assign(R.clone(t),{status:'有效销售价',currency:'CNY',unit:'人',min:1,max:t.capacity,audience:'成人及儿童',start:'2026-11-12',end:'2026-11-19',included:t.id==='insurance',ship:'理想号',route:'地中海西线'}));}
 function mount(){
  document.getElementById('addonPrice').previousElementSibling.textContent='成人单价';document.getElementById('addonMin').parentElement.previousElementSibling.textContent='本单数量范围';const heads=document.getElementById('addonPriceRows').closest('table').querySelectorAll('th');heads[3].textContent='人数上限';heads[4].textContent='选择要求';
  const name=document.getElementById('addonName');name.innerHTML=R.templates.map(t=>'<option value="'+e(t.name)+'">'+e(t.name)+'</option>').join('')+'<option>其他</option>';
  document.getElementById('addonPriceDrawer').querySelector('.form-grid').insertAdjacentHTML('beforeend','<div class="cruise-addon-fields form-grid" id="cruiseAddonFields">'+[
   ['参考服务','<select id="cruiseAddonTemplate" class="form-control">'+R.templates.map(t=>'<option value="'+t.id+'">'+e(t.category+' / '+t.name)+'</option>').join('')+'</select>'],
   ['儿童单价','<input id="cruiseAddonChildPrice" class="form-control" type="number" min="0" value="150">'],
   ['服务供应商','<input id="cruiseAddonSupplier" class="form-control" value="欧洲接送车队">'],
   ['本航次人数上限','<input id="cruiseAddonCapacity" class="form-control" type="number" min="0" value="40">'],
   ['选择要求','<select id="cruiseAddonRequired" class="form-control"><option value="no">可选</option><option value="yes">必选</option></select>'],
   ['收费方式','<select id="cruiseAddonIncluded" class="form-control"><option value="no">另收</option><option value="yes">方案已含</option></select>'],
   ['同组互斥','<input id="cruiseAddonExclusive" class="form-control" value="机场接驳" placeholder="无则留空">'],
   ['适用船只／线路','<input id="cruiseAddonScope" class="form-control" value="理想号 / 地中海西线">']
  ].map(([label,field])=>'<div class="form-group"><label class="form-label">'+label+'</label>'+field+'</div>').join('')+'</div>');
  document.getElementById('cruiseAddonTemplate').addEventListener('change',function(){const t=R.templates.find(x=>x.id===this.value);document.getElementById('addonName').value=t.name;document.getElementById('addonPrice').value=t.price;document.getElementById('addonUnit').value='人';document.getElementById('addonResource').value=t.resource;document.getElementById('addonStatus').value='有效销售价';document.getElementById('addonStatus').dispatchEvent(new Event('change'));open(t);});
 }
 function open(item){
  const t=Object.assign({},R.templates.find(x=>x.name===item.name)||R.templates[0],item);
  const vals={Template:t.id,ChildPrice:t.childPrice,Supplier:t.supplier,Capacity:t.capacity,Required:t.required?'yes':'no',Included:t.included?'yes':'no',Exclusive:t.exclusive,Scope:t.scope||'理想号 / 地中海西线'};
  Object.keys(vals).forEach(k=>document.getElementById('cruiseAddon'+k).value=vals[k]??'');
 }
 function read(item){const v=k=>document.getElementById('cruiseAddon'+k).value;return Object.assign(item,{id:v('Template'),childPrice:item.status==='免费'?0:Number(v('ChildPrice')),supplier:v('Supplier'),capacity:Number(v('Capacity')),required:v('Required')==='yes',included:v('Included')==='yes',exclusive:v('Exclusive'),scope:v('Scope')});}
 function row(item,index){return '<tr><td><strong>'+e(item.name)+'</strong><br><span class="text-muted">'+e(item.supplier)+'</span></td><td>'+e(item.status)+'</td><td>'+e(item.included?'方案已含':item.status==='免费'?'免费':'成人 ¥'+item.price+' / 儿童 ¥'+item.childPrice)+'／'+e(item.unit)+'</td><td>'+e(item.capacity)+'人上限</td><td>'+e(item.required?'必选':'可选')+'<br><span class="text-muted">'+e(item.exclusive?'互斥：'+item.exclusive:'无互斥')+'</span></td><td>'+e(item.start)+' 至 '+e(item.end)+'</td><td>'+e(item.resource)+'</td><td><button class="table-link" type="button" data-edit-addon="'+index+'">编辑</button></td></tr>';}
 window.CaesarCruiseAddonEditor={mount,samples,open,read,row};
})();
