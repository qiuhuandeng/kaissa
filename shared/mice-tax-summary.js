(function(){'use strict';const U=MiceUI,{store:S,M,esc:E}=U;
const values=(projectId,currency='CNY',activityId='')=>MiceTaxModel.values(S.data,projectId,currency,activityId);
function section(projectId,activityId=''){const cs=[...new Set([...S.data.orders,...S.data.costs].filter(x=>x.projectId===projectId).map(x=>x.currency))],pct=v=>v==null?'待确认':v.toFixed(2)+'%';return U.section('业务毛利测算',cs.map(currency=>{const v=values(projectId,currency,activityId);return'<h4>'+E(currency)+'</h4>'+U.table(['金额口径','客户金额','成本金额','业务毛利','毛利率'],[['含税金额',M.money(v.grossIncome,currency),M.money(v.grossCost,currency),M.money(v.grossProfit,currency),pct(v.grossRate)],['扣除预计税额（测算）',M.money(v.estimatedNetIncome,currency),M.money(v.estimatedNetCost,currency),M.money(v.estimatedNetProfit,currency),pct(v.estimatedNetRate)],['扣除财务核定税额',M.money(v.netIncome,currency),M.money(v.netCost,currency),M.money(v.netProfit,currency),pct(v.netRate)]])+U.summary([['预计销项税额',M.money(v.estimatedOutputTax,currency)],['预计可扣税额',M.money(v.estimatedInputTax,currency)],['核定销项税额',M.money(v.outputTax,currency)],['核定可扣税额',M.money(v.inputTax,currency)]])+v.issues.map(i=>'<p class="mice-muted">'+E(i)+'</p>').join('');}).join('')+'<p class="mice-muted">未明确金额、未确认成本或未核定税额不按零处理。各币种分别展示；业务测算不替代财务收入确认与正式毛利。</p>');}
const dateText=(value,fallback='未登记')=>value?new Date(value).toLocaleString('zh-CN',{hour12:false}):fallback;
const settlementHeaders=['金额口径','收入','销项税额','成本','可扣税额','毛利','毛利率'];
function settlementRows(v){
 const money=n=>M.money(n,v.currency),income=n=>v.incomeApplicable?money(n):'不适用',rate=n=>!v.incomeApplicable?'不适用':n==null?'待确认':n.toFixed(2)+'%';
 return [
  ['含税金额',income(v.grossIncome),'—',money(v.grossCost),'—',income(v.grossProfit),rate(v.grossRate)],
  ['预计扣税后',income(v.estimatedNetIncome),income(v.estimatedOutputTax),money(v.estimatedNetCost),money(v.estimatedInputTax),income(v.estimatedNetProfit),rate(v.estimatedNetRate)],
  ['核定扣税后',income(v.netIncome),income(v.outputTax),money(v.netCost),money(v.inputTax),income(v.netProfit),rate(v.netRate)]
 ];
}
function settlementSection(evidence,title='本次结算金额'){
 const f=evidence?.financial;
 if(!f)return U.section(title,'<p class="mice-muted">原结算未保存收入与税额，金额结果待核对。</p>');
 const table=f.amounts.map(v=>'<h4>'+E(v.currency)+'</h4>'+U.table(settlementHeaders,settlementRows(v).map(row=>row.map(E)),'mice-settlement-money-table')+(v.issues.length?'<p class="mice-settlement-gaps">'+v.issues.map(E).join('；')+'</p>':'')).join('');
 const income=U.table(['客户订单','含税收入','预计销项税','核定销项税'],f.incomeLines.map(l=>[
  U.lines(E(l.id),'V'+l.version,!l.covered?'整包未分团，原订单 '+E(M.money(l.originalAmount,l.currency)):l.activities.length+'团'),M.money(l.amount,l.currency),M.money(l.estimatedTax,l.currency),M.money(l.approvedTax,l.currency)
 ]),'mice-settlement-tax-lines');
 const costs=U.table(['费用／承担范围','含税成本','预计可扣税','核定可扣税'],f.costLines.map(l=>[
  U.lines(E(l.name||l.costId),E(l.costId),E(({direct:'本团直接费用',shared:'跨团分配',management:'管理分摊',project:'项目承担费用'})[l.kind]||l.kind)),M.money(l.amount,l.currency),M.money(l.estimatedTax,l.currency),M.money(l.approvedTax,l.currency)
 ]),'mice-settlement-tax-lines');
 return U.section(title,(table||'<p class="mice-muted">本次范围暂无收入和费用记录。</p>')+'<details class="mice-settlement-sources"><summary>收入与税额明细</summary>'+income+'</details><details class="mice-settlement-sources"><summary>成本与抵扣明细</summary>'+costs+'</details>');
}
function settlementExportRows(record,evidence){
 const f=evidence?.financial,project=f?.project||S.find('projects',record.projectId)||{};
 const rows=[['业务结算单',record.id],['项目',project.name||record.projectId],['客户',project.customer||''],['我方公司',project.company||''],['状态',record.status],['版本',record.version],['金额依据',record.status==='已确认'?'确认时结果':record.status==='审批中'?'提交时结果':record.status==='已退回'?'退回版本结果':'草稿测算'],['提交时间',dateText(record.submittedAt)],['确认时间',dateText(evidence?.confirmedAt)],['项目承担费用',record.includeProjectCosts?'本次包含':'本次不包含'],['结算依据',record.basis||''],['未结事项',record.pending||''],['无费用说明',record.noCost||'']];
 for(const a of f?.activities||record.activities.map(id=>({id,name:id})))rows.push(['项目团',a.id,a.name,a.start||'',a.end||'']);
 if(!f){rows.push(['金额结果','原结算未保存收入与税额，待核对']);return rows;}
 for(const v of f.amounts){rows.push([],['币种',v.currency],settlementHeaders,...settlementRows(v));for(const issue of v.issues)rows.push(['待核对',issue]);}
 rows.push([],['收入依据'],['订单','版本','币种','含税原单金额','本次收入','预计销项税','核定销项税','测算方式','预计税率','测算依据','核定依据']);
 for(const l of f.incomeLines)rows.push([l.id,l.version,l.currency,M.money(l.originalAmount,l.currency),l.covered?M.money(l.amount,l.currency):'整包未分团',M.money(l.estimatedTax,l.currency),M.money(l.approvedTax,l.currency),({standard:'按单一税率测算',manual:'按提供税额测算',pending:'待确认'})[l.method]||'待确认',l.rate==null?'待确认':l.rate+'%',l.estimateBasis,l.approvedBasis]);
 rows.push([],['成本依据'],['费用','供应商','币种','本次承担','预计可扣税','核定可扣税','预计税率','预计可扣处理','票据号码','预计依据','核定依据']);
 for(const l of f.costLines)rows.push([l.name||l.costId,l.supplier,l.currency,M.money(l.amount,l.currency),M.money(l.estimatedTax,l.currency),M.money(l.approvedTax,l.currency),l.rate==null?'待确认':l.rate+'%',({full:'预计全扣',none:'不可扣',partial:'部分可扣',pending:'待确认'})[l.deductionMode]||'待确认',l.ticketNumber,l.estimateBasis,l.approvedBasis]);
 return rows;
}
window.MiceTaxSummary={values,section,settlementSection,settlementExportRows,settlementRows,dateText};})();
