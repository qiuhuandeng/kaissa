/* 项目团列表只前移具体表单；主状态决定入口，关联单据决定能否办理。 */
(function(root){
  'use strict';
  function settlementFor(activity,data={}){
    const rows=(data.settlements||[]).filter(r=>r.projectId===activity.projectId&&r.activities?.includes(activity.id));
    return rows.find(r=>['审批中','已确认'].includes(r.status))||rows.slice().reverse().find(r=>['草稿','已退回'].includes(r.status));
  }
  function items(activity,project,data={}){
    if(!activity||!project||activity.projectId!==project.id)return [];
    if(!['草稿','进行中','已完成','已取消'].includes(activity.status))return [];
    const closed=['已结项','已终止'].includes(project.status),status=activity.status;
    const record=settlementFor(activity,data),readonly=closed||['审批中','已确认'].includes(record?.status);
    const orders=(data.orders||[]).filter(o=>o.projectId===project.id&&o.activities?.includes(activity.id)&&o.status==='已确认');
    const result=[],add=(key,label,place='more',reason='')=>result.push({key,label,place,reason});
    if(closed){add('roster-export','导出名单');if(record)add('settlement','查看结算');return result;}
    if(status==='草稿'){
      add('form','确认建团','primary');add('edit','编辑');add('quote-new','新增报价');return result;
    }
    const phase={进行中:['complete','确认完成']}[status];
    if(phase)add(...phase,'primary');
    add('roster-export','导出名单');
    if(status==='已取消'){
      const hasCosts=(data.costs||[]).some(c=>c.projectId===project.id&&(c.activityId===activity.id||c.allocations?.some(r=>r.activityId===activity.id)));
      const hasOrders=(data.orders||[]).some(o=>o.projectId===project.id&&o.activities?.includes(activity.id));
      if(record||hasCosts||hasOrders)add('settlement',readonly?'查看结算':'核对结算');
      return result;
    }
    if(['进行中','已完成'].includes(status)){
      if(!readonly)add('cost-new','新增费用');
      if(status!=='已完成')add('cost-budget','调整本团预计');
      for(const [key,label] of [['claim','收款认领'],['invoice','开票申请'],['order-change','订单改价']])
        add(key,label,'more',!orders.length?'暂无已确认订单':key==='order-change'&&!orders.some(o=>o.activities.length===1)?'整包订单请从订单详情办理整单变更':'');
    }
    if(status==='已完成')add('settlement',readonly?'查看结算':'核对结算','primary');
    if(['进行中'].includes(status))add('change','发起项目团变更');
    add('files','维护附件');
    return result;
  }
  const api={items,settlementFor,allows:(activity,project,key,data)=>items(activity,project,data).some(item=>item.key===key&&!item.reason)};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MiceActivityActions=api;
})(typeof window==='object'?window:globalThis);
