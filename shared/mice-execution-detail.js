/* 项目团的人员准备、领队及交付资料，按执行八页签组织；不办理成本或结算。 */
(function(){
'use strict';
const U=window.MiceUI,{store:S,M,esc:E,btn:B,action:A,section:SEC,field:F,grid:G}=U;
const active=()=>window.MiceActivity?.activity,project=()=>window.MiceActivity?.project;
const editable=()=>active()&&M.activityAllows(active(),project(),'execution');
function save(action,detail){S.log(project().id,action,active().name+'／'+detail);const log=S.data.logs.at(-1);log.activityId=active().id;S.save();MiceActivity.render();}
const field=(name,value,label)=>'<input class="form-control" name="'+E(name)+'" value="'+E(value||'')+'" aria-label="'+E(label)+'">';
function leaderForm(){
 if(!editable())return;const a=active(),people=window.CaesarLeaderPrototype?.load()||[];
 U.drawer('安排领队',G(F('leader','领队',people[0]?.id||'',{options:people.map(p=>({value:p.id,label:p.name+'／'+p.languages})),blank:null})+F('scope','服务范围',a.service==='会议'?'会议执行':'全程领队',{options:['全程领队','当地陪同','会议执行'],blank:null})+F('start','开始日期',a.start,{type:'date'})+F('end','结束日期',a.end,{type:'date'})+F('basis','派团依据','按本团服务及行程安排',{type:'textarea',full:true})),{submit(v,intent,x){if(!editable())return;const person=people.find(p=>p.id===v.leader);if(!person)return x.errors({leader:'请选择领队'});if((a.leaders||[]).some(r=>r.leaderId===v.leader&&r.status!=='已取消'))return x.errors({leader:'该领队已有有效安排，请在原安排继续办理'});(a.leaders||=[]).push({id:S.id('PD'),leaderId:person.id,name:person.name,...v,status:'待领队确认',history:[{action:'安排领队',basis:v.basis,date:new Date().toLocaleString('zh-CN')}]});x.close();save('安排领队',person.name);}});
}
function leaderResult(id,kind){
 const r=active()?.leaders?.find(r=>r.id===id);if(!editable()||!r||r.status==='已取消')return;
 if(kind==='confirm'&&r.status!=='待领队确认'||kind==='actual'&&r.status!=='已确认'||kind==='cancel'&&!['待领队确认','已确认'].includes(r.status))return;
 const title={confirm:'登记领队确认',actual:'登记实际出行',cancel:'取消派团'}[kind];
 U.drawer(title,U.summary([['领队',r.name],['服务范围',r.scope]])+G(F('date','办理日期',kind==='actual'?r.start:new Date().toISOString().slice(0,10),{type:'date'})+F('basis','办理依据',kind==='confirm'?'领队已确认本团服务安排':kind==='actual'?'根据实际出行记录核对':'本团服务安排调整',{type:'textarea',full:true})),{submit(v,intent,x){if(!editable())return;r.status={confirm:'已确认',actual:'已出行',cancel:'已取消'}[kind];(r.history||=[]).push({action:title,...v});x.close();save(title,r.name);}});
}
function leaders(a){
 return SEC(a.service==='会议'?'会务执行人员':'领队安排',U.table(['领队／范围','服务日期','确认情况','操作'],(a.leaders||[]).map(r=>[U.lines(E(r.name),E(r.scope)),E(r.start)+' 至 '+E(r.end),E(r.status),A('查看','execution-leader-view',r.id)+(editable()?(r.status==='待领队确认'?A('确认','execution-leader-confirm',r.id):r.status==='已确认'?A('实际出行','execution-leader-actual',r.id):'')+(['待领队确认','已确认'].includes(r.status)?A('取消','execution-leader-cancel',r.id):''):'')])),editable()?B('安排领队','execution-leader-new'):'');
}
function documentText(a,type){
 const p=S.find('projects',a.projectId);
 return [type,a.name,a.id,'客户：'+p.customer,'服务日期：'+a.start+' 至 '+a.end,'地点：'+a.city,'主责计调：'+a.planner,'计划人数：'+(a.people??'待确认'),'已登记名单：'+(a.roster||[]).length+'人','',...(a.agenda||[]).map(r=>[r.date,(r.start||'')+'—'+(r.end||''),r.title||r.name,r.place].filter(Boolean).join('　')),'','资源安排',...(a.resources||[]).map(r=>[r.name,r.supplier,r.quantity+r.unit,r.status,r.confirmNo||'确认依据待补'].join('　')),'','领队安排',...(a.leaders||[]).filter(r=>r.status!=='已取消').map(r=>r.name+'　'+r.scope+'　'+r.status)].join('\n');
}
function documentForm(){
 if(!editable())return;const a=active(),type=a.service==='会议'?'会议执行手册':'出团通知';
 U.drawer('生成执行资料',G(F('name','资料名称',type)+F('content','资料内容',documentText(a,type),{type:'textarea',full:true})),{submit(v,intent,x){if(!editable())return;(a.executionDocuments||=[]).push({id:S.id('ZL'),name:v.name||type,content:v.content,createdAt:new Date().toLocaleString('zh-CN'),owner:a.planner});x.close();save('生成执行资料',v.name||type);}});
}
function materials(a){return SEC('执行资料',U.table(['资料名称','生成时间','经办人','操作'],(a.executionDocuments||[]).map(d=>[E(d.name),E(d.createdAt),E(d.owner),A('预览','execution-document-view',d.id)+A('下载','execution-document-download',d.id)])),editable()?B('生成资料','execution-document-new'):'');}
function resourceView(id){
 const r=active()?.resources?.find(r=>r.id===id);if(!r)return;
 U.drawer('资源详情',U.summary([['服务',r.name],['类别',r.category],['供应商',r.supplier],['日期',r.start+' 至 '+r.end],['数量',r.quantity+' '+r.unit],['确认情况',r.status],['确认号／依据',r.confirmNo||'待补'],['服务标准',r.spec||'待补'],['批次',r.batches||'—'],['地点',r.point||'—'],['联系人',r.contact||'—'],['取消依据',r.cancelReason||'—']]),{readonly:true,buttons:[]});
}
function resourceConfirmation(id){
 const a=active(),r=a?.resources?.find(r=>r.id===id);if(!r||r.status==='已取消')return;
 const canEdit=editable(),traffic=r.category==='交通',hotel=r.category==='酒店',vehicle=r.category==='车辆';
 const rows=traffic?(a.roster||[]):[],records=r.passengers||[];
 const confirmation=G(F('confirmNo','供应商确认号／依据',r.confirmNo||'',{readonly:!canEdit})+F('reference','采购协议／订位记录',r.reference||'',{readonly:!canEdit})+F('batches',traffic?'航班／车次':hotel?'入住与离店安排':'服务批次',r.batches||'',{readonly:!canEdit})+F('spec',traffic?'舱位／席别':hotel?'房型':vehicle?'车型':'服务规格',r.spec||'',{readonly:!canEdit})+F('point',traffic?'出发地与到达地':hotel?'酒店地址':'服务地点',r.point||'',{readonly:!canEdit})+F('contact',vehicle?'司机与联系电话':'服务联系人',r.contact||'',{readonly:!canEdit}));
 const people=traffic?SEC('乘客票号',U.table(['姓名','证件资料','票号／凭证号'],rows.map((p,i)=>[E(p.name),p.document?'已登记':'待补',canEdit?field('ticket-'+i,records.find(v=>v.personId===p.id)?.ticketNo,p.name+'票号'):E(records.find(v=>v.personId===p.id)?.ticketNo||'待登记')]))):'';
 U.drawer('资源确认资料',U.summary([['服务',r.name],['供应商',r.supplier],['数量',r.quantity+' '+r.unit]])+confirmation+people,{wide:traffic,readonly:!canEdit,buttons:canEdit?[['保存资料','save']]:[],submit(v,intent,x){if(!editable())return;for(const key of ['confirmNo','reference','batches','spec','point','contact'])r[key]=v[key];if(r.status==='已确认'&&!r.confirmNo.trim())r.status='待确认';if(traffic)r.passengers=rows.map((p,i)=>({personId:p.id,ticketNo:v['ticket-'+i]||''}));x.close();save('维护资源确认资料',r.name);}});
}
function overview(a,p){
 const resources=(a.resources||[]).filter(r=>r.status!=='已取消'),missing=resources.filter(r=>r.status!=='已确认'),roster=a.roster||[];
 const records=S.data.settlements.filter(r=>r.projectId===p.id&&r.activities.includes(a.id)),record=records.find(r=>['审批中','已确认'].includes(r.status))||records.at(-1);
 const settlement=U.url('merchant/tour/fulfillment-cost.html',{type:'project',activityId:a.id,projectId:p.id,detail:'1',returnUrl:location.href});
 const gaps=[];
 if(!M.activityFormationSource(a,p,S.data))gaps.push(['客户确认依据','待补',U.link('查看关联订单',U.activityUrl(a,{tab:'orders'}))]);
 if(!(a.agenda||[]).length)gaps.push(['执行安排','日程未登记',A('查看安排','tab','execution')]);
 if(a.nameMode==='实名服务'&&a.people>roster.length)gaps.push(['报名名单','尚缺 '+(a.people-roster.length)+' 人',A('查看名单','tab','roster')]);
 if(missing.length)gaps.push(['资源确认',missing.length+' 项未确认',A('查看资源','tab','resources')]);
 const changed=(a.agenda||[]).filter(r=>r.dateNeedsCheck).length;if(changed)gaps.push(['日程日期',changed+' 项待核',A('查看安排','tab','execution')]);
 if(a.visaRequirement?.required){const count=roster.filter(r=>r.visaReviewRequired||((r.visaMode||(r.visaRequired===false?'exempt':'agency'))==='agency'?r.visa?.status!=='已出签':!r.visaBasis)).length;if(count)gaps.push(['签证资料',count+' 人待核对',A('查看签证','tab','visa')]);}
 return SEC('业务归属',U.summary([['业务执行公司',a.executionCompany||M.executionCompany(p)],['合同签约公司',p.company]]))+SEC('执行概况',U.summary([['服务类型',a.service],['计划人数',a.people==null?'待确认':a.people+' 人'],['确认人数',a.confirmedPeople==null?'待确认':a.confirmedPeople+' 人'],['实际服务人数',a.completion?.actualPeople==null?'未登记':a.completion.actualPeople+' 人'],['已登记名单',roster.length+' 人'],['资源确认',resources.filter(r=>r.status==='已确认').length+' / '+resources.length+' 项']]))+
 (a.sourceChecks?.length?SEC('原资料待核',a.sourceChecks.map(v=>'<p class="mice-muted">'+E(v)+'</p>').join('')):'')+
 SEC('执行缺口',gaps.length?U.table(['核对内容','当前情况','操作'],gaps):'<p class="mice-muted">当前已登记资料无待补项。</p>')+
 (window.MiceBusinessUI?.receipts(a)||'')+SEC('服务完成记录',U.summary([['执行状态',a.status],['实际服务日期',a.completion?(a.completion.actualStart||'未登记')+' 至 '+(a.completion.actualEnd||'未登记'):'尚未登记'],['完成依据',a.completion?.basis||'尚未登记'],['未结事项',a.completion?.unfinished||'未登记'],['登记人／时间',[a.completion?.recordedBy,a.completion?.recordedAt].filter(Boolean).join(' / ')||'尚未登记'],['客户认可',a.acceptance?.status||'待客户确认']]))+
 SEC('结算状态',U.summary([['业务结算',record?.status||'未结算'],['结算单',record?.id||'尚未登记']]),U.link('查看结算详情',settlement));
}
let resourceCategory='',resourceActivity='';
function resources(a){
 if(resourceActivity!==a.id){resourceActivity=a.id;resourceCategory='';}
 const list=(a.resources||[]).filter(r=>!resourceCategory||r.category===resourceCategory);
 return SEC('资源安排','<div class="mice-resource-filter"><label for="mice-resource-category">服务类别</label><select class="form-control" id="mice-resource-category">'+U.options(['交通','酒店','车辆','会场设备','餐饮','地接','其他'],resourceCategory,'全部资源')+'</select></div>'+U.table(['资源／供应商','服务日期／数量','服务安排','确认情况','操作'],list.map(r=>[U.lines(E(r.name),E(r.category)+' · '+E(r.supplier)),U.lines(E(r.start)+' 至 '+E(r.end),E(r.quantity)+' '+E(r.unit)),U.lines(E(r.batches||r.spec||'待补安排'),E(r.point||'')),U.lines(E(r.status),E(r.confirmNo||'确认依据待补')),A('查看','resource-view',r.id)+(r.status!=='已取消'?(editable()?A('编辑','resource-edit',r.id):'')+A('确认资料','execution-resource-confirmation',r.id)+(editable()?A('取消','resource-cancel',r.id):''):'')]),'mice-execution-resource-table'),editable()?B('新增资源','resource-new'):'')+leaders(a);
}
function orders(a,p){
 const orders=S.data.orders.filter(o=>o.projectId===p.id&&o.activities.includes(a.id)),quotes=S.data.commitments.filter(c=>c.projectId===p.id&&(c.activities?.includes(a.id)||c.id===a.commitmentId||orders.some(o=>o.commitmentId===c.id)));
 const scope=ids=>(ids||[]).map(id=>S.find('activities',id)?.name||id).join('、')||'待核对';
 return '<div class="mice-toolbar">'+(window.MiceOrderEntry?.groupAction(a)||'')+'</div>'+SEC('客户委托与服务约定',U.summary([['本团服务',a.service],['客户委托依据',a.basis||S.find('commitments',a.commitmentId)?.basis||'待补'],['所属项目',p.name],['客户',p.customer]]))+
 SEC('关联报价',U.table(['报价单／约定','覆盖范围','原报价金额','状态','操作'],quotes.map(c=>[U.lines(E(c.id),E(c.name||c.basis||'—')),E(scope(c.activities)),M.money(c.amount,c.currency)+(c.activities?.length>1?'<br><span class="mice-muted">整体包价，未按团拆分</span>':''),U.tag(c.status),U.link('查看原报价',U.url('merchant/tour/product-custom-detail.html',{id:p.id,tab:'agreements'}))])))+
 SEC('关联订单与合同',U.table(['订单／合同','覆盖范围','原订单成交金额','订单状态','操作'],orders.map(o=>[U.lines(E(o.id),E(o.contractNo||'合同未登记')),E(scope(o.activities)),M.money(o.amount,o.currency)+(o.activities.length>1?'<br><span class="mice-muted">整体包价，未按团拆分</span>':''),U.tag(o.status),U.link('查看订单',U.url('merchant/sales/orders-detail.html',{mice:1,type:'project',orderNo:o.id,projectId:p.id}))+(o.contractNo?U.link('查看合同',U.url('merchant/sales/contracts.html',{mice:1,orderNo:o.id,projectId:p.id,contractNo:o.contractNo})):'' )])));
}
function preparation(a){
 const checklist=[['日程安排',(a.agenda||[]).length+' 项','execution'],['报名名单',(a.roster||[]).length+' 人 · '+(a.nameMode||'名单要求待定'),'roster'],['签证要求',a.visaRequirement?(a.visaRequirement.required?'需要 · '+a.visaRequirement.country:'不需要'):'未设置','visa'],['资源确认',(a.resources||[]).filter(r=>r.status==='已确认').length+' 项已确认','resources']];
 return SEC(a.service==='会议'?'会务准备':'出团与会务准备',U.table(['准备事项','当前资料','操作'],checklist.map(([label,result,id])=>[label,E(result),A('查看','tab',id)])))+materials(a)+SEC('客户与执行附件',U.table(['资料','类型','大小'],(a.attachments||[]).map(f=>[E(f.name),E(f.type||'资料'),(f.size||0)+' 字节'])),M.activityAllows(a,project(),'files')?B('维护附件','activity-files'):'')+SEC('服务交付附件',U.table(['资料','类型'],(a.completion?.files||[]).map(f=>[E(f.name),E(f.type||'完成证明')])));
}
function logs(a,p){
 const rows=S.data.logs.filter(l=>!/成本|结算|认款|付款|发票|报价|订单|收款|费用/.test(l.action||'')).filter(l=>l.activityId===a.id||!l.activityId&&l.projectId===p.id&&(String(l.detail).includes(a.name)||String(l.detail).includes(a.id)));
 return SEC('本团操作日志',U.table(['时间','操作','内容'],[...rows].reverse().map(l=>[E(l.time),E(l.action),E(l.detail)])))+SEC('历史日程',U.table(['版本／日期','原安排','调整依据','登记人'],[...(a.agendaHistory||[]).map(r=>[U.lines(E(r.version),E(r.date)),E(r.title),E(r.reason),E(r.owner)]),...(a.agenda||[]).filter(r=>r.kind&&a.service!=='会议加旅游'&&r.kind!==a.service).map(r=>[E(r.date),E(r.title),'原'+E(r.kind)+'安排保留',E(r.owner||a.planner)])]))+(window.MiceChanges?.activitySection(a)||'');
}
function enhance(a,p,tab){
 if(tab==='resources'){const input=document.getElementById('mice-resource-category');if(input)input.onchange=()=>{resourceCategory=input.value;MiceActivity.render();};}
}
Object.assign(U.actions,{
 'execution-leader-new':leaderForm,
 'execution-leader-confirm':({id})=>leaderResult(id,'confirm'),'execution-leader-actual':({id})=>leaderResult(id,'actual'),'execution-leader-cancel':({id})=>leaderResult(id,'cancel'),
 'execution-leader-view':({id})=>{const r=active()?.leaders?.find(r=>r.id===id);if(r)U.drawer('领队安排记录',U.summary([['领队',r.name],['状态',r.status],['服务日期',r.start+' 至 '+r.end]])+U.table(['办理事项','日期','依据'],(r.history||[]).map(h=>[E(h.action),E(h.date),E(h.basis)])),{readonly:true,buttons:[]});},
 'execution-document-new':documentForm,
 'execution-document-view':({id})=>{const d=active()?.executionDocuments?.find(d=>d.id===id);if(d)U.drawer(d.name,F('preview','资料内容',d.content,{type:'textarea',readonly:true,full:true}),{readonly:true,buttons:[]});},
 'execution-document-download':({id})=>{const d=active()?.executionDocuments?.find(d=>d.id===id);if(d)U.download(d.name+'.txt',d.content,'text/plain;charset=utf-8');},
 'execution-resource-confirmation':({id})=>resourceConfirmation(id),
 'resource-view':({id})=>resourceView(id)
});
window.MiceExecution={enhance,overview,resources,orders,preparation,logs,materials};
})();
