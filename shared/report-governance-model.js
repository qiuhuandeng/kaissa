(function(root){
  'use strict';
  const roles={group:{name:'集团财务（演示）',publish:true,sensitive:true},company:{name:'A公司财务（演示）',company:'A公司（演示）',sensitive:false},department:{name:'A公司直营部门（演示）',company:'A公司（演示）',department:'直营销售部',sensitive:false},store:{name:'A公司朝阳门店（演示）',company:'A公司（演示）',department:'直营销售部',store:'朝阳门店',sensitive:false},admin:{name:'报表规则管理员（演示）',noData:true,sensitive:false}};
  const defaults={view:'records',role:'group',version:'PUB01',company:'',department:'',store:'',keyword:''};
  function initial(){
    const rows=[['A公司（演示）','直营销售部','朝阳门店'],['A公司（演示）','直营销售部','海淀门店'],['A公司（演示）','呼叫中心','不适用'],['B公司（演示）','直营销售部','外地门店']].map(([company,department,store],i)=>({id:'ACCESS-'+(i+1),company,department,store,customer:'合同付款客户'+(i+1),phone:'1380000000'+i,bank:'62220000000000000'+i,amount:(i+1)*1000,source:'独立权限验收资料'}));
    const original={id:'PUB01',state:'已发布版（演示）',rule:'RPT-DEMO-V1',cutoff:'2026-09-30',period:'2026-09',parent:'',reason:'首版验收样例',evidence:'演示校验依据CHECK01',rows:structuredClone(rows)};
    const corrected={...structuredClone(original),id:'COR02',state:'更正版（演示）',parent:'PUB01',cutoff:'2026-10-05',reason:'原记录金额更正，保留原版',evidence:'更正依据CHECK02'};corrected.rows[0].amount=900;
    return {versions:[original,corrected,{...structuredClone(corrected),id:'WORK03',state:'工作版（演示）',parent:'COR02'}],subscriptions:[],logs:[],sequence:3};
  }
  const allowed=(r,p)=>!p.noData&&['company','department','store'].every(k=>!p[k]||r[k]===p[k]);
  function readable(rows,role,filter={}){
    const p=roles[role];if(!p)return [];
    return rows.filter(r=>allowed(r,p)&&['company','department','store'].every(k=>!filter[k]||r[k]===filter[k])&&(!filter.keyword||[r.id,r.customer].join(' ').includes(filter.keyword))).map(r=>({...r,phone:p.sensitive?r.phone:String(r.phone).slice(0,3)+'****'+String(r.phone).slice(-4),bank:p.sensitive?r.bank:'****'+String(r.bank).slice(-4)}));
  }
  function query(state,input){
    const q={...defaults,...input},p=roles[q.role];if(!p)throw new Error('请选择有效查看角色');
    const version=state.versions.find(v=>v.id===q.version);if(!version)throw new Error('版本不存在');
    let rows=readable(version.rows,q.role,q),sections=[];
    if(q.view==='versions')rows=state.versions.map(v=>({id:v.id,state:v.state,rule:v.rule,period:v.period,cutoff:v.cutoff,parent:v.parent,reason:v.reason,evidence:v.evidence,amount:p.noData?null:readable(v.rows,q.role,q).reduce((s,r)=>s+r.amount,0)}));
    if(q.view==='subscriptions')rows=state.subscriptions.filter(r=>q.role==='group'||r.createdBy===q.role).map(r=>({...r,recipient:roles[r.recipient]?.name}));
    if(q.view==='records')sections=[{key:'version',title:'所查版本依据',rows:[{id:version.id,state:version.state,period:version.period,cutoff:version.cutoff,rule:version.rule,parent:version.parent,reason:version.reason,evidence:version.evidence}],columns:['id','state','period','cutoff','rule','parent','reason','evidence']}];
    return {rows,sections,notice:p.name+' · '+version.state+' '+version.id+' · 截止'+version.cutoff+' · 查看与导出同范围，敏感字段按该角色处理。独立权限样例，不代表正式权限已接入。'};
  }
  function update(state,fail=false){const out=structuredClone(state),working=out.versions.find(v=>v.state==='工作版（演示）');if(!working)throw new Error('没有可更新的工作版');
    out.logs.push({id:'LOG'+(out.logs.length+1),state:fail?'更新失败，保留上次工作版':'已更新演示工作副本',source:working.id});if(!fail){working.evidence='演示重新校验CHECK03';working.reason='本页重建工作副本，未接正式更新服务';}return out;}
  function publish(state,role,versionId,correction=false){
    if(!roles[role]?.publish)throw new Error('当前角色无发布权限；规则维护不等于业务或财务批准');
    const original=state.versions.find(v=>v.id===versionId);if(!original||original.state!=='工作版（演示）'||!original.evidence||!original.rule)throw new Error('仅有校验依据的工作版可创建发布副本');
    const out=structuredClone(state),id=(correction?'COR':'PUB')+String(++out.sequence).padStart(2,'0');
    out.versions.push({...structuredClone(original),id,parent:correction?original.parent:'',state:correction?'更正版（演示）':'已发布版（演示）'});out.logs.push({id:'LOG'+(out.logs.length+1),state:'创建演示发布副本，未发布正式数据',source:id});return out;
  }
  function subscribe(state,creator,recipient,scope){
    const actor=roles[creator],receiver=roles[recipient];if(!actor||!receiver||actor.noData||receiver.noData)throw new Error('当前角色或订阅对象无业务报表权限');
    if(['company','department','store'].some(k=>(actor[k]&&scope[k]!==actor[k])||(receiver[k]&&scope[k]!==receiver[k])))throw new Error('订阅范围超出创建人或接收人权限');
    const out=structuredClone(state);out.subscriptions.push({id:'SUB'+(out.subscriptions.length+1),createdBy:creator,recipient,...scope,state:'订阅草稿（演示，未发送）',evidence:'发送前仍须按接收人当时权限重查'});return out;
  }
  const api={roles,defaults,initial,readable,query,update,publish,subscribe};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.CaesarReportGovernance=api;
})(typeof window!=='undefined'?window:globalThis);
