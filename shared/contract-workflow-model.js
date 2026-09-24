(function(root){
  'use strict';
  const copy=v=>JSON.parse(JSON.stringify(v));
  const DAY='2026-09-24';
  const people=[{id:'T001',name:'张建国',signer:'张建国',relation:'本人',identity:'身份证尾号1201',phone:'138****8001',ready:true},{id:'T002',name:'李梅',signer:'王芳',relation:'监护人',identity:'身份证尾号2202',phone:'139****2200',ready:true},{id:'T003',name:'王磊',signer:'王磊',relation:'本人',identity:'护照尾号3203',phone:'136****3003',ready:true}];
  function order(id,extra={}){return Object.assign({id,customer:'张建国',business:'参团游',product:'法瑞意经典15日游',trip:'EU-FRA-20261012-001',start:'2026-10-12',end:'2026-10-26',amount:30000,company:'fj',companyName:'福建凯撒国际旅行社有限公司',store:'文灶门店',owner:'赵佳',status:'已确认',canServe:true,allow:true,people:copy(people),template:'团队出境旅游合同',templateVersion:'V1.0',templateReady:true,payment:'先签后收',paymentReady:true,review:true,rule:'福建参团游签约规则',basis:'已确认订单资料',allocations:{T001:10000,T002:10000,T003:10000}},extra);}
  function attachments(o,ids){const a=[{id:'trip',name:'行程单',file:'确认行程单_示例.html',ready:true,scope:'本合同游客'},{id:'fee',name:'费用明细',file:'费用明细_示例.html',ready:true,scope:'本合同游客'}];o.people.filter(p=>ids.includes(p.id)&&p.relation!=='本人').forEach(p=>a.push({id:'auth-'+p.id,name:p.relation==='监护人'?'监护人同意书':'签署授权书',file:p.signer+'_授权材料_示例.html',ready:true,scope:p.name}));return a;}
  function draft(o,id,extra={}){return Object.assign({id,orderId:o.id,doc:'主合同',version:'V1',mode:'多人合签',people:o.people.map(p=>p.id),amount:o.amount,company:o.company,template:o.template,templateVersion:o.templateVersion,status:'草稿',deadline:'2026-10-10',note:'',attachments:attachments(o,o.people.map(p=>p.id)),signers:o.people.map(p=>({id:p.id,auth:'待核验',status:'未签署',time:''})),seal:'未盖章',approval:'未提交',approvalReason:'',platform:'未提交',platformNo:'',regulatorNo:'',filing:'未提交',filingReason:'',fileReady:false,entry:'未取得',attempts:0,notifications:0,entryVersion:0,events:[],current:true,preview:'',created:'2026-09-24'},extra);}
  function event(c,title,note){c.events.push({time:new Date().toLocaleString('zh-CN',{hour12:false}),title,note});}
  function finish(c){c.status='已签署';c.signers.forEach(s=>{s.auth='核验通过';s.status='已签署';s.time='2026-09-23 14:00';});c.seal='已盖章';c.approval='通过';c.platform='已受理';c.platformNo='演示平台-'+c.id;c.regulatorNo='演示监管-'+c.id;c.entry='已结束';c.attempts=1;}
  function createState(){
    const orders=[order('ORD-CONTRACT-NEW-30000'),order('ORD-CONTRACT-30000'),order('KS20260704001',{customer:'张建国',product:'欧洲十国经典游·12天',trip:'EU20260715001',start:'2026-07-15',end:'2026-07-26',amount:25600,status:'预留',people:people.slice(0,2).map(p=>({...p,ready:false})),allocations:{},payment:'待确认',paymentReady:false}),order('ORD-JOINT-30000'),order('ORD-CHANGE-11000',{amount:11000,people:[copy(people[0])],allocations:{T001:11000}}),order('ORD-READY-30000'),order('ORD-UNKNOWN-30000'),order('ORD-RETURN-30000'),order('ORD-FILING-30000'),order('KSMICE20260713003',{customer:'北京某科技有限公司',business:'MICE',product:'某科技公司年会欧洲行',amount:1906000,template:'企业旅游服务合同',templateReady:false,people:[{id:'E001',name:'企业授权代表',signer:'陈红',relation:'企业代表',identity:'授权代表证件待核对',phone:'',ready:false}],allocations:{}}),order('MS-HISTORY-001',{store:'观音山门店（暂停新单）',historical:true,people:[copy(people[0])],allocations:{T001:30000}})];
    const contracts=[];const get=id=>orders.find(o=>o.id===id);
    contracts.push(draft(orders[0],'HT-DRAFT-001'));
    contracts.push(draft(get('KS20260704001'),'HT-MISSING-001'));
    people.forEach((p,i)=>{const c=draft(get('ORD-CONTRACT-30000'),'HT-P-20260919-00'+(i+1),{mode:'按人分签',people:[p.id],amount:10000,attachments:attachments(orders[1],[p.id]),signers:[{id:p.id,auth:'核验通过',status:'未签署',time:''}],approval:'通过',status:'签署中',platform:'已受理',platformNo:'演示平台-分签'+i,regulatorNo:'演示监管-分签'+i,entry:'已失效',attempts:1,entryVersion:1});if(i<2){finish(c);c.filing='已备案';c.fileReady=true;}c.events=[{time:'2026-09-23 14:00',title:'签署进度样例',note:i<2?'本游客及旅行社签署完成；已取得文件':'签署入口已失效；本游客未签署'}];contracts.push(c);});
    const joint=draft(get('ORD-JOINT-30000'),'HT-JOINT-001');finish(joint);joint.filing='已备案';joint.fileReady=true;contracts.push(joint);
    const base=draft(get('ORD-CHANGE-11000'),'HT-BASE-10000',{amount:10000});finish(base);base.filing='已备案';base.fileReady=true;contracts.push(base);
    const extra=draft(get('ORD-CHANGE-11000'),'HT-ADD-1000',{doc:'补充协议',amount:1000,parent:base.id,changeBasis:'SH-20260923-001：已确认服务增加1000元'});finish(extra);extra.filing='已备案';extra.fileReady=true;contracts.push(extra);
    const pending=draft(get('ORD-CHANGE-11000'),'HT-ADD-PENDING',{doc:'补充协议',amount:500,parent:base.id,status:'待审核',approval:'待审核',changeBasis:'SH-20260924-002：新增服务申请待审核'});contracts.push(pending);
    const old=draft(get('ORD-JOINT-30000'),'HT-JOINT-OLD',{version:'V0',current:false});finish(old);old.filing='已备案';old.fileReady=true;contracts.push(old);
    contracts.push(draft(get('ORD-READY-30000'),'HT-READY-001',{status:'待签署',approval:'通过',events:[{time:'2026-09-23 16:00',title:'内部审核通过',note:'合同管理员 王洁；准予本版本发起签署（样例）'}]}));
    contracts.push(draft(get('ORD-UNKNOWN-30000'),'HT-UNKNOWN-001',{status:'签署中',approval:'通过',platform:'结果待核对',attempts:1,events:[{time:'2026-09-23 16:05',title:'发起结果待核对',note:'提交超时，先核对原申请，不另建合同（样例）'}]}));
    contracts.push(draft(get('ORD-RETURN-30000'),'HT-RETURN-001',{status:'审核退回',approval:'退回',approvalReason:'请在签约备注补充集合时间和地点。',events:[{time:'2026-09-23 15:00',title:'审核退回',note:'王洁：请补集合安排（样例）'}]}));
    const filed=draft(get('ORD-FILING-30000'),'HT-FILING-001');finish(filed);filed.filing='备案失败';filed.filingReason='行程附件未通过校验（演示）';filed.events=[{time:'2026-09-23 17:00',title:'签署完成',note:'游客及我方签章完成（样例）'},{time:'2026-09-23 17:05',title:'备案失败',note:filed.filingReason}];contracts.push(filed);
    contracts.push(draft(get('MS-HISTORY-001'),'HT-MS-HISTORY-001',{status:'待签署',approval:'通过'}));
    contracts.push(draft(get('KSMICE20260713003'),'HT-MICE-001',{mode:'企业代表签署',channel:'线下归档',archive:{file:'',ourSeal:false,clientSeal:false,authorization:false,reason:''}}));
    const enterprise=order('KSMICE-ELECTRONIC-001',{customer:'企业签约支持示例客户',business:'MICE',product:'企业旅游项目（模板已支持示例）',template:'企业旅游服务合同',people:[{id:'E001',name:'企业授权代表',signer:'陈红',relation:'企业代表',identity:'授权代表证件尾号1001',phone:'138****1001',ready:true}]});orders.push(enterprise);contracts.push(draft(enterprise,'HT-ENTERPRISE-ELECTRONIC',{mode:'企业代表签署'}));
    const sources=[];
    [['ORD-REVISION-33000',33000,3000],['ORD-REDUCE-27000',27000,-3000],['ORD-JOINT-30000',30000,0]].forEach(([id,amount,delta])=>{
      let o=get(id);if(!o){o=order(id,{amount});orders.push(o);const c=draft(o,'HT-'+id,{amount:30000});finish(c);c.fileReady=true;c.filing='已备案';contracts.push(c);}
      sources.push({id:'SH-'+id,orderId:id,status:'已确认',beforeAmount:30000,afterAmount:amount,delta,before:'原行程及服务标准',after:delta>0?'增加酒店服务':delta<0?'取消一项自选服务':'集合地点调整为厦门机场T3',people:o.people.map(p=>p.id),start:o.start,end:o.end,confirmedBy:'销售主管 王洁',file:'客户变更确认_样例.html'});
      sources.push({id:'SH-PENDING-'+id,orderId:id,status:'待确认',beforeAmount:amount,afterAmount:amount+500,delta:500,before:'当前服务',after:'待确认新增服务',people:o.people.map(p=>p.id),start:o.start,end:o.end,file:''});
    });
    return {orders,contracts,sources,serial:20,day:DAY};
  }
  const amountCents=v=>Number.isFinite(Number(v))?Math.round(Number(v)*100):NaN;
  function fingerprint(c){return JSON.stringify([c.orderId,c.company,c.template,c.templateVersion,c.version,c.mode,c.people,c.amount,c.deadline,c.note,c.attachments]);}
  function issues(s,o,c,phase='submit'){
    const a=[];if(!o||o.status!=='已确认')a.push('订单尚未确认，请回订单核对');if(!o?.canServe)a.push('本单办理权限未获准');if(!o?.allow)a.push('门店未获准发起合同');
    if(c.company!==o?.company||c.company!=='fj')a.push('签约公司或用章未获准');if(!o?.templateReady)a.push('本业务有效模板待配置');if(c.template!==o?.template)a.push('模板不适用本订单');if(!o?.paymentReady)a.push('签约付款条件尚未满足或待确认');
    if(!c.people.length||new Set(c.people).size!==c.people.length)a.push('请选择不重复的合同覆盖游客');
    if(c.people.some(id=>!o.people.some(p=>p.id===id&&p.ready&&p.signer&&p.phone)))a.push('游客证件、签署人或联系资料待补');
    if(c.changeSource){const src=s.sources.find(x=>x.id===c.changeSource);if(!src||src.status!=='已确认')a.push('变更依据尚未确认');else if(amountCents(c.amount)!==amountCents(c.replaces?src.afterAmount:src.delta))a.push('变更金额与确认依据不符');}
    else if(!Number.isFinite(Number(c.amount))||amountCents(c.amount)<=0||amountCents(c.amount)>amountCents(o?.amount))a.push('本份金额必须大于0且不超过订单金额');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(c.deadline)||!Number.isFinite(Date.parse(c.deadline))||new Date(c.deadline).toISOString().slice(0,10)!==c.deadline||c.deadline<s.day)a.push('签署截止日期无效或已过期');
    const required=['trip','fee',...o.people.filter(p=>c.people.includes(p.id)&&p.relation!=='本人').map(p=>'auth-'+p.id)];if(required.some(id=>!c.attachments.some(f=>f.id===id)))a.push('必要行程、费用或代签授权附件缺失');
    c.attachments.filter(f=>!f.ready||!f.file).forEach(f=>a.push(f.name+'（'+f.scope+'）待补'));
    if(c.doc==='主合同'){
      const siblings=s.contracts.filter(x=>x.id!==c.id&&x.id!==c.replaces&&x.orderId===o.id&&x.doc==='主合同'&&x.current&&!['已撤销','已解除'].includes(x.status));
      if(siblings.some(x=>x.people.some(id=>c.people.includes(id))))a.push('所选游客已有合同，请处理原合同，不能重复覆盖');
      if(amountCents(c.amount)+siblings.reduce((n,x)=>n+amountCents(x.amount),0)>amountCents(o.amount))a.push('同订单合同分配金额超出订单金额');
    }
    if(phase==='send'&&o?.review&&c.approval!=='通过')a.push('本版本内部审核尚未通过');
    return [...new Set(a)];
  }
  function coverage(o,all){
    if(!o)return null;const current=all.filter(c=>c.orderId===o.id&&c.current&&!['已撤销','已解除'].includes(c.status));const bases=current.filter(c=>c.doc==='主合同');const ids=new Set(bases.flatMap(c=>c.people));const signers=bases.filter(c=>c.channel!=='线下归档').flatMap(c=>c.signers);const allocated=bases.reduce((n,c)=>n+amountCents(c.amount),0)/100;
    const signed=current.filter(c=>['已签署','已归档'].includes(c.status));const agreed=signed.reduce((n,c)=>n+amountCents(c.amount),0)/100;
    const pendingChange=all.some(c=>c.orderId===o.id&&c.replaces&&!['已签署','已归档','已撤销'].includes(c.status));
    const duplicates=bases.flatMap(c=>c.people).length!==ids.size;const complete=!pendingChange&&o.people.length>0&&ids.size===o.people.length&&o.people.every(p=>ids.has(p.id))&&!duplicates&&bases.length>0&&bases.every(c=>c.channel==='线下归档'?c.status==='已归档'&&c.archive?.ourSeal&&c.archive?.clientSeal&&c.archive?.authorization&&c.fileReady:c.status==='已签署'&&c.seal==='已盖章'&&c.signers.every(p=>p.status==='已签署'))&&amountCents(agreed)===amountCents(o.amount)&&!current.some(c=>c.doc!=='主合同'&&!['已签署','已归档'].includes(c.status));
    return {count:bases.length,covered:ids.size,total:o.people.length,allocated,agreed,remaining:Math.max(0,o.amount-allocated),signed:signers.filter(x=>x.status==='已签署').length,required:signers.length,seals:bases.filter(c=>c.seal==='已盖章').length,complete,duplicates};
  }
  function send(s,c,outcome){const o=s.orders.find(o=>o.id===c.orderId);const errs=issues(s,o,c,'send');if(c.status!=='待签署'||!['未提交','未受理'].includes(c.platform))errs.push('本合同已提交或结果待核对，不能重复发起');if(errs.length)return errs;c.attempts++;c.status='签署中';if(outcome==='超时'){c.platform='结果待核对';event(c,'发起结果待核对','提交超时，需核对原申请');}else if(outcome==='失败'){c.platform='未受理';c.status='待签署';event(c,'发起失败','授权校验未通过，原申请未受理（演示）');}else{c.platform=outcome==='平台审核'?'平台待审核':'已受理';c.platformNo='演示平台-'+c.id;if(c.platform==='已受理'){c.regulatorNo='演示监管-'+c.id;c.entry='可用';c.entryVersion++;c.notifications++;}event(c,'平台受理结果',c.platform+'（演示）');}return [];}
  function receive(c,outcome){if(c.status!=='签署中')return ['当前不在签署阶段'];if(c.platform==='结果待核对'){if(outcome==='仍待核对'){event(c,'核对原申请','结果仍待核对');return [];}if(outcome==='未受理'){c.platform='未受理';c.status='待签署';event(c,'核对原申请','确认未受理，可修正后重新发起');return [];}if(outcome!=='已受理')return ['请先核对原申请是否受理'];c.platform='已受理';c.platformNo='演示平台-'+c.id;c.regulatorNo='演示监管-'+c.id;c.entry='可用';c.entryVersion++;event(c,'核对原申请','原申请已受理，沿用原合同');return [];}
    if(c.platform==='平台待审核'){if(outcome==='平台退回'){c.platform='未受理';c.status='待签署';event(c,'平台审核退回','附件格式不符（演示）');return [];}if(outcome!=='平台通过')return ['平台审核尚未通过'];c.platform='已受理';c.regulatorNo='演示监管-'+c.id;c.entry='可用';c.entryVersion++;event(c,'平台审核通过','取得签署入口（演示）');return [];}
    if(c.platform!=='已受理')return ['平台尚未受理'];
    if(outcome==='身份失败'){const p=c.signers.find(p=>p.status!=='已签署');if(p)p.auth='核验失败';}
    else if(outcome==='部分完成'){const p=c.signers.find(p=>p.status!=='已签署');if(p){p.auth='核验通过';p.status='已签署';p.time='2026-09-24 15:00';}}
    else if(['游客完成','全部完成'].includes(outcome)){c.signers.forEach(p=>{p.auth='核验通过';p.status='已签署';p.time=p.time||'2026-09-24 15:00';});if(outcome==='全部完成')c.seal='已盖章';}
    else if(outcome==='入口失效')c.entry='已失效';
    else if(outcome!=='无变化')return ['未知结果'];
    if(c.signers.every(p=>p.status==='已签署')&&c.seal==='已盖章'){c.status='已签署';c.filing='待备案';c.entry='已结束';}
    event(c,'签署结果核对',outcome+'（演示）');return [];
  }
  function renew(c){if(c.status!=='签署中'||c.platform!=='已受理'||c.entry!=='已失效')return ['当前无需更新签署入口'];c.entry='可用';c.entryVersion++;event(c,'更新签署入口','沿用原平台合同号，保留既有签名');return [];}
  function filing(c,outcome){if(c.status!=='已签署')return ['各方签署尚未完成'];c.filing=outcome;c.filingReason=outcome==='备案失败'?'行程附件校验未通过（演示）':'';event(c,'备案结果核对',outcome+'（演示）');return [];}
  function createChange(s,base,sourceId,kind,reason){
    const errors=[],o=s.orders.find(o=>o.id===base.orderId),src=s.sources.find(x=>x.id===sourceId&&x.orderId===base.orderId);
    const offline=kind==='替换归档版本';
    if(!base.current||!['已签署','已归档'].includes(base.status))errors.push('仅当前已签署或已归档版本可申请变更');
    if(!['补充协议','新版本','替换归档版本'].includes(kind))errors.push('请选择变更方式');
    if(offline&&base.channel!=='线下归档')errors.push('当前不是线下归档合同');
    if(!offline&&(!src||src.status!=='已确认'))errors.push('请选择已确认的订单或售后变更依据');
    if(!reason?.trim())errors.push('请填写变更原因');
    if(base.ending&&!['已退回','已撤回'].includes(base.ending.status))errors.push('撤销或解除正在办理，不能同时变更');
    if(s.contracts.some(c=>c.parent===base.id&&!['已签署','已归档','已撤销'].includes(c.status)))errors.push('已有变更待办，请继续办理或撤销原申请');
    if(src&&s.contracts.some(c=>c.changeSource===src.id&&c.status!=='已撤销'))errors.push('该变更依据已生成合同，不可重复生成');
    if(errors.length)return {errors};
    const c=draft(o,'HT-CHANGE-'+String(++s.serial).padStart(3,'0'),{parent:base.id,version:'V'+(Number(base.version.replace('V',''))+1),doc:kind==='补充协议'?'补充协议':'主合同',amount:offline?base.amount:kind==='补充协议'?src.delta:src.afterAmount,current:kind==='补充协议',replaces:kind==='补充协议'?'':base.id,changeSource:offline?'':src.id,changeBasis:offline?'原归档文件替换：'+reason:src.id+' / '+src.after,changeReason:reason,change:offline?null:copy(src)});
    if(offline){c.channel='线下归档';c.mode='企业代表签署';c.archive={file:'',ourSeal:false,clientSeal:false,authorization:false,reason};}
    event(c,'建立变更草稿','原合同 '+base.id+' 继续保留；本版本重新审核及签署／归档');s.contracts.unshift(c);return {errors:[],contract:c};
  }
  function review(c,result,reason=''){
    if(c.status!=='待审核')return ['只有待审核申请可以处理'];
    if(!['通过','退回'].includes(result))return ['请选择审批结果'];
    if(result==='退回'&&!reason.trim())return ['退回原因必填'];
    c.approval=result;c.approvalReason=reason;c.status=result==='退回'?'审核退回':c.channel==='线下归档'?'待归档':'待签署';event(c,'内部审核',result+' / '+(reason||'本次版本审核通过'));return [];
  }
  function activate(s,c){
    if(!['已签署','已归档'].includes(c.status))return;
    if(c.replaces){const old=s.contracts.find(x=>x.id===c.replaces);if(!old?.current)return;old.current=false;event(old,'新版本生效',c.id+' '+c.version+' 已完成；本文件保留查询和下载');s.contracts.filter(x=>x.parent===old.id&&x.id!==c.id&&x.status==='已签署').forEach(x=>x.current=false);c.current=true;event(c,'版本生效','替代 '+old.id+'；已有签名不复用');}
  }
  function archiveComplete(s,c){if(c.status!=='待归档'||c.approval!=='通过')return ['归档审核尚未通过'];if(!c.archive?.file||!c.archive.ourSeal||!c.archive.clientSeal||!c.archive.authorization)return ['文件、双方盖章或授权资料缺失'];c.status='已归档';c.fileReady=true;c.seal='已盖章';event(c,'完成线下归档',c.archive.file);activate(s,c);return [];}
  function requestEnding(s,c,kind,reason){
    const errors=[];if(!c.current)errors.push('历史版本不能再次办理');
    if(!reason?.trim())errors.push('申请原因必填');
    if(c.ending&&!['已退回','已撤回'].includes(c.ending.status))errors.push('已有撤销或解除申请，请继续原申请');
    if(s.contracts.some(x=>x.parent===c.id&&!['已签署','已归档','已撤销'].includes(x.status)))errors.push('请先处理尚未完成的变更申请');
    if(kind==='撤销'){if(c.status!=='签署中'||c.platform!=='已受理'||c.signers.some(x=>x.status==='已签署'))errors.push('仅平台已受理且各方未签的合同可以申请撤销');}
    else if(kind==='解除'){if(!['已签署','已归档','签署中'].includes(c.status)||c.status==='签署中'&&!c.signers.some(x=>x.status==='已签署'))errors.push('已签署或部分签署合同方可申请解除');}
    else errors.push('申请类型无效');
    if(errors.length)return errors;c.endingHistory=c.endingHistory||[];if(c.ending)c.endingHistory.push(copy(c.ending));c.ending={kind,reason,status:'待审核',approval:'待审核',result:'未办理',agreement:'未签署',file:'',events:[]};event(c,'申请'+kind,reason+'；原合同状态保留');return [];
  }
  function reviewEnding(c,result,reason=''){
    const r=c.ending;if(!r||r.status!=='待审核')return ['申请不在待审核阶段'];if(!['通过','退回'].includes(result))return ['审批结果无效'];if(result==='退回'&&!reason.trim())return ['退回原因必填'];r.approval=result;r.opinion=reason;r.status=result==='通过'?'待办理':'已退回';event(c,r.kind+'内部审核',result+' / '+reason+'；未改变原合同签署状态');return [];
  }
  function finishEnding(s,c,result){
    const r=c.ending;if(!r||r.approval!=='通过'||!['待办理','结果待核对','办理失败','待协议签署'].includes(r.status))return ['内部审核尚未通过或本申请已完成'];
    const allowed=r.kind==='撤销'?['结果待核对','办理失败','平台撤销完成']:['结果待核对','办理失败','解除协议待签署',c.channel==='线下归档'?'双方解除文件已归档':'各方已签署且平台解除完成'];if(!allowed.includes(result))return ['办理结果与申请类型不符'];
    r.result=result;if(['平台撤销完成','各方已签署且平台解除完成','双方解除文件已归档'].includes(result)){r.status='已完成';r.file=r.kind+'确认_原型样例.html';r.agreement=r.kind==='解除'?'各方已签署':'不适用';c.status=r.kind==='解除'?'已解除':'已撤销';c.entry='已结束';s.contracts.filter(x=>x.parent===c.id&&x.current&&x.status==='已签署').forEach(x=>{x.current=false;event(x,'主合同已解除','文件保留，后续退款按售后单另行办理');});}else r.status=result==='解除协议待签署'?'待协议签署':result;
    event(c,r.kind+'办理结果',result+'（样例）；收款及退款未改变');return [];
  }
  // Explicit, repeatable approval-page examples. No persisted cross-page state.
  function approvalExample(s,no){
    const find=id=>s.contracts.find(c=>c.id===id);let c;
    if(no==='APR-CONTRACT-001'){c=find('HT-DRAFT-001');c.status='待审核';c.approval='待审核';}
    else if(no==='APR-CONTRACT-002'){c=createChange(s,find('HT-ORD-REVISION-33000'),'SH-ORD-REVISION-33000','新版本','客户确认增加酒店服务').contract;if(c){c.status='待审核';c.approval='待审核';}}
    else if(no==='APR-CONTRACT-003'){c=find('HT-P-20260919-003');requestEnding(s,c,'撤销','客户手机号修正，原申请未签');}
    else if(no==='APR-CONTRACT-004'){c=find('HT-JOINT-001');requestEnding(s,c,'解除','客户确认取消出行，费用另按售后单核对');}
    else if(no==='APR-CONTRACT-005'){c=find('HT-MICE-001');c.status='待审核';c.approval='待审核';c.archive={file:'企业合同_双方盖章_样例.html',ourSeal:true,clientSeal:true,authorization:true,reason:'首次线下归档'};}
    return c||null;
  }
  const api={copy,DAY,people,order,draft,attachments,createState,issues,fingerprint,coverage,send,receive,renew,filing,event,amountCents,createChange,review,activate,archiveComplete,requestEnding,reviewEnding,finishEnding,approvalExample};
  if(typeof module!=='undefined')module.exports=api;root.ContractWorkflow=api;
})(typeof window!=='undefined'?window:globalThis);
