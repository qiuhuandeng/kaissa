/* 票务导入：日报保留成交核对；回票只补已有订单的出票凭据。 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./air-orders-model.js'));
  else root.AirImportFlow=factory(root.AirOrders);
})(typeof window==='object'?window:globalThis,function(M){
  'use strict';
  const copy=M.copy;
  const refillHeaders=['订单号','乘客姓名','证件号码','航班号','出行日期','出发机场','到达机场','票号','订座编号','航司订单号','出票日期','订座舱位代码'];
  const refillFields=['orderId','name','docNo','flight','date','from','to','ticket','pnr','airlineNo','issuedDate','bookingCode'];
  const key=r=>[r.type||'出票',M.ticketNo(r.ticket),r.date,r.flight].join('|');
  function candidates(r,data,loose=false){
    return data.orders.filter(o=>o.company===M.company&&o.state!=='已取消'&&(!r.scopeOrder||r.scopeOrder===o.id)&&(!r.orderId||r.orderId===o.id)).flatMap(o=>o.tickets.flatMap(t=>{
      const p=o.people.find(x=>x.id===t.personId),l=o.legs.find(x=>x.id===t.legId);if(!p||!l)return [];
      if(loose){if(r.name&&p.name!==r.name&&(!r.docNo||p.docNo!==r.docNo))return [];}
      else if(r.name!==p.name||r.docNo&&p.docNo!==r.docNo||r.flight!==l.flight||r.date!==l.date||r.from&&r.from!==l.from||r.to&&r.to!==l.to||r.pnr&&t.pnr&&r.pnr!==t.pnr)return [];
      return [{order:o.id,person:p.id,leg:l.id,customer:o.customer,group:o.group,name:p.name,docNo:p.docNo,flight:l.flight,date:l.date,from:l.from,to:l.to,ticket:t.ticket||'',pnr:t.pnr||o.bookingPnr||''}];
    }));
  }
  function inspectRefill(r,data){
    const list=candidates(r,data),issues=[];let target;
    if(r.match){try{const s=JSON.parse(r.match);target=list.find(x=>x.order===s.order&&x.person===s.person&&x.leg===s.leg);}catch(_){}if(!target)issues.push('所选订单、乘客和航段与本次回票不一致');}
    else if(list.length===1)target=list[0];else issues.push(list.length?'找到多笔候选，请选择本次订单和航段':'未找到对应名单航段，请核对回票资料或原订单');
    if(!/^\d{13}$/.test(M.ticketNo(r.ticket)))issues.push('请核对13位票号');
    if(!r.name||!r.flight||!r.date)issues.push('请补齐乘客、航班和出行日期');
    if(!r.issuedDate||!r.pnr||!r.airlineNo)issues.push('请补齐出票日期、订座编号和航司订单号');
    if(target){
      const o=data.orders.find(x=>x.id===target.order),t=o.tickets.find(x=>x.personId===target.person&&x.legId===target.leg);
      if(!['待确认','待出票','出票中','已出票'].includes(o.state))issues.push('订单尚未提交，请先核对原订单');
      if(t.state==='结果待查')issues.push('原出票结果待查，请先查证原回执');
      if(t.ticket&&t.ticket!==M.ticketNo(r.ticket))issues.push('已有不同票号，请核对原票退改记录');
      if(data.orders.some(x=>x.tickets.some(y=>y.ticket===M.ticketNo(r.ticket)&&(x.id!==o.id||y.personId!==target.person))))issues.push('本票号已用于其他乘客或订单');
      if(!issues.length&&t.state==='已出票'){
        if((r.pnr||'')!==(t.pnr||'')||(r.airlineNo||'')!==(t.airlineNo||'')||r.bookingCode&&t.bookingCode&&r.bookingCode!==t.bookingCode)issues.push('原票订座或航司订单号不同，请核对原出票记录');
        else return {state:'重复跳过',candidates:list,target,issues:[]};
      }
    }
    return {state:issues.length?'未应用':'可回填',candidates:list,target,issues};
  }
  function applyRefill(rows,data){
    const b={id:'HP'+Date.now()+Math.random().toString(36).slice(2,5),company:M.company,mode:'票号回填',name:'航司回票',time:new Date().toLocaleString('zh-CN'),who:'孙丽 · 票务经办',results:[]};
    for(const raw of rows){const r={...copy(raw),type:'出票',ticket:M.ticketNo(raw.ticket)};
      if(r.skip){b.results.push({row:r,state:'跳过'});continue;}
      const v=inspectRefill(r,data),result={row:r,state:v.state,error:v.issues.join('；'),order:v.target?.order};
      if(v.state==='可回填'){
        const o=data.orders.find(x=>x.id===v.target.order),t=o.tickets.find(x=>x.personId===v.target.person&&x.legId===v.target.leg),before=copy(t);
        Object.assign(t,{state:'已出票',ticket:r.ticket,pnr:r.pnr,airlineNo:r.airlineNo,issuedDate:r.issuedDate,bookingCode:r.bookingCode||t.bookingCode||'',reason:'航司回票导入',checkedAt:new Date().toISOString()});
        if(o.state!=='待确认')o.state=o.tickets.every(x=>x.state==='已出票')&&(!o.charterVersion||o.people.length>=Number(o.bookedSeats))?'已出票':'出票中';
        M.log(o,'回填票号 '+r.ticket+' · '+r.name+' · '+r.flight,'superadmin',{basis:'回票文件第'+r.sourceRow+'行',changes:M.changes(before,t,{state:'出票状态',ticket:'票号',pnr:'订座编号',airlineNo:'航司订单号',issuedDate:'出票日期'})});
        // Provenance only; no sale, procurement, funds or stock mutation.
        data.transactions.push({batch:b.id,lastBatch:b.id,mode:b.mode,company:o.company,currency:o.currency,account:o.account,source:o.source,key:key(r),fingerprint:M.fingerprint(r),row:r,order:o.id,versions:[],who:b.who});
        result.state='已应用';
      }
      b.results.push(result);
    }
    data.batches.unshift(b);return b;
  }
  function apply(rows,data,mode,meta={}){
    const existing=new Set(data.orders.map(o=>o.id));
    const range=mode==='日报'?dailyRange(meta,rows,data):null;
    const b=mode==='票号回填'?applyRefill(rows,data):M.applyImport(rows,data,'superadmin','日报');
    Object.assign(b,meta);if(range)b.dailyRange=range;
    b.results.forEach(r=>{r.action=mode==='票号回填'?'回填票号':r.row.type!=='出票'?'退改记录':r.state==='更正已记录'?'交易更正':r.order&&!existing.has(r.order)?'新增订单':'回填票号';});
    return b;
  }
  function preview(rows,data,mode){return apply(copy(rows),copy(data),mode).results;}
  function later(result,b,data){
    if(result.state!=='未应用')return null;
    return data.batches.slice(0,data.batches.indexOf(b)).find(x=>x.results.some(y=>!['未应用','跳过','重复跳过'].includes(y.state)&&y.row.sourceRow===result.row.sourceRow&&(x.retryOf===b.id||key(y.row)===key(result.row))));
  }
  function pending(result,b,data){
    if(b&&later(result,b,data))return false;
    if(result.state==='未应用')return true;
    if(result.state==='草稿待补'){const o=data.orders.find(x=>x.id===result.order);return !o||!o.customer||o.customer==='待补结算客户'||o.sale===''||o.sale==null;}
    return false;
  }
  function state(result,b,data,previewing=false){
    if(b&&later(result,b,data))return '后续已处理';
    if(result.state==='跳过')return '本次跳过';
    if(result.state==='重复跳过')return '重复跳过';
    if(result.state==='未应用')return '待处理';
    if(result.state==='草稿待补'&&pending(result,b,data))return previewing?'将建待补草稿':'草稿待补';
    if(result.state==='退改待办理')return previewing?'待关联退改':'退改待办理';
    if(result.state==='更正已记录')return previewing?'将记录更正':'更正已记录';
    return previewing?'可导入':'已导入';
  }
  function counts(results,b,data){
    const n={total:results.length,applied:0,pending:0,duplicate:0,skipped:0,created:0,refilled:0,afterSales:0};
    for(const r of results){if(r.state==='重复跳过')n.duplicate++;else if(r.state==='跳过')n.skipped++;else if(pending(r,b,data))n.pending++;else n.applied++;
      
      if(r.order&&(r.action==='回填票号'||b?.mode==='票号回填')&&r.state==='已应用')n.refilled++;
      if(r.state==='退改待办理')n.afterSales++;
    }n.created=new Set(results.filter(r=>r.order&&r.action==='新增订单'&&r.state!=='未应用').map(r=>r.order)).size;return n;
  }
  function dailyRange(meta,rows,data){
    const dates=[...new Set(rows.map(r=>r.issuedDate).filter(Boolean))].sort(),outside=rows.filter(r=>r.issuedDate&&r.issuedDate!==meta.dailyDate).length,missing=rows.filter(r=>!r.issuedDate).length;
    const prior=(data?.batches||[]).filter(b=>b.mode==='日报'&&b.dailyDate===meta.dailyDate&&b.account===meta.account&&b.currency===meta.currency);
    return {dates,outside,missing,prior:prior.map(b=>b.id),text:meta.dailyDate+' 00:00 至次日 00:00（不含）'+(outside?'；跨营业日 '+outside+' 行':'')+(missing?'；出票日期待补 '+missing+' 行':'')+(prior.length?'；已有 '+prior.length+' 批，请核对补导／重复记录':'')};
  }
  function calendar(meta,rows,calendarRows){
    const dates=[...new Set(rows.map(r=>[r.issuedDate||meta.dailyDate,r.currency||meta.currency||'CNY'].join('|')))];
    if(!dates.length&&meta.dailyDate)dates.push(meta.dailyDate+'|'+(meta.currency||'CNY'));
    const found=[];let missing=false;
    for(const item of dates){const [date,currency]=item.split('|');const matches=(calendarRows||[]).filter(c=>c.company===M.company&&c.account===meta.account&&c.currency===currency&&c.from<=date&&c.to>=date);if(matches.length!==1)missing=true;else if(!found.some(x=>x.id===matches[0].id))found.push(matches[0]);}
    return {found,missing:missing||!dates.length,text:!found.length?'账期待确认':found.map(c=>c.period+' · '+c.from+' 至 '+c.to+(c.demo?'（演示日历）':'')).join('；')+(missing?'；部分日期账期待确认':'')||'账期待确认'};
  }
  return {refillHeaders,refillFields,candidates,inspectRefill,apply,preview,later,pending,state,counts,calendar,dailyRange,key};
});
