/* 四状态迁移与真实资料表单：不启动浏览器，不修改用户会话。 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const M=require('../shared/mice-prototype-model.js'),T=require('../shared/mice-tax-model.js');
const source=fs.readFileSync(require.resolve('../shared/mice-prototype-data.js'),'utf8');
const load=s=>{const ctx={window:{MiceModel:M,MiceTaxModel:T},TextEncoder};vm.runInNewContext(s,ctx);return ctx.window;};
const old=load(source.split('/* 项目团四状态')[0]).MicePrototypeSeed,w=load(source),checks=[];
function check(name,fn){fn();checks.push(name);}
check('所有当前项目团均为四状态，项目和订单待确认保持原意',()=>{
 assert.deepEqual([...M.activityStatuses],['草稿','进行中','已完成','已取消']);
 for(const a of w.MicePrototypeSeed.activities)assert(M.activityStatuses.includes(a.status));
 for(const kind of ['projects','orders'])assert.deepEqual(M.clone(w.MicePrototypeSeed[kind]),M.clone(old[kind]));
});
check('旧待确认只并入草稿，不自动执行，报价金额与历史单据不改变',()=>{
 const saved=M.clone(old),pending=saved.activities.filter(a=>a.status==='待确认'),upgraded=w.MicePrototypeDemo.upgrade(saved);
 assert(pending.length>0);for(const a of pending){const b=upgraded.activities.find(x=>x.id===a.id);assert.equal(b.status,'草稿');assert.equal(b.statusBeforeSimplification,'待确认');const clean=M.clone(b);delete clean.statusBeforeSimplification;clean.status=a.status;assert.deepEqual(clean,a);}
 for(const k of ['projects','commitments','orders','costs','claims','invoices','settlements','adjustments','approvals'])assert.deepEqual(M.clone(upgraded[k]),saved[k]);
});
check('旧准备中和执行中合并进行中，用户资料与已完成历史保留',()=>{
 const saved=M.clone(old);saved.activities.push({id:'USER-RUN',projectId:old.projects[0].id,status:'执行中',formation:{basis:'用户确认'},completion:null,resources:[{id:'R',confirmNo:'原确认号'}]});
 const result=w.MicePrototypeDemo.upgrade(saved);
 for(const a of saved.activities.filter(a=>['准备中','执行中'].includes(a.status))){const b=result.activities.find(x=>x.id===a.id),expected=M.clone(a);expected.status='进行中';expected.statusBeforeSimplification=expected.statusBeforeSimplification||a.status;assert.deepEqual(M.clone(b),expected);}
 assert.deepEqual(M.clone(w.MicePrototypeDemo.upgrade(result)),M.clone(result));
});
check('用户新建的旧待确认团也保留已填资料，结束状态不被回退',()=>{
 const saved=M.clone(old);saved.activities.push({id:'USER-A',projectId:old.projects[0].id,status:'待确认',name:'用户另建团',basis:'用户客户依据',roster:[{name:'用户填写'}],resources:[],attachments:[{name:'原附件'}]});
 const upgraded=w.MicePrototypeDemo.upgrade(saved),a=upgraded.activities.find(a=>a.id==='USER-A');assert.equal(a.status,'草稿');assert.equal(a.basis,'用户客户依据');assert.equal(a.roster[0].name,'用户填写');assert.equal(a.attachments[0].name,'原附件');
 for(const a of saved.activities.filter(a=>['已完成','已取消'].includes(a.status)))assert.deepEqual(M.clone(upgraded.activities.find(x=>x.id===a.id)),a);
});
check('旧筛选地址承接四状态；迁移只保存一次且不重复建单',()=>{
 assert.equal(M.activityStatus('待确认'),'草稿');for(const value of ['准备中','执行中'])assert.equal(M.activityStatus(value),'进行中');let value=JSON.stringify(old),writes=0;const storage={getItem:()=>value,setItem:(k,v)=>{value=v;writes++;}};
 const first=M.createStore(w.MicePrototypeSeed,storage,w.MicePrototypeDemo.upgrade),second=M.createStore(w.MicePrototypeSeed,storage,w.MicePrototypeDemo.upgrade);assert.equal(writes,1);assert.equal(first.data.orders.length,second.data.orders.length);assert(!second.data.activities.some(a=>a.status==='待确认'));
});
check('只允许顺序推进；跨项目、重复办理、终态及结束项目不可推进',()=>{
 const p={id:'P',status:'进行中'};for(const [before,after] of [['草稿','进行中'],['进行中','已完成']])assert(M.canAdvanceActivity({projectId:'P',status:before},p,after));
 for(const [before,after] of [['草稿','已完成'],['进行中','草稿'],['已完成','进行中'],['已取消','进行中'],['进行中','进行中']])assert(!M.canAdvanceActivity({projectId:'P',status:before},p,after));
 assert(!M.canAdvanceActivity({projectId:'OTHER',status:'草稿'},p,'进行中'));for(const status of ['已结项','已终止'])assert(!M.canAdvanceActivity({projectId:'P',status:'草稿'},{...p,status},'进行中'));
});
const data=M.clone(w.MicePrototypeSeed),a=data.activities.find(x=>x.id==='PRJ20261000005'),p=data.projects.find(x=>x.id===a.projectId);let drawer,closed=0,errors={},fields={};
const U={M,q:new URLSearchParams('projectId='+p.id),actions:{},ready(){},store:{data,id:prefix=>prefix+'COPY-TEST',find:(k,id)=>data[k]?.find(x=>x.id===id),log:(pid,action,detail)=>data.logs.push({projectId:pid,action,detail})},esc:x=>x,field:(key,label,value)=>{fields[key]=value;return '';},grid:x=>x,section:()=>'',btn:()=>'',action:()=>'',link:()=>'',summary:()=>'',drawer:(title,body,opts)=>{drawer={title,body,...opts};},toast:()=>{}};
const c={MiceUI:U,URLSearchParams,location:{pathname:'/merchant/tour/schedules-detail.html'},MiceAccess:{current:()=>({name:'张三',role:'负责人'})},MiceProjects:{people:()=>['李梅','张三']},MiceFiles:{html:()=>''},MiceActivity:{render(){}},console};c.window=c;
vm.runInNewContext(fs.readFileSync(require.resolve('../shared/mice-project-detail.js'),'utf8'),c);
const open=mode=>{fields={};errors={};c.MiceProjectDetail.activityForm(a.id,false,'',false,mode);};
const submit=intent=>{errors={};drawer.submit({...a,...fields},intent,{close(){closed++;},errors(e){errors=e;}});};
check('编辑保存仅存草稿，没有保存即进行中的动作',()=>{
 open('edit');assert.equal(drawer.title,'编辑项目团');assert.deepEqual(M.clone(drawer.buttons),[['保存','draft']]);submit('draft');assert.deepEqual(errors,{});assert.equal(a.status,'草稿');
 const before=JSON.stringify(a);submit('save');submit('form');assert.equal(JSON.stringify(a),before);
});
check('确认建团是独立业务表单，保存草稿不推进',()=>{
 open('form');assert.equal(drawer.title,'确认建团');assert.deepEqual(M.clone(drawer.buttons),[['保存草稿','draft'],['确认建团','form']]);assert(fields.formationSource.startsWith('quote:'));assert(fields.basis);submit('draft');assert.deepEqual(errors,{});assert.equal(a.status,'草稿');
});
check('没有有效客户报价或订单，完整资料也不能确认建团',()=>{
 const qs=data.commitments,os=data.orders;data.commitments=[];data.orders=[];open('form');submit('form');assert(errors.formationSource);assert.equal(a.status,'草稿');data.commitments=qs;data.orders=os;
});
check('建团表单打开后引用报价失效，不使用另一单据偷偷替代',()=>{
 open('form');const q=data.commitments.find(q=>'quote:'+q.id===fields.formationSource);q.status='已作废';submit('form');assert(errors.formationSource);assert.equal(a.status,'草稿');q.status='已确认';
});
check('确认建团引用客户依据并进入进行中，不另建成交和财务单据',()=>{
 const before=JSON.stringify([data.orders,data.claims,data.invoices,data.costs,data.settlements]),count=data.activities.length;open('form');submit('form');assert.deepEqual(errors,{});assert.equal(a.status,'进行中');assert.equal(a.formation.source,fields.formationSource);assert.equal(a.formation.by,'张三');assert.equal(a.formation.basis,a.basis);assert.equal(data.logs.at(-1).action,'确认建团');assert.equal(data.activities.length,count);assert.equal(JSON.stringify([data.orders,data.claims,data.invoices,data.costs,data.settlements]),before);
});
check('重复确认或旧表单保存不能回退状态或覆盖建团事实',()=>{
 const before=JSON.stringify(a),closeCount=closed;submit('form');submit('draft');assert.equal(JSON.stringify(a),before);assert.equal(closed,closeCount);
});
check('复制已完成团只存新草稿，不继承建团确认、订单依据或完成事实',()=>{
 a.status='已完成';a.completion={basis:'原团完成事实'};c.MiceProjectDetail.activityForm(a.id,true);assert.deepEqual(M.clone(drawer.buttons),[['保存草稿','draft']]);
 drawer.submit({name:'复制的新项目团',service:a.service,start:'',end:'',city:a.city,planner:a.planner,scope:a.scope,copyPlanner:true},'draft',{close(){},errors(e){throw Error(JSON.stringify(e));}});
 const copy=data.activities.find(x=>x.id==='DRAFT-COPY-TEST');assert.equal(copy.status,'草稿');assert.equal(copy.formation,null);assert.equal(copy.formationSource,'');assert.equal(copy.completion,null);assert.equal(copy.commitmentId,'');
});
check('有效订单可独立作为客户确认依据，不强制重复报价',()=>{
 const next={...a,id:'LEGACY',status:'草稿',commitmentId:'',formationSource:'order:O',basis:''},o={id:'O',projectId:p.id,activities:['LEGACY'],status:'已确认',customer:p.customer,company:p.company,basis:'已签客户订单'};
 assert.deepEqual(M.validateActivity(next,p,'confirm',{orders:[o],catalog:data.catalog}),{});
 for(const status of ['待确认','已取消','已作废'])assert(M.validateActivity(next,p,'confirm',{orders:[{...o,status}]}).formationSource);
 assert(M.validateActivity(next,p,'confirm',{orders:[{...o,customer:'其他客户'}]}).formationSource);
 assert(M.validateActivity(next,p,'confirm',{orders:[{...o,activities:['OTHER']}]}).formationSource);
});
check('已确认的按实际结算规则支持建团，最终收入未定不拦建团',()=>{
 const next={...a,id:'ACTUAL',commitmentId:'Q',formationSource:'quote:Q',basis:'',people:null},q={id:'Q',name:'按实际人次结算',projectId:p.id,activities:['ACTUAL'],status:'已确认',pricing:'actual',amount:null,rule:'按实际20欧元每人次',basis:'客户已确认计价规则'};
 assert.deepEqual(M.validateActivity(next,p,'confirm',{commitments:[q],catalog:data.catalog}),{});
 assert(M.validateActivity(next,p,'confirm',{commitments:[{...q,status:'待审批'}]}).formationSource);
 assert(M.validateActivity(next,p,'confirm',{commitments:[{...q,basis:''}]}).basis);
});
check('建团仍核服务范围和主责；引用框架必须有效且覆盖本团日期',()=>{
 const q={id:'Q',name:'报价',projectId:p.id,activities:[a.id],status:'已确认',basis:'已确认',frameworkId:'F'},next={...a,formationSource:'quote:Q',planner:'',scope:''};
 const errors=M.validateActivity(next,{...p,frameworks:[{id:'F',status:'已签署',start:'2026-01-01',end:'2026-01-31'}]},'confirm',{commitments:[q]});assert(errors.planner);assert(errors.scope);assert(errors.formationSource);
});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
