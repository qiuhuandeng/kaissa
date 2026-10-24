(function () {
  'use strict';
  var R = window.CaesarCruiseResources;
  var kind = document.body.dataset.cruiseResource;
  if (!R || !kind) return;
  var rows = R.clone(R[kind]);
  var name = {ports:'港口',ships:'船只',routes:'模板'}[kind];
  var prefix = {ports:'port',ships:'ship',routes:'route'}[kind];
  var drawer = document.getElementById(prefix + 'Drawer');
  var body = drawer.querySelector('.modal-body');
  var list = document.querySelector('.cruise-resource-list');
  var active = null, activeId = null;
  var e = R.escape;
  function field(key, label, value, type, choices) {
    var control = type === 'select' ? '<select class="form-control" data-field="'+key+'">'+choices+'</select>' : type === 'textarea' ? '<textarea class="form-control" data-field="'+key+'" rows="3">'+e(value)+'</textarea>' : '<input class="form-control" data-field="'+key+'" type="'+(type || 'text')+'" value="'+e(value)+'">';
    return '<div class="form-group'+(type === 'textarea'?' form-group-full':'')+'"><label class="form-label">'+e(label)+control+'</label></div>';
  }
  function section(title, content) { return '<section class="drawer-section"><h3 class="drawer-section-title">'+title+'</h3>'+content+'</section>'; }
  function grid(content) { return '<div class="form-grid">'+content+'</div>'; }
  function value(key) { var el=body.querySelector('[data-field="'+key+'"]');return el?el.value:''; }
  function ship(id) { return R.ships.find(function(s){return s.id===id;}) || R.ships[0]; }
  function shipOptions(id) { return R.ships.map(function(s){return '<option value="'+s.id+'"'+(s.id===id?' selected':'')+'>'+e(s.name)+'</option>';}).join(''); }
  function uploadFields() {
    return '<div class="cruise-resource-media"><img id="shipImagePreview" src="'+e(active.image)+'" alt="船舶展示图（示例）"><div><label class="form-label">船舶图片<input type="file" data-upload-image accept="image/*"></label><div class="text-muted" id="shipImageName">'+e(active.imageName)+'</div></div></div><label class="form-label">甲板图／船舶手册<input type="file" data-upload-docs multiple accept=".pdf,.png,.jpg,.jpeg,.webp"></label><div class="cruise-resource-files" id="shipFiles"></div>';
  }
  function renderFiles() {
    var target = document.getElementById('shipFiles'); if(!target)return;
    target.innerHTML=active.attachments.map(function(f,i){return '<span><a target="_blank" rel="noopener" href="'+e(f.url)+'">'+e(f.name)+'</a> <button type="button" class="table-link danger" data-remove-file="'+i+'">移除</button></span>';}).join('') || '<span class="text-muted">尚未添加甲板图或船舶手册</span>';
  }
  function cabinRows(cabins) {
    return cabins.map(function(c,i){
      function input(k,t){return '<input class="table-input" data-cabin="'+k+'" aria-label="'+e(c.code+' '+k)+'" type="'+(t||'text')+'" value="'+e(c[k])+'">';}
      function select(k,opts){return '<select class="table-input" data-cabin="'+k+'">'+R.options(opts,c[k])+'</select>';}
      return '<tr data-cabin-row><td>'+input('name')+input('code')+'</td><td>'+select('category',['内舱','海景','阳台','套房','其他'])+'</td><td>'+input('standard','number')+'</td><td>'+input('maximum','number')+'</td><td>'+select('extra',['支持','不支持'])+'</td><td>'+select('child',['支持','需确认','不支持'])+'</td><td><div class="table-action"><button class="table-link" type="button" data-cabin-detail>资料</button><button class="table-link danger" type="button" data-remove-cabin>删除</button></div></td></tr><tr class="cruise-cabin-detail" hidden><td colspan="7">'+grid(field('cabinArea'+i,'面积',c.area)+field('cabinView'+i,'景观',c.view)+field('cabinBeds'+i,'床型',c.beds)+field('cabinFacilities'+i,'设施',c.facilities,'textarea'))+'</td></tr>';
    }).join('');
  }
  function readCabins() {
    return Array.from(body.querySelectorAll('[data-cabin-row]')).map(function(tr){var c={};tr.querySelectorAll('[data-cabin]').forEach(function(el){c[el.dataset.cabin]=el.type==='number'?Number(el.value):el.value;});var more=tr.nextElementSibling.querySelectorAll('[data-field]');['area','view','beds','facilities'].forEach(function(k,i){c[k]=more[i].value;});return c;});
  }
  function renderShip() {
    body.innerHTML=section('船只信息',grid(
      field('name','船名',active.name)+field('company','船公司',active.company,'select',R.options(['地中海邮轮','皇家加勒比','歌诗达邮轮'],active.company))+
      field('supplier','绑定供应商',active.supplier)+field('home','母港',active.home,'select',R.portOptions(active.home))+
      field('tonnage','吨位／建造',active.tonnage)+field('capacity','载客量',active.capacity)+field('rooms','总舱房数',active.rooms)+field('version','资料版本',active.version)+field('facilities','设施与舱型备注',active.facilities,'textarea')))+
      section('船舶介绍与资料',grid(field('description','船舶介绍',active.description,'textarea')+field('policy','登船与服务政策',active.policy,'textarea'))+uploadFields())+
      section('基础舱型','<div class="drawer-section-head"><button class="btn btn-secondary btn-sm" type="button" data-add-cabin>新增舱型</button></div><div class="table-wrap drawer-table-wrap cruise-reference-table"><table><thead><tr><th>舱型名称／船方代码</th><th>分类</th><th>标准入住</th><th>最大入住</th><th>第三／第四人</th><th>儿童不占位</th><th>操作</th></tr></thead><tbody id="shipCabins">'+cabinRows(active.cabins)+'</tbody></table></div>');
    body.querySelector('[data-field="supplier"]').readOnly=true;
    renderFiles();
  }
  function renderPort() {
    document.getElementById('portFields').innerHTML=
      field('name','中文名称',active.name)+field('english','英文名称',active.english)+field('country','国家',active.country)+field('city','城市',active.city)+field('aliases','别名',active.aliases)+field('timezone','当地时区',active.timezone,'select',R.options(Array.from(new Set(R.ports.map(function(p){return p.timezone;}))),active.timezone))+field('tax','港口税费参考',active.tax,'number')+field('currency','参考币种',active.currency,'select',R.options(['CNY','EUR','USD','JPY','SGD','HKD'],active.currency))+field('note','备注',active.note,'textarea');
  }
  function stopRows(days) {
    return days.map(function(d,i){return '<div class="route-day-card cruise-resource-stop" data-stop><strong>D<span data-day-number>'+ (i+1)+'</span></strong><div><div class="cruise-port-line"><label>港口／海上日<select class="form-control" data-stop-port>'+R.portOptions(d.port,true)+'</select></label><label>到港时间<input class="form-control" type="time" data-stop-arrival value="'+e(d.arrival)+'"></label><label>离港时间<input class="form-control" type="time" data-stop-departure value="'+e(d.departure)+'"></label><label><input type="checkbox" data-stop-overnight'+(d.overnight?' checked':'')+'>过夜停靠</label></div><textarea class="form-control" rows="2" data-stop-text aria-label="D'+(i+1)+'航程">'+e(d.text)+'</textarea><div class="cruise-stop-actions"><button class="table-link" type="button" data-stop-up>上移</button><button class="table-link danger" type="button" data-stop-remove>删除</button></div></div></div>';}).join('');
  }
  function readStops() {return Array.from(body.querySelectorAll('[data-stop]')).map(function(row){return {port:row.querySelector('[data-stop-port]').value,arrival:row.querySelector('[data-stop-arrival]').value,departure:row.querySelector('[data-stop-departure]').value,overnight:row.querySelector('[data-stop-overnight]').checked,text:row.querySelector('[data-stop-text]').value,meal:'船上用餐 / 船上住宿'};});}
  function cabinChoices() {
    var s=ship(value('ship')||active.ship);
    var selected=active.cabinCodes || s.cabins.map(function(c){return c.code;});
    return s.cabins.map(function(c){return '<tr><td>'+e(c.name)+'</td><td><select class="table-input" data-route-cabin="'+e(c.code)+'">'+R.options(['适用','不适用'],selected.includes(c.code)?'适用':'不适用')+'</select></td><td>'+e(c.standard)+'</td><td>'+e(c.maximum)+'</td><td>'+e(c.child)+'</td></tr>';}).join('');
  }
  function renderRoute() {
    body.innerHTML=section('模板信息',grid(field('name','模板名称',active.name)+field('code','模板编号',active.code)+field('ship','船只',active.ship,'select',shipOptions(active.ship))+field('company','船公司',ship(active.ship).company)+field('duration','航程天数',active.duration)+field('season','适用季节',active.season)))+
      section('港口与航程','<div id="routeStops">'+stopRows(active.days)+'</div><button class="btn btn-secondary btn-sm" type="button" data-add-stop>新增一天</button>')+
      section('可采购舱型','<div class="table-wrap drawer-table-wrap resource-cruise-cabin-table drawer-table-fit drawer-table-cols-5"><table><thead><tr><th>舱型</th><th>是否适用</th><th>标准入住</th><th>最大入住</th><th>儿童不占位</th></tr></thead><tbody id="routeCabins"></tbody></table></div>');
    body.querySelector('[data-field="company"]').readOnly=true;
    body.querySelector('[data-field="code"]').readOnly=true;
    body.querySelector('[data-field="duration"]').readOnly=true;
    document.getElementById('routeCabins').innerHTML=cabinChoices();syncStops();
  }
  function syncStops() { var stops=body.querySelectorAll('[data-stop]');stops.forEach(function(row,i){row.querySelector('[data-day-number]').textContent=i+1;var sea=!row.querySelector('[data-stop-port]').value;row.querySelectorAll('input').forEach(function(el){el.disabled=sea;if(sea){if(el.type==='checkbox')el.checked=false;else el.value='';}});});body.querySelector('[data-field="duration"]').value=Math.max(stops.length-1,0)+'晚'+stops.length+'天'; }
  function open(id) {
    activeId=id||null;active=R.clone(rows.find(function(r){return r.id===id;})||rows[0]);
    if(!id){active.name='新'+name;if(kind==='routes')active.code='新模板';}
    document.getElementById(prefix+'DrawerTitle').textContent=id?name+'维护':'新增'+name;
    ({ships:renderShip,ports:renderPort,routes:renderRoute})[kind]();window.caesarUI.openLayer(drawer);
  }
  function filteredRows() {
    var q=list.querySelector('input[type=search]').value.trim().toLowerCase();
    var filters=Array.from(list.querySelectorAll('select')).map(function(s){return s.value;}).filter(function(v){return v&&!v.startsWith('全部');});
    return rows.filter(function(r){var hay=JSON.stringify(r)+(kind==='routes'?ship(r.ship).name+r.days.map(function(d){return R.portName(d.port);}).join(' '):'');return (!q||hay.toLowerCase().includes(q))&&filters.every(function(v){return hay.includes(v);});});
  }
  function renderList() {
    var shown=filteredRows();
    list.querySelector('tbody').innerHTML=shown.map(function(r){
      var edit='<div class="table-action"><button class="table-action-primary" type="button" data-edit-resource="'+e(r.id)+'">编辑</button>'+(kind==='ships'?'<a href="resource-cruise-routes.html?ship='+e(r.id)+'">模板</a>':'')+'</div>';
      if(kind==='ports')return '<tr><td><strong>'+e(r.name)+'</strong><div class="text-muted">'+e(r.english)+'</div></td><td>'+e(r.country+' / '+r.city)+'</td><td>'+e(r.aliases)+'</td><td>'+e(r.timezone)+'</td><td>'+edit+'</td></tr>';
      if(kind==='ships')return '<tr><td><strong>'+e(r.name)+'</strong></td><td>'+e(r.company)+'</td><td>'+e(r.supplier)+'</td><td>'+e(R.portName(r.home))+'</td><td>'+e(r.tonnage)+'</td><td>'+e(r.capacity)+'</td><td>'+e(Array.from(new Set(r.cabins.map(function(c){return c.category;}))).join('/'))+'</td><td>'+edit+'</td></tr>';
      var ports=r.days.filter(function(d){return d.port;});
      return '<tr><td><strong>'+e(r.code)+'</strong><div class="text-muted">'+e(r.name)+'</div></td><td>'+e(ship(r.ship).company+' / '+ship(r.ship).name)+'</td><td>'+e(ports.length?R.portName(ports[0].port)+' → '+R.portName(ports[ports.length-1].port):'海上巡游')+'</td><td>'+e(r.duration)+'</td><td>'+e(ports.slice(1,-1).map(function(d){return R.portName(d.port);}).join('/'))+'</td><td>'+e((r.cabinCodes||ship(r.ship).cabins.map(function(c){return c.code;})).join('/'))+'</td><td>'+e(r.season)+'</td><td><span class="tag tag-green">启用</span></td><td>'+edit+'</td></tr>';
    }).join('')||'<tr><td colspan="'+({ports:5,ships:8,routes:9}[kind])+'">暂无符合条件的资料</td></tr>';
    var count=list.querySelector('.pagination span');if(count)count.textContent='共'+shown.length+'条';
  }
  function save() {
    if(kind==='ships') {
      ['name','company','supplier','home','tonnage','capacity','rooms','version','facilities','description','policy'].forEach(function(k){active[k]=value(k);});active.cabins=readCabins();
    }else if(kind==='ports'){
      ['name','english','country','city','aliases','timezone','tax','currency','note'].forEach(function(k){active[k]=value(k);});
    }else{
      ['name','ship','duration','season'].forEach(function(k){active[k]=value(k);});active.days=readStops();active.cabinCodes=Array.from(body.querySelectorAll('[data-route-cabin]')).filter(function(el){return el.value==='适用';}).map(function(el){return el.dataset.routeCabin;});
    }
    active.name=active.name||'新'+name;
    if(activeId)rows[rows.findIndex(function(r){return r.id===activeId;})]=active;else{active.id=kind+'-'+Date.now();rows.unshift(active);}
    renderList();window.caesarUI.closeLayer(drawer);window.caesarUI.toast(name+'资料已保存');
  }
  // Keep the existing filter, drawer and footer paths; bind saves to current-page records.
  var saveButton=drawer.querySelector('[data-save-cruise-resource]')||drawer.querySelector('.modal-footer .btn-primary');
  saveButton.removeAttribute('data-close-'+prefix+'-drawer');saveButton.addEventListener('click',save);
  document.addEventListener('click',function(ev){
    var t=ev.target;
    if(t.closest('[data-open-'+prefix+'-drawer]'))open(null);
    var edit=t.closest('[data-edit-resource]');if(edit)open(edit.dataset.editResource);
    if(t.closest('[data-close-'+prefix+'-drawer]')||t===drawer)window.caesarUI.closeLayer(drawer);
    if(t.closest('[data-cabin-detail]')){var detail=t.closest('tr').nextElementSibling;detail.hidden=!detail.hidden;}
    if(t.closest('[data-remove-cabin]')){var tr=t.closest('tr');tr.nextElementSibling.remove();tr.remove();}
    if(t.closest('[data-add-cabin]')){var cabins=readCabins();var c=R.clone(R.ships[0].cabins[0]);c.code='NEW';c.name='新舱型';cabins.push(c);document.getElementById('shipCabins').innerHTML=cabinRows(cabins);}
    var removeFile=t.closest('[data-remove-file]');if(removeFile){active.attachments.splice(Number(removeFile.dataset.removeFile),1);renderFiles();}
    if(t.closest('[data-add-stop]')){document.getElementById('routeStops').insertAdjacentHTML('beforeend',stopRows([{port:'',text:'海上巡游。'}]));syncStops();}
    if(t.closest('[data-stop-remove]')){t.closest('[data-stop]').remove();syncStops();}
    if(t.closest('[data-stop-up]')){var stop=t.closest('[data-stop]');if(stop.previousElementSibling)stop.parentNode.insertBefore(stop,stop.previousElementSibling);syncStops();}
  });
  body.addEventListener('change',function(ev){
    var t=ev.target;
    if(t.matches('[data-upload-image]')&&t.files[0]){active.image=URL.createObjectURL(t.files[0]);active.imageName=t.files[0].name;document.getElementById('shipImagePreview').src=active.image;document.getElementById('shipImageName').textContent=active.imageName;}
    if(t.matches('[data-upload-docs]')){Array.from(t.files).forEach(function(f){active.attachments.push({name:f.name,url:URL.createObjectURL(f)});});renderFiles();}
    if(t.matches('[data-field="company"]')&&kind==='ships'){var s=R.ships.find(function(s){return s.company===t.value;});body.querySelector('[data-field="supplier"]').value=s?s.supplier:'';}
    if(t.matches('[data-field="ship"]')&&kind==='routes'){body.querySelector('[data-field="company"]').value=ship(t.value).company;active.cabinCodes=null;document.getElementById('routeCabins').innerHTML=cabinChoices();}
    if(t.matches('[data-stop-port]'))syncStops();
  });
  list.querySelector('.btn-filter-search').addEventListener('click',renderList);
  list.querySelector('input[type=search]').addEventListener('keydown',function(ev){if(ev.key==='Enter')renderList();});
  list.querySelectorAll('.filter-actions button')[1].addEventListener('click',function(){list.querySelector('input[type=search]').value='';list.querySelectorAll('select').forEach(function(s){s.selectedIndex=0;});renderList();});
  if(kind==='ports')document.getElementById('portCountry').insertAdjacentHTML('beforeend',R.options(Array.from(new Set(R.ports.map(function(p){return p.country;}))),''));
  if(kind==='routes'){
    document.getElementById('routeShip').innerHTML='<option value="">全部船只</option>'+shipOptions('');
    var selected=new URLSearchParams(location.search).get('ship');if(selected)document.getElementById('routeShip').value=selected;
    document.getElementById('routePort').innerHTML='<option value="">全部港口</option>'+R.portOptions('');
  }
  renderList();
})();
