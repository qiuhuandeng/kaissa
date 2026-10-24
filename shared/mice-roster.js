/* 项目团报名名单：个人资料、集中安排、本团签证要求各自维护，同一份人员记录。 */
(function(){
'use strict';
const U=window.MiceUI,{M,store:S,esc:E,field:F,grid:G,section:SEC,btn:B,action:A}=U;
const active=()=>window.MiceActivity?.activity;
const project=()=>window.MiceActivity?.project;
const editable=()=>M.activityAllows(active(),project(),'execution');
const canSave=a=>active()?.id===a.id&&editable();
const selected=new Set();
let currentId='',query='',filter='',page=1;
const arrangementFields=[['group','客户分组'],['arrival','到达批次'],['departure','离开批次'],['room','房间'],['vehicle','车辆']];
const personalFields=['name','phone','documentType','document','needs','note'];
const modes=[{value:'agency',label:'随团代办'},{value:'self',label:'自行办理'},{value:'existing',label:'已有有效签证'},{value:'exempt',label:'免签／无需办理'}];
const mode=r=>r.visaMode||(r.visaRequired===false?'exempt':'agency');
const modeName=r=>modes.find(v=>v.value===mode(r))?.label||'待核对';
const progress=r=>r.visaReviewRequired?'原签证资料待复核':mode(r)!=='agency'?(r.visaBasis?'依据已登记，待核验':'核对依据待补'):r.visa?.status||'待办理';
const mask=v=>v?String(v).slice(0,3)+'••••'+String(v).slice(-3):'未登记';
function save(a,action,detail){S.log(a.projectId,action,a.name+'／'+detail);S.data.logs.at(-1).activityId=a.id;S.save();MiceActivity.render();}
function rows(){return (active()?.roster||[]).filter(r=>(!query||[r.name,r.phone,r.group,r.arrival,r.departure,r.room,r.vehicle].join(' ').toLowerCase().includes(query.toLowerCase()))&&(!filter||filter==='document'&&!r.document||filter==='group'&&!r.group||filter==='room'&&!r.room||filter==='vehicle'&&!r.vehicle||filter==='visa'&&active().visaRequirement?.required&&(r.visaReviewRequired||mode(r)==='agency'&&r.visa?.status!=='已出签'||mode(r)!=='agency'&&!r.visaBasis)));}
function scope(){return selected.size?(active().roster||[]).filter(r=>selected.has(r.id)):rows();}
function scopeLabel(list){return (selected.size?'已选人员':'当前筛选')+' '+list.length+' 人';}
function visaSummary(a){
 const v=a.visaRequirement,needed=v?.required,people=a.roster||[],agency=people.filter(r=>mode(r)==='agency'),review=people.filter(r=>r.visaReviewRequired).length;
 const result=needed?'<span>随团代办 <strong>'+agency.length+'</strong> 人</span><span>材料齐全 '+agency.filter(r=>!r.visaReviewRequired&&r.visa?.materials==='齐全').length+' 人</span><span>已送签 '+agency.filter(r=>!r.visaReviewRequired&&['已送签','已出签'].includes(r.visa?.status)).length+' 人</span><span>已出签 '+agency.filter(r=>!r.visaReviewRequired&&r.visa?.status==='已出签').length+' 人</span>'+(review?'<span class="mice-roster-warning">原资料待复核 '+review+' 人</span>':''):'';
 return '<div class="mice-roster-visa"><div class="mice-roster-visa-head"><div><strong>本团签证要求</strong><span>'+E(v?(needed?'需要 · '+(v.country||'目的地待核')+' · '+(v.type||'类型待核'):'不需要'):'未设置')+'</span></div><div>'+A(editable()?'签证要求':'查看要求','execution-visa-requirement')+(needed?U.link('打开签证办理',U.url('merchant/tour/visa-processing.html',{scheduleNo:a.id,projectId:a.projectId,source:'project',returnUrl:location.href})):'' )+'</div></div>'+(needed?'<div class="mice-roster-visa-counts">'+result+'</div><p class="mice-muted">个人办理方式在“报名名单”的“编辑”中核对；材料、送签和出签以签证办理记录为准。</p>':'')+'</div>';
}
function section(a){
 if(currentId!==a.id){currentId=a.id;query='';filter='';page=1;selected.clear();}
 for(const id of selected)if(!(a.roster||[]).some(r=>r.id===id))selected.delete(id);
 if(!a.visaRequirement?.required&&filter==='visa')filter='';
 const list=rows(),all=a.roster||[],write=editable(),visa=a.visaRequirement?.required;
 page=Math.min(page,Math.max(1,Math.ceil(list.length/20)));
 const summary=U.summary([['已登记人员',all.length+' 人'],['计划人数',(a.people??'待定')+(a.people!=null?' 人':'')],['名单要求',a.nameMode||'待核对'],['名单核对',a.nameMode==='按人数交付'?'按人数交付，不强制实名':a.people==null?'计划人数待确认':all.length>a.people?'已登记超计划 '+(all.length-a.people)+' 人':'尚缺 '+Math.max(0,a.people-all.length)+' 人']]);
 const filters=[{value:'document',label:'证件待补'},{value:'group',label:'未分组'},{value:'room',label:'未分房'},{value:'vehicle',label:'未分车'},...(visa?[{value:'visa',label:'签证待核对'}]:[])];
 const exports='<span class="dropdown table-action-more"><button type="button" class="btn btn-secondary dropdown-toggle" data-action-menu-toggle aria-expanded="false">导出</button><span class="dropdown-menu action-dropdown-menu">'+[['roster-export','导出人员资料'],['execution-roster-export','导出分组安排']].map(([key,label])=>'<button type="button" class="dropdown-item" data-mice-action="'+key+'">'+label+'</button>').join('')+'</span></span>';
 const actions=(write?B('新增人员','roster-new',{},true)+B('导入名单','roster-import')+B('分组分房分车','execution-roster-batch'):'')+exports;
 const head='<div class="mice-roster-toolbar"><div class="mice-roster-query"><input id="mice-roster-search" aria-label="筛选报名名单" placeholder="姓名／电话／分组／批次／房间／车辆" value="'+E(query)+'"><select id="mice-roster-filter" aria-label="名单筛选">'+U.options(filters,filter,'全部人员')+'</select>'+B('查询','roster-search')+B('重置','roster-reset')+'</div><div class="mice-roster-actions">'+actions+'</div></div>';
 const check=r=>'<input type="checkbox" data-roster-select="'+E(r.id)+'" aria-label="选择'+E(r.name)+'" '+(selected.has(r.id)?'checked':'')+'>';
 const selection='<div class="mice-roster-selection"><label><input type="checkbox" id="mice-roster-select-filtered" '+(list.length&&list.every(r=>selected.has(r.id))?'checked':'')+'> 选择当前筛选 '+list.length+' 人</label><span>已选 '+selected.size+' 人</span>'+(selected.size?A('清空选择','roster-clear'):'')+'<span class="mice-muted">'+(selected.size?'安排与导出使用已选人员':'未勾选时，安排与导出使用当前筛选结果')+'</span></div>';
 const table=U.table(['选择','人员资料','分组／到离批次','房间／车辆','服务需求',...(visa?['签证']:[]),'操作'],list.slice((page-1)*20,page*20).map(r=>[check(r),U.lines(E(r.name),E(r.phone||'电话未登记'),'<span class="mice-muted">'+E(r.document?(r.documentType||'证件')+' '+mask(r.document):'证件未登记')+'</span>'),U.lines(E(r.group||'未分组'),E(r.arrival||'到达待定'),'<span class="mice-muted">'+E(r.departure||'离开待定')+'</span>'),U.lines(E(r.room||'未分房'),E(r.vehicle||'未分车')),E(r.needs||'—'),...(visa?[U.lines(E(modeName(r)),E(progress(r)))]:[]),A(write?'编辑':'查看',write?'roster-edit':'roster-view',r.id)]),'mice-registration-table');
 return '<div class="mice-registration">'+summary+'<p class="mice-muted">本团签证：'+E(a.visaRequirement?(visa?'需要 · '+(a.visaRequirement.country||'目的地待核'):'不需要'):'未设置')+'　'+A('查看签证进度','tab','visa')+'</p>'+head+selection+table+'<div class="mice-pagination">筛选 '+list.length+' 人／全团 '+all.length+' 人<div>'+B('上一页','roster-prev')+' '+page+' / '+Math.max(1,Math.ceil(list.length/20))+' '+B('下一页','roster-next')+'</div></div></div>';
}
function visaSection(a){
 const people=a.roster||[],needed=a.visaRequirement?.required;
 return visaSummary(a)+SEC(needed?'人员签证进度':'人员签证资料',U.table(['人员','办理方式','材料情况','办理进度','核对依据','操作'],people.map(r=>[E(r.name),needed?E(modeName(r)):'本团无需办理',E(r.visa?.materials||'未登记'),E(needed?progress(r):r.visa?.status?'原记录：'+r.visa.status:'—'),E(r.visaBasis||r.visa?.basis||'未登记'),A('查看人员','roster-locate',r.id)])))+(people.length?'':'<p class="mice-muted">尚未登记人员，请先在报名名单登记；本团签证要求可提前设置。</p>');
}
function bind(app){
 const input=app.querySelector('#mice-roster-search');if(input)input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search();}};
 app.querySelectorAll('[data-roster-select]').forEach(n=>n.onchange=()=>{n.checked?selected.add(n.dataset.rosterSelect):selected.delete(n.dataset.rosterSelect);MiceActivity.render();});
 const all=app.querySelector('#mice-roster-select-filtered');if(all)all.onchange=()=>{rows().forEach(r=>all.checked?selected.add(r.id):selected.delete(r.id));MiceActivity.render();};
}
function search(){query=document.getElementById('mice-roster-search').value.trim();filter=document.getElementById('mice-roster-filter').value;page=1;selected.clear();MiceActivity.render();}
function person(id){
 const a=active(),r=(a.roster||[]).find(r=>r.id===id);if(id&&!r)return;
 const write=editable();if(!id&&!write)return;
 const value=r||{name:'演示报名人员'+((a.roster||[]).length+1),documentType:a.visaRequirement?.required?'护照':'身份证'};
 if(!write)return U.drawer('人员资料',U.summary(personalFields.map(k=>[({name:'姓名',phone:'电话',documentType:'证件类型',document:'证件号码',needs:'服务需求',note:'备注'})[k],value[k]||'—']))+SEC('接待安排',U.summary(arrangementFields.map(([k,label])=>[label,value[k]||'未安排'])))+(a.visaRequirement?.required?SEC('个人签证',U.summary([['办理方式',modeName(value)],['核对依据',value.visaBasis||'待补'],['办理进度',progress(value)]])):''),{readonly:true,buttons:[]});
 const visa=a.visaRequirement?.required?SEC('个人签证',G(F('visaMode','办理方式',mode(value),{options:modes,blank:null})+F('visaBasis','核对依据',value.visaBasis||'',{type:'textarea',full:true}))+'<p class="mice-muted">已有签证、自行办理或免签须核对依据；办理方式不代替材料、送签和出签结果。</p>'):'';
 U.drawer(id?'编辑人员资料':'新增人员',SEC('个人资料',G(F('name','姓名',value.name)+F('phone','联系电话',value.phone||'')+F('documentType','证件类型',value.documentType||'',{options:['身份证','护照','其他']})+F('document','证件号码',value.document||'')+F('needs','服务需求',value.needs||'',{full:true})+F('note','备注',value.note||'',{type:'textarea',full:true})))+visa+(r?SEC('已有接待安排',U.summary(arrangementFields.map(([k,label])=>[label,r[k]||'未安排'])))+'<p class="mice-muted">分组、到离批次、房间及车辆在“分组分房分车”中统一维护。</p>':''),{submit(v,intent,x){
  if(!canSave(a))return U.toast('本团已结束或状态已变化，不能修改报名名单','warning');
  const duplicate=v.document&&(a.roster||[]).find(n=>n.id!==id&&n.document===v.document.trim());if(duplicate)return x.errors({document:'本团已有该证件：'+duplicate.name+'，请编辑原人员'});
  const next=Object.fromEntries(personalFields.map(k=>[k,(v[k]||'').trim()]));next.name=next.name||value.name;
  if(a.visaRequirement?.required){next.visaMode=v.visaMode;next.visaRequired=v.visaMode==='agency';next.visaBasis=v.visaBasis||'';}
  if(r){if(r.visa&&r.document!==next.document)r.visaReviewRequired=true;Object.assign(r,next);}else(a.roster||=[]).push({...next,id:S.id('MD')});
  x.close();save(a,id?'修改人员资料':'新增报名人员',next.name);
 }});
}
function batch(){
 if(!editable())return;const a=active(),list=scope();if(!list.length)return U.toast('当前没有可安排的人员，请先新增或导入名单','warning');
 const input=(name,value,label)=>'<input name="'+E(name)+'" class="form-control" value="'+E(value||'')+'" aria-label="'+E(label)+'">';
 const common='<details class="mice-roster-common"><summary>统一填写一项</summary><div class="mice-roster-common-fields">'+F('common-field','安排项目','group',{options:arrangementFields.map(([value,label])=>({value,label})),blank:null})+F('common-value','统一内容','')+B('填给本次'+list.length+'人','roster-apply-batch')+'</div></details>';
 const table=U.table(['姓名／需求','客户分组','到达／离开批次','房间／车辆'],list.map((r,i)=>[U.lines(E(r.name),E(r.needs||'—')),input('group-'+i,r.group,r.name+'分组'),input('arrival-'+i,r.arrival,r.name+'到达批次')+input('departure-'+i,r.departure,r.name+'离开批次'),input('room-'+i,r.room,r.name+'房间')+input('vehicle-'+i,r.vehicle,r.name+'车辆')]),'mice-roster-arrange-table');
 U.drawer('人员安排','<div class="mice-roster-arrangement-heading"><strong>'+E(a.name)+'</strong><span>'+scopeLabel(list)+'</span></div>'+common+table,{wide:true,buttons:[['保存安排','save']],onOpen({el,form}){
  el.classList.add('mice-roster-arrange-drawer');
  form.elements['common-field'].onchange=()=>{form.elements['common-value'].value='';};
  el.querySelector('[data-mice-action=roster-apply-batch]').onclick=()=>{
   const key=form.elements['common-field'].value,value=form.elements['common-value'].value.trim();
   if(!arrangementFields.some(([field])=>field===key)||!value)return U.toast('请填写统一内容；清空安排可直接修改人员行','warning');
   list.forEach((r,i)=>form.elements[key+'-'+i].value=value);
   form.dispatchEvent(new Event('input',{bubbles:true}));
   form.elements['common-value'].value='';el.querySelector('.mice-roster-common').open=false;
   form.elements[key+'-0'].focus();
   U.toast('已填入本次'+list.length+'人的'+arrangementFields.find(([field])=>field===key)[1]+'，请核对并保存安排');
  };
 },submit(v,intent,x){if(!canSave(a))return U.toast('本团状态已变化，不能保存安排','warning');for(const [i,r]of list.entries())for(const [key]of arrangementFields)r[key]=(v[key+'-'+i]||'').trim();x.close();save(a,'维护接待安排',list.length+'人');}});
}
function requirements(){
 const a=active(),v=a.visaRequirement||{},write=editable();
 if(!write)return U.drawer('本团签证要求',U.summary([['是否需要签证',a.visaRequirement?(v.required?'需要':'不需要'):'未设置'],['目的地',v.country||'—'],['签证类型',v.type||'—'],['核对依据',v.basis||'—']]),{readonly:true,buttons:[]});
 U.drawer('本团签证要求',G(F('required','是否需要签证',v.required?'需要':'不需要',{options:['不需要','需要'],blank:null}))+'<div id="mice-visa-details">'+G(F('country','目的地国家／地区',v.country||a.city||'')+F('type','签证类型',v.type||'旅游签证'))+'</div>'+G(F('basis','核对依据',v.basis||'按本团目的地及参加人员情况核对',{type:'textarea',full:true})),{onOpen({form}){const toggle=()=>form.querySelector('#mice-visa-details').hidden=form.elements.required.value!=='需要';form.elements.required.onchange=toggle;toggle();},submit(next,intent,x){if(!canSave(a))return U.toast('本团状态已变化，不能修改签证要求','warning');const changed=v.country!==next.country||v.type!==next.type||!!v.required!==(next.required==='需要');if(changed)(a.roster||[]).filter(r=>r.visa||r.visaBasis).forEach(r=>r.visaReviewRequired=true);a.visaRequirement={...next,required:next.required==='需要'};x.close();save(a,'维护本团签证要求',next.required);}});
}
const headers=['姓名','分组','电话','到达批次','离开批次','房间分组','车辆分组','证件','证件类型','服务需求','备注'];
function importRoster(initial){
 if(!editable())return;const a=active();let data=[],checked='',source=typeof initial==='string'?initial:M.csv([headers,['演示导入人员'+((a.roster||[]).length+1),'','','','','','','','','','']]);
 const parse=text=>{const csv=M.parseCSV(text);if(csv[0]?.[0]!=='姓名')throw Error('请使用名单模板的表头');return csv.slice(1).filter(row=>row.some(Boolean)).map(r=>({name:r[0]||'',group:r[1]||'',phone:r[2]||'',arrival:r[3]||'',departure:r[4]||'',room:r[5]||'',vehicle:r[6]||'',document:r[7]||'',documentType:r[8]||'',needs:r[9]||'',note:r[10]||''}));};
 const validate=items=>{const seen=new Set((a.roster||[]).map(r=>r.document||r.name+'|'+(r.phone||'')));return items.map(r=>{const key=r.document||r.name+'|'+r.phone,issue=!r.name?'姓名待补':seen.has(key)?'重复，保留原人员':'';if(!issue)seen.add(key);return {...r,issue};});};
 function preview(x){try{const raw=x.form.elements.csv.value;const entries=checked===raw?data.map((r,i)=>({...r,name:x.form.elements['import-name-'+i]?.value.trim()||'',phone:x.form.elements['import-phone-'+i]?.value.trim()||'',document:x.form.elements['import-document-'+i]?.value.trim()||''})):parse(raw);data=validate(entries);checked=raw;x.el.querySelector('#mice-roster-preview').innerHTML=SEC('逐行核对',U.table(['姓名','电话／证件','核对结果'],data.map((r,i)=>['<input class="form-control" name="import-name-'+i+'" aria-label="第'+(i+1)+'行姓名" value="'+E(r.name)+'">','<input class="form-control" name="import-phone-'+i+'" aria-label="第'+(i+1)+'行电话" value="'+E(r.phone)+'"><input class="form-control" name="import-document-'+i+'" aria-label="第'+(i+1)+'行证件" value="'+E(r.document)+'">',E(r.issue||'可导入')]),'mice-roster-import-table'));}catch(e){data=[];checked='';x.el.querySelector('#mice-roster-preview').innerHTML='<p class="mice-roster-warning">'+E(e.message)+'</p>';}}
 U.drawer('导入报名名单',SEC('名单来源','<div class="mice-roster-batch-tools">'+B('下载名单模板','roster-template')+'<input type="file" id="mice-roster-file" accept=".csv" aria-label="选择CSV名单"></div><p id="mice-roster-source" class="mice-muted">'+(typeof initial==='string'?'保留上次待修正名单':'当前为演示资料，可直接核对；选择CSV文件后替换')+'</p>'+F('csv','名单内容（CSV）',source,{type:'textarea',full:true}))+'<div id="mice-roster-preview"></div>',{wide:true,buttons:[['核对名单','check'],['确认导入','save']],onOpen(x){x.el.classList.add('mice-roster-import-drawer');preview(x);x.form.querySelector('input[type=file]').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const text=await f.text();parse(text);x.form.elements.csv.value=text;x.el.querySelector('#mice-roster-source').textContent='已读取：'+f.name;preview(x);}catch(err){U.toast('文件未读入，保留当前资料：'+err.message,'warning');}};},submit(v,intent,x){if(!canSave(a))return U.toast('本团状态已变化，不能导入名单','warning');if(intent==='check'||checked!==v.csv){preview(x);if(intent==='check')return;}if(!checked)return;const revised=data.map((r,i)=>({...r,name:x.form.elements['import-name-'+i]?.value.trim()||'',phone:x.form.elements['import-phone-'+i]?.value.trim()||'',document:x.form.elements['import-document-'+i]?.value.trim()||''}));const result=validate(revised),valid=result.filter(r=>!r.issue),pending=result.filter(r=>r.issue);(a.roster||=[]).push(...valid.map(({issue,...r})=>({...r,id:S.id('MD')})));save(a,'导入报名名单',valid.length+'人；待处理'+pending.length+'行');x.close();U.drawer('导入结果',U.summary([['已导入',valid.length+'人'],['待处理',pending.length+'行']])+U.table(['姓名','处理结果'],result.map(r=>[E(r.name||'未填姓名'),E(r.issue||'已导入')]))+(pending.length?B('返回修正','roster-import-return'):''),{readonly:true,buttons:[],onOpen(resultDrawer){if(pending.length)resultDrawer.el.querySelector('[data-mice-action=roster-import-return]').onclick=()=>{resultDrawer.close();importRoster(M.csv([headers,...pending.map(r=>[r.name,r.group,r.phone,r.arrival,r.departure,r.room,r.vehicle,r.document,r.documentType,r.needs,r.note])]));};}});}});
}
function exportRows(kind){const list=scope(),a=active();if(!list.length)return U.toast('当前没有可导出的人员','warning');const keys=kind==='arrange'?['name','group','arrival','departure','room','vehicle','needs']:['name','phone','documentType','document','needs','note'];const labels=kind==='arrange'?['姓名','客户分组','到达批次','离开批次','房间','车辆','服务需求']:['姓名','联系电话','证件类型','证件号码','服务需求','备注'];U.download(a.name+'-'+(kind==='arrange'?'分组安排':'人员资料')+'-'+list.length+'人.csv',M.csv([labels,...list.map(r=>keys.map(k=>r[k]||''))]));window.CaesarActionMenus?.close();U.toast('已导出'+scopeLabel(list));}
Object.assign(U.actions,{
 'roster-locate':({id})=>{const r=active()?.roster?.find(r=>r.id===id);if(!r)return;currentId=active().id;query=r.name;filter='';page=1;selected.clear();U.actions.tab({id:'roster'});},
 'roster-new':()=>person(),'roster-edit':({id})=>person(id),'roster-view':({id})=>person(id),'roster-import':()=>importRoster(),'roster-template':()=>U.download('报名名单模板.csv',M.csv([headers])),
 'roster-search':search,'roster-reset':()=>{query='';filter='';page=1;selected.clear();MiceActivity.render();},'roster-clear':()=>{selected.clear();MiceActivity.render();},'roster-prev':()=>{page=Math.max(1,page-1);MiceActivity.render();},'roster-next':()=>{page++;MiceActivity.render();},
 'execution-roster-batch':batch,'execution-visa-requirement':requirements,'roster-export':()=>exportRows('personal'),'execution-roster-export':()=>exportRows('arrange')
});
window.MiceRoster={section,visaSection,bind,selected};
})();
