(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./report-management.js'),require('./report-pages.js'),require('./report-governance-model.js'));else root.CaesarManagementAnalysis=factory(root.CaesarManagementChecks,root.CaesarReports,root.CaesarReportGovernance);})(typeof globalThis==='object'?globalThis:this,function(checks,report,gov){
 const defaults={view:'checks',basis:'orders',start:'2026-05-01',end:report.CUTOFF,company:'',issue:''};
 function query(input={}){
  const q={...defaults,...input};if(!['orders','returns'].includes(q.basis)||!checks.dateValid(q.start)||!checks.dateValid(q.end)||q.start>q.end||q.end>report.CUTOFF)throw Error('请核对日期范围，资料截止为'+report.CUTOFF);
  if(q.issue&&!checks.checks.some(([k])=>k===q.issue&& (q.basis==='returns'||!['financeRevenue','cost'].includes(k))))throw Error('所选字段不适用于本核对明细');
  const r=checks.inspect(q);
  return {rows:r.summary.map(s=>({...s,amount:s.coverage.value,state:s.count?'存在缺口':'本字段未发现缺口'})),columns:['label','count','amount','owner','source','state'],title:'问题汇总',sections:[{key:'details',title:'缺口记录',rows:r.details,columns:['order','rowId','product','date','issue','value','amount','owner','source']}],pending:false,affected:r.affected.length,uniqueAmount:r.coverage.value,notice:'核对'+r.rows.length+'条业务，'+r.details.length+'项缺口，去重涉及'+r.affected.length+'条业务，成交额'+r.coverage.value+'元。各字段涉及金额不能相加，不是缺失收入成本金额。只核对已提供资料，未代表跨系统完整性已验证。'};
 }
 function permission(input={},state=gov.initial()){
  const q={...gov.defaults,...input},data=gov.query(state,{...q,view:'records'}),p=gov.roles[q.role];
  const outside=['company','department','store'].some(k=>q[k]&&p[k]&&q[k]!==p[k]);
  return {rows:[{roleName:p.name,company:p.noData?'无业务数据权限':p.company||'全部公司（演示）',department:p.noData?'不适用':p.department||'授权公司全部部门',store:p.noData?'不适用':p.store||'授权部门全部门店',sensitive:p.sensitive?'电话、账号完整可见（演示）':'电话、账号脱敏',publish:p.publish?'允许创建演示发布副本':'不允许发布',effective:'正式授权有效期未提供',status:p.noData?'规则维护不授予业务数据权限':outside?'当前筛选超出角色授权，预览无数据':'查看与导出按同范围控制'}],columns:['roleName','company','department','store','sensitive','publish','effective','status'],sections:[],pending:false,notice:data.notice,preview:data.rows};
 }
 return {query,permission,defaults};
});
