/* 名单导出格式演示；正式航司样板未确认，不代表航司受理规范。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirTemplate=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const fields={personId:'人员编号',name:'姓名',english:'英文姓名',docType:'证件类型',docNo:'证件号码',birth:'生日',expiry:'有效期',origin:'联运出发地',date:'出行日期',flight:'航班号',from:'出发机场',to:'到达机场',cabin:'舱位',meal:'餐食',carrier:'航司',version:'模板版本',notice:'使用说明',nationality:'国籍'};
const enums={docType:['身份证','护照','港澳通行证','台湾通行证','其他证件','其他出入境证件'],cabin:['经济舱','商务舱','头等舱'],meal:['普通餐','素食','儿童餐','无麸质餐']};
const dateFormats=['YYYY-MM-DD','YYYYMMDD','DD/MM/YYYY'],nameFormats=['保持原文','姓/名','名 姓'];
const clone=x=>JSON.parse(JSON.stringify(x));
function must(ok,message){if(!ok)throw Error(message);}
function preset(kind='A'){
 const values=Object.fromEntries(Object.entries(enums).map(([k,vs])=>[k,vs.map((v,i)=>({source:v,enabled:true,output:kind==='A'?v:({docType:['ID','P','HK','TW','OT','TR'],cabin:['Y','C','F'],meal:['STD','VGML','CHML','GFML']}[k][i])}))]));
 const columns=Object.entries(fields).map(([field,label])=>({field,label,enabled:true}));
 if(kind==='B'){const keys=['flight','date','english','docType','docNo','birth','expiry','nationality','from','to','cabin','meal','origin','personId'];const labels=['Flight','Travel Date','Passenger Name','Document Type','Document Number','Birth Date','Expiry Date','Nationality','From','To','Cabin','Meal','Origin','Passenger Ref'];columns.sort((a,b)=>(keys.includes(a.field)?keys.indexOf(a.field):100)-(keys.includes(b.field)?keys.indexOf(b.field):100));columns.forEach(c=>{const i=keys.indexOf(c.field);c.enabled=i>=0;if(i>=0)c.label=labels[i];});}
 return {name:kind==='A'?'中文列演示':'英文列演示',dateFormat:kind==='A'?'YYYY-MM-DD':'DD/MM/YYYY',nameFormat:kind==='A'?'保持原文':'名 姓',columns,values};
}
function layout(t){return clone(t.layout||preset(['法国航空','土耳其航空','卡塔尔航空','阿联酋航空'].includes(t.carrier)&&t.version==='2026.2'?'B':'A'));}
function validate(d){
 must(d&&String(d.name||'').trim(),'请填写格式名称');must(dateFormats.includes(d.dateFormat)&&nameFormats.includes(d.nameFormat),'请选择支持的姓名和日期格式');
 must(Array.isArray(d.columns)&&d.columns.length===Object.keys(fields).length&&new Set(d.columns.map(c=>c.field)).size===Object.keys(fields).length&&d.columns.every(c=>fields[c.field]),'名单可用资料不完整，请重新打开模板');
 const cs=d.columns.filter(c=>c.enabled);must(cs.some(c=>['name','english'].includes(c.field))&&['docNo','flight','date'].every(f=>cs.some(c=>c.field===f)),'导出须保留姓名或英文姓名、证件号码、航班号、出行日期');
 must(cs.every(c=>String(c.label||'').trim())&&new Set(cs.map(c=>c.label.trim())).size===cs.length,'导出列名不能空缺或重复');
 for(const [k,vs]of Object.entries(enums)){const rows=d.values?.[k];must(Array.isArray(rows)&&rows.length===vs.length&&new Set(rows.map(r=>r.source)).size===vs.length&&rows.every(r=>vs.includes(r.source)),'请保留完整的'+fields[k]+'对应资料');must(rows.some(r=>r.enabled),'至少允许一种'+fields[k]);must(rows.filter(r=>r.enabled).every(r=>String(r.output||'').trim()),'允许的'+fields[k]+'须填写输出值');}
 const result=clone(d);result.name=result.name.trim();result.columns.forEach(c=>c.label=c.label.trim());Object.values(result.values).flat().forEach(r=>r.output=String(r.output||'').trim());return result;
}
function formatDate(value,style){if(!value)return '';must(/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value,'日期资料不完整或无效：'+value);const [y,m,d]=value.split('-');return style==='YYYYMMDD'?y+m+d:style==='DD/MM/YYYY'?d+'/'+m+'/'+y:value;}
function formatName(value,style){if(style==='保持原文')return value||'';const parts=String(value||'').trim().split('/').map(s=>s.trim());must(parts.length===2&&parts.every(p=>/^[A-Za-z][A-Za-z -]*$/.test(p)),'英文姓名须按“姓/名”核录，不能自动猜测姓与名');return (style==='名 姓'?parts[1]+' '+parts[0]:parts.join('/')).toUpperCase();}
function convert(records,t){const d=validate(layout(t)),cs=d.columns.filter(c=>c.enabled);return {headers:cs.map(c=>c.label),layoutName:d.name,rows:records.map(r=>cs.map(c=>{let v=r[c.field]??'';try{if(c.field==='english')v=formatName(v,d.nameFormat);if(['date','birth','expiry'].includes(c.field))v=formatDate(v,d.dateFormat);if(enums[c.field]){const mapping=d.values[c.field].find(m=>m.source===v);must(mapping?.enabled,fields[c.field]+'“'+v+'”不在本模板允许范围');v=mapping.output;}}catch(e){throw Error((r.name||r.personId)+' · '+r.flight+'：'+e.message);}return v;}))};}
const sample={personId:'DEMO-P01',name:'张建国',english:'ZHANG/JIANGUO',docType:'护照',docNo:'DEMO-PASSPORT-001',birth:'1988-05-20',expiry:'2031-05-20',origin:'PEK',date:'2026-11-20',flight:'CA931',from:'PEK',to:'FRA',cabin:'经济舱',meal:'普通餐',carrier:'演示航司',version:'2026.2',notice:'演示模板，须经航司确认',nationality:'中国'};
return {fields,enums,dateFormats,nameFormats,preset,layout,validate,convert,sample};
});
