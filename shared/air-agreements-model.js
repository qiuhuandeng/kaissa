/* 航司框架协议资料；不更改机位采购已确认的价格、付款节点或引用。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirAgreements=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const key='caesar-air-agreements-v1',copy=x=>JSON.parse(JSON.stringify(x));
  function seed(){
    const base={currency:'CNY',state:'有效',start:'2026-01-01',end:'2026-12-31',signed:'2025-12-20',owner:'孙丽',cabin:'经济舱团队位，G/K舱优先',deposit:'定金20%，确认后7日内支付',release:'起飞前10天释放未确认座位；已确认名单取消按协议损失核算。',ticketing:'名单和证件资料齐全后72小时内出票，出票后按航司退改规则执行。',basis:'双方签署的年度团队合作协议（演示）',attachments:[],history:[]};
    return {version:1,records:[
      {...copy(base),id:'CA-EU-2026',name:'国航欧洲团队票协议',airline:'中国国际航空',supplier:'国航团队票中心',method:'锁位协议 + 团队票',flights:'CA937 / CA938 / CA939'},
      {...copy(base),id:'HU-EU-2026',name:'海航欧洲团队位协议',airline:'海南航空',supplier:'海航团队销售部',method:'团队票协议',flights:'HU489 / HU782',start:'2026-03-01',end:'2026-10-31',signed:'2026-02-20',owner:'陈红',deposit:'定金30%',release:'起飞前14天释放未确认座位',ticketing:'PNR确认后锁价'},
      {...copy(base),id:'MU-JP-2026',name:'东航日本团队票协议',airline:'中国东方航空',supplier:'东航华东销售部',method:'团队票协议',flights:'MU225 / MU226',owner:'王芳',deposit:'按确认书约定',ticketing:'名单提交后48小时出票'}]};
  }
  function draft(db,id,renew=false){
    const old=id?db.records.find(r=>r.id===id):null;
    if(id&&!old)throw Error('协议不存在');
    if(renew&&['草稿','待审核','终止'].includes(old.state))throw Error('当前协议阶段不能登记续约');
    if(renew&&db.records.some(r=>r.previous===id&&['草稿','待审核'].includes(r.state)))throw Error('已有待完成的续约资料，请编辑原续约记录');
    const d=copy(old||seed().records[0]);
    if(!old){d.id='';d.name='新的航司合作协议';d.state='草稿';d.history=[];d.attachments=[];}
    if(renew){const start=new Date(old.end+'T00:00:00Z');start.setUTCDate(start.getUTCDate()+1);const end=new Date(start);end.setUTCFullYear(end.getUTCFullYear()+1);end.setUTCDate(end.getUTCDate()-1);Object.assign(d,{id:'',previous:id,name:old.name+'（续约）',start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10),signed:'',state:'草稿',basis:'续约资料待核对',attachments:[],history:[]});}
    return d;
  }
  function saveRecord(db,d){
    const old=db.records.find(r=>r.id===d.id),parent=d.previous&&db.records.find(r=>r.id===d.previous);
    if(parent&&!old){if(['草稿','待审核','终止'].includes(parent.state))throw Error('原协议阶段已变化，请重新核对');if(db.records.some(r=>r.previous===parent.id&&['草稿','待审核'].includes(r.state)))throw Error('已有待完成续约，不能重复登记');}
    const record=copy(d);record.id=old?.id||'XY'+Date.now()+Math.random().toString(36).slice(2,6);
    const {history,...version}=old||{};
    record.history=[{at:new Date().toLocaleString('zh-CN'),by:'超级管理员',action:old?'维护协议资料':parent?'登记续约资料':'新增协议',before:old?copy(version):null},...(old?.history||[])];
    if(old)db.records[db.records.indexOf(old)]=record;else db.records.push(record);
    if(parent&&!old)parent.history.unshift({at:new Date().toLocaleString('zh-CN'),by:'超级管理员',action:'登记续约资料',next:record.id});
    return record;
  }
  function load(){try{const d=JSON.parse(sessionStorage.getItem(key));if(d?.version===1)return d;}catch(_){}return seed();}
  function save(db){try{sessionStorage.setItem(key,JSON.stringify(db));return true;}catch(_){return false;}}
  return {key,copy,seed,draft,saveRecord,load,save};
});
