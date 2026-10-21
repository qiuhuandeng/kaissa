/* 项目总览只读；详情原位采购；集中台账复用同一费用及付款记录。 */
(function(root){
'use strict';
const core=root.FulfillmentCostEditor;
if(!root.MiceUI)return;
const U=MiceUI,{M,store:S,esc:E,field:F,grid:G,section:SEC,btn:B,action:A,link:L}=U,D=S.data;let context={projectId:'',activityId:''};let openedSource=false;let detailRange='activity',lastActivity='';
let ledgerFilters=null;
const isOverview=()=>location.pathname.endsWith('product-custom-detail.html');
const isLedger=()=>location.pathname.endsWith('fulfillment-cost.html');
const procurementUrl=(projectId,activityId='',costId='',adjustmentId='')=>U.url('merchant/tour/fulfillment-cost.html',{mice:1,projectId,activityId,costId,adjustmentId,returnUrl:isLedger()?U.q.get('returnUrl'):location.href});
const procurementLink=(label,projectId,activityId='',costId='',button=false)=>'<a class="'+(button?'btn btn-secondary':'link-primary')+'" href="'+E(procurementUrl(projectId,activityId,costId))+'">'+E(label)+'</a>';
function canView(c){
  if(!c||!isLedger()&&c.projectId!==context.projectId)return false;
  const p=S.find('projects',c.projectId),a=S.find('activities',c.activityId),access=root.MiceAccess;
  return !!p&&(!access||(access.project(p)&&access.current().role!=='协作查看'&&(access.current().role!=='计调'||!a||a.planner===access.current().name)));
}
function canManage(c,action='cost-edit'){
  if(isOverview()||!canView(c))return false;
  const p=S.find('projects',c.projectId),a=S.find('activities',c.activityId);
  if(a&&['cost-new','cost-edit','cost-budget'].includes(action)){
    if(!['进行中','已完成'].includes(a.status))return false;
    if(action==='cost-budget'&&a.status==='已完成')return false;
    if(D.settlements.some(r=>r.projectId===p.id&&r.activities?.includes(a.id)&&['审批中','已确认'].includes(r.status)))return false;
  }
  return (p.status!=='已结项'||action==='cost-adjust')&&(!root.MiceAccess||MiceAccess.allowed(action,p));
}
function requireManage(c,action){if(canManage(c,action))return true;U.toast('当前费用不在可办理范围，请核对项目、项目团及岗位权限','error');return false;}
function reveal(id){
  const c=S.find('costs',id);
  if(!isLedger()&&c)detailRange=c.activityId?'activity':'project';
  if(isLedger()&&ledgerFilters&&c){ledgerFilters={...ledgerFilters,projectId:c.projectId,activityId:'',word:'',status:'',scope:''};}
  refresh();const row=[...document.querySelectorAll('#mice-app .mice-cost-table tr')].find(n=>n.querySelector('[data-id="'+CSS.escape(id)+'"]'));
  if(row){row.classList.add('mice-cost-highlight');row.scrollIntoView({block:'nearest'});}
}
function backToCost(id){return U.dialog?.dataset.costId===id?()=>view(id):undefined;}
function projectActivities(projectId,retained=[]){return D.activities.filter(a=>a.projectId===projectId&&(M.activityAllows(a,S.find('projects',projectId),'cost')||retained.includes(a.id)));}
function coverage(c){return [...new Set(c.activityIds||c.allocations?.map(r=>r.activityId)||[])];}
const amountText=(value,currency)=>'<span class="mice-cost-money">'+E(M.money(value,currency))+'</span>';
const scopeOf=c=>c.scopeType||(c.activityId?'direct':'common');
const scopeLabel=c=>c.activityId?(context.activityId===c.activityId?'本项目团':'单个项目团'):scopeOf(c)==='shared'?'指定多个项目团':'项目整体';
const assignedTo=(c,activityId)=>c.activityId===activityId?c.amount:(c.allocations||[]).find(r=>r.activityId===activityId)?.amount;
function distribution(c){return M.costDistribution(c);}
function refresh(){if(root.MiceActivity&&/\/schedules(?:-detail)?\.html$/.test(location.pathname))MiceActivity.render();else if(root.MiceProjectDetail&&location.pathname.endsWith('product-custom-detail.html'))MiceProjectDetail.render();else page();}
function scopeFields(r,p,activityId,old){
  const fixed=!!old||!isLedger();
  const projectField=fixed?F('projectName','所属项目',p?.name||'',{readonly:true,full:true}):F('projectId','所属项目',p?.id||'',{required:true,full:true,options:D.projects.filter(p=>canManage({projectId:p.id,activityId:''},'cost-new')).map(p=>({value:p.id,label:p.name}))});
  return SEC('费用归属',G(projectField+F('scopeType','服务范围',r.scopeType,{blank:null,disabled:!!old,options:[{value:'direct',label:activityId?'本项目团':'指定单个项目团'},{value:'shared',label:'指定多个项目团'},{value:'common',label:'项目整体'}]})+F('category','费用类别',r.category||'',{options:['住宿','交通','餐饮','会场设备','地接服务','签证保险','领队服务','服务费','其他']})+(activityId?F('activityName','本项目团',S.find('activities',activityId)?.name||'',{readonly:true,full:true}):F('activityId','项目团',r.activityId||'',{options:[],full:true})))+'<div id="mice-cost-coverage"></div>');
}
function bindScope(form,r,activityId,old,getProject,setProject){
  const drawCoverage=()=>{const p=getProject(),selected=coverage(r),acts=projectActivities(p?.id,selected).filter(a=>canManage({projectId:p.id,activityId:a.id})),single=form.elements.activityId;
    if(single)single.innerHTML=U.options(acts.filter(a=>canManage({projectId:p.id,activityId:a.id})).map(a=>({value:a.id,label:a.name})),r.activityId||'');
    form.querySelector('#mice-cost-coverage').innerHTML=U.layout('<div class="mice-field mice-full"><label>关联项目团 <span class="mice-required">*</span></label><div class="mice-cost-choice-head"><span>项目团名称／日期</span><span>分配金额（可选）</span></div><div class="mice-cost-activity-picker">'+(acts.length?acts.map(a=>'<div class="mice-cost-activity-choice"><label><input type="checkbox" name="covered" value="'+E(a.id)+'" '+(selected.includes(a.id)?'checked':'')+'> <span>'+E(a.name)+(a.status==='已取消'?'（已取消）':'')+'<small>'+E(a.start)+' 至 '+E(a.end)+'</small></span></label><input type="number" min="0" step="0.01" name="share-'+E(a.id)+'" aria-label="'+E(a.name)+'分配金额" placeholder="暂不分配" value="'+E(r.allocations?.find(x=>x.activityId===a.id)?.amount??'')+'"></div>').join(''):'<p class="mice-muted">'+(p?'暂无可新增费用的项目团；草稿、已取消和已结算的项目团不可选。':'先选择所属项目')+'</p>')+'</div><p class="mice-muted" id="mice-cost-coverage-total"></p><span class="mice-error" data-error="coverage"></span></div>'+G(F('allocationBasis','分配依据',r.allocationBasis||'',{full:true})),{drawer:true});};
  const update=()=>{const scope=form.elements.scopeType.value;form.querySelector('#mice-cost-coverage').hidden=scope!=='shared';form.querySelector('#mice-project-delivery').hidden=scope==='direct';
    const single=form.elements.activityId||form.elements.activityName;if(single)single.closest('.mice-field').hidden=scope!=='direct';
    const selected=[...form.querySelectorAll('[name=covered]:checked')];let allocated=0;
    form.querySelectorAll('[name=covered]').forEach(n=>{const input=form.elements['share-'+n.value];input.disabled=!n.checked;if(n.checked)allocated+=Number(input.value)||0;});
    const total=M.num(form.elements.amount.value),currency=form.elements.currency.value;
    form.querySelector('#mice-cost-coverage-total').textContent='已选 '+selected.length+' 团 · 已分配 '+M.money(allocated,currency)+(total==null?' · 总额待确认':' · 未分配 '+M.money(M.round(total-allocated),currency))+'；金额可暂留空，后续从费用详情分配。';
  };
  if(form.elements.projectId)form.elements.projectId.onchange=()=>{const p=S.find('projects',form.elements.projectId.value);setProject(p);form.elements.company.value=p?.company||'';form.elements.start.value=p?.start||'';form.elements.end.value=p?.end||'';drawCoverage();update();};
  if(form.elements.activityId)form.elements.activityId.onchange=()=>{const a=S.find('activities',form.elements.activityId.value);if(a){form.elements.start.value=a.start;form.elements.end.value=a.end;}};
  form.elements.scopeType.onchange=()=>{const p=getProject(),a=S.find('activities',activityId||form.elements.activityId?.value);form.elements.start.value=form.elements.scopeType.value==='direct'&&a?a.start:p?.start||'';form.elements.end.value=form.elements.scopeType.value==='direct'&&a?a.end:p?.end||'';update();};
  form.addEventListener('change',update);form.addEventListener('input',update);drawCoverage();update();return update;
}
function open(id,projectId=context.projectId,activityId=context.activityId,source={}){
  const old=S.find('costs',id),back=old?backToCost(id):undefined;let p=S.find('projects',old?.projectId||projectId);
  if(old&&!requireManage(old)||!old&&(isOverview()||root.MiceAccess&&!MiceAccess.allowed('cost-new')))return;
  if(p&&!old&&!requireManage({projectId:p.id,activityId},'cost-new'))return;
  if(old?.adjustmentId)return U.drawer('调整费用只读','<p>本笔为已批准调整，继续变化须另建调整。</p>',{readonly:true,buttons:[],onBack:back});
  const a=S.find('activities',activityId),r=old?M.clone(old):{...core.createDraft({},p?.company),id:S.id('FY'),projectId:p?.id||'',activityId,scopeType:activityId?'direct':'common',name:source.name||'',supplier:source.supplier||'',category:source.category||'',start:source.start||a?.start||p?.start,end:source.end||a?.end||p?.end,unit:source.unit||'项',quantity:source.quantity||1,price:null,amount:null,estimate:null,budget:null,status:'待确认',paid:0,allocations:[],basis:source.confirmNo||'',taxStatus:'未到票',resourceId:source.id||'',amountMode:'total'};
  r.scopeType=scopeOf(r);let files,taxRead,prevSupplier=r.supplier,prevCurrency=r.currency;
  U.drawer(old?'维护费用':'新增费用',scopeFields(r,p,activityId,old)+SEC('采购明细',G(F('name','服务内容',r.name,{required:true,full:true})+F('supplier','供应商',r.supplier,{options:D.catalog.suppliers.map(x=>typeof x==='string'?x:x.name),required:true})+F('company','付款公司',r.company||p?.company,{readonly:true})+F('agreementNo','适用采购协议／确认单',r.agreementNo||'')+F('start','服务开始日期',r.start||p?.start,{type:'date'})+F('end','服务结束日期',r.end||p?.end,{type:'date'})+F('currency','币种',r.currency,{options:['CNY','EUR','USD']})+F('amountMode','计价方式',r.amountMode||'quantity',{options:[{value:'total',label:'固定总额'},{value:'quantity',label:'数量×单价'}]})+F('quantity','数量',r.quantity??'',{type:'number'})+F('unit','计量单位',r.unit,{options:['项','人','场','间夜','台天','辆次','辆天','人次','桌']})+F('price','含税单价',r.price??'',{type:'number'})+F('amount','含税总额',r.amount??'',{type:'number',required:true})+F('budget','原预算参考',r.budget??'',{type:'number',readonly:!!old})+F('estimate','最新预计',r.estimate??'',{type:'number'})+F('basis','采购确认依据',r.basis||'',{type:'textarea',full:true})))+SEC('付款条件',G(F('paymentTerms','付款约定',r.paymentTerms||'',{type:'textarea',full:true})+F('conditionLimit','当前条件允许累计申请',r.conditionLimit??'',{type:'number'})+F('paymentBasis','本次付款条件依据',r.paymentBasis||'')))+'<div id="mice-fx-fields">'+SEC('外币折算依据',G(F('budgetRate','预算汇率',r.budgetRate??'',{type:'number',step:'0.0001'})+F('agreedRate','固定约定汇率',r.agreedRate??'',{type:'number',step:'0.0001'})+F('rateBasis','约定汇率依据',r.rateBasis||'',{type:'textarea',full:true})+F('referenceRate','参考汇率',r.referenceRate??r.refRate??'',{type:'number',step:'0.0001'})))+'</div>'+MiceTaxUI.costFields(r,p)+'<div id="mice-project-delivery">'+SEC('采购服务交付',G(F('serviceDelivery','交付情况',r.serviceConfirmed?'已交付':'待核对',{options:['待核对','已交付']})+F('deliveryBasis','交付确认依据',r.deliveryBasis||'',{full:true})))+'</div>'+SEC('采购附件',MiceFiles.html(r.attachments||[])),{wide:true,onBack:back,buttons:[['保存明细','draft'],['确认费用','confirm']],onOpen({el,form}){files=MiceFiles.bind(el,r.attachments||[]);taxRead=MiceTaxUI.bindCost(form,r,()=>files());const updateScope=bindScope(form,r,activityId,old,()=>p,next=>{p=next;});const update=()=>{const quantity=form.elements.amountMode.value==='quantity';form.elements.amount.readOnly=quantity;form.elements.price.disabled=!quantity;form.elements.quantity.disabled=!quantity;form.querySelector('#mice-fx-fields').hidden=form.elements.currency.value==='CNY';if(quantity)form.elements.amount.value=form.elements.quantity.value&&form.elements.price.value?core.total(form.elements.quantity.value,form.elements.price.value):'';updateScope();};form.addEventListener('input',update);form.elements.amountMode.onchange=update;form.elements.currency.onchange=()=>{const next=form.elements.currency.value;form.elements.currency.value=prevCurrency;if(old&&((r.paid||0)>0||D.requests.some(q=>q.costId===r.id)||(r.allocations||[]).length))return U.toast('已有分配或付款记录，请保留原币种并核对调整','error');U.confirm('更换费用币种','确认后清除金额、分配、单价、付款限额、票面税额及折算依据，请重新填写。',()=>{prevCurrency=next;form.elements.currency.value=next;for(const k of ['amount','price','estimate','conditionLimit','ticketAmount','ticketTax','estimatedTax','budgetRate','agreedRate','rateBasis','referenceRate'])form.elements[k].value='';form.querySelectorAll('[name^=share-]').forEach(n=>n.value='');form.dispatchEvent(new Event('input'));update();});};form.elements.supplier.onchange=()=>{const next=form.elements.supplier.value;form.elements.supplier.value=prevSupplier;const apply=()=>{prevSupplier=next;form.elements.supplier.value=next;for(const k of ['agreementNo','paymentTerms','paymentBasis','conditionLimit'])form.elements[k].value='';};if(prevSupplier)U.confirm('更换供应商','确认后清除原采购协议及付款条件；已有付款或对账的费用需走费用调整。',()=>{if((r.paid||0)>0||D.requests.some(q=>q.costId===r.id))return U.toast('该费用已有付款或申请，请通过费用调整处理','error');apply();});else apply();};form.elements.taxStatus?.querySelector('option[value="已核定"]')?.setAttribute('disabled','disabled');update();},submit(v,i,x){const e={},scope=v.scopeType||r.scopeType,selected=[...x.form.querySelectorAll('[name=covered]:checked')].map(n=>n.value),chosenActivity=scope==='direct'?(activityId||v.activityId):'',n={...r,...v,projectId:p?.id||'',activityId:chosenActivity,scopeType:scope,activityIds:scope==='shared'?selected:[],company:p?.company||'',serviceConfirmed:v.serviceDelivery==='已交付',amount:M.num(v.amount),estimate:M.num(v.estimate),budget:old?r.budget:M.num(v.budget),quantity:M.num(v.quantity)||r.quantity,price:M.num(v.price),conditionLimit:M.num(v.conditionLimit),budgetRate:M.num(v.budgetRate),agreedRate:M.num(v.agreedRate),referenceRate:M.num(v.referenceRate),ticketAmount:M.num(v.ticketAmount),ticketTax:M.num(v.ticketTax),estimatedTax:M.num(v.estimatedTax),attachments:files()};if(!p)return x.errors({projectId:'请选择采购所属项目'});if(!requireManage(n,old?'cost-edit':'cost-new'))return;
if(!['direct','common','shared'].includes(scope))e.scopeType='请选择服务范围';
if(scope==='direct'&&!projectActivities(p.id,old?[old.activityId]:[]).some(a=>a.id===chosenActivity))e.activityId='请选择本项目有效项目团';
if(scope==='shared'){
  if(selected.length<2)e.coverage='请至少选择两个项目团；仅一个团请选择指定单个项目团';
  if(selected.some(id=>!projectActivities(p.id,old?coverage(old):[]).some(a=>a.id===id)||!canManage({projectId:p.id,activityId:id},old?'cost-edit':'cost-new')))e.coverage='所选项目团尚未建团、已取消或结算已锁定，请重新核对';
  n.allocations=selected.filter(id=>v['share-'+id]!=='').map(id=>({activityId:id,amount:M.num(v['share-'+id])}));
  n.commonAmount=old?Number(old.commonAmount||0):0;n.unallocated=n.amount==null?null:M.round(n.amount-M.sum(n.allocations)-n.commonAmount);
  if(n.allocations.some(r=>r.amount==null||r.amount<0)||n.unallocated<0)e.coverage='分配金额不能为负，合计不能超过采购总额';
  if(n.allocations.length&&!v.allocationBasis)e.allocationBasis='填写分配金额时请补充分配依据';
}else if(!old){n.allocations=[];n.commonAmount=scope==='common'?n.amount:0;}
const assigned=M.sum(r.allocations||[])+(scope==='shared'?Number(r.commonAmount||0):0);if(scope==='common'&&n.amount!=null&&(!old||distribution(r).remaining===0)){n.commonAmount=M.round(n.amount-M.sum(n.allocations||[]));n.unallocated=0;}if(old&&n.amount!=null&&assigned>n.amount)e.amount='费用金额不能低于现有分配合计，请先核对分配';if(!n.activityId&&n.serviceConfirmed&&!v.deliveryBasis)e.deliveryBasis='请填写本次采购服务交付依据';if(!v.name)e.name='请填写服务内容';if(!v.supplier)e.supplier='请选择供应商';if((i==='confirm'&&n.amount==null)||(n.amount!=null&&n.amount<0))e.amount='请填写非负含税总额，减费请走调整';if(i==='confirm'){if(!v.category)e.category='请选择费用类别';if(!v.start||!v.end||v.start>v.end)e.end='请核对服务日期';if(!v.basis)e.basis='请填写采购确认或实际费用依据';if(n.currency!=='CNY'&&n.agreedRate&&!v.rateBasis)e.rateBasis='固定结算汇率须填写双方约定依据';}if(n.conditionLimit>n.amount)e.conditionLimit='付款条件限额不能超过费用总額';if(n.ticketTax!=null&&(n.ticketTax<0||n.ticketAmount==null||n.ticketTax>n.ticketAmount))e.ticketTax='请核对票面金额及税额';if(old){const allocationIssue=M.lockedAllocation(r,n.allocations||[],Number(n.commonAmount)||0,D.settlements);if(allocationIssue)e.coverage=allocationIssue;}if(old&&(r.paid>n.amount||M.settledCost(r,D.settlements)))e.amount='已付款或已结算费用请通过后补调整处理';if(n.taxStatus==='已核定'&&r.taxStatus!=='已核定')e.taxStatus='可扣税额由财务核定';if(v.expectedTaxRate!==''&&v.ticketRate!==''&&+v.expectedTaxRate!==+v.ticketRate&&v.rateConflict!=='以票面为准，已人工核对')e.rateConflict='预计税率与票面税率不同，请核对票面并明确确认；不自动核定可扣税额';Object.assign(e,taxRead(n));if(Object.keys(e).length)return x.errors(e);n.status=i==='confirm'?'已确认':'待确认';if(old){n.history=[...(r.history||[]),{version:r.version||1,amount:r.amount,status:r.status,basis:r.basis}];n.version=(r.version||1)+1;Object.assign(old,n);}else D.costs.push(n);S.log(p.id,i==='confirm'?'确认费用':'保存费用',n.name+'／'+M.money(n.amount,n.currency));x.close();reveal(n.id);if(back)back();U.toast(old?'费用已保存':'费用已新增');}});}

function allocation(id){const c=S.find('costs',id);if(!requireManage(c))return;if(c.amount==null)return U.toast('请先明确采购总额再分配','error');const back=backToCost(id),p=S.find('projects',c.projectId),acts=projectActivities(p.id,(c.allocations||[]).map(r=>r.activityId)).filter(a=>scopeOf(c)!=='shared'||!coverage(c).length||coverage(c).includes(a.id));U.drawer(c.scopeType==='common'?'公共费用管理分摊':'分配采购费用',SEC('采购总额',U.summary([['费用',c.name],['供应商',c.supplier],['总额',M.money(c.amount,c.currency)],['分配用途',c.scopeType==='common'?'管理分析，项目费用仍只计一次':'采购归属核对']]))+SEC('项目团分配',U.table(['项目团','本次分配'],acts.map(a=>[E(a.name),'<input type="number" step="0.01" name="alloc-'+a.id+'" '+(!canManage({projectId:p.id,activityId:a.id},'cost-edit')?'readonly ':'')+'aria-label="'+E(a.name)+'分配金额" value="'+E(c.allocations?.find(r=>r.activityId===a.id)?.amount??'')+'">'])))+G(F('common','项目共同保留金额',distribution(c).common,{type:'number'})+F('basis','分配依据',c.allocationBasis||'',{type:'textarea',required:true,full:true}))+'<p id="mice-allocation-total"></p><span class="mice-error" data-error="allocation"></span>',{onBack:back,onOpen({form}){const change=()=>{const v=Object.fromEntries(new FormData(form)),rows=acts.map(a=>({amount:Number(v['alloc-'+a.id])||0})),r=M.allocation(c.amount,rows,v.common);form.querySelector('#mice-allocation-total').textContent='已分配 '+M.money(r.assigned,c.currency)+' · 未分配 '+M.money(r.remaining,c.currency);};form.oninput=change;change();},submit(v,i,x){const rows=acts.filter(a=>v['alloc-'+a.id]!=='').map(a=>({activityId:a.id,amount:+v['alloc-'+a.id]})),r=M.allocation(c.amount,rows,v.common);if(!r.valid||+v.common<0)return x.errors({allocation:'分配合计不得超过采购总额，各项不能为负'});if(!v.basis)return x.errors({basis:'请填写分配依据'});if(rows.some(r=>r.amount!==(c.allocations||[]).find(old=>old.activityId===r.activityId)?.amount&&!canManage({projectId:p.id,activityId:r.activityId},'cost-edit')))return x.errors({allocation:'项目团状态或结算已变化，不能调整其费用分配'});const locked=M.lockedAllocation(c,rows,Number(v.common)||0,D.settlements);if(locked)return x.errors({allocation:locked});c.allocations=rows;c.commonAmount=Number(v.common)||0;c.allocationBasis=v.basis;c.unallocated=r.remaining;c.managementAllocation=c.scopeType==='common';S.log(c.projectId,'分配采购费用',c.name+'／未分配'+r.remaining);x.close();reveal(c.id);if(back)back();}});}
function budget(options={}){const activityId=options.scope==='project'?'':context.activityId;if(!requireManage({...context,activityId},'cost-budget'))return;const p=S.find('projects',context.projectId),obj=activityId?S.find('activities',activityId):p;U.drawer('调整预计费用',SEC('原预算',U.summary([['范围',obj.name],['原批准预算',M.money(obj.originalBudget)],['现有最新预计',M.money(obj.latestEstimate??obj.originalBudget)]]))+G(F('estimate','最新预计费用',obj.latestEstimate??obj.originalBudget??'',{type:'number',required:true})+F('charge','客户是否追加收费','',{options:['不追加','已另行确认','待客户确认']})+F('reason','费用变化原因','',{type:'textarea',required:true,full:true})+F('basis','客户确认资料或内部核对依据','',{type:'textarea',required:true,full:true})),{submit(v,i,x){if(!requireManage({...context,activityId},'cost-budget'))return;const e={};if(!(M.num(v.estimate)>=0)||v.estimate==='')e.estimate='请填写有效预计费用';if(!v.reason)e.reason='请说明变化原因';if(!v.charge)e.charge='请选择客户收费情况';if(!v.basis)e.basis='请填写核对依据';if(Object.keys(e).length)return x.errors(e);obj.budgetHistory=[...(obj.budgetHistory||[]),{before:obj.latestEstimate??obj.originalBudget,after:+v.estimate,reason:v.reason,basis:v.basis,charge:v.charge}];obj.latestEstimate=+v.estimate;S.log(p.id,'调整预计费用',obj.name+'／'+M.money(+v.estimate)+'／'+v.charge+'，客户订单保持原确认');x.close();refresh();}});}
function rowsFor(projectId,activityId){return D.costs.filter(c=>c.projectId===projectId&&(!activityId||c.activityId===activityId||c.allocations?.some(r=>r.activityId===activityId)||scopeOf(c)==='shared'&&coverage(c).includes(activityId)));}
function summary(p,activityId='',overview=false){
  const all=rowsFor(p.id,activityId),costs=activityId||overview?all:all.filter(c=>!c.activityId),obj=activityId?S.find('activities',activityId):p;
  const currencies=[...new Set(costs.map(c=>c.currency))];
  const items=[[activityId?'本团原批准预算':'项目原批准预算',M.money(obj.originalBudget)],[activityId?'本团最新预计':'项目最新预计',M.money(obj.latestEstimate??obj.originalBudget)]];
  for(const currency of currencies){
    const confirmed=costs.filter(c=>c.currency===currency&&c.status==='已确认');
    items.push([(activityId?'本团已明确承担':overview?'项目已确认费用':'公共／跨团已确认')+'（'+currency+'）',M.money(M.sum(confirmed.map(c=>({amount:activityId?assignedTo(c,activityId):c.amount}))),currency)]);
  }
  const pending=costs.filter(c=>c.status!=='已确认'||c.amount==null).length;
  items.push(['待确认费用',pending+' 笔']);if(activityId){const unassigned=costs.filter(c=>!c.activityId&&assignedTo(c,activityId)==null).length;if(unassigned)items.push(['本团分配待确认',unassigned+' 笔']);}
  return U.summary(items);
}
function coverageText(c){
  if(c.activityId)return S.find('activities',c.activityId)?.name||'本项目团';
  if(scopeOf(c)==='common')return '项目整体服务';
  const ids=coverage(c);return ids.length?ids.length+' 个项目团':'关联项目团待补充';
}
function costTable(costs,{activityId='',overview=false,ledger=false}={}){
  const heads=['费用／供应商',ledger?'所属项目':'服务范围',ledger?'服务范围':'原预算／最新预计',activityId?'本团承担':'采购总额','确认状态','操作'];
  return U.table(heads,costs.map(c=>{
    const sharedHere=!!activityId&&!c.activityId,own=canManage(c),split=distribution(c);
    const scopeCell=U.lines(E(scopeLabel(c)),E(coverageText(c)),!c.activityId&&scopeOf(c)==='shared'?'未分配 '+amountText(split.remaining,c.currency):'');
    const value=activityId?assignedTo(c,activityId):c.amount;
    const money=U.lines(value==null?(sharedHere?'待分配':'待确认'):amountText(value,c.currency),sharedHere?'采购总额 '+amountText(c.amount,c.currency):'');
    let actions=A('详情','cost-view',c.id);
    if(!overview&&own&&!c.adjustmentId)actions+=A('编辑','cost-edit',c.id);
    return[U.lines(E(c.name),E(c.supplier),E(c.id)),ledger?E(S.find('projects',c.projectId)?.name):scopeCell,ledger?scopeCell:sharedHere?'—':U.lines(amountText(c.budget,c.currency),amountText(c.estimate,c.currency)),money,U.tag(c.status),actions];
  }),'mice-cost-table');
}
function overview(projectId){
  context={projectId,activityId:''};const p=S.find('projects',projectId),costs=rowsFor(projectId);
  const currencies=[...new Set(costs.map(c=>c.currency))];
  const composition=U.table(['币种','各团直接费用','项目公共费用','跨团采购','已确认合计'],currencies.map(currency=>{
    const rows=costs.filter(c=>c.currency===currency&&c.status==='已确认');
    return[E(currency),...['direct','common','shared'].map(type=>amountText(M.sum(rows.filter(c=>scopeOf(c)===type)),currency)),amountText(M.sum(rows),currency)];
  }));
  return SEC('费用总览',summary(p,'',true)+composition,procurementLink('履约采购',p.id,'','',true))+SEC('费用明细',costTable(costs,{overview:true}))+(root.MiceTaxSummary?.section(projectId)||'');
}
function section(projectId,activityId=''){
  context={projectId,activityId};if(lastActivity!==activityId){detailRange='activity';lastActivity=activityId;}
  const p=S.find('projects',projectId),projectRange=detailRange==='project';
  const costs=(projectRange?D.costs.filter(c=>c.projectId===projectId&&!c.activityId):rowsFor(projectId,activityId)).filter(canView);
  const currentGroup=S.find('activities',activityId),phaseAllowed=!currentGroup||['进行中','已完成'].includes(currentGroup.status),subject={projectId,activityId:projectRange?'':activityId};
  const controls=phaseAllowed?((canManage(subject,'cost-new')?B('新增费用','cost-new',{},true):'')+(canManage(subject,'cost-budget')?B(projectRange?'调整项目预计':'调整本团预计','cost-budget',{scope:projectRange?'project':'activity'}):'')):'';
  const range='<div class="mice-cost-range"><label for="mice-cost-range">查看范围</label><select class="form-control" id="mice-cost-range" aria-label="查看范围">'+U.options([{value:'activity',label:'本团费用'},{value:'project',label:'项目采购'}],detailRange,null)+'</select><span class="mice-muted">'+(projectRange?'项目整体及跨团采购 · '+costs.length+' 笔':'本团直接费用及已分配费用 · '+costs.length+' 笔')+'</span></div>';
  return SEC('费用采购',summary(p,projectRange?'':activityId)+range+costTable(costs,{activityId:projectRange?'':activityId}),controls);
}
function view(id){
  const c=S.find('costs',id);if(!canView(c))return U.toast('未找到费用或无权查看','error');
  const p=S.find('projects',c.projectId),pay=M.payable(c,D.requests),split=distribution(c),own=canManage(c),adjust=canManage(c,'cost-adjust'),assigned=context.activityId&&!c.activityId;
  const meta=[['费用编号',c.id],['项目',p.name],['服务范围',scopeLabel(c)],['服务内容',c.name],['供应商',c.supplier],['服务日期',(c.start||'待确认')+' 至 '+(c.end||'待确认')],['确认状态',c.status],['采购确认依据',c.basis||'待补充'],['关联项目团',coverageText(c)]];
  const money=[['采购总额',M.money(c.amount,c.currency)],...(assigned?[[scopeOf(c)==='common'?'本团承担（管理分摊）':'本团承担',assignedTo(c,context.activityId)==null?'待分配':M.money(assignedTo(c,context.activityId),c.currency)]]:[]),['实际已付',M.money(pay.paid,c.currency)],['有效申请未付',M.money(pay.unpaid,c.currency)],['可申请金额',c.conditionLimit==null?'付款条件待核对':M.money(pay.available,c.currency)],['付款约定',c.paymentTerms||c.paymentBasis||'待核对']];
  const ids=[...new Set([...coverage(c),...(c.allocations||[]).map(r=>r.activityId)])];
  const allocation=!c.activityId?SEC(scopeOf(c)==='common'?'公共费用分摊':'项目团费用分配',(ids.length?U.table(['项目团','承担金额'],ids.map(id=>[E(S.find('activities',id)?.name||id),c.allocations?.some(r=>r.activityId===id)?amountText(c.allocations.find(r=>r.activityId===id).amount,c.currency):'待分配'])):'<p class="mice-muted">'+(scopeOf(c)==='common'?'当前费用由项目整体承担，可按需进行管理分摊。':'尚未分配到项目团。')+'</p>')+U.summary([['项目共同保留',M.money(split.common,c.currency)],['未分配金额',M.money(split.remaining,c.currency)],['分配依据',c.allocationBasis||'尚未分配']])):'';
  const controls=(own&&!c.adjustmentId?B('编辑费用','cost-edit',{id}):'')+(own&&!c.activityId&&!c.adjustmentId?B('分配费用','cost-allocation',{id}):'')+(root.MicePayments&&canManage(c,'payment-new')?B('申请付款','payment-new',{id},true):'');
  const related=isOverview()?procurementLink('查看采购',p.id,c.activityId||'',c.id):(adjust&&root.MiceChanges?B('费用调整','cost-adjust',{id:c.id}):'')+L('供应商对账',U.url('merchant/tour/supplier-reconciliation.html',{mice:1,costId:c.id,projectId:p.id}));
  const dialog=U.drawer('费用详情',SEC('采购费用',U.summary(meta),controls)+SEC('金额及付款',U.summary(money))+(c.currency!=='CNY'?SEC('汇率依据',U.summary([['预算折算',M.money(core.convert(c.amount,c.budgetRate))],['约定折算',M.money(core.convert(c.amount,c.agreedRate))],['参考汇率',c.referenceRate??c.refRate??'待确认'],['约定依据',c.rateBasis||'待核对']])):'')+allocation+(root.MicePayments?.records(c.id)||'')+SEC('票据资料',U.summary([['票据情况',c.taxStatus],['预计票面税率',c.expectedTaxRate!=null&&c.expectedTaxRate!==''?c.expectedTaxRate+'%':'待确认'],['预计可扣税额',M.money(MiceTaxModel.costEstimate(c).deduction,c.currency)],['发票号码',c.ticketNumber||'未登记'],['票面税额',M.money(c.ticketTax,c.currency)],['核定可扣税额',c.approvedTax==null?'待财务核定':M.money(c.approvedTax,c.currency)]])+MiceTaxUI.history(c))+SEC(isOverview()?'采购来源':'关联办理',related),{readonly:true,buttons:[]});
  dialog.el.dataset.costId=id;
}
function page(){
  const projectId=U.q.get('projectId')||'',activityId=U.q.get('activityId')||'',costId=U.q.get('costId')||'';
  const p=S.find('projects',projectId),a=S.find('activities',activityId),c=S.find('costs',costId),app=U.takeover('项目采购');
  const adjustmentId=U.q.get('adjustmentId'),adjustment=S.find('adjustments',adjustmentId);
  if(projectId&&!p||activityId&&(!a||a.projectId!==projectId)||costId&&(!c||projectId&&c.projectId!==projectId||activityId&&c.activityId!==activityId)||adjustmentId&&(!adjustment||adjustment.type!=='cost'||adjustment.targetId!==costId||adjustment.projectId!==projectId))return U.missing('项目、项目团或采购费用');
  ledgerFilters??={projectId,activityId,word:'',status:'',scope:''};context={projectId:ledgerFilters.projectId,activityId:''};
  const projects=D.projects.filter(p=>!root.MiceAccess||MiceAccess.project(p)),f=ledgerFilters;
  const filters='<div class="mice-filters"><input id="mice-cost-query" type="search" placeholder="费用／供应商／编号" value="'+E(f.word)+'"><select id="mice-cost-project" aria-label="所属项目">'+U.options(projects.map(p=>({value:p.id,label:p.name})),f.projectId,'全部项目')+'</select><select id="mice-cost-scope" aria-label="服务范围">'+U.options([{value:'direct',label:'单个项目团'},{value:'shared',label:'指定多个项目团'},{value:'common',label:'项目整体'}],f.scope,'全部范围')+'</select><select id="mice-cost-status" aria-label="确认状态">'+U.options(['待确认','已确认'],f.status,'全部状态')+'</select>'+B('查询','cost-search')+B('重置','cost-reset')+'</div>';
  const costs=D.costs.filter(canView).filter(c=>(!f.projectId||c.projectId===f.projectId)&&(!f.activityId||c.activityId===f.activityId||coverage(c).includes(f.activityId))&&(!f.status||c.status===f.status)&&(!f.scope||scopeOf(c)===f.scope)&&(!f.word||[c.name,c.id,c.supplier].join(' ').toLowerCase().includes(f.word.toLowerCase())));
  U.render(app,U.listHead('项目采购',B('新增采购','cost-new',{},true),U.q.get('returnUrl')||'')+filters+'<section class="mice-list-surface">'+(f.activityId?'<div class="mice-cost-range"><span>当前项目团：'+E(S.find('activities',f.activityId)?.name)+'</span>'+B('清除项目团筛选','cost-clear-activity')+'</div>':'')+costTable(costs,{ledger:true})+'<div class="mice-cost-list-count">共 '+costs.length+' 笔费用</div></section>');
  app.querySelector('#mice-cost-query').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search();}};
  if(costId&&!openedSource){openedSource=true;if(adjustment&&['草稿','已退回'].includes(adjustment.status)&&canManage(c,'cost-adjust'))root.MiceChanges.open('cost',costId,adjustmentId);else view(costId);}
}
function search(){ledgerFilters={projectId:document.querySelector('#mice-cost-project').value,activityId:'',word:document.querySelector('#mice-cost-query').value.trim(),scope:document.querySelector('#mice-cost-scope').value,status:document.querySelector('#mice-cost-status').value};page();}
document.addEventListener('change',e=>{if(e.target.id==='mice-cost-range'){detailRange=e.target.value;refresh();}});
Object.assign(U.actions,{'cost-new':()=>open(),'cost-edit':({id})=>{const c=S.find('costs',id);if(c)open(id,c.projectId,c.activityId);},'cost-view':({id})=>view(id),'cost-allocation':({id})=>allocation(id),'cost-budget':budget,'cost-search':search,'cost-reset':()=>{ledgerFilters={projectId:'',activityId:'',word:'',status:'',scope:''};page();},'cost-clear-activity':()=>{ledgerFilters.activityId='';page();}});
function openForActivity(projectId,activityId,kind){
  const a=S.find('activities',activityId);
  if(!a||a.projectId!==projectId)return U.toast('项目团与所属项目不匹配','error');
  context={projectId,activityId};detailRange='activity';lastActivity=activityId;
  return kind==='cost-budget'?budget():open(null,projectId,activityId);
}
root.MiceCosts={section,embed:section,overview,open,openForActivity,view,page,refresh,rowsFor,summary,canView,canManage,requireManage,procurementUrl,backToCost,resource:(r,projectId,activityId)=>open(null,projectId,activityId,r)};
const X=root.MiceProjectExtensions=root.MiceProjectExtensions||{};X.costs=p=>overview(p.id);
U.ready(()=>{if(!location.pathname.endsWith('fulfillment-cost.html'))return;if(U.q.get('mice')==='1')page();});
})(window);
