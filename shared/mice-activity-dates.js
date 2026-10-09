/* 会奖项目团日期选择：纯日期运算，不读取系统时区或伪造节假日日历。 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MiceActivityDates=factory();})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const valid=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
 function add(date,n){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
 function month(date,n=0){const d=new Date(date.slice(0,7)+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,10);}
 function calculate(s,period={}){
  const days=Number(s.days);if(!Number.isInteger(days)||days<1||days>366)return {dates:[],base:[],error:'每团天数须为1至366的整数'};
  if(!valid(s.start)||!valid(s.end)||s.start>s.end)return {dates:[],base:[],error:'请填写有效的开始、结束日期'};
  let base=[];
  if(s.kind==='manual')base=[...new Set(s.manual||[])].filter(d=>d>=s.start&&d<=s.end).sort();
  else{
   if(!valid(s.start)||!valid(s.end)||s.start>s.end)return {dates:[],base:[],error:'请填写有效的开始、结束日期'};
   if((Date.parse(s.end)-Date.parse(s.start))/86400000>1095)return {dates:[],base:[],error:'日期范围不能超过3年，请分批安排'};
   if(['weekly','biweekly'].includes(s.cycle)&&!s.weekdays.length)return {dates:[],base:[],error:'请选择发团星期'};
   if(s.cycle==='monthly'&&(!Number.isInteger(+s.monthDay)||+s.monthDay<1||+s.monthDay>31))return {dates:[],base:[],error:'每月日期须为1至31日'};
   for(let date=s.start,index=0;date<=s.end;date=add(date,1),index++){
    const d=new Date(date+'T00:00:00Z');
    if(s.cycle==='monthly'&&d.getUTCDate()!==+s.monthDay)continue;
    if(['weekly','biweekly'].includes(s.cycle)&&!s.weekdays.includes(d.getUTCDay()))continue;
    if(s.cycle==='biweekly'&&Math.floor(index/7)%2!==0)continue;
    base.push(date);
   }
  }
  if(base.some(d=>!valid(d)))return {dates:[],base:[],error:'所选日期无效'};
  const excluded=new Set(s.excluded||[]),dates=base.filter(d=>s.kind==='manual'||!excluded.has(d));
  if(dates.length>200)return {dates,base,error:'单次最多200个项目团，请排除部分日期或缩小范围'};
  if(dates.some(d=>period.start&&d<period.start||period.end&&add(d,days-1)>period.end))return {dates,base,error:'项目团开始或结束日期超出项目／本人分工期间，请调整日期或每团天数'};
  return {dates,base,error:dates.length?'':'尚未选择项目团日期'};
 }
 return {valid,add,month,calculate};
});
