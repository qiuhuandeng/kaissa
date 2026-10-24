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
    if(closed){add('roster-export','导出名单');return result;}
    const hasOrder=(data.orders||[]).some(o=>o.projectId===project.id&&o.activities?.includes(activity.id)&&!['已取消','已作废'].includes(o.status));
    if(status==='草稿'){
      if(!hasOrder)add('order-new','创建订单','primary');add('form','确认成团','primary');add('edit','编辑');if(!hasOrder)add('quote-new','报价');return result;
    }
    if(status==='进行中'&&!hasOrder){add('order-new','创建订单','primary');add('quote-new','报价');}
    const phase={进行中:['complete','确认完成']}[status];
    if(phase)add(...phase,'primary');
    add('roster-export','导出名单');
    if(status==='已取消')return result;
    if(['进行中','已完成'].includes(status)){
      for(const [key,label] of [['claim','收款认领'],['invoice','开票申请'],['order-change','订单改价']])
        add(key,label,'more',!orders.length?'暂无已确认订单':key==='order-change'&&!orders.some(o=>o.activities.length===1)?'整包订单请从订单详情办理整单变更':'');
    }
    if(['进行中'].includes(status))add('change','发起项目团变更');
    add('files','维护附件');
    return result;
  }
  const api={items,settlementFor,allows:(activity,project,key,data)=>items(activity,project,data).some(item=>item.key===key&&!item.reason)};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MiceActivityActions=api;
})(typeof window==='object'?window:globalThis);
