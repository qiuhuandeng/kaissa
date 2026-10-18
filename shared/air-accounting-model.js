/* 结算后的核算资料准备；不生成会计分录，不修改来源或连接真实NC。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirAccounting=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const key='caesar-air-accounting-v1',company='北京凯撒航空服务有限公司';
const roles={superadmin:'超级管理员',finance:'李梅 · 核算财务',ticket:'孙丽 · 票务查看',owner:'周伟 · 包机查看',supervisor:'王强 · 主管查看',other:'其他公司'};
const copy=x=>JSON.parse(JSON.stringify(x)),valid=x=>x!==null&&x!==''&&x!==undefined&&Number.isFinite(Number(x));
function must(ok,msg){if(!ok)throw Error(msg);}
function sources(b,c){const rows=[];
 for(const s of b.settlements){const v=s.versions?.at(-1);rows.push({key:'settlement:'+s.id,id:s.id,type:s.kind==='调整'?'结算调整':'机票结算',company:s.company,currency:s.currency,partner:s.customer,group:s.group,parent:s.parent||'',version:v?.version||0,period:v?.period||s.period,sale:v?.totals.sale??null,cost:v?.totals.cost??null,lines:copy(v?.lines||[]),basis:v?.note||s.note||'',ready:s.state==='已结算'&&!s.revision&&!!v,reason:s.state==='已作废'?'来源结算已作废':s.revision?'原结算正在修订，请等审批完成':!v?'结算尚未审批完成':'',locked:!!(s.closed||s.pushed),url:'air-settlement.html?id='+encodeURIComponent(s.id)});}
 for(const p of c.projects){const v=p.settlement?.versions?.at(-1);rows.push({key:'charter:'+p.id,id:p.id,type:'包机结算',company:p.company,currency:p.currency,partner:p.name,group:p.id,parent:'',version:v?.version||0,period:v?.period||'',sale:v?.totals.sale??null,cost:v?.totals.cost??null,lines:v?[{orderId:p.id,sale:v.totals.sale,cost:v.totals.cost,confirmed:valid(v.totals.cost),basis:v.basis}]:[],basis:v?.basis||'',ready:p.settlement?.state==='已确认'&&!!v,reason:p.state==='已取消'&&!v?'项目已取消，无已确认结算可准备':!v?'项目结算尚未审批完成':'',locked:false,url:'air-settlement.html?business=aircharter&id='+encodeURIComponent(p.id)});
 for(const a of p.adjustments||[])rows.push({key:'charter-adjustment:'+a.id,id:a.id,type:'包机调整',company:p.company,currency:p.currency,partner:p.name,group:p.id,parent:p.id,version:a.state==='已确认'?1:0,period:'',sale:a.saleDelta,cost:a.costDelta,lines:[{orderId:a.ref,sale:a.saleDelta,cost:a.costDelta,confirmed:true,basis:a.basis}],basis:a.basis,ready:a.state==='已确认',reason:a.state!=='已确认'?'补充调整尚未审批完成':'',locked:false,url:'air-settlement.html?business=aircharter&id='+encodeURIComponent(p.id)});
 }return rows;
}
function visible(rows,role){return role==='superadmin'?rows:roles[role]&&role!=='other'?rows.filter(s=>s.company===company):[];}
function stamp(s){return JSON.stringify([s.key,s.company,s.currency,s.version,s.period,s.sale,s.cost,s.lines,s.ready]);}
function issues(s){const e=[];if(!s.ready)e.push(s.reason||'来源未完成结算确认');if(!s.company||!s.currency)e.push('公司或币种资料待补');if(s.locked&&!s.parent)e.push('原结算已关账或已有凭证，本页只读；后续差额从原单补充调整办理');if(!valid(s.sale)&&!valid(s.cost))e.push('来源金额待核');return e;}
function active(db,s){return db.records.find(r=>r.source.key===s.key&&r.state!=='已撤回');}
function access(s,role){must(role==='superadmin'||role==='finance'&&s.company===company,'仅本公司核算财务可办理');}
function log(r,role,text){r.history.unshift({time:new Date().toLocaleString('zh-CN'),who:roles[role],text});}
function confirm(db,s,d,periods,role){access(s,role);must(!issues(s).length,issues(s).join('；'));must(!active(db,s),'本来源已有准备记录，请查看或撤回后重新核对');const scope=['sale','cost'].filter(k=>d[k]===true);must(scope.length,'请选择本次准备范围');must(scope.every(k=>valid(s[k])),'所选金额尚未核定');if(scope.includes('cost'))must(s.lines.every(l=>l.confirmed===true),'存在暂估成本，不能作为已确认采购成本准备');must(periods.some(p=>p.period===d.period&&p.state==='开放'),'请选择开放的会计期间');must(String(d.basis||'').trim(),'请填写财务核对依据');must(scope.length===2||String(d.exclusion||'').trim(),'请说明本次未纳入另一项金额的原因');
 const r={id:'HFHS'+Date.now()+String(db.records.length+1).padStart(2,'0'),source:copy(s),stamp:stamp(s),period:d.period,scope,sale:scope.includes('sale')?s.sale:null,cost:scope.includes('cost')?s.cost:null,basis:d.basis.trim(),exclusion:String(d.exclusion||'').trim(),state:'已核对',history:[]};db.records.unshift(r);log(r,role,'确认来源、期间与本次准备范围；未确认收入、税额或会计分录');return r;
}
function generate(db,id,s,periods,role){const r=db.records.find(r=>r.id===id);must(r,'准备记录不存在');access(r.source,role);must(r.state==='已核对','本记录已生成或已撤回，请查看原记录');must(s&&stamp(s)===r.stamp&&!issues(s).length,'来源已变化，请撤回后按最新结算重新核对');must(periods.some(p=>p.period===r.period&&p.state==='开放'),'会计期间已关闭，请撤回后重新核对');r.state='待配置';log(r,role,'已生成核算准备；科目、收入确认、税额及辅助核算待财务配置');return r;}
function withdraw(db,id,reason,role){const r=db.records.find(r=>r.id===id);must(r,'准备记录不存在');access(r.source,role);must(['已核对','待配置'].includes(r.state),'本记录不能重复撤回');must(String(reason||'').trim(),'请填写撤回原因');r.state='已撤回';log(r,role,'撤回核算准备：'+reason+'；保留原核对范围与金额');}
function demoRecords(db,rows,periods){
 if(db.recordDemoVersion)return db;
 db.recordDemoVersion=1;
 if(db.records.length)return db;
 const source=rows.find(s=>s.key==='charter:CH20260912001'&&!issues(s).length&&valid(s.sale)&&valid(s.cost)&&s.lines.every(l=>l.confirmed===true)),period=periods.find(p=>p.state==='开放');
 if(source&&period){const r=confirm(db,source,{sale:true,cost:true,period:period.period,basis:'演示核对：秋季包机已确认结算及成本明细',exclusion:''},periods,'finance');r.id='HFHS20261017DEMO01';generate(db,r.id,source,periods,'finance');}
 return db;
}
function load(){try{const db=JSON.parse(sessionStorage.getItem(key));if(db?.version===1)return db;}catch(_){}return {version:1,records:[]};}
function save(db){try{sessionStorage.setItem(key,JSON.stringify(db));return true;}catch(_){return false;}}
return {key,company,roles,sources,visible,stamp,issues,active,confirm,generate,withdraw,demoRecords,load,save};
});
