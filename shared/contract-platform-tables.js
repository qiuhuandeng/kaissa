(function(root){
'use strict';
const F=root.ContractTemplateFields||(typeof require!=='undefined'?require('./contract-template-fields.js'):null);
const copy=v=>JSON.parse(JSON.stringify(v));
const blank=v=>v===undefined||v===null||String(v).trim()==='';
const pathOK=v=>/^[A-Za-z_]\w*(?:\[\])?(?:\.[A-Za-z_]\w*(?:\[\])?)*$/.test(v||'');
const transforms={text:'原值',nameFallback:'展示名为空取场所名',dayDate:'所属行程对应本单日期',maxMinutes:'明确最长时长转分钟',money:'金额（元）',cents:'金额（分）',omit:'不传（样例选填）'};
// These are prototype source definitions, not HTML selectors or official 12301 parameters.
const productSources={
 'product.line.shopping':{label:'产品 → 本单采用线路 → 购物场所',kind:'shopping',columns:[['name','场所名称'],['day','所属行程'],['location','城市/国家'],['goods','经营品类'],['duration','停留时间'],['displayName','合同展示名称']]},
 'product.line.selfpay':{label:'产品 → 本单采用线路 → 自费项目',kind:'selfpay',columns:[['name','项目名称'],['day','所属行程'],['location','城市/国家'],['price','参考价格'],['duration','服务时长'],['displayName','合同展示名称']]}
};
function sources(){const out=copy(productSources);Object.entries(F.tableDefinitions).forEach(([kind,d])=>{out[d.source]={label:d.sourceLabel,kind,columns:d.columns};});return out;}
function column(id,label,allowed,conversion='text',optional=false){return {id,label,allowed,conversion,optional};}
function definitions(t){
 // Platform sample schemas belong to the contract type, independent of local body references.
 const D=root.ContractSettings||(typeof require!=='undefined'?require('./contract-settings-data.js'):null);
 const preset=D.newState().templates.find(x=>x.profile===t.profile);
 const out=(preset?F.rows(F.normalize(preset)):[]).filter(r=>r.spec.type==='table').map(({spec:s,config:f})=>({id:'table-'+f.id,fieldId:f.id,name:f.name,legacyName:f.key,kind:s.kind,source:f.source,allowedSources:[f.source],detailSource:s.detailSource,optional:false,columns:s.columns.map(c=>column(c.id,c.label,[c.id],c.type==='money'?'money':'text'))}));
 const C=root.ContractCatalog||(typeof require!=='undefined'?require('./contract-template-catalog.js'):null);
 if(C.get(t.profile)?.groups.includes('shopping')||t.profile==='provincial'){
  out.push({id:'shopping-agreement',name:'自愿购物活动补充协议',kind:'shopping',source:'product.line.shopping',allowedSources:['product.line.shopping'],optional:true,columns:[column('when','具体时间',['day'],'dayDate'),column('location','地点',['location']),column('name','购物场所名称',['displayName','name'],'nameFallback'),column('goods','主要商品信息',['goods']),column('maxMinutes','最长停留时间（分钟）',['duration'],'maxMinutes'),column('note','其他说明',[],'omit',true)]});
  out.push({id:'selfpay-agreement',name:'自费项目表（结构样例）',kind:'selfpay',source:'product.line.selfpay',allowedSources:['product.line.selfpay'],optional:true,columns:[column('when','时间',['day'],'dayDate'),column('location','地点',['location']),column('name','项目名称',['displayName','name']),column('price','费用',['price']),column('duration','时长',['duration'])]});
 }
 return out;
}
function conversions(c,source){if(c.optional)return ['omit'];if(c.conversion==='money')return ['money','cents'];if(c.conversion==='nameFallback')return source==='displayName'?['text','nameFallback']:['text'];return [c.conversion];}
function defaults(d,source=d.source){return {id:d.id,source,parameter:'',detailParameter:'',columns:d.columns.map(c=>({id:c.id,source:c.allowed[0]||'',transform:c.conversion,parameter:''}))};}
function configs(t){const p=F.platform(t);return definitions(t).map(d=>{
 const saved=(p.tables||[]).find(x=>x.id===d.id);if(saved)return copy(saved);
 const n=defaults(d,d.optional?'':d.source),old=(p.fields||[]).find(x=>x.fieldId===d.fieldId||x.name===d.legacyName);
 if(old){n.parameter=old.parameter||'';n.detailParameter=old.detailParameter||'';const pairs=Object.fromEntries((old.members||'').split('\n').filter(Boolean).map(x=>x.split('=')));n.columns.forEach(c=>{c.parameter=pairs[c.id]||'';});}
 return n;
});}
function issues(t){const p=F.platform(t),defs=definitions(t),out=[],seen=new Set((p.fields||[]).filter(x=>!defs.some(d=>d.fieldId===x.fieldId||d.legacyName===x.name)).map(x=>x.parameter).filter(Boolean));
 if(!Array.isArray(p.tables))return out;
 for(const d of defs){const m=p.tables.find(x=>x.id===d.id);if(!m?.source){out.push(d.name+'：整组资料未对应'+(d.optional?'（如本次不适用，仍需核实平台省略方式）':''));continue;}
  if(!d.allowedSources.includes(m.source))out.push(d.name+'：整组来源不适用');
  if(!pathOK(m.parameter)||!m.parameter.endsWith('[]'))out.push(d.name+'：重复记录参数待对应');
  if(seen.has(m.parameter))out.push(d.name+'：平台参数重复');seen.add(m.parameter);
  if(d.detailSource){if(!pathOK(m.detailParameter))out.push(d.name+'：随表服务标准参数待对应');if(seen.has(m.detailParameter))out.push(d.name+'：服务标准参数重复');seen.add(m.detailParameter);}
  const used=new Set();for(const c of d.columns){const mc=m.columns?.find(x=>x.id===c.id);
   if(!mc||!conversions(c,mc.source).includes(mc.transform)||(!c.optional&&!c.allowed.includes(mc.source)))out.push(d.name+'：'+c.label+'取值或转换未正确对应');
   if(c.optional&&mc?.transform==='omit')continue;
   if(!/^[A-Za-z_]\w*$/.test(mc?.parameter||''))out.push(d.name+'：'+c.label+'子项参数待对应');
   if(used.has(mc?.parameter))out.push(d.name+'：列参数重复');used.add(mc?.parameter);
  }
  if(m.columns?.some(c=>!d.columns.some(x=>x.id===c.id)))out.push(d.name+'：存在失效列对应');
 }
 if(p.tables.some(m=>!defs.some(d=>d.id===m.id)))out.push('存在不适用当前模板的表格对应');
 return [...new Set(out)];
}
const sampleCases=[['product','产品页现有资料'],['many','三条记录（转换样例）'],['missing','三条记录／第二条缺项'],['empty','已确认无安排'],['unavailable','来源资料未取得'],['conflict','选定有安排但记录为空']];
function sample(t,kind='product',line='economy'){
 const ctx=F.sample(t,'joint');const lines={economy:{id:'line-economy',label:'经济款',version:'线路资料V1'},quality:{id:'line-quality',label:'品质款',version:'线路资料V2'}};const chosen=lines[line]||lines.economy;
 const original={id:'shop-1',name:'巴黎香氛体验中心',day:'D2',location:'法国巴黎',goods:'香水、护肤品',duration:'约60分钟',displayName:'巴黎香氛体验中心'};
 const selfpay=[{id:'pay-1',name:'塞纳河游船晚餐',day:'D2',location:'法国巴黎',price:'EUR 85/人',duration:'约90分钟',displayName:'塞纳河游船晚餐体验'},{id:'pay-2',name:'卢塞恩雪山观景',day:'D3',location:'瑞士卢塞恩',price:'CHF 120/人',duration:'半日',displayName:'卢塞恩雪山观景项目'}];
 const normalize=(rows,l)=>rows.map(r=>({...r,lineId:l.id,version:l.version}));
 const shopping=kind==='product'?[original]:[original,{...original,id:'shop-2',name:'卢塞恩钟表店',displayName:'卢塞恩钟表店',day:'D3',location:'瑞士卢塞恩',goods:'钟表',duration:'最长45分钟'},{...original,id:'shop-3',name:'巴黎工艺品店',displayName:'巴黎工艺品店',day:'D2',goods:'工艺品',duration:'不超过1小时'}];
 if(kind!=='product')shopping[0]={...shopping[0],duration:'最长60分钟'};
 if(kind==='missing'){shopping[1].goods='';shopping[1].day='全程';shopping[1].duration='约60分钟';}
 ctx.scope=copy(chosen);ctx.scope.product='欧洲线路产品（样例）';ctx.dayDates=Object.fromEntries(ctx.values['confirmed.itineraryRows'].map(x=>[x.day,x.date]));
 ctx.collections={};const state=['empty','unavailable','conflict'].includes(kind)?kind:'present';
 const selectedRows=state==='present'?normalize(shopping,lines.economy).concat(normalize([{...original,id:'quality-shop-1',name:'品质线工艺坊',displayName:'品质线工艺坊',day:'D1',goods:'本地工艺品',duration:kind==='product'?'约90分钟':'最长90分钟'}],lines.quality)):[];
 ctx.collections['product.line.shopping']={state,rows:selectedRows};
 ctx.collections['product.line.selfpay']={state,rows:state==='present'?normalize(selfpay,lines.economy).concat(normalize([{...selfpay[0],id:'quality-pay-1',name:'品质线游船',displayName:'品质线游船体验'}],lines.quality)):[]};
 return ctx;
}
function sourceRows(m,ctx){if(m.source?.startsWith('product.line.')){
 const c=ctx.collections?.[m.source];if(!c||c.state==='unavailable'||!Array.isArray(c.rows))return {rows:[],error:'来源资料未取得'};
 if(!ctx.scope?.id||!ctx.scope.version)return {rows:[],error:'本单采用线路及版本未确定'};
 const rows=c.rows.filter(x=>x.lineId===ctx.scope.id&&x.version===ctx.scope.version);
 if(c.state==='empty')return rows.length?{rows,error:'无安排与来源记录冲突'}:{rows:[],empty:true};
 if(!rows.length)return {rows:[],error:'选定有安排，但本单采用线路／版本没有记录'};
 return {rows};
 }const rows=ctx.values?.[m.source];return Array.isArray(rows)&&rows.length?{rows:copy(rows)}:{rows:[],error:'没有取得本份合同的记录'};
}
function convert(d,c,mc,row,ctx){
 if(c.optional&&mc?.transform==='omit')return {value:'',omitted:true};
 if(!mc||!c.allowed.includes(mc.source)||!conversions(c,mc.source).includes(mc.transform))return {value:'',error:'取值或转换未正确对应'};
 let value=row[mc.source];if(mc.transform==='nameFallback'&&blank(value))value=row.name;
 if(blank(value))return {value:'',error:'来源值缺失'};
 if(mc.transform==='dayDate'){value=ctx.dayDates?.[value];if(!value)return {value:'',error:'所属行程无法对应本单日期'};return {value,warning:'仅取得日期；平台具体时间格式待核实'};}
 if(mc.transform==='maxMinutes'){const match=String(value).match(/^(?:最长|不超过)\s*(\d+(?:\.\d+)?)\s*(分钟|小时)$/);if(!match)return {value:'',error:'停留时间未明确最长时长，不能直接取数字'};value=Number(match[1])*(match[2]==='小时'?60:1);if(!Number.isInteger(value)||value<=0)return {value:'',error:'最长分钟数无效'};}
 if(['money','cents'].includes(mc.transform)){if(!Number.isFinite(Number(value)))return {value:'',error:'金额格式无效'};value=mc.transform==='cents'?Math.round(Number(value)*100):Number(value);}
 if(d.kind==='selfpay'&&mc.source==='price')return {value,error:'产品参考价格不能直接视为本次约定费用'};
 return {value};
}
function preview(t,m,ctx){const d=definitions(t).find(d=>d.id===m.id);if(!d)return {rows:[],sourceRows:[],errors:['表格不适用当前模板'],warnings:[]};
 const errors=[],warnings=[];if(!d.allowedSources.includes(m.source))return {rows:[],sourceRows:[],errors:['请先选择适用的ERP整组资料'],warnings:[]};
 const data=sourceRows(m,ctx);if(data.error)errors.push(data.error);if(data.empty)warnings.push('已确认无安排；平台是否省略或传空记录待接口核实');
 const rows=data.rows.map((row,i)=>{const cells=d.columns.map(c=>{const x=convert(d,c,m.columns.find(x=>x.id===c.id),row,ctx);if(x.error)errors.push('第'+(i+1)+'条：'+c.label+'—'+x.error);if(x.warning)warnings.push(x.warning);return {id:c.id,...x};});return {id:row.id,index:i+1,cells};});
 if(d.detailSource&&blank(ctx.values?.[d.detailSource]))errors.push('随表服务标准未取得');
 return {rows,sourceRows:data.rows,errors,warnings:[...new Set(warnings)],detail:d.detailSource?ctx.values?.[d.detailSource]:'',empty:!!data.empty};
}
function payload(t,ctx){const parameters=[],errors=[];for(const m of F.platform(t).tables||[]){const r=preview(t,m,ctx),d=definitions(t).find(x=>x.id===m.id);if(!d)continue;errors.push(...r.errors.map(x=>d.name+'：'+x));if(r.errors.length||r.empty)continue;
 parameters.push({parameter:m.parameter,value:r.rows.map(row=>Object.fromEntries(row.cells.filter(c=>!c.omitted).map(c=>[m.columns.find(x=>x.id===c.id).parameter,c.value])))});
 if(d.detailSource)parameters.push({parameter:m.detailParameter,value:r.detail});
 }return {parameters,errors};}
root.ContractPlatformTables={sources,definitions,defaults,configs,conversions,transforms,issues,sample,sampleCases,sourceRows,preview,payload};
if(typeof module!=='undefined')module.exports=root.ContractPlatformTables;
})(typeof window==='undefined'?globalThis:window);
