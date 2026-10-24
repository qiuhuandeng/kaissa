(function () {
  'use strict';
  var R=window.CaesarCruiseResources;
  if(!R)return;
  var e=R.escape;
  function mount(page) {
    var shipSelect=page.querySelector('#lineShipName');
    if(!shipSelect) return;
    if(page.cruiseReferenceCleanup)page.cruiseReferenceCleanup();
    var selectedShip='glory';
    var dayList=page.querySelector('#lineItinerarySection .route-day-list');
    var dayTemplate=dayList.firstElementChild.cloneNode(true);
    var lines={};
    var planFields=['planFeature','shoreIncluded','embarkService','prePostTraffic','prePostResource','prePostHotel','childPolicy','taxIncluded','includeFee','excludeFee','refundRule','cruiseShoreCode','cruiseShoreContent'];
    shipSelect.innerHTML=R.ships.map(function(s){return '<option value="'+s.id+'"'+(s.id===selectedShip?' selected':'')+'>'+e(s.name)+'</option>';}).join('');
    function portSelect(id,selected){var old=document.getElementById(id);var replacement=document.createElement('select');replacement.id=id;replacement.className=old.className;replacement.innerHTML=R.portOptions(selected);old.replaceWith(replacement);}
    portSelect('lineHomePort','barcelona');portSelect('lineBoardingPort','barcelona');portSelect('lineDisembarkPort','barcelona');
    document.getElementById('lineRoutePorts').readOnly=true;
    shipSelect.closest('.form-group').insertAdjacentHTML('afterend','<div class="form-group"><label class="form-label" for="lineCruiseTemplate">邮轮模板</label><select id="lineCruiseTemplate" class="form-control"></select></div>');
    var basic=page.querySelector('#lineBasicSection .route-field-grid');
    basic.insertAdjacentHTML('beforeend','<details class="route-field-full cruise-reference-summary" id="lineShipReference"><summary>船舶介绍与资料</summary><div id="lineShipReferenceBody"></div></details>');
    var itinerary=page.querySelector('#lineItinerarySection');
    itinerary.querySelector('.route-field-grid').insertAdjacentHTML('beforeend','<div class="form-group"><label class="form-label" for="cruiseShoreCode">岸上方案编号</label><input id="cruiseShoreCode" class="form-control" value="A"></div><div class="form-group route-field-full"><label class="form-label" for="cruiseShoreContent">本方案岸上行程</label><textarea id="cruiseShoreContent" class="form-control" rows="2">马赛精选观光、热那亚老城游览；全单采用同一方案。</textarea></div><div class="form-group route-field-full"><label class="form-label">本方案已含服务</label><div class="cruise-plan-services">'+window.CaesarCruiseSalesRules.templates.map(function(t){return '<label><input type="checkbox" data-plan-included="'+t.id+'"'+(['transfer','insurance'].includes(t.id)?' checked':'')+'> '+e(t.name)+'</label>';}).join('')+'</div></div>');
    itinerary.querySelector('.route-itinerary-draft').insertAdjacentHTML('afterend','<div class="form-group"><label class="form-label">行程PDF<input type="file" id="lineCruisePdf" accept="application/pdf,.pdf"></label><div id="lineCruisePdfFiles" class="cruise-resource-files"></div></div>');
    dayList.insertAdjacentHTML('afterend','<button class="btn btn-secondary btn-sm" type="button" data-cruise-add-day>新增一天</button>');
    function ship(){return R.ships.find(function(s){return s.id===selectedShip;});}
    function renderReference(){var s=ship();document.getElementById('lineShipReferenceBody').innerHTML='<p class="text-muted">采用资料：'+e(s.name)+' · '+e(s.version)+'</p><div class="cruise-resource-media"><a href="'+e(s.image)+'" target="_blank" rel="noopener"><img src="'+e(s.image)+'" alt="'+e(s.imageName)+'"></a><div><p>'+e(s.description)+'</p><p>'+e(s.facilities)+'</p><p>'+e(s.policy)+'</p></div></div><div class="cruise-resource-files">'+s.attachments.map(function(f){return '<a href="'+e(f.url)+'" target="_blank" rel="noopener">'+e(f.name)+'</a>';}).join('')+'</div>';}
    function templateOptions(){document.getElementById('lineCruiseTemplate').innerHTML='<option value="">选择可复用模板</option>'+R.routes.filter(function(r){return r.ship===selectedShip;}).map(function(r){return '<option value="'+r.id+'">'+e(r.name+' · '+r.duration)+'</option>';}).join('');}
    function cabinRow(c){return '<tr><td><input class="form-control" aria-label="舱型名称" value="'+e(c.name)+'"><input class="form-control" aria-label="船方舱型代码" data-cruise-code value="'+e(c.code)+'"></td><td><select class="form-control">'+R.options(['无窗','海景窗','阳台'],c.view)+'</select></td><td><input class="form-control" aria-label="标准入住" type="number" value="'+c.standard+'"></td><td><input class="form-control" aria-label="最大入住" type="number" value="'+c.maximum+'"></td><td><select class="form-control">'+R.options(['支持','不支持'],c.extra)+'</select></td><td><select class="form-control">'+R.options(['支持','需确认','不支持'],c.child)+'</select></td><td><button class="table-link danger" type="button" data-remove-row>删除</button></td></tr>';}
    function renderCabins(){var table=document.getElementById('cabinMatrix');table.closest('.table-wrap').classList.add('cruise-reference-table');table.querySelector('th').textContent='舱型名称／船方代码';table.querySelector('tbody').innerHTML=ship().cabins.map(cabinRow).join('');}
    function upgradeDay(card,data){
      var main=card.querySelector('.route-itinerary-main'),side=card.querySelector('.route-itinerary-side');
      main.insertAdjacentHTML('afterbegin','<label class="form-label">港口／海上日<select class="form-control" data-cruise-port>'+R.portOptions(data.port,true)+'</select></label><span class="text-muted" data-cruise-timezone></span>');
      main.querySelector('textarea').value=data.text;
      var old=side.querySelector('input');var oldLabel=old.previousElementSibling;
      oldLabel.textContent='到港时间';old.type='time';old.value=data.arrival||'';old.setAttribute('data-cruise-arrival','');
      old.insertAdjacentHTML('afterend','<label class="route-itinerary-label">离港时间</label><input class="form-control" type="time" data-cruise-departure value="'+e(data.departure)+'"><label><input type="checkbox" data-cruise-overnight'+(data.overnight?' checked':'')+'> 过夜停靠</label>');
      var meal=side.querySelector('input:not([type=time]):not([type=checkbox])');if(meal&&data.meal)meal.value=data.meal;
      card.insertAdjacentHTML('beforeend','<div class="cruise-stop-actions"><button class="table-link" type="button" data-cruise-day-up>上移</button><button class="table-link danger" type="button" data-cruise-day-remove>删除</button></div>');
    }
    function readDays(){return Array.from(dayList.children).map(function(c){return {port:c.querySelector('[data-cruise-port]').value,arrival:c.querySelector('[data-cruise-arrival]').value,departure:c.querySelector('[data-cruise-departure]').value,overnight:c.querySelector('[data-cruise-overnight]').checked,text:c.querySelector('textarea').value,meal:c.querySelector('.route-itinerary-side input:not([type=time]):not([type=checkbox])').value};});}
    function syncDays(){
      var days=readDays();
      Array.from(dayList.children).forEach(function(c,i){c.querySelector('.route-day-index').textContent='D'+(i+1);var sea=!days[i].port;var p=R.ports.find(function(p){return p.id===days[i].port;});c.querySelector('[data-cruise-timezone]').textContent=p?'当地时间 · '+p.timezone:'';c.querySelectorAll('[type=time],[data-cruise-overnight]').forEach(function(el){el.disabled=sea;if(sea){if(el.type==='checkbox')el.checked=false;else el.value='';}});});
      document.getElementById('sailingDays').value=days.length;
      document.getElementById('lineRoutePorts').value=days.map(function(d){return R.portName(d.port);}).join(' / ');
    }
    function renderDays(days){dayList.replaceChildren();days.forEach(function(d){var c=dayTemplate.cloneNode(true);upgradeDay(c,d);dayList.appendChild(c);});syncDays();}
    var initialCards=Array.from(dayList.children);initialCards.forEach(function(c,i){upgradeDay(c,{port:i?'marseille':'barcelona',text:c.querySelector('textarea').value,arrival:i?'08:00':'',departure:'18:00'});});R.routes.find(function(r){return r.id==='glory-west';}).days.slice(initialCards.length).forEach(function(d){var c=dayTemplate.cloneNode(true);upgradeDay(c,d);dayList.appendChild(c);});syncDays();
    // Confirmation only protects replacement of edits, not normal form progression.
    var modal=document.getElementById('cruiseReferenceConfirm');
    if(!modal){document.body.insertAdjacentHTML('beforeend','<div class="modal-overlay" id="cruiseReferenceConfirm" hidden><section class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="cruiseReferenceConfirmTitle"><div class="modal-header"><h3 id="cruiseReferenceConfirmTitle" class="modal-title">确认更换资料</h3></div><div class="modal-body"><p id="cruiseReferenceConfirmText"></p></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-cruise-replace-cancel>取消</button><button class="btn btn-primary" type="button" data-cruise-replace-confirm>确认更换</button></div></section></div>');modal=document.getElementById('cruiseReferenceConfirm');}
    function confirmReplacement(text,yes,no){document.getElementById('cruiseReferenceConfirmText').textContent=text;window.caesarUI.openLayer(modal);modal.querySelector('[data-cruise-replace-confirm]').onclick=function(){window.caesarUI.closeLayer(modal);yes();};modal.querySelector('[data-cruise-replace-cancel]').onclick=function(){window.caesarUI.closeLayer(modal);no();};}
    shipSelect.addEventListener('change',function(){var next=shipSelect.value;shipSelect.value=selectedShip;confirmReplacement('更换船只将带入对应船舶资料和舱型，替换当前舱型编辑。',function(){selectedShip=next;shipSelect.value=next;renderReference();renderCabins();templateOptions();document.getElementById('lineHomePort').value=ship().home;},function(){});});
    document.getElementById('lineCruiseTemplate').addEventListener('change',function(ev){var select=ev.target,id=select.value;select.value='';if(!id)return;var r=R.routes.find(function(r){return r.id===id;});confirmReplacement('采用“'+r.name+'”将替换当前港口和逐日航程。',function(){renderDays(R.clone(r.days));select.value=id;var ports=r.days.filter(function(d){return d.port;});document.getElementById('lineBoardingPort').value=ports[0].port;document.getElementById('lineDisembarkPort').value=ports[ports.length-1].port;var count=document.getElementById('sailingDays');if(count)count.value=r.days.length;},function(){});});
    function onPageClick(ev){
      if(!page.querySelector('#lineShipName'))return;
      var t=ev.target;
      if(t.closest('[data-cruise-add-day]')){var c=dayTemplate.cloneNode(true);upgradeDay(c,{port:'',text:'海上巡游，船上自由活动。'});dayList.appendChild(c);syncDays();}
      if(t.closest('[data-cruise-day-remove]')){t.closest('.route-day-card').remove();syncDays();}
      if(t.closest('[data-cruise-day-up]')){var c=t.closest('.route-day-card');if(c.previousElementSibling)dayList.insertBefore(c,c.previousElementSibling);syncDays();}
      if(t.closest('[data-add-row="#cabinMatrix"]')){ev.preventDefault();var c=R.clone(ship().cabins[0]);c.name='新舱型';c.code='NEW';document.querySelector('#cabinMatrix tbody').insertAdjacentHTML('beforeend',cabinRow(c));}
      var plan=t.closest('[data-plan-switch]');
      if(plan){var current=page.querySelector('[data-plan-switch].active');if(current&&current!==plan){lines[current.dataset.planName]=snapshot();restore(lines[plan.dataset.planName]||defaultForPlan(plan.dataset.planName));}}
    }
    page.addEventListener('click',onPageClick);
    page.cruiseReferenceCleanup=function(){page.removeEventListener('click',onPageClick);};
    dayList.addEventListener('change',syncDays);
    document.getElementById('lineCruisePdf').addEventListener('change',function(ev){var f=ev.target.files[0];if(!f)return;document.getElementById('lineCruisePdfFiles').innerHTML='<a target="_blank" rel="noopener" href="'+e(URL.createObjectURL(f))+'">'+e(f.name)+'</a>';});
    function snapshot(){return {ship:selectedShip,fields:['lineHomePort','lineBoardingPort','lineDisembarkPort','lineCruiseTemplate'].map(function(id){return document.getElementById(id).value;}),days:readDays(),cabinHtml:document.querySelector('#cabinMatrix tbody').innerHTML,cabinValues:Array.from(document.querySelectorAll('#cabinMatrix tbody input,#cabinMatrix tbody select')).map(function(el){return el.value;}),pdf:document.getElementById('lineCruisePdfFiles').innerHTML,planFields:planFields.map(function(id){var f=document.getElementById(id);return f?f.value:null;}),included:Array.from(page.querySelectorAll('[data-plan-included]:checked')).map(function(f){return f.dataset.planIncluded;})};}
    function restore(s){selectedShip=s.ship;shipSelect.value=s.ship;renderReference();templateOptions();['lineHomePort','lineBoardingPort','lineDisembarkPort','lineCruiseTemplate'].forEach(function(id,i){document.getElementById(id).value=s.fields[i];});renderDays(s.days);document.querySelector('#cabinMatrix tbody').innerHTML=s.cabinHtml;Array.from(document.querySelectorAll('#cabinMatrix tbody input,#cabinMatrix tbody select')).forEach(function(el,i){el.value=s.cabinValues[i];});document.getElementById('lineCruisePdfFiles').innerHTML=s.pdf;document.getElementById('lineCruisePdf').value='';planFields.forEach(function(id,i){var f=document.getElementById(id);if(f&&s.planFields[i]!=null)f.value=s.planFields[i];});page.querySelectorAll('[data-plan-included]').forEach(function(f){f.checked=s.included.includes(f.dataset.planIncluded);});}
    templateOptions();renderReference();renderCabins();
    var initialReference=snapshot();
    function defaultForPlan(name){var state=R.clone(initialReference);if(/B方案/.test(name)){state.planFields[planFields.indexOf('cruiseShoreCode')]='B';state.planFields[planFields.indexOf('cruiseShoreContent')]='各港自由活动，不含成套岸上观光；单港项目可另选。';state.planFields[planFields.indexOf('shoreIncluded')]='岸上游自费';state.planFields[planFields.indexOf('embarkService')]='仅含码头协助';state.included=['insurance'];state.days.forEach(function(d,i){if(i&&d.port)d.text=R.portName(d.port)+'靠港自由活动，按船方离港时间返回。';});state.pdf='';}return state;}
  }
  window.CaesarCruiseProductReference={mount:mount};
})();
