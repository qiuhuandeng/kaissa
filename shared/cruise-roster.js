(function (root) {
  'use strict';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // A room belongs to a cabin group, not to an individual passenger. Allocation never changes sold stock.
  function roomError(groups, rooms, group, roomNo) {
    if (!roomNo) return '';
    const room = rooms.find(r => r.no === roomNo);
    if (!room) return '房号不在本航次船方房表中';
    if (room.cabin !== group.cabin) return '房号舱型与已订舱型不符';
    if (group.people.length > room.capacity) return '入住人数超过房间容量';
    if (groups.some(g => g.id !== group.id && g.room === roomNo)) return '房号已分配给另一同舱组';
    return '';
  }
  function checkImport(rows, people, groups, rooms) {
    return rows.map((r, i) => {
      const p = people.find(p => p.id === r.personId), g = p && groups.find(g => g.id === p.group);
      let reason = !p ? '游客未匹配' : r.order !== p.order || r.group !== p.group ? '订单或同舱组不匹配' : r.cabin !== g.cabin ? '舱型不匹配' : '';
      if (!reason && rows.some((x, j) => j < i && x.personId === r.personId)) reason = '重复游客记录';
      const peers = rows.filter(x => x.group === r.group && x.order === r.order);
      if (!reason && peers.some(x => x.room !== r.room)) reason = '同舱组收到不同房号';
      if (!reason && rows.some(x => x.group !== r.group && x.room && x.room === r.room)) reason = '本批不同同舱组使用同一房号';
      if (!reason && !r.room) reason = '房号未回传';
      if (!reason) reason = roomError(groups, rooms, g, r.room);
      return {reason, ready: !reason};
    });
  }
  function parseCsv(text) {
    let rows = [], row = [], value = '', quoted = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
      else if (!quoted && (c === ',' || c === '\n')) { row.push(value.replace(/\r$/, '')); value = ''; if (c === '\n') { rows.push(row); row = []; } }
      else value += c;
    }
    if (quoted) throw new Error('CSV引号未闭合，保留当前资料');
    if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
    return rows.filter(r => r.some(Boolean));
  }
  const csv = rows => '\uFEFF' + rows.map(row => row.map(x => '"' + String(x == null ? '' : x).replace(/^[=+@\-]/, "'$&").replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const rules = {roomError, checkImport, parseCsv, csv};
  if (typeof module !== 'undefined') module.exports = rules;
  if (!root.document) return;
  const $ = id => document.getElementById(id), open = id => root.caesarUI.openLayer($(id)), close = id => root.caesarUI.closeLayer($(id));
  let config, refresh, orderList = [], people = [], groups = [], currentPerson = 0, currentGroup, batch, filter = 'all', stage = 0, view = 'people';
  const history = [], rooms = [{no:'9232',cabin:'BA',capacity:4},{no:'9234',cabin:'BA',capacity:4},{no:'9240',cabin:'BA',capacity:4},{no:'6110',cabin:'OV',capacity:3},{no:'6112',cabin:'OV',capacity:3}];
  const importHeaders = ['游客编号','订单号','同舱组','舱型代码','船方房号'];
  const profileFields = [['surname','英文姓'],['given','英文名'],['gender','性别'],['birth','出生日期'],['nationality','国籍'],['passport','护照号'],['expiry','护照有效期'],['emergency','紧急联系人'],['preference','舱房偏好'],['diet','饮食需求'],['diningWish','用餐偏好'],['restaurant','船方确认餐厅'],['dining','船方确认时段'],['station','船方确认集合站'],['shipRef','船方确认依据']];
  function field(key, label, val, type) { return '<label class="form-group"><span class="form-label">'+esc(label)+'</span><input class="form-control" data-cr-profile="'+key+'" type="'+(type || 'text')+'" value="'+esc(val)+'"></label>'; }
  function download(name, rows) { const url = URL.createObjectURL(new Blob([csv(rows)], {type:'text/csv;charset=utf-8'})), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function drawer(id, title, body, footer) { document.body.insertAdjacentHTML('beforeend','<div id="'+id+'" class="modal-overlay drawer-overlay" aria-hidden="true" hidden><section class="modal drawer-modal drawer-xl cruise-roster-drawer" role="dialog" aria-modal="true" aria-labelledby="'+id+'Title"><div class="modal-header"><h2 class="modal-title" id="'+id+'Title">'+title+'</h2><button type="button" class="modal-close" aria-label="关闭" data-cr-close="'+id+'">×</button></div><div class="modal-body">'+body+'</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-cr-close="'+id+'">关闭</button>'+footer+'</div></section></div>'); }
  function mount(c, orders, callback) {
    config = c; refresh = callback; orderList = orders;
    if ($('cruiseRosterView')) return;
    people = c.roster.rows.map((row, i) => ({id:'CRP-0'+(i+1), group:i<2?'同舱01':'同舱02', orderIndex:i<2?0:1, order:(orders[i<2?0:1] || {}).no || '', name:row[1], surname:['ZHANG','LI','WANG'][i], given:['JIANGUO','MEI','QIANG'][i], gender:i===1?'F':'M', birth:['1968-04-16','1970-06-08','1982-03-21'][i], nationality:'CHN', passport:['TEST00001','TEST00002','TEST00003'][i], expiry:'2030-06-01', emergency:i===2?'':'张女士 / 13800000000', preference:i===2?'远离电梯':'相邻舱优先', diet:i===1?'素食':'无', diningWish:'第一时段', restaurant:'', dining:'', station:'', shipRef:'', shore:i===2?'B 岸上自由':'A 经典岸上', source:row[8].text || row[8], row}));
    groups = [{id:'同舱01', cabin:'BA', room:'9232', people:people.slice(0,2)}, {id:'同舱02', cabin:'OV', room:'', people:people.slice(2)}];
    const select = document.createElement('select'); select.id = 'cruiseRosterView'; select.className = 'form-control schedule-roster-filter-select'; select.setAttribute('aria-label','名单查看方式'); select.innerHTML = '<option value="people">按游客查看</option><option value="cabins">按舱房查看</option>';
    $('rosterFilterSelect').before(select); select.onchange = () => { view = select.value; render(); };
    const table = document.createElement('div'); table.id = 'cruiseCabinView'; table.className = 'table-wrap cruise-cabin-view'; table.hidden = true;
    table.innerHTML = '<table><colgroup><col style="width:150px"><col><col style="width:140px"><col style="width:150px"><col style="width:120px"></colgroup><thead><tr><th>同舱组 / 舱型</th><th>入住游客 / 订单</th><th>船方房号</th><th>偏好</th><th>操作</th></tr></thead><tbody id="cruiseCabinRows"></tbody></table>';
    document.querySelector('#tab-roster .schedule-roster-v2-table').after(table);
    $('openRosterImport').textContent = '导入资料';
    $('rosterHandleDrawer').classList.add('cruise-roster-drawer');
    const fields = document.createElement('div'); fields.id = 'cruisePersonFields'; fields.className = 'form-grid'; $('rosterHandleRemark').closest('.form-group').before(fields);
    drawer('cruiseRoomDrawer','安排舱房','<div id="cruiseRoomSummary" class="readonly-summary"></div><label class="form-group"><span class="form-label">船方房号</span><select class="form-control" id="cruiseRoomSelect"></select></label><p id="cruiseRoomError" class="text-danger" role="status"></p><h3 class="detail-section-title">分房及换房记录</h3><div id="cruiseRoomHistory"></div>', '<button id="cruiseRoomSave" class="btn btn-primary" type="button">保存安排</button>');
    drawer('cruiseRosterImport','导入名单与房号','<div class="form-grid"><label class="form-group"><span class="form-label">导入内容</span><select id="cruiseImportKind" class="form-control"><option value="rooms">船方房号返单</option><option value="people">游客证件资料</option></select></label><label class="form-group"><span class="form-label">替换资料（CSV）</span><input type="file" id="cruiseImportFile" accept=".csv,text/csv" class="form-control"></label></div><p id="cruiseImportSource" class="schedule-muted"></p><button id="cruiseImportTemplate" class="btn btn-secondary" type="button">下载模板</button><p id="cruiseImportSummary" role="status"></p><label class="form-group"><span class="form-label">核对范围</span><select id="cruiseImportFilter" class="form-control"><option value="all">全部记录</option><option value="issue">待修正</option><option value="ready">可导入</option></select></label><div class="table-wrap"><table><thead id="cruiseImportHead"></thead><tbody id="cruiseImportRows"></tbody></table></div><div id="cruiseImportCorrection" hidden></div>', '<button id="cruiseImportBack" class="btn btn-secondary" type="button" hidden>返回核对</button><button id="cruiseImportNext" class="btn btn-primary" type="button">下一步：核对资料</button>');
    drawer('cruiseRosterExport','导出船方资料','<div class="readonly-summary" id="cruiseExportScope"></div><label class="form-group"><span class="form-label">名单模板</span><select id="cruiseExportTemplate" class="form-control"><option value="zh">船方通用中文 V1</option><option value="en">船方通用英文 V1</option></select></label><p class="schedule-muted">模板字段待对应船公司确认；仅导出当前名单。资料缺口随文件保留。</p>', '<button id="cruiseExportDownload" class="btn btn-primary" type="button">下载CSV</button>');
    $('cruiseRoomSave').onclick = () => { const room = $('cruiseRoomSelect').value, error = roomError(groups, rooms, currentGroup, room); $('cruiseRoomError').textContent = error; if (error) return; assign(currentGroup,room,'手动安排'); refresh(); close('cruiseRoomDrawer'); };
    $('cruiseImportKind').onchange = () => { batch = null; stage = 0; ensureBatch(); renderImport(); };
    $('cruiseImportFilter').onchange = () => { filter = $('cruiseImportFilter').value; renderImport(); };
    $('cruiseImportTemplate').onclick = () => download('邮轮'+($('cruiseImportKind').value==='rooms'?'房号':'游客资料')+'模板.csv',[headers()]);
    $('cruiseImportBack').onclick = () => { stage = 1; $('cruiseImportCorrection').hidden = true; renderImport(); };
    $('cruiseImportNext').onclick = () => {
      if (stage===0) {stage=1;renderImport();return;}
      if (stage===2) {close('cruiseRosterImport');return;}
      const checks = batchChecks(); let count=0; const changed = new Set();
      batch.rows.forEach((r,i) => { if (!checks[i].ready || r.applied) return; const p=people.find(p=>p.id===r.personId); if ($('cruiseImportKind').value==='rooms') {if(!changed.has(p.group)){assign(groups.find(g=>g.id===p.group),r.room,'船方返单 '+batch.name);changed.add(p.group);}} else { ['surname','given','passport','birth','nationality','expiry'].forEach(k=>p[k]=r[k] || p[k]); } r.applied=true; count++; });
      batch.result = count+'条已导入，'+batch.rows.filter(r=>!r.applied).length+'条待修正'; stage=2; sync(); refresh(); renderImport();
    };
    $('cruiseImportFile').onchange = async function () { const file=this.files[0]; if(!file)return; try {const data=parseCsv(await file.text()); if(JSON.stringify(data[0])!==JSON.stringify(headers())) throw new Error('表头不匹配，请使用当前模板；保留当前资料'); if(data.length<2)throw new Error('文件只有表头，保留当前资料'); batch={name:file.name,rows:data.slice(1).map(values=>Object.fromEntries(keys().map((k,i)=>[k,values[i]||''])))}; stage=0; renderImport();}catch(e){$('cruiseImportSource').textContent=e.message;} };
    document.addEventListener('click', e => {
      const closer=e.target.closest('[data-cr-close]'); if(closer)close(closer.dataset.crClose);
      const room=e.target.closest('[data-cr-room]'); if(room)openRoom(room.dataset.crRoom);
      const edit=e.target.closest('[data-cr-import-edit]'); if(edit)editImport(Number(edit.dataset.crImportEdit));
    });
    sync();
  }
  function assign(group,room,source) { if(group.room===room)return; history.unshift({group:group.id,before:group.room||'未分房',after:room||'未分房',source,time:new Date().toLocaleString('zh-CN')});group.room=room;sync(); }
  function profileMissing(p){return [['surname','英文姓'],['given','英文名'],['birth','出生日期'],['nationality','国籍'],['passport','护照'],['expiry','护照有效期'],['emergency','紧急联系人']].filter(([k])=>!p[k]).map(([,label])=>'缺'+label);}
  function sync() { people.forEach(p=>{const g=groups.find(g=>g.id===p.group);p.row[2]=p.passport;p.row[4]=(g.room||'待船方分房')+'/'+g.people.filter(x=>x.id!==p.id).map(x=>x.name).join('、');const missing=profileMissing(p);p.row[5]={text:missing.length?missing.join('、'):'已完成',tag:missing.length?'tag tag-orange':'tag tag-green'};}); }
  function render() {
    document.querySelector('#tab-roster .schedule-roster-v2-table').hidden = view==='cabins'; $('cruiseCabinView').hidden=view!=='cabins'; $('rosterFilterSelect').hidden=view==='cabins';
    $('rosterAllOption').textContent='全部 '+people.length+'人';$('rosterDocOption').textContent='资料已齐 '+people.filter(p=>!profileMissing(p).length).length+'人';$('rosterProgressOption').textContent='资料待补 '+people.filter(p=>profileMissing(p).length).length+'人';$('rosterInsuranceOption').textContent='保险待投（暂无名单标记）';$('rosterSpecialOption').textContent='特殊需求 '+people.filter(p=>p.preference||p.diet!=='无').length+'人';
    $('rosterTableHint').textContent='当前名单 '+people.length+'人 / '+groups.length+'间；已分房 '+groups.filter(g=>g.room).length+'间';
    $('cruiseCabinRows').innerHTML=groups.map(g=>'<tr><td><strong>'+esc(g.id)+'</strong><span class="table-cell-sub">'+esc(g.cabin)+' / '+g.people.length+'人</span></td><td>'+esc(g.people.map(p=>p.name).join('、'))+'<span class="table-cell-sub">'+esc([...new Set(g.people.map(p=>p.order))].join('、'))+'</span></td><td>'+esc(g.room||'待船方分房')+'</td><td>'+esc([...new Set(g.people.map(p=>p.preference))].join('、'))+'</td><td><div class="table-action"><button class="table-action-primary" type="button" data-cr-room="'+esc(g.id)+'">'+(g.room?'换房':'分房')+'</button></div></td></tr>').join('');
  }
  function openRoom(id) {currentGroup=groups.find(g=>g.id===id);$('cruiseRoomDrawerTitle').textContent=currentGroup.room?'换房':'安排舱房';$('cruiseRoomSummary').textContent=id+' / '+currentGroup.cabin+' / '+currentGroup.people.map(p=>p.name).join('、');$('cruiseRoomSelect').innerHTML='<option value="">待船方分房</option>'+rooms.filter(r=>r.cabin===currentGroup.cabin).map(r=>'<option value="'+r.no+'">'+r.no+' / 最多'+r.capacity+'人</option>').join('');$('cruiseRoomSelect').value=currentGroup.room;$('cruiseRoomError').textContent='';$('cruiseRoomHistory').innerHTML=history.filter(x=>x.group===id).map(x=>'<p>'+esc(x.time+' '+x.before+' → '+x.after+' / '+x.source)+'</p>').join('')||'<p class="schedule-muted">暂无调整记录</p>';open('cruiseRoomDrawer');}
  function openPerson(index) {currentPerson=index;const p=people[index];$('rosterHandleTitle').textContent='游客资料';$('cruisePersonFields').innerHTML=profileFields.map(([k,l])=>field(k,l,p[k],['birth','expiry'].includes(k)?'date':'text')).join('');$('saveRosterHandle').textContent='保存资料';}
  function savePerson() {const p=people[currentPerson];document.querySelectorAll('[data-cr-profile]').forEach(input=>p[input.dataset.crProfile]=input.value);sync();refresh();}
  function keys(){return $('cruiseImportKind').value==='rooms'?['personId','order','group','cabin','room']:['personId','order','surname','given','passport','birth','nationality','expiry'];}
  function headers(){return $('cruiseImportKind').value==='rooms'?importHeaders:['游客编号','订单号','英文姓','英文名','护照号','出生日期','国籍','护照有效期'];}
  function ensureBatch(){if(batch)return;batch={name:'默认演示资料（非文件读取）',rows:people.map((p,i)=>Object.assign({},p,{personId:p.id,group:p.group,cabin:groups.find(g=>g.id===p.group).cabin,room:i<2?'9234':'6112'}))};if($('cruiseImportKind').value==='rooms')batch.rows.push({personId:'待匹配',order:'待核对',group:'同舱待核',cabin:'BA',room:'9240'});}
  function batchChecks(){if($('cruiseImportKind').value==='rooms')return checkImport(batch.rows,people,groups,rooms);return batch.rows.map((r,i)=>{const p=people.find(p=>p.id===r.personId);let reason=!p?'游客未匹配':p.order!==r.order?'订单不匹配':batch.rows.some((x,j)=>j<i&&x.personId===r.personId)?'重复游客记录':'';return {ready:!reason,reason};});}
  function openImport(){ensureBatch();renderImport();open('cruiseRosterImport');}
  function renderImport(){const checks=batchChecks();$('cruiseImportSource').textContent=batch.name;$('cruiseImportSummary').textContent=stage===2?batch.result:checks.filter(x=>x.ready).length+'条可导入 / '+checks.filter(x=>!x.ready).length+'条待修正；未匹配记录保留在本批';$('cruiseImportHead').innerHTML='<tr>'+headers().map(x=>'<th>'+esc(x)+'</th>').join('')+'<th>核对结果</th><th>操作</th></tr>';$('cruiseImportRows').innerHTML=batch.rows.map((r,i)=>{if(filter==='issue'&&checks[i].ready||filter==='ready'&&!checks[i].ready)return '';return '<tr><td>'+esc(r.personId)+'</td>'+keys().slice(1).map(k=>'<td>'+esc(r[k])+'</td>').join('')+'<td>'+esc(r.applied?'已导入':checks[i].reason||'可导入')+'</td><td>'+(r.applied?'已完成':'<button class="table-link" type="button" data-cr-import-edit="'+i+'">核对</button>')+'</td></tr>';}).join('');$('cruiseImportNext').textContent=['下一步：核对资料','确认导入可用记录','完成'][stage];$('cruiseImportBack').hidden=stage===0;}
  function editImport(i){const r=batch.rows[i],box=$('cruiseImportCorrection');box.hidden=false;box.innerHTML='<h3 class="detail-section-title">第'+(i+1)+'行核对</h3><div class="form-grid"><label class="form-group"><span class="form-label">对应游客 / 订单 / 同舱组</span><select id="cruiseImportPerson" class="form-control"><option value="">待匹配</option>'+people.map(p=>'<option value="'+p.id+'">'+esc(p.id+' '+p.name+' / '+p.order+' / '+p.group)+'</option>').join('')+'</select></label>'+keys().filter(k=>!['personId','order','group','cabin'].includes(k)).map(k=>'<label class="form-group"><span class="form-label">'+esc(headers()[keys().indexOf(k)])+'</span><input class="form-control" data-cr-import-field="'+k+'" value="'+esc(r[k])+'"></label>').join('')+'</div><button class="btn btn-secondary" id="cruiseImportSave" type="button">保存并返回核对</button>';$('cruiseImportPerson').value=r.personId;$('cruiseImportSave').onclick=()=>{const p=people.find(p=>p.id===$('cruiseImportPerson').value);if(p){r.personId=p.id;r.order=p.order;r.group=p.group;r.cabin=groups.find(g=>g.id===p.group).cabin;}box.querySelectorAll('[data-cr-import-field]').forEach(input=>r[input.dataset.crImportField]=input.value);box.hidden=true;stage=1;renderImport();};box.scrollIntoView({block:'nearest'});}
  function exportRoster(kind){
    const code=new URLSearchParams(location.search).get('scheduleNo')||config.summary.code;
    $('cruiseExportScope').textContent=code+' / '+kind+' / '+people.length+'人、'+groups.length+'间';
    $('cruiseExportDownload').onclick=()=>{
      let head=['模板版本','航次','游客编号','订单号','同舱组','姓名','英文姓','英文名','性别','出生日期','国籍','护照号','护照有效期','舱型','房号','岸上方案','饮食需求','用餐偏好','船方餐厅','船方时段','集合站','船方确认依据','资料缺口'];
      if($('cruiseExportTemplate').value==='en')head=['TemplateVersion','Departure','PassengerID','OrderNo','CabinGroup','Name','Surname','GivenName','Gender','DateOfBirth','Nationality','PassportNo','PassportExpiry','CabinCategory','CabinNo','ShorePlan','Diet','DiningPreference','ConfirmedRestaurant','ConfirmedDiningTime','AssemblyStation','ShipConfirmation','MissingInformation'];
      let rows=people.map(p=>{const g=groups.find(g=>g.id===p.group);return ['V1 / '+$('cruiseExportTemplate').value,code,p.id,p.order,p.group,p.name,p.surname,p.given,p.gender,p.birth,p.nationality,p.passport,p.expiry,g.cabin,g.room,p.shore,p.diet,p.diningWish,p.restaurant,p.dining,p.station,p.shipRef,profileMissing(p).concat(!g.room?'房号待确认':'',!p.shipRef?'船方安排未确认':'').filter(Boolean).join('；')];});
      if(kind==='舱房分配表'){head=['航次','同舱组','订单号','舱型','船方房号','游客编号','入住游客','人数'];rows=groups.map(g=>[code,g.id,[...new Set(g.people.map(p=>p.order))].join('、'),g.cabin,g.room,g.people.map(p=>p.id).join('、'),g.people.map(p=>p.name).join('、'),g.people.length]);}
      download(code+'-'+kind+'.csv',[head,...rows]);
    };
    open('cruiseRosterExport');
  }
  function transferContext(){const code=new URLSearchParams(location.search).get('scheduleNo')||config.summary.code;return {type:'cruise',code,product:config.summary.product,depart:config.summary.depart,orders:orderList.map((o,i)=>({no:o.no,customer:o.customer,quantity:o.travelQty+' / '+[4,3,2][i%3]+'人',occupation:o.raw.stock,contract:o.pay,decision:'待决定',status:'待处理',processed:false})),targets:[{code:'CZ20261126001',label:'CZ20261126001 / 理想号 / 2026-11-26 / A、B方案',supply:'MED-20261126；船方房量已确认（演示）',available:8,cabins:[{code:'BA',capacity:4,available:4},{code:'OV',capacity:3,available:2},{code:'SU',capacity:3,available:2}]},{code:'CZ20261210001',label:'CZ20261210001 / 理想号 / 2026-12-10 / 三岛方案',supply:'MED-20261210；改为三岛行程（演示）',available:2,cabins:[{code:'BA',capacity:4,available:1},{code:'OV',capacity:3,available:0},{code:'SU',capacity:3,available:1}]}].filter(t=>t.code!==code)};}
  function trafficCell(index){const p=people[index],g=groups.find(g=>g.id===p.group);return {html:'<div class="schedule-roster-cell"><strong>'+esc(p.row[6].text||p.row[6])+'</strong><span>'+esc(g.room?'房号 '+g.room:'房号待确认')+'</span></div>'};}
  function matchesFilter(v,f){const p=people[v.index];if(f==='doc')return !profileMissing(p).length;if(f==='progress')return !!profileMissing(p).length;if(f==='special')return !!p.preference||p.diet!=='无';if(f==='insurance')return /保险|投保/.test(v.text);return true;}
  root.CaesarCruiseRoster = Object.assign(rules,{mount,render,matchesFilter,trafficCell,transferContext,orderIndex:i=>people[i]?people[i].orderIndex:i,openPerson,savePerson,openImport,exportRoster});
})(typeof window==='undefined'?globalThis:window);
