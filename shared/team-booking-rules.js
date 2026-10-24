/* 直接团队报名的来源检查；不改变其他产品的出行日期、库存或财务流程。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TeamBookingRules=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function issues({type,mode,stock,stocks=[],catalog=[],productName=''}){
    if(type!=='group'||mode==='draft')return [];
    const id=String(stock?.[1]||'').trim();
    if(!id||!/[A-Za-z]/.test(id)||!/\d/.test(id)||/\s|\//.test(id))return ['请先选择已生成团号的团队'];
    const original=stocks.find(r=>r[1]===id),route=(Array.isArray(catalog)?catalog:(catalog?.routes||[])).find(r=>(r.schedules||[]).some(r=>r[0]===id)),entry=route?.schedules.find(r=>r[0]===id);
    if(!original&&route&&productName&&!String(productName).replace(/[·\s]/g,'').includes(String(route.product).replace(/[·\s]/g,'')))return ['所选团号不属于当前线路，请重新选择团期'];
    if(!original&&!entry)return ['所选团号未在当前团期资料中找到，请返回选择已有团期'];
    const blocked=/停售|关闭|取消|终止|未发布|未开放|筹备|不可售|满员|售罄/;
    const states=[stock?.[4],original?.[4],entry?.[7]].filter(Boolean);
    if(states.some(s=>blocked.test(s)))return ['所选团期尚未开放、已停售或取消，不能新增报名'];
    const state=entry?.[7]||original?.[4];
    if(!/可售|销售中|在售|紧张|实时可售|申请确认/.test(state||''))return ['所选团期开放状态待核对，请返回团期确认'];
    const date=entry?.[1]||original?.[0];
    if(stock?.[0]!==date)return ['出发日期与所选团号不一致，请重新选择团期'];
    return [];
  }
  return {issues};
});
