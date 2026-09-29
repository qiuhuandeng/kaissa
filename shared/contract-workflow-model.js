(function(root){
  'use strict';
  const copy=v=>JSON.parse(JSON.stringify(v));
  const K=root.ContractChannel||(typeof require!=='undefined'?require('./contract-channel'):null);
  const DAY='2026-09-24';
  const people=[{id:'T001',name:'张建国',signer:'张建国',relation:'本人',identity:'身份证尾号1201',phone:'138****8001',ready:true},{id:'T002',name:'李梅',signer:'王芳',relation:'监护人',identity:'身份证尾号2202',phone:'139****2200',ready:true},{id:'T003',name:'王磊',signer:'王磊',relation:'本人',identity:'护照尾号3203',phone:'136****3003',ready:true}];
  function order(id,extra={}){return Object.assign({id,customer:'张建国',business:'参团游',product:'法瑞意经典15日游',trip:'EU-FRA-20261012-001',start:'2026-10-12',end:'2026-10-26',amount:30000,company:'fj',companyName:'福建凯撒国际旅行社有限公司',store:'文灶门店',owner:'赵佳',status:'已确认',canServe:true,allow:true,people:copy(people),template:'团队出境旅游合同',templateVersion:'V1.0',templateReady:true,payment:'先签后收',paymentReady:true,review:true,rule:'福建参团游签约规则',basis:'已确认订单资料',provider:'12301',generation:'platform',allocations:{T001:10000,T002:10000,T003:10000}},extra);}
  function attachments(o,ids){const a=[{id:'trip',name:'行程单',file:'确认行程单_示例.html',ready:true,scope:'本合同游客'},{id:'fee',name:'费用明细',file:'费用明细_示例.html',ready:true,scope:'本合同游客'}];o.people.filter(p=>ids.includes(p.id)&&p.relation!=='本人').forEach(p=>a.push({id:'auth-'+p.id,name:p.relation==='监护人'?'监护人同意书':'签署授权书',file:p.signer+'_授权材料_示例.html',ready:true,scope:p.name}));return a;}
  function draft(o,id,extra={}){return Object.assign({id,orderId:o.id,platformBinding:{provider:o.provider||'',generation:o.generation||'platform',version:o.templateVersion},regulatory:{result:'需要报送',channel:'12301',path:'接口报送（演示）',evidence:'既有12301合同办理样例'},doc:'主合同',version:'V1',mode:'多人合签',people:o.people.map(p=>p.id),amount:o.amount,company:o.company,template:o.template,templateVersion:o.templateVersion,status:'草稿',deadline:'2026-10-10',note:'',attachments:attachments(o,o.people.map(p=>p.id)),signers:o.people.map(p=>({id:p.id,auth:'待核验',status:'未签署',time:''})),seal:'未盖章',approval:'未提交',approvalReason:'',platform:'未提交',platformNo:'',regulatorNo:'',filing:'未提交',filingReason:'',fileReady:false,entry:'未取得',attempts:0,notifications:0,entryVersion:0,events:[],current:true,preview:'',created:'2026-09-24'},extra);}
  function event(c,title,note){c.events.push({time:new Date().toLocaleString('zh-CN',{hour12:false}),title,note});}
  function finish(c){c.status='已签署';c.signers.forEach(s=>{s.auth='核验通过';s.status='已签署';s.time='2026-09-23 14:00';});c.seal='已盖章';c.approval='通过';c.platform='已受理';c.platformNo=K.number(c);c.regulatorNo='演示监管-'+c.id;c.entry='已结束';c.attempts=1;}
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
    const enterprise=order('KSMICE-ELECTRONIC-001',{customer:'企业签约支持示例客户',business:'MICE',product:'企业旅游项目（模板待启用）',profile:'mice',range:'境内',templateId:'T-MICE-2026',productContractMode:'specified',template:'企业旅游服务合同',people:[{id:'E001',name:'企业授权代表',signer:'陈红',relation:'企业代表',identity:'授权代表证件尾号1001',phone:'138****1001',ready:true}]});orders.push(enterprise);contracts.push(draft(enterprise,'HT-ENTERPRISE-ELECTRONIC',{mode:'企业代表签署'}));
    const sources=[];
    [['ORD-REVISION-33000',33000,3000],['ORD-REDUCE-27000',27000,-3000],['ORD-JOINT-30000',30000,0]].forEach(([id,amount,delta])=>{
      let o=get(id);if(!o){o=order(id,{amount});orders.push(o);const c=draft(o,'HT-'+id,{amount:30000});finish(c);c.fileReady=true;c.filing='已备案';contracts.push(c);}
      sources.push({id:'SH-'+id,orderId:id,status:'已确认',beforeAmount:30000,afterAmount:amount,delta,before:'原行程及服务标准',after:delta>0?'增加酒店服务':delta<0?'取消一项自选服务':'集合地点调整为厦门机场T3',people:o.people.map(p=>p.id),start:o.start,end:o.end,confirmedBy:'销售主管 王洁',file:'客户变更确认_样例.html'});
      sources.push({id:'SH-PENDING-'+id,orderId:id,status:'待确认',beforeAmount:amount,afterAmount:amount+500,delta:500,before:'当前服务',after:'待确认新增服务',people:o.people.map(p=>p.id),start:o.start,end:o.end,file:''});
    });
    const state={orders,contracts,sources,serial:20,day:DAY};seedLifecycle(state);return state;
  }
  const amountCents=v=>Number.isFinite(Number(v))?Math.round(Number(v)*100):NaN;
  function fingerprint(c){return JSON.stringify([c.orderId,c.company,c.template,c.templateVersion,c.version,c.mode,c.people,c.amount,c.deadline,c.note,c.attachments,c.signingPeople,c.preparedDocument,c.preparation?.templateSnapshot,c.selectionRule,c.confirmedTerms,c.terms,c.termChanges,c.parties,c.platformBinding,c.signingConfig]);}
  function signingPeople(c,o){if(c.parties)return c.parties.map(p=>({...p,signer:p.name,signerIdentity:p.identity,ready:true}));if(c.preparation)return c.preparation.signers.filter(x=>x.required).map(x=>({id:x.key,name:x.name,signer:x.name,signerIdentity:x.identity,identity:x.identity,phone:x.phone,relation:x.relation,ready:true}));return o.people.map(p=>({...p,signerIdentity:p.relation==='本人'?p.identity:(p.ready?'签署人证件已核对（样例）':''),...(c.signingPeople||[]).find(x=>x.id===p.id)}));}
  function setSigningPeople(c,o,values){
    if(!['草稿','审核退回'].includes(c.status)||!['未提交','未受理'].includes(c.platform)||c.signers.some(x=>x.status==='已签署'))return ['已提交或签署的合同不能直接修改签署人'];
    const before=signingPeople(c,o),next=[];
    for(const v of values){const person=o.people.find(p=>p.id===v.id);if(!person||!c.people.includes(v.id))return ['签署人不属于本份合同'];
      const relations=o.business==='MICE'?['企业代表']:['本人','监护人','代理人'];if(!relations.includes(v.relation))return ['签署关系不适用本合同'];
      const n={id:v.id,relation:v.relation,signer:v.relation==='本人'?person.name:String(v.signer||'').trim(),signerIdentity:v.relation==='本人'?person.identity:String(v.signerIdentity||'').trim(),phone:String(v.phone||'').trim()};next.push(n);
    }
    for(const n of next){const old=before.find(x=>x.id===n.id),key='auth-'+n.id,person=o.people.find(p=>p.id===n.id);const changed=['relation','signer','signerIdentity'].some(k=>old[k]!==n[k]);
      if(n.relation==='本人')c.attachments=c.attachments.filter(f=>f.id!==key);
      else if(changed||!c.attachments.some(f=>f.id===key)){c.attachments=c.attachments.filter(f=>f.id!==key);c.attachments.push({id:key,name:n.relation==='监护人'?'监护人同意书':n.relation==='企业代表'?'企业授权书':'签署授权书',file:'',ready:false,scope:person.name});}
    }
    c.signingPeople=next;return [];
  }
  function canReopen(c){return c.status==='待签署'&&c.platform==='未受理'&&!c.signers.some(x=>x.status==='已签署')&&c.seal!=='已盖章'&&!c.ending;}
  function reopen(c){
    if(!canReopen(c))return ['只有已明确未受理且无签署的合同可以修改重提；未知结果请先核对'];
    c.submissionHistory=c.submissionHistory||[];c.submissionHistory.push({version:c.version,approval:c.approval,platform:c.platform,platformNo:c.platformNo,reason:c.platformReason||'明确未受理',content:fingerprint(c),provider:K.binding(c).provider,requestId:c.requestId,document:c.submittedDocument});
    delete c.reviewedPackage;delete c.submittedBinding;delete c.submittedSigning;delete c.submittedDocument;delete c.submittedHTML;c.status='草稿';c.approval='未提交';c.approvalReason='';c.platform='未提交';c.platformNo='';c.regulatorNo='';c.entry='未取得';c.preview='';c.needsCorrection=false;
    event(c,'修改重提',c.platformReason||'原申请已明确未受理；本次修改须重新预览并按规则审核');return [];
  }
  function replacementParts(s,o){
    const all=s.contracts.filter(c=>c.orderId===o.id),live=all.filter(c=>c.current&&!['已撤销','已解除'].includes(c.status)),bases=live.filter(c=>c.doc==='主合同'),covered=new Set(bases.flatMap(c=>c.people)),missing=o.people.filter(p=>!covered.has(p.id));
    const errors=[];if(o.status!=='已确认'||!o.canServe||!o.allow)errors.push('订单确认或办理权限尚未满足');
    if(!missing.length)errors.push('本订单已有合同，请继续原合同办理，无需重复生成');
    if(live.some(c=>c.doc!=='主合同'||c.replaces||c.ending&&!['已退回','已撤回'].includes(c.ending.status))||all.some(c=>c.replaces&&!['已签署','已归档','已撤销'].includes(c.status)))errors.push('请先处理合同变更或撤销／解除申请');
    const previous=missing.map(p=>all.find(c=>c.doc==='主合同'&&c.mode==='按人分签'&&c.status==='已撤销'&&c.people.length===1&&c.people[0]===p.id));
    if(previous.some(c=>!c)||bases.some(c=>c.mode!=='按人分签'))errors.push('仅支持为已撤销分签合同的原游客补签，人员或订单变更请先核对依据');
    const amounts=missing.map(p=>amountCents(o.allocations?.[p.id]));
    if(amounts.some(n=>!Number.isFinite(n)||n<=0)||amounts.reduce((n,v)=>n+v,0)+bases.reduce((n,c)=>n+amountCents(c.amount),0)!==amountCents(o.amount)||previous.some((c,i)=>c&&amountCents(c.amount)!==amounts[i]))errors.push('补签金额与订单确认分配不一致，请先核对订单及售后依据');
    if(errors.length)return {errors:[...new Set(errors)],contracts:[]};
    const contracts=missing.map((p,i)=>{const old=previous[i],c=draft(o,'HT-RESIGN-'+String(++s.serial).padStart(3,'0'),{mode:'按人分签',people:[p.id],amount:amounts[i]/100,signers:[{id:p.id,auth:'待核验',status:'未签署',time:''}],attachments:attachments(o,[p.id]),resignOf:old.id});old.current=false;event(c,'准备缺口补签','原合同 '+old.id+' 已撤销；仅覆盖 '+p.name+'，其余合同和签名保持');return c;});s.contracts.unshift(...contracts);return {errors:[],contracts};
  }
  function issues(s,o,c,phase='submit'){
    const a=phase==='send'?K.issues(c):[];if(c.preparation&&!c.parent&&root.ContractPrepare){const p=root.ContractPrepare;if(c.company!==o.company)a.push('实际签约公司与本订单不一致');a.push(...p.issues(o,c.preparation.sourceSnapshot||p.source(o),c.preparation,s.contracts).map(x=>x.text));if(phase==='send'&&(c.selectionRule?c.selectionRule.review==='需要审核':o.review)&&c.approval!=='通过')a.push('本版本内部审核尚未通过');return [...new Set(a)];}if(!o||o.status!=='已确认')a.push('订单尚未确认，请回订单核对');if(!o?.canServe)a.push('本单办理权限未获准');if(!o?.allow)a.push('门店未获准发起合同');
    if(o?.business==='MICE'&&c.channel!=='线下归档'&&!c.parent){const bridge=root.ContractTemplateBridge||(typeof require!=='undefined'?require('./contract-template-bridge.js'):null);if(bridge)a.push(...bridge.selection(o,{profile:'mice',range:o.range||'境内',province:o.province||'全国',days:1,serviceMode:'包价旅游'}).issues);}
    if(c.company!==o?.company||c.company!=='fj')a.push('签约公司或用章未获准');if(!o?.templateReady)a.push('本业务有效模板待配置');if(!c.parent&&c.template!==o?.template)a.push('模板不适用本订单');if(!o?.paymentReady)a.push('签约付款条件尚未满足或待确认');
    if(!c.people.length||new Set(c.people).size!==c.people.length)a.push('请选择不重复的合同覆盖游客');
    const signing=signingPeople(c,o);if(c.parties){const covered=c.parties.flatMap(p=>p.touristIds);if(!c.parties.length||c.parties.some(p=>!p.name||!p.identity||!p.phone||p.relation!=='本人'&&!p.authorization)||c.people.some(id=>covered.filter(x=>x===id).length!==1))a.push('必要签署方资料、代表范围或授权材料待核对');}if(!c.parties&&c.people.some(id=>!signing.some(p=>p.id===id&&(o.business==='MICE'||p.ready)&&p.signer&&p.phone&&p.signerIdentity)))a.push('游客证件、签署人或联系资料待补');
    if(c.changeSource){const src=s.sources.find(x=>x.id===c.changeSource);if(!src||src.status!=='已确认')a.push('变更依据尚未确认');else if(amountCents(c.amount)!==amountCents(c.replaces?src.afterAmount:src.delta))a.push('变更金额与确认依据不符');}
    else if(!Number.isFinite(Number(c.amount))||amountCents(c.amount)<=0||amountCents(c.amount)>amountCents(o?.amount))a.push('本份金额必须大于0且不超过订单金额');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(c.deadline)||!Number.isFinite(Date.parse(c.deadline))||new Date(c.deadline).toISOString().slice(0,10)!==c.deadline||c.deadline<s.day)a.push('签署截止日期无效或已过期');
    const required=['trip','fee',...(c.parties?[]:signing.filter(p=>c.people.includes(p.id)&&p.relation!=='本人').map(p=>'auth-'+p.id))];if(required.some(id=>!c.attachments.some(f=>f.id===id)))a.push('必要行程、费用或代签授权附件缺失');
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
  function send(s,c,outcome){if(handling(c)!=='平台签署并监管处理'||K.binding(c).generation==='manual')return ['本份采用平台办理，请登记原任务，不能重复创建签署'];if(!['正常受理','平台审核','超时','失败'].includes(outcome))return ['发起结果样例无效'];const o=s.orders.find(o=>o.id===c.orderId);const errs=issues(s,o,c,'send');if(c.needsCorrection)errs.push('平台已退回，请先修改重提并重新审核');if(c.status!=='待签署'||!['未提交','未受理'].includes(c.platform))errs.push('本合同已提交或结果待核对，不能重复发起');if(errs.length)return errs;c.submittedDocument=documentContent(c,o);c.submittedHTML=c.preparedHTML||'';c.attempts++;K.freeze(c);c.status='签署中';if(outcome==='超时'){c.platform='结果待核对';event(c,'发起结果待核对','提交超时，需核对原申请');}else if(outcome==='失败'){c.platform='未受理';c.status='待签署';event(c,'发起失败','授权校验未通过，原申请未受理（演示）');}else{c.platform=outcome==='平台审核'?'平台待审核':'已受理';c.platformNo=K.number(c);if(c.platform==='已受理'){c.entry='可用';c.entryVersion++;c.notifications++;}event(c,'平台受理结果',c.platform+'（演示）');}platformRecord(c,K.name(c)+'签署渠道',c.platform==='平台待审核'?'待审核':c.platform==='已受理'?'签署中':c.platform,'发起签署');return [];}
  function receive(c,outcome,envelope){const mismatch=K.identity(c,envelope);if(mismatch.length)return mismatch;if(c.status==='已签署')return ['已签署结果保留，重复或晚到结果不改变签署状态'];if(handling(c)!=='平台签署并监管处理'&&!(handling(c)==='到平台办理'&&c.manualAccess==='query'))return ['当前采用其他渠道签署，请核对签署证明'];if(activeEnding(c))return ['撤销或解除处理中，先核对原申请'];if(c.status!=='签署中')return ['当前不在签署阶段'];if(c.platform==='结果待核对'){if(outcome==='仍待核对'){event(c,'核对原申请','结果仍待核对');return [];}if(outcome==='未受理'){c.platform='未受理';c.status='待签署';event(c,'核对原申请','确认未受理，可修正后重新发起');return [];}if(outcome!=='已受理')return ['请先核对原申请是否受理'];c.platform='已受理';c.platformNo=envelope?.number||c.platformNo||K.number(c);c.entry='可用';c.entryVersion++;event(c,'核对原申请','原申请已受理，沿用原合同');return [];}
    if(c.platform==='平台待审核'){if(outcome==='平台退回'){c.platform='未受理';c.status='待签署';c.platformReason='附件格式不符';c.needsCorrection=true;event(c,'平台审核退回','附件格式不符（演示）');return [];}if(outcome!=='平台通过')return ['平台审核尚未通过'];c.platform='已受理';c.entry='可用';c.entryVersion++;event(c,'平台审核通过','取得签署入口（演示）');return [];}
    if(c.platform!=='已受理')return ['平台尚未受理'];
    if(['部分完成','游客完成','全部完成'].includes(outcome)&&c.signers.some(p=>['已拒签','已过期'].includes(p.status)))return ['存在拒签或过期方，请逐方核对最新结果'];
    if(['部分完成','游客完成'].includes(outcome)&&K.orderIssues(c,'customer').length)return K.orderIssues(c,'customer');
    if(outcome==='身份失败'){const p=c.signers.find(p=>p.status!=='已签署');if(p)p.auth='核验失败';}
    else if(outcome==='部分完成'){const p=c.signers.find(p=>p.status!=='已签署');if(p){p.auth='核验通过';p.status='已签署';p.time='2026-09-24 15:00';}}
    else if(['游客完成','全部完成'].includes(outcome)){c.signers.forEach(p=>{p.auth='核验通过';p.status='已签署';p.time=p.time||'2026-09-24 15:00';});if(outcome==='全部完成')c.seal='已盖章';}
    else if(outcome==='入口失效')c.entry='已失效';
    else if(outcome!=='无变化')return ['未知结果'];
    settleSignatures(c);
    event(c,'签署结果核对',outcome+'（演示）');return [];
  }
  function renew(c){if(activeEnding(c))return ['先处理撤销或解除申请'];if(c.status!=='签署中'||c.platform!=='已受理'||c.entry!=='已失效')return ['当前无需更新签署入口'];c.entry='可用';c.entryVersion++;event(c,'更新签署入口','沿用原平台合同号，保留既有签名');return [];}
  function filing(c,outcome){if(outcome==='待备案')return K.regulatoryIssues(c);return queryRegulatory(c,outcome);}
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
    if(src&&src.people&&JSON.stringify([...src.people].sort())!==JSON.stringify([...base.people].sort())&&kind==='补充协议')errors.push('游客范围变化请建立新版本，原名单与签名保留');
    if(errors.length)return {errors};
    const c=draft(o,'HT-CHANGE-'+String(++s.serial).padStart(3,'0'),{signingPeople:copy(base.signingPeople||[]),parent:base.id,version:'V'+(Number(base.version.replace('V',''))+1),doc:kind==='补充协议'?'补充协议':'主合同',amount:offline?base.amount:kind==='补充协议'?src.delta:src.afterAmount,current:kind==='补充协议',replaces:kind==='补充协议'?'':base.id,changeSource:offline?'':src.id,changeBasis:offline?'原归档文件替换：'+reason:src.id+' / '+src.after,changeReason:reason,change:offline?null:copy(src)});
    if(!offline&&c.signingPeople.length)c.attachments=c.attachments.filter(f=>!f.id.startsWith('auth-')).concat(copy(base.attachments.filter(f=>f.id.startsWith('auth-')&&c.people.includes(f.id.slice(5)))));
    if(offline){c.channel='线下归档';c.mode='企业代表签署';c.archive={file:'',ourSeal:false,clientSeal:false,authorization:false,reason};}
    inheritChange(s,base,c,src);
    event(c,'建立变更草稿','原合同 '+base.id+' 继续保留；本版本重新审核及签署／归档');s.contracts.unshift(c);return {errors:[],contract:c};
  }
  function review(c,result,reason=''){
    if(c.status!=='待审核')return ['只有待审核申请可以处理'];
    if(!['通过','退回'].includes(result))return ['请选择审批结果'];
    if(result==='退回'&&!reason.trim())return ['退回原因必填'];
    c.approval=result;c.approvalReason=reason;if(result==='通过')K.review(c);else delete c.reviewedPackage;c.status=result==='退回'?'审核退回':c.channel==='线下归档'?'待归档':'待签署';event(c,'内部审核',result+' / '+(reason||'本次版本审核通过'));return [];
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
    if(errors.length)return errors;c.endingHistory=c.endingHistory||[];if(c.ending)c.endingHistory.push(copy(c.ending));c.ending={kind,reason,status:'待审核',approval:'待审核',result:'未办理',agreement:'未签署',file:'',events:[],parties:partyDetails(c,s.orders.find(o=>o.id===c.orderId)).map(p=>({id:p.id,name:p.name,scope:p.covers.join('、'),status:'待确认',time:'',evidence:''})).concat({id:'company',name:s.orders.find(o=>o.id===c.orderId).companyName,scope:'旅行社',status:'待确认',time:'',evidence:''})};event(c,'申请'+kind,reason+'；原合同状态保留');return [];
  }
  function reviewEnding(c,result,reason=''){
    const r=c.ending;if(!r||r.status!=='待审核')return ['申请不在待审核阶段'];if(!['通过','退回'].includes(result))return ['审批结果无效'];if(result==='退回'&&!reason.trim())return ['退回原因必填'];r.approval=result;r.opinion=reason;r.status=result==='通过'?'待办理':'已退回';event(c,r.kind+'内部审核',result+' / '+reason+'；未改变原合同签署状态');return [];
  }
  function finishEnding(s,c,result){
    const r=c.ending;if(!r||r.approval!=='通过'||!['待办理','结果待核对','办理失败','待协议签署'].includes(r.status))return ['内部审核尚未通过或本申请已完成'];
    const allowed=r.kind==='撤销'?['结果待核对','办理失败','平台撤销完成']:['结果待核对','办理失败','解除协议待签署',c.channel==='线下归档'?'双方解除文件已归档':'各方已签署且平台解除完成'];if(!allowed.includes(result))return ['办理结果与申请类型不符'];
    if(['平台撤销完成','各方已签署且平台解除完成','双方解除文件已归档'].includes(result)&&(!r.parties?.length||r.parties.some(p=>p.status!=='同意')))return ['仍有必要确认方未同意，原合同状态保持'];
    r.result=result;platformRecord(c,c.channel==='线下归档'?'线下解除文件':handling(c)==='其他获准渠道签署后上传监管'?'获准签署渠道':K.name(c)+'签署渠道',['平台撤销完成','各方已签署且平台解除完成'].includes(result)?'已作废':result,r.kind+'结果');if(['平台撤销完成','各方已签署且平台解除完成','双方解除文件已归档'].includes(result)){r.status='已完成';r.file=r.kind+'确认_原型样例.html';r.agreement=r.kind==='解除'?'各方已签署':'不适用';c.status=r.kind==='解除'?'已解除':'已撤销';c.entry='已结束';s.contracts.filter(x=>x.parent===c.id&&x.current&&x.status==='已签署').forEach(x=>{x.current=false;event(x,'主合同已解除','文件保留，后续退款按售后单另行办理');});}else r.status=result==='解除协议待签署'?'待协议签署':result;
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
  const termLabels={itinerary:'行程与服务',insurance:'保险委托',formation:'成团与不成团',cancellation:'解除及必要费用',force:'不可抗力',breach:'违约责任',dispute:'争议解决',other:'其他约定'};
  function handling(c){return K.binding(c).generation==='manual'?'到平台办理':c.handling||'平台签署并监管处理';}
  function activeEnding(c){return c.ending&&!['已退回','已撤回','已完成'].includes(c.ending.status);}
  function partyDetails(c,o){
    if(c.preparation)return c.preparation.signers.filter(x=>x.required).map(x=>({id:x.key,name:x.name,identity:x.identity,phone:x.phone,relation:x.relation,covers:x.covers.map(id=>[...o.people,...(o.originalPeople||[])].find(p=>p.id===id)?.name||id),touristIds:copy(x.covers),authorization:x.relation==='本人'?'本人':x.authorization||x.file||'授权资料已核对'}));
    if(c.parties)return c.parties.map(x=>({...copy(x),covers:x.touristIds.map(id=>[...o.people,...(o.originalPeople||[])].find(p=>p.id===id)?.name||id)}));
    return signingPeople(c,o).filter(p=>c.people.includes(p.id)).map(p=>({id:p.id,name:p.signer,identity:p.signerIdentity,phone:p.phone,relation:p.relation,touristIds:[p.id],covers:[p.name],authorization:p.relation==='本人'?'本人':c.attachments.find(a=>a.id==='auth-'+p.id)?.file||'授权待补'}));
  }
  function platformRecord(c,source,raw,stage){c.platformRecords=c.platformRecords||[];const r={source,raw,stage,number:stage==='监管结果'?c.regulatorNo:c.platformNo,time:new Date().toLocaleString('zh-CN',{hour12:false})};c.platformRecords.push(r);return r;}
  function settleSignatures(c){if(c.signers.length&&c.signers.every(p=>p.status==='已签署')&&c.seal==='已盖章'){c.status='已签署';K.completed(c);c.entry='已结束';if(!c.signedDocument)c.signedDocument=c.submittedDocument||c.preparedDocument||'';if(!c.signedHTML)c.signedHTML=c.submittedHTML||c.preparedHTML||'';}platformRecord(c,K.name(c)+'签署渠道',c.status==='已签署'?'已签署':'签署中','签署结果');}
  function receiveParty(c,id,result,envelope){
    const mismatch=K.identity(c,envelope);if(mismatch.length)return mismatch;if(result==='已签署'&&K.orderIssues(c,'customer').length)return K.orderIssues(c,'customer');
    if((handling(c)!=='平台签署并监管处理'&&!(handling(c)==='到平台办理'&&c.manualAccess==='query'))||c.status!=='签署中'||c.platform!=='已受理'||activeEnding(c))return ['当前不能核对签署，请先处理受理或撤销解除申请'];
    const p=c.signers.find(x=>x.id===id);if(!p)return ['必要签署方不存在'];
    if(!['身份失败','已拒签','已过期','已签署','待签署'].includes(result))return ['签署结果无效'];
    if(p.status==='已签署'&&result!=='已签署')return ['已有签名保留，不能通过异常结果删除签名'];
    if(result==='身份失败')p.auth='核验失败';else {p.status=result==='待签署'?'未签署':result;p.auth=result==='已签署'?'核验通过':p.auth;if(result==='已签署')p.time=p.time||new Date().toLocaleString('zh-CN',{hour12:false});}
    p.lastResult=result;settleSignatures(c);event(c,'逐方签署核对',id+' / '+result+'（演示渠道结果）');return [];
  }
  function receiveSeal(c,envelope){const mismatch=K.identity(c,envelope);if(mismatch.length)return mismatch;if(K.orderIssues(c,'company').length)return K.orderIssues(c,'company');if(c.status!=='签署中'||c.platform!=='已受理'||(handling(c)!=='平台签署并监管处理'&&!(handling(c)==='到平台办理'&&c.manualAccess==='query'))||activeEnding(c))return ['当前不能核对我方签章'];c.seal='已盖章';settleSignatures(c);event(c,'我方签章核对','渠道回报已盖章（演示）');return [];}
  function endingParty(c,id,result,evidence){const r=c.ending;if(!r||r.approval!=='通过'||r.status==='已完成')return ['内部通过后再核对逐方结果'];const p=r.parties?.find(x=>x.id===id);if(!p||!['待确认','同意','不同意','已超时'].includes(result))return ['确认方或结果无效'];if(result!=='待确认'&&!String(evidence||'').trim())return ['请填写本方确认或核对依据'];p.status=result;p.evidence=String(evidence||'').trim();p.time=new Date().toLocaleString('zh-CN',{hour12:false});r.agreement=r.parties.every(p=>p.status==='同意')?'各方已确认':r.parties.some(p=>p.status==='不同意')?'存在不同意方':'待必要方确认';event(c,'逐方'+r.kind+'确认',p.name+' / '+result+' / '+p.evidence);return [];}
  function externalSigned(s,c,proof){
    const manual=handling(c)==='到平台办理'&&c.manualAccess==='evidence';
    if(!(manual?c.status==='签署中'&&c.manualRecord:handling(c)==='其他获准渠道签署后上传监管'&&c.status==='待签署')||!['通过','无需审核'].includes(c.approval))return ['当前不满足外部签署证明核对条件'];
    const o=s.orders.find(o=>o.id===c.orderId);if(!proof.channel?.trim()||!proof.authorization?.trim()||!proof.number?.trim()||!proof.file?.trim()||!proof.evidence?.trim()||!proof.signedAt?.trim()||!proof.partiesConfirmed||!proof.sealConfirmed)return ['请补齐获准渠道、外部编号、签署文件与证明、时间，并核对全部必要方及我方签章'];
    if(manual&&(proof.number!==c.platformNo||proof.channel!==K.name(c)))return ['请核对原平台及任务号，不能关联其他平台的文件'];
    if(!Number.isFinite(Date.parse(proof.signedAt))||Date.parse(proof.signedAt)>Date.now())return ['签署时间无效或晚于当前时间'];
    if(s.contracts.some(x=>x.id!==c.id&&x.company===c.company&&x.externalProof?.channel===proof.channel&&x.externalProof?.number===proof.number))return ['同公司和渠道的外部编号已有关联合同，请核对原记录'];
    c.externalProof=copy(proof);c.platformNo=proof.number;c.status='已签署';c.platform='外部签署已核对';c.signers.forEach(p=>{p.auth='证明已核对';p.status='已签署';p.time=proof.signedAt;});c.seal='已盖章';c.fileReady=true;c.proofReady=true;c.entry='不适用';K.completed(c);c.signedDocument=c.submittedDocument||documentContent(c,o);c.signedHTML=c.submittedHTML||c.preparedHTML||'';platformRecord(c,proof.channel,'已签署','外部签署证明');event(c,'核对外部签署证明',proof.number+'；监管要求及文件分别保留');return [];
  }
  function uploadRegulatory(c,outcome){const problems=K.regulatoryIssues(c);if(problems.length)return problems;if(!c.fileReady||c.proofReady===false)return ['先取得已签文件及签署证明'];if(!['未提交','待备案','未受理','备案失败'].includes(c.filing))return ['请先核对原上传申请；未知结果不得重复上传'];if(!['已备案','结果待核对','未受理','备案失败'].includes(outcome))return ['上传结果无效'];c.regulatoryAttempts=(c.regulatoryAttempts||0)+1;c.regulatoryRequest=c.regulatoryRequest||c.id+'-监管申请';c.filing=outcome;if(outcome==='已备案')c.regulatorNo=c.regulatorNo||'演示监管-'+c.id;platformRecord(c,K.regulatory(c).channel+'监管',outcome,'监管结果');event(c,'上传监管',outcome+'（演示）');return [];}
  function queryRegulatory(c,outcome){const problems=K.regulatoryIssues(c);if(problems.length)return problems;if(!c.regulatoryAttempts&&!c.regulatorNo&&!['备案失败','结果待核对'].includes(c.filing))return ['尚无监管申请，请按获准路径先提交'];if(!['已备案','备案失败','结果待核对','未受理'].includes(outcome))return ['监管结果无效'];if(c.filing==='已备案'&&outcome!=='已备案')return ['已有备案成功记录保留，后续更正另行处理'];c.filing=outcome;if(outcome==='已备案')c.regulatorNo=c.regulatorNo||'演示监管-'+c.id;c.filingReason=outcome==='备案失败'?'行程附件不符合接收要求（演示）；签署事实保留':'';platformRecord(c,K.regulatory(c).channel+'监管',outcome,'监管结果');event(c,'核对原监管申请',outcome+'（演示）');return [];}
  function registerManual(s,c,data){
    if(handling(c)!=='到平台办理'||c.status!=='待签署'||c.platformNo)return ['请继续原平台任务，不能重复登记'];
    const o=s.orders.find(x=>x.id===c.orderId),errors=issues(s,o,c,'send');
    if(!data.number?.trim()||!data.file?.trim()||!data.evidence?.trim()||!data.sameContent)errors.push('请登记原平台任务号、实际文书及核对依据，并确认与已审内容一致');
    if(s.contracts.some(x=>x.id!==c.id&&x.company===c.company&&K.binding(x).provider===K.binding(c).provider&&x.platformNo===data.number?.trim()))errors.push('同公司同平台任务号已关联其他合同');
    if(errors.length)return [...new Set(errors)];
    c.attempts++;K.freeze(c);c.platformNo=data.number.trim();c.manualRecord=copy(data);c.submittedDocument=documentContent(c,o);c.submittedHTML=c.preparedHTML||'';c.status='签署中';c.platform='已受理';c.entry='平台内办理';platformRecord(c,K.name(c)+'平台办理','已受理','登记原任务');event(c,'登记原平台任务',c.platformNo+'；实际文书与本次批准内容核对一致（样例）');return [];
  }
  function receiveEnvelope(s,data){
    const hits=s.contracts.filter(c=>c.company===data.company&&K.binding(c).provider===data.provider&&(c.platformNo?c.platformNo===data.number:c.platform==='结果待核对'&&!!c.requestId&&c.requestId===data.requestId&&!!data.number)&&c.id===data.contractId);
    if(hits.length!==1)return ['未唯一找到原合同；没有新建或合并记录'];const c=hits[0];
    if(data.stage==='签署方')return receiveParty(c,data.party,data.result,data);
    if(data.stage==='我方签章')return receiveSeal(c,data);
    return receive(c,data.result,data);
  }
  function documentContent(c,o){if(c.preparedDocument)return c.preparedDocument;return `原型示例 · 非正式签约文件\n${c.template} ${c.templateVersion} / ${c.doc} ${c.version}\n合同：${c.id}\n订单：${o.id}\n我方：${o.companyName}\n客户：${o.customer}\n产品：${o.product}\n出行：${o.start} 至 ${o.end}\n${c.doc==='补充协议'?'本次金额增减':'本份合同金额'}：¥${c.amount}\n签约备注：${c.note||'无'}\n\n${Object.entries(c.terms||{}).map(([k,v])=>(termLabels[k]||k)+'：'+v).join('\n\n')}\n\n覆盖游客：${o.people.filter(p=>c.people.includes(p.id)).map(p=>p.name).join('、')}\n必要签署人：${partyDetails(c,o).map(p=>p.name+' / '+p.relation+' / 代表 '+p.covers.join('、')).join('；')}\n附件：${c.attachments.map(f=>f.name+' / '+f.file).join('\n')}${c.parent?'\n原合同：'+c.parent+'\n原模板：'+c.originalTemplate+'\n原文件版本：'+c.originalVersion+'\n变更依据：'+c.changeSource+'\n'+(c.termChanges||[]).map(x=>(termLabels[x.key]||x.key)+'\n变更前：'+x.before+'\n变更后：'+x.after).join('\n')+'\n其他未修改条款继续适用原合同。\n\n原签署文件（保留查询，本次修改以以上对比为准）\n'+c.originalDocument:''}`;}
  function effectiveTerms(s,base){let terms=copy(base.confirmedTerms||base.terms||{});if(base.preparation&&!base.confirmedTerms){const d=base.preparation;Object.keys(termLabels).forEach(k=>{const entries=Object.entries(d.values).filter(([id])=>id.startsWith(k+'-'));if(entries.length)terms[k]=entries.map(x=>x[1]).join('；');});terms.itinerary=terms.itinerary||Object.entries(d.values).filter(([id])=>/^(trip|dayTrip|studyTrip|cruiseTrip|services)-/.test(id)).map(x=>x[1]).join('；');terms.insurance=(d.decisions.insurance||'')+'；'+(terms.insurance||'');terms.formation=(terms.formation||'')+'；转社：'+d.decisions.transfer+'；延期：'+d.decisions.delay+'；改线：'+d.decisions.reroute+'；解除：'+d.decisions.terminate;terms.dispute=d.decisions.dispute+'；'+d.decisions.institution;terms.other=d.extra||terms.other||'无';}s.contracts.filter(c=>c.parent===base.id&&c.current&&c.doc==='补充协议'&&c.status==='已签署').forEach(c=>{(c.termChanges||[]).forEach(x=>terms[x.key]=x.after);});return terms;}
  function createTermSource(s,base,key,value,evidence){if(!['itinerary','insurance','formation','dispute','other'].includes(key))return {errors:['该条款不能在本次约定调整中直接修改']};const current=effectiveTerms(s,base);if(!value?.trim()||value.trim()===current[key]||!evidence?.trim())return {errors:['请填写不同于原约定的内容及客户／业务确认依据']};const amount=s.contracts.filter(c=>c.orderId===base.orderId&&c.current&&['已签署','已归档'].includes(c.status)).reduce((n,c)=>n+amountCents(c.amount),0)/100;const src={id:'SH-TERMS-'+(++s.serial),orderId:base.orderId,status:'已确认',beforeAmount:amount,afterAmount:amount,delta:0,before:current[key]||'未约定',after:value.trim(),termChanges:[{key,before:current[key]||'未约定',after:value.trim()}],people:copy(base.people),confirmedBy:'合同经办人核对（演示）',file:evidence.trim(),start:s.orders.find(o=>o.id===base.orderId).start,end:s.orders.find(o=>o.id===base.orderId).end};s.sources.push(src);return {errors:[],source:src};}
  function inheritChange(s,base,c,src){
    c.handling=handling(base);c.platformBinding=copy(K.binding(base));c.signingConfig=copy(K.signing(base));c.regulatory=copy(K.regulatory(base));c.manualAccess=base.manualAccess;c.selectionRule=copy(base.selectionRule||null);c.filing=c.regulatory.result==='需要报送'?'未提交':c.regulatory.result==='经确认不适用'?'经确认不适用':'适用要求待确认';c.originalPlatform=K.name(base);c.originalTemplate=base.template+' '+base.templateVersion;c.originalVersion=base.version;c.originalDocument=base.signedDocument||documentContent(base,s.orders.find(o=>o.id===base.orderId));c.template=base.template;c.templateVersion=base.templateVersion;c.terms=effectiveTerms(s,base);c.termChanges=copy(src?.termChanges||[]);c.termChanges.forEach(x=>c.terms[x.key]=x.after);
    c.people=copy(src?.people||base.people);c.parties=partyDetails(base,s.orders.find(o=>o.id===base.orderId)).map(p=>({...p,touristIds:p.touristIds.filter(id=>c.people.includes(id))})).filter(p=>p.touristIds.length);c.signers=c.parties.map(p=>({id:p.id,auth:'待核验',status:'未签署',time:''}));c.attachments=copy(base.attachments);if(src)c.attachments.push({id:'change-confirm',name:'变更确认依据',file:src.file,ready:!!src.file,scope:'本次变更'});
  }
  function seedLifecycle(s){
    s.contracts.forEach(c=>{c.handling=handling(c);c.terms={itinerary:'按本次确认行程 V1 提供服务；集合地点厦门机场T4。',insurance:'自行购买，旅行社已提示投保（流程样例）。',formation:'最低16人；未成团方案须逐单确认。',cancellation:'已签退改约定 A版：按实际必要费用及证明逐项核对，对客费用须另经确认。',force:'按所选模板不可抗力条款处理，费用承担逐项核对。',breach:'采用签署时模板的双方违约责任条款。',dispute:'诉讼；有管辖权的人民法院（本次约定样例）。',other:'无其他补充约定。'};if(c.status==='已签署')c.signedDocument=documentContent(c,s.orders.find(o=>o.id===c.orderId));});
    s.sources.forEach(x=>{x.termChanges=[{key:'itinerary',before:s.contracts.find(c=>c.orderId===x.orderId&&c.current)?.terms.itinerary||x.before,after:x.after}];});
    const joint=s.contracts.find(c=>c.id==='HT-JOINT-001'),o=s.orders.find(o=>o.id===joint.orderId);
    joint.parties=[{id:'S1',name:'张建国',identity:'身份证尾号1201',phone:'138****8001',relation:'本人及代理人',touristIds:['T001','T003'],authorization:'张建国_代理王磊授权_样例.pdf'},{id:'S2',name:'王芳',identity:'监护人证件尾号6601',phone:'139****2200',relation:'监护人',touristIds:['T002'],authorization:'王芳_监护关系_样例.pdf'}];joint.signers=joint.parties.map(p=>({id:p.id,auth:'核验通过',status:'已签署',time:'2026-09-23 14:00'}));joint.signedDocument=documentContent(joint,o);
    const multi=order('ORD-MULTI-PROGRESS',{product:'三亚游5日 · 三游客两名必要签署人',template:'团队境内旅游合同',trip:'CN-SANYA-20261012-001',end:'2026-10-16',rule:'福建境内参团游签约规则',amount:30000,people:copy(o.people)});s.orders.push(multi);const m=draft(multi,'HT-MULTI-PROGRESS',{status:'签署中',approval:'通过',platform:'已受理',platformNo:'演示平台-MULTI',entry:'可用',parties:copy(joint.parties),terms:copy(joint.terms),signers:joint.parties.map((p,i)=>({id:p.id,auth:i?'待核验':'核验通过',status:i?'未签署':'已签署',time:i?'':'2026-09-28 09:00'}))});s.contracts.push(m);
    const kids=order('ORD-GUARDIAN-TWO',{business:'研学',product:'北京历史研学营 · 两名儿童',template:'中小学生研学旅行服务合同',trip:'ST-BJ-20261012-001',end:'2026-10-16',rule:'福建研学签约规则',amount:8000,people:[{...copy(people[1]),id:'K1',name:'李小梅'},{...copy(people[1]),id:'K2',name:'李小明'}]});s.orders.push(kids);s.contracts.push(draft(kids,'HT-GUARDIAN-TWO',{status:'签署中',approval:'通过',platform:'已受理',platformNo:'演示平台-GUARDIAN',entry:'可用',terms:copy(joint.terms),parties:[{id:'G1',name:'王芳',identity:'身份证尾号6601',phone:'139****2200',relation:'监护人',touristIds:['K1','K2'],authorization:'王芳_两名儿童监护证明_样例.pdf'}],signers:[{id:'G1',auth:'待核验',status:'未签署',time:''}]}));
    for(const [id,h] of [['UPLOAD','其他获准渠道签署后上传监管'],['PATH-PENDING','待确认']]){const o=order('ORD-'+id,{product:id==='UPLOAD'?'其他渠道签署后监管上传样例':'办理方式待确认样例'});s.orders.push(o);s.contracts.push(draft(o,'HT-'+id,{status:'待签署',approval:'通过',handling:h,terms:copy(joint.terms)}));}
    const partialOrder=order('ORD-PARTIAL-20000',{amount:20000,people:copy(o.people.slice(0,2)),originalPeople:copy(o.people),allocations:{T001:10000,T002:10000}});s.orders.push(partialOrder);const partial=copy(joint);partial.id='HT-PARTIAL-30000';partial.orderId=partialOrder.id;partial.signedDocument=joint.signedDocument.replaceAll(joint.id,partial.id).replaceAll(o.id,partialOrder.id);s.contracts.push(partial);
    s.sources.push({id:'SH-PARTIAL-JOINT',orderId:partialOrder.id,status:'已确认',beforeAmount:30000,afterAmount:20000,delta:-10000,before:'3名游客',after:'王磊退订，张建国及李梅继续出行',people:['T001','T002'],termChanges:[{key:'other',before:'3名游客共同合同',after:'王磊退订；原签署文件与退订依据保留'}],start:o.start,end:o.end,confirmedBy:'销售主管 王洁',file:'部分退订确认_样例.pdf'});
  }

  const api={channel:K,registerManual,receiveEnvelope,handling,activeEnding,partyDetails,platformRecord,receiveParty,receiveSeal,endingParty,externalSigned,uploadRegulatory,queryRegulatory,documentContent,effectiveTerms,createTermSource,termLabels,signingPeople,setSigningPeople,canReopen,reopen,replacementParts,copy,DAY,people,order,draft,attachments,createState,issues,fingerprint,coverage,send,receive,renew,filing,event,amountCents,createChange,review,activate,archiveComplete,requestEnding,reviewEnding,finishEnding,approvalExample};
  if(typeof module!=='undefined')module.exports=api;root.ContractWorkflow=api;
})(typeof window!=='undefined'?window:globalThis);
