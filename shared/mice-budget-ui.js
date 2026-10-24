(function(){
  'use strict';
  const U=MiceUI,{store:S,M,esc:E,field:F,grid:G,section:SEC,btn:B,action:A}=U,D=S.data,Q=MiceBudgetModel;
  const state=p=>Q.snapshot(D,p);
  const refresh=()=>location.pathname.endsWith('product-custom-list.html')?MiceProjects.render():location.pathname.endsWith('product-custom-detail.html')?MiceProjectDetail.render():window.MiceSettlementHost?MiceSettlementHost.refreshCosts():window.MiceActivity?.render();
  function groupNote(p,a){
    const r=state(p).people.find(r=>r.d.employee===a.planner),errors=Q.groupIssues(D,p,[{...a,status:'进行中'}]);
    if(!Q.enabled(p))return '预算参考：正式启用管控后，成团与采购确认将核对费用预算。';
    return (r?'人员可用额度 '+M.money(r.remaining)+'；':'项目可分配预算 '+M.money(state(p).available)+'；')+'本团预算 '+M.money(M.num(a.originalBudget))+(errors.length?'。'+errors.join('；'):'。草稿不占用，正式成团后占用。');
  }
  function summary(p){
    const s=state(p);
    return SEC('费用预算',U.summary([['管控方式',Q.enabled(p)?'预算管控':'预算参考'],['项目总预算',M.money(p.originalBudget)],['公共费用预算',M.money(p.publicBudget??0)],['项目预留／可分配',M.money(s.available)],['预算已占用',M.money(s.occupied)],['已确认／已发生费用',M.money(s.actual)]])+U.table(['操作人员','负责业务金额（参考）','费用额度','已占用','可用额度'],s.people.map(r=>[E(r.d.employee),M.money(r.d.businessAmount,r.d.currency),M.money(r.d.costBudget,r.d.currency),M.money(r.unknown?null:r.occupied),M.money(r.remaining)]))+U.table(['项目团','本团预算','已确认／已发生费用','预算占用','核对情况'],s.groups.map(r=>[E(r.a.name),M.money(r.budget),M.money(r.unknown?null:r.cost),M.money(r.unknown?null:r.occupied),E(r.unknown?'折算／金额待核对':r.overrun?'超预算 '+M.money(r.overrun):r.released?'已释放未使用预算':r.a.status==='草稿'?'草稿不占用':r.pending?'仍有费用待确认':'执行中保留预算')])));
  }
  function adjust(id){
    const a=S.find('activities',id),p=S.find('projects',a?.projectId);if(!a||!p)return;
    const row=state(p).groups.find(r=>r.a.id===id),locked=['待结项','已结项','已终止'].includes(p.status)||D.settlements.some(r=>r.activities?.includes(id)&&['审批中','已确认'].includes(r.status));
    const body=U.summary([['项目团',a.name],['主责计调',a.planner],['当前预算',M.money(a.originalBudget)],['已确认／已发生费用',M.money(row.unknown?null:row.cost)],['预算占用',M.money(row.occupied)]])+G(F('originalBudget','调整后费用预算（CNY）',a.originalBudget??20000,{type:'number',readonly:locked})+F('basis','调整依据','按客户服务范围和采购测算调整预算',{type:'textarea',full:true,readonly:locked}))+'<p id="budget-adjust-check"></p>'+SEC('预算调整记录',U.table(['调整前','调整后','依据'],(a.budgetChanges||[]).map(r=>[M.money(r.before),M.money(r.after),E(r.basis)])));
    U.drawer(locked?'费用预算记录':'调整费用预算',body,{buttons:locked?[]:[['确认调整','save']],readonly:locked,onOpen({form}){const update=()=>{form.querySelector('#budget-adjust-check').textContent=groupNote(p,{...a,originalBudget:M.num(form.elements.originalBudget.value)});};form.oninput=update;update();},submit(v,i,x){
      const next={...a,originalBudget:M.num(v.originalBudget)},errors=Q.groupIssues(D,p,[next]);
      if(!Q.valid(next.originalBudget))errors.push('请填写非负费用预算');if(!v.basis?.trim())errors.push('请填写调整依据');
      if(errors.length)return x.errors({originalBudget:errors.join('；')});
      (a.budgetChanges||=[]).push({before:a.originalBudget,after:next.originalBudget,basis:v.basis,at:new Date().toISOString()});a.originalBudget=next.originalBudget;S.log(p.id,'调整费用预算',a.name+'／'+M.money(next.originalBudget)+'／'+v.basis);x.close();refresh();
    }});
  }
  function costFields(c){return G(F('budgetNature','费用发生情况',c.budgetNature||'planned',{options:[{value:'planned',label:'拟确认采购'},{value:'actual',label:'费用已实际发生'}],blank:null})+F('budgetOverrunReason','已发生费用超支／待核对原因',c.budgetOverrunReason||'',{full:true}))+ '<div id="mice-cost-budget-check"></div>';}
  function costPreview(form,p,c){
    const el=form.querySelector('#mice-cost-budget-check');if(!el)return;if(!p){el.innerHTML='';return;}
    form.elements.budgetOverrunReason.closest('.mice-field').hidden=form.elements.budgetNature.value!=='actual';
    const errors=Q.costIssues(D,p,c),r=state(p).groups.find(r=>r.a.id===c.activityId);
    el.innerHTML=U.summary([['预算管控',Q.enabled(p)?'已启用':'参考提示'],['本团／公共预算',M.money(c.activityId?r?.budget:p.publicBudget??0)],['已确认／已发生费用',M.money(c.activityId?(r?.unknown?null:r?.cost):state(p).common)]])+(errors.length?'<p class="mice-error">'+E(errors.join('；'))+'</p><p class="mice-muted">拟确认采购须先调整预算，可先保存明细；已实际发生的费用请如实登记并说明原因。</p>':'');
  }
  Object.assign(U.actions,{'budget-group-adjust':({id})=>adjust(id)});
  window.MiceBudget={state,groupNote,summary,adjust,costFields,costPreview,groupIssues:(p,rows)=>Q.groupIssues(D,p,rows),allocationIssues:p=>Q.allocationIssues(D,p),costIssues:(p,c)=>Q.costIssues(D,p,c)};
})();
