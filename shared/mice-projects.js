(function(){
'use strict';
const U=window.MiceUI,{M,store:S,esc:E,field:F,grid:G,section:SEC,btn:B,action:A,link:L}=U,D=S.data,C=D.catalog;
const path='merchant/tour/product-custom-detail.html';
const filterKeys=['keyword','kind','mode','sales','owner','status','start','end'];let filters=Object.fromEntries(filterKeys.map(k=>[k,U.q.get('filter_'+k)||''])),page=Number(U.q.get('page'))||1;
function people(company,plan=false){return C.staff.filter(s=>(!company||s.companies.includes(company))&&(!plan||s.canPlan)).map(s=>s.name);}
function createSingle(){
 const actor=window.MiceAccess?.current(),company=C.companies.find(c=>c.name===actor?.company)||C.companies[0],staff=people(company.name),customer=C.customers[0];
 const p={name:'客户年度交流会',customer:customer?.name||'',customerType:'企业',company:company.name,executionCompany:company.name,department:company.departments.includes('会奖业务部')?'会奖业务部':company.departments[0],kind:'会奖',mode:'single',businessMode:'会议专票团',sales:staff.includes('陈刚')?'陈刚':staff[0],owner:staff.includes(actor?.name)?actor.name:staff[0],start:'2026-11-15',end:'2026-11-15',contact:customer?.contact||'',phone:customer?.phone||'',scope:'会议、会场及接待服务',basis:'客户会议服务需求（演示）',originalBudget:20000,budgetControl:'enforced',publicBudget:0};
 const contracts=client=>(D.oaContractReturns||[]).filter(r=>r.customer===client&&r.company===(document.querySelector('.mice-single-project-entry [name=company]')?.value||p.company)&&r.status==='盖章完成');
 const contractOptions=client=>contracts(client).map(r=>({value:r.id,label:r.number+' · '+r.name}));
 const html='<div class="mice-single-project-form">'+SEC('客户与项目资料',G(
  F('name','单团名称',p.name,{full:true,required:true})+F('customer','客户单位',p.customer,{options:C.customers.map(c=>c.name),required:true,blank:null})+F('customerType','客户类型',p.customerType,{options:['企业','政府','其他单位'],blank:null})+
  F('kind','项目分类',p.kind,{options:['会奖','奖励旅游','企业团建','定制团','私人包团','政企考察','研学项目'],blank:null})+F('executionCompany','业务执行公司',p.executionCompany,{readonly:true})+F('company','合同签约公司',p.company,{options:C.companies.map(c=>c.name),blank:null})+
  F('sales','销售负责人',p.sales,{options:staff,blank:null})+F('owner','项目负责人',p.owner,{options:staff,blank:null})+
  F('contact','客户联系人',p.contact)+F('phone','联系电话',p.phone)))+
 SEC('团执行资料',G(
  MiceProjectFlow.modeField(p)+F('service','服务类型','会议',{options:['会议','旅游','会议加旅游'],blank:null})+
  F('start','开始日期',p.start,{type:'date'})+F('end','结束日期',p.end,{type:'date'})+F('city','城市／地点','上海')+F('people','计划人数',30,{type:'number',step:'1'})+
  F('planner','主责计调',people(p.company,true)[0]||'',{options:people(p.company,true),blank:null})+F('nameMode','名单要求','按人数交付',{options:['实名服务','按人数交付'],blank:null})+
  F('originalBudget','费用预算（CNY）',p.originalBudget,{type:'number'})+F('budgetControl','费用预算管理',p.budgetControl,{options:[{value:'enforced',label:'启用预算管控'},{value:'reference',label:'预算参考'}],blank:null})+
  F('scope','服务范围',p.scope,{type:'textarea',full:true})))+
 MiceBusinessUI.plan()+
 '<details class="mice-single-project-extra"><summary>补充资料</summary>'+G(
  F('department','负责部门',p.department,{options:company.departments,blank:null})+F('reference','客户委托编号','')+
  F('startTime','开始时间','',{type:'time'})+F('endTime','结束时间','',{type:'time'})+F('estimatedSales','客户预计金额（非成交）','',{type:'number'})+F('settlementDue','业务结算截止日','',{type:'date'})+
  F('oaId','关联已签合同','',{options:contractOptions(p.customer),blank:'暂不关联',full:true})+F('basis','客户需求资料',p.basis,{type:'textarea',full:true}))+'</details>'+
 '<div class="mice-create-status"><label class="mice-inline-check"><input type="checkbox" name="saveAsDraft">保存为草稿</label></div></div>';
 let committed=false;
 U.drawer('新增单团',html,{wide:true,buttons:[['创建单团','create']],onOpen({el,form,setClean}){
  el.classList.add('mice-single-project-entry');MiceBusinessUI.bindPlan(form);
  form.elements.customer.onchange=()=>{const c=C.customers.find(c=>c.name===form.elements.customer.value);form.elements.contact.value=c?.contact||'';form.elements.phone.value=c?.phone||'';form.elements.oaId.innerHTML=U.options(contractOptions(c?.name),'','暂不关联');};
  form.elements.company.onchange=()=>{form.elements.oaId.innerHTML=U.options(contractOptions(form.elements.customer.value),'','暂不关联');};
  form.elements.businessMode.onchange=()=>{form.elements.service.value=form.elements.businessMode.value==='会议专票团'?'会议':'旅游';};
  form.elements.saveAsDraft.onchange=()=>{form.querySelector('button[value="create"]').textContent=form.elements.saveAsDraft.checked?'保存草稿':'创建单团';};
  let previousStart=p.start;form.elements.start.onchange=()=>{if(!form.elements.end.value||form.elements.end.value===previousStart)form.elements.end.value=form.elements.start.value;previousStart=form.elements.start.value;};
  setClean();
 },submit(v,intent,x){
  if(committed||intent!=='create')return;
  const draft=!!v.saveAsDraft,status=draft?'草稿':'进行中',next={...p,id:'NEW-SINGLE-PROJECT',status,members:[],delegations:[],frameworks:[],attachments:[]};
  for(const k of ['name','customer','customerType','company','department','kind','sales','owner','start','end','contact','phone','scope','basis','businessMode','budgetControl'])next[k]=v[k];
  next.originalBudget=M.num(v.originalBudget);
  const activity={collectionPlan:MiceBusinessUI.readPlan(x.form)||[],id:'NEW-SINGLE-ACTIVITY',projectId:next.id,executionCompany:next.executionCompany,status,name:next.name,start:next.start,end:next.end,scope:next.scope,basis:next.basis,businessMode:next.businessMode,originalBudget:next.originalBudget,people:M.num(v.people),estimatedSales:M.num(v.estimatedSales),agenda:[],roster:[],resources:[],attachments:[]};
  for(const k of ['service','city','planner','nameMode','reference','startTime','endTime','settlementDue'])activity[k]=v[k]||'';
  const errors={...M.validateProject(next,draft?'draft':'confirm',{catalog:C}),...M.validateActivity(activity,next,draft?'draft':'execute',{catalog:C})};
  for(const k of ['originalBudget','estimatedSales'])if(v[k]!==''&&v[k]!=null&&(!Number.isFinite(Number(v[k]))||Number(v[k])<0))errors[k]='金额须为有效非负数';
  const contract=v.oaId?contracts(next.customer).find(r=>r.id===v.oaId):null;
  if(v.oaId&&!contract)errors.oaId='客户或合同已变化，请重新选择已签合同';
  if(Object.keys(errors).length)return x.errors(errors);
  // 所有资料先核对，项目与首团一起保存，取消或核对失败不留下空项目。
  next.id=S.id('PRJ-');activity.id=S.id('DRAFT-');activity.projectId=next.id;
  for(const [name,role] of [[next.sales,'销售'],[next.owner,'项目负责'],[activity.planner,'操作']]){
   if(!name)continue;const member=next.members.find(m=>m.name===name);
   if(member)member.role+='／'+role;else next.members.push({id:S.id('XM'),name,role,start:next.start,end:next.end,activities:[activity.id]});
  }
  if(contract)next.frameworks.push(MiceProjectFlow.contractFromOA(contract));
  if(!draft)activity.formation={source:'直接建团',basis:activity.scope,by:actor?.name||next.owner,time:new Date().toLocaleString('zh-CN')};
  D.projects.unshift(next);D.activities.push(activity);committed=true;
  S.log(next.id,draft?'保存单团草稿':'创建单团',next.name+'／'+activity.id+'／'+status);x.close();
  location.href=U.url(path,{id:next.id,tab:'activities',returnUrl:location.href});
 }});
}
function edit(id,copy=false,context={}){
 const old=S.find('projects',id),p=old?M.clone(old):{name:context.projectName||'企业年度会议服务项目',customer:context.customer||'北京科技发展有限公司',contact:context.contact||'王经理',phone:context.phone||'13800000000',company:'北京凯撒',department:'会奖业务部',kind:context.type==='MICE'?'会奖':context.type||'会奖',mode:'multi',businessMode:'会议专票团',budgetControl:'enforced',publicBudget:0,originalBudget:500000,start:context.travelStart||'2026-10-24',end:context.travelEnd||'2026-12-31',sales:'陈刚',owner:'张三',scope:context.requirement||context.meetingRequest||'按场执行会议、住宿及交通服务',basis:context.customerDoc||'客户年度服务需求资料（演示）',source:context,status:'草稿'};
 if(old&&!copy&&!['草稿','待确认'].includes(old.status))return U.toast('项目已进入后续阶段，请从详情查看或按原流程变更','warning');
 if(copy){for(const key of ['closeout','closeoutPlan','version','terminatedAt','terminateReason','termination','history','approvalId','approvalHistory'])delete p[key];p.id='';p.name+='-副本';p.status='草稿';p.start='';p.end='';}
 if(!old||copy){const ec=MiceAccess.current().company,co=C.companies.find(c=>c.name===ec)||C.companies[0];p.executionCompany=co.name;if(!old)p.company=co.name;p.department=co.departments[0];for(const k of ['sales','owner'])if(!people(co.name).includes(p[k]))p[k]=people(co.name)[0];}else p.executionCompany=M.executionCompany(old);
 const acts=old?D.activities.filter(a=>a.projectId===id):[];
 const customers=[...new Set([...C.customers.map(c=>c.name),p.customer].filter(Boolean))];
 let readTeam;
 const html=SEC('项目资料',G(F('name','项目名称',p.name,{required:true,full:true})+F('customer','客户单位',p.customer,{options:customers,required:true})+F('customerType','客户类型',p.customerType||'企业',{options:['企业','政府','其他单位']})+F('kind','业务分类',p.kind,{options:['会奖','奖励旅游','企业团建','定制团','私人包团','政企考察','研学项目']})+F('executionCompany','业务执行公司',p.executionCompany,{readonly:true})+F('company','合同签约公司',p.company,{options:C.companies.map(c=>c.name)})+F('department','负责部门',p.department,{options:C.companies.find(c=>c.name===M.executionCompany(p))?.departments||[]})+F('mode','组织方式',p.mode,{options:[{value:'single',label:'单个项目团'},{value:'multi',label:'大项目（多个子团）'}]})+F('start','服务开始日期',p.start,{type:'date'})+F('end','服务结束日期',p.end,{type:'date'})+F('sales','销售',p.sales,{options:people(M.executionCompany(p))})+F('owner','项目负责人',p.owner,{options:people(M.executionCompany(p))})+F('contact','客户联系人',p.contact,{options:[...new Set([C.customers.find(c=>c.name===p.customer)?.contact,p.contact].filter(Boolean))]})+F('phone','联系电话',p.phone)+F('scope','整体服务范围',p.scope,{type:'textarea',full:true})+F('basis','客户需求资料',p.basis,{type:'textarea',full:true})))+
 (p.source?.sourceLabel||p.source?.productName?SEC('需求来源',U.summary([['来源',p.source.sourceLabel||p.source.source],['来源编号',p.source.sourceNo||'—'],['参考线路',p.source.productName||p.source.route||'—']])+(p.source.returnUrl?L('返回来源',p.source.returnUrl):'')):'')+
 (window.MiceProjectFlow?MiceProjectFlow.setupFields({...p,members:copy?[]:p.members}):'')+
 (copy?SEC('复制范围','<label class="mice-inline-check"><input type="checkbox" name="copyAgenda" checked>服务安排</label> <label class="mice-inline-check"><input type="checkbox" name="copyBudget">预算参考</label> <label class="mice-inline-check"><input type="checkbox" name="copyTeam">项目分工</label>'):'');
 U.drawer(copy?'复制项目':old?'项目核对':'新建项目',html,{buttons:copy?[['保存草稿','draft']]:old?.status==='待确认'?[['保存草稿','draft'],['确认启用','activate']]:[['保存草稿','draft'],['提交核对','submit']],onOpen({form,read}){
 if(window.MiceProjectFlow)readTeam=MiceProjectFlow.bindTeam(form,{...p,members:copy?[]:p.members});
 let prevCustomer=p.customer,prevCompany=p.company;
 const setOpts=(key,vals)=>{form.elements[key].innerHTML=U.options(vals);};
 form.elements.customer.onchange=()=>{const next=form.elements.customer.value;if(old&&D.orders.some(o=>o.projectId===old.id)&&!copy){form.elements.customer.value=prevCustomer;U.toast('已有客户订单，请在项目变更中核对签约方','error');return;}const apply=()=>{prevCustomer=next;const c=C.customers.find(c=>c.name===next);setOpts('contact',c?.contact?[c.contact]:[]);form.elements.phone.value='';};if(prevCustomer){form.elements.customer.value=prevCustomer;U.confirm('变更客户','确认后清除原联系人及联系电话，已有关联客户资料需要重新核对。',()=>{form.elements.customer.value=next;apply();});}else apply();};
 form.elements.company.onchange=()=>{const next=form.elements.company.value;if(old&&D.orders.some(o=>o.projectId===old.id)&&!copy){form.elements.company.value=prevCompany;U.toast('已有客户订单，请在项目变更中核对我方公司','error');return;}const apply=()=>{prevCompany=next;};if(prevCompany){form.elements.company.value=prevCompany;U.confirm('变更合同签约公司','执行公司及执行人员归属保持原项目记录。',()=>{form.elements.company.value=next;apply();});}else apply();};
 },submit(v,intent,x){if(copy&&intent!=='draft')return;if(old&&!copy&&(!['草稿','待确认'].includes(old.status)||intent==='activate'&&old.status!=='待确认'))return U.toast('项目状态已变化，请重新查看','warning');const next={...p,...v,executionCompany:p.executionCompany,mode:v.mode||p.mode,status:intent==='activate'?'进行中':intent==='submit'?'待确认':'草稿'},e=M.validateProject(next,intent==='draft'?'draft':'confirm',{catalog:C,activityCount:copy?0:acts.length,old:copy?null:old,confirmed:!copy&&D.orders.some(o=>o.projectId===id)});if(Object.keys(e).length)return x.errors(e);
 if(!next.id||copy)next.id=S.id('PRJ-');next.members=copy?(v.copyTeam?M.clone(p.members||[]):[]):p.members||[];next.delegations=copy?(v.copyTeam?M.clone(p.delegations||[]):[]):p.delegations||[];next.frameworks=copy?[]:p.frameworks||[];next.attachments=copy?[]:p.attachments||[];next.originalBudget=copy?(v.copyBudget?p.originalBudget:M.num(v.originalBudget)):M.num(v.originalBudget);if(readTeam)next.members=readTeam();if(window.MiceBudgetModel)MiceBudgetModel.syncMembers(next,()=>S.id('XM'));if(window.MiceBudget){const e=MiceBudget.allocationIssues(next);if(e.length)return x.errors({originalBudget:e.join('；')});}
 if(old&&!copy)Object.assign(old,next);else D.projects.unshift(next);
 if(copy){for(const a of acts)D.activities.push({...M.copyActivityDraft(a,{id:S.id('DRAFT-'),projectId:next.id,copyAgenda:!!v.copyAgenda,copyBudget:!!v.copyBudget,copyPlanner:!!v.copyTeam}),executionCompany:next.executionCompany});}

 S.log(next.id,copy?'复制项目':intent==='activate'?'项目启用':intent==='submit'?'提交项目核对':'保存项目',next.name);x.close();if(!old&&!copy&&location.pathname.endsWith('product-custom-list.html')){filters={keyword:next.id,status:''};page=1;render();U.toast('项目已'+(intent==='submit'?'提交核对':'保存'));return;}if(window.MiceProjectDetail)MiceProjectDetail.render();else render();U.toast('项目已'+(intent==='activate'?'启用':intent==='submit'?'提交核对':'保存'));}
 });
}
function render(){const viewUrl=new URL(location.href);for(const k of filterKeys)filters[k]?viewUrl.searchParams.set('filter_'+k,filters[k]):viewUrl.searchParams.delete('filter_'+k);viewUrl.searchParams.set('page',page);history.replaceState(null,'',viewUrl);const app=U.mount('单团项目');app.classList.add('mice-project-list');let rows=D.projects.filter(p=>(!window.MiceAccess||MiceAccess.project(p))&&(!filters.keyword||[p.name,p.customer,p.id,...D.activities.filter(a=>a.projectId===p.id).map(a=>a.id)].join(' ').includes(filters.keyword))&&['kind','mode','sales','owner','status'].every(k=>!filters[k]||p[k]===filters[k])&&(!filters.start||p.end>=filters.start)&&(!filters.end||p.start<=filters.end));
 U.render(app,U.listHead('单团项目',B('新增单团','project-single-new',{},true)+B('新建项目','project-new'))+'<form class="filter-card mice-filters" id="mice-project-filter"><input name="keyword" type="search" placeholder="项目／客户／编号" aria-label="项目／客户／编号" value="'+E(filters.keyword||'')+'">'+[['kind',['会奖','奖励旅游','企业团建','定制团','政企考察','研学项目'],'业务分类'],['mode',[{value:'single',label:'单个项目团'},{value:'multi',label:'多个项目团'}],'组织方式'],['sales',people(),'销售'],['owner',people(),'项目负责人']].map(([k,vals,label])=>'<select name="'+k+'" aria-label="'+label+'">'+U.options(vals,filters[k],'全部'+label)+'</select>').join('')+'<input name="start" type="date" aria-label="期间开始" value="'+E(filters.start||'')+'"><input name="end" type="date" aria-label="期间结束" value="'+E(filters.end||'')+'"><button class="btn btn-primary">查询</button>'+B('重置','project-reset')+'</form><section class="list-surface"><div class="project-list-tabs">'+[['','全部'],...['草稿','待确认','进行中','待结项','已结项','已终止'].map(s=>[s,s])].map(([id,label])=>'<button type="button" data-mice-action="project-status" data-id="'+id+'" class="'+(filters.status===id?'active':'')+'">'+label+'</button>').join('')+'</div>'+U.table(['项目／客户','组织方式／服务期间','销售／项目负责人','项目团','客户已确认金额','状态','操作'],rows.slice((page-1)*15,page*15).map(p=>{const acts=D.activities.filter(a=>a.projectId===p.id),orders=D.orders.filter(o=>o.projectId===p.id&&!['已作废','已取消'].includes(o.status)),curr=[...new Set(orders.map(o=>o.currency))];return[U.lines(L(E(p.name),U.url(path,{id:p.id,returnUrl:location.href})),E(p.customer),E(p.id)),U.lines(p.mode==='multi'?'多个项目团':p.mode==='single'?'单个项目团':'待确认',E(p.start||'日期待定')+' 至 '+E(p.end||'日期待定')),U.lines(E(p.sales||'待分配'),E(p.owner||'待分配')),'<span class="mice-count">'+L(acts.length,U.url(path,{id:p.id,returnUrl:location.href}))+' 团</span><span class="mice-line mice-muted">草稿 '+acts.filter(a=>a.status==='草稿').length+' · 进行中 '+acts.filter(a=>a.status==='进行中').length+' · 已完成 '+acts.filter(a=>a.status==='已完成').length+'</span>',curr.length?curr.map(c=>'<div class="mice-count">'+(orders.some(o=>o.currency===c&&o.amount!=null)?M.money(M.sum(orders.filter(o=>o.currency===c&&o.amount!=null)),c):'待确认')+(orders.some(o=>o.currency===c&&o.amount==null)?'<span class="mice-muted mice-line">待定价 '+orders.filter(o=>o.currency===c&&o.amount==null).length+' 项</span>':'')+'</div>').join(''):'待确认',U.tag(p.status),MiceProjectManagement.rowActions(p)];}))+'<div class="mice-pagination"><span>共 '+rows.length+' 个项目</span><div>'+B('上一页','project-prev')+' '+page+' / '+Math.max(1,Math.ceil(rows.length/15))+' '+B('下一页','project-next',{'total':Math.ceil(rows.length/15)})+'</div></div></section>');
 app.querySelector('form').onsubmit=e=>{e.preventDefault();filters={...Object.fromEntries(new FormData(e.target)),status:filters.status};page=1;render();};}
 Object.assign(U.actions,{'project-status':({id})=>{filters.status=id;page=1;render();},'project-single-new':()=>createSingle(),'project-new':()=>edit(null,false,{}),'project-edit':({id})=>edit(id),'project-copy':({id})=>edit(id,true),'project-detail':({id})=>location.href=U.url(path,{id,returnUrl:location.href}),'project-reset':()=>{filters={};page=1;render();},'project-prev':()=>{page=Math.max(1,page-1);render();},'project-next':({total})=>{page=Math.min(+total||1,page+1);render();}});
 window.MiceProjects={edit,createSingle,render,people};
 if(location.pathname.endsWith('product-custom-list.html'))U.ready(()=>{render();if(U.q.get('create')){let c={};try{c=JSON.parse(U.q.get('source')||'{}');}catch{}edit(null,false,c);const u=new URL(location.href);u.searchParams.delete('create');u.searchParams.delete('source');history.replaceState(null,'',u);}});
})();
