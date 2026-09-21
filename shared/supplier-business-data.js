/* 合作申请与正式档案分离；当前页面内演示，不跨页自动生成或回写正式资料。 */
(function(root){
  'use strict';
  const companies=['福建凯撒','北京凯撒','上海凯撒','亿步','体坛','亿步山西分公司'];
  const copy=x=>JSON.parse(JSON.stringify(x));
  const types=['新增合作','续签／变更','临时合作'];
  const stages=['草稿','待处理','待发送致远','审批中','待补充','已完成','已拒绝','已撤回'];
  function companyContext(){const c=root.caesarCompanyContext?root.caesarCompanyContext():null;const query=new URLSearchParams(root.location?root.location.search:'').get('company');return c&&companies.includes(c.company)&&(!query||query===c.company)?c:{company:'',department:''};}
  function view(records,company){if(!companies.includes(company))return [];return records.map(s=>({...copy(s),agreements:s.agreements.filter(a=>a.bodies.some(b=>b.company===company)).map(a=>({...copy(a),bodies:a.bodies.filter(b=>b.company===company).map(copy)}))})).filter(s=>s.agreements.length);}
  function usage(s,a,date){if(s.status!=='已准入')return '已停用，不可新使用';if(a.end<date)return '已到期，不可新使用';if(a.start>date)return '未到开始日';if(a.effective!=='已确认')return '生效条件待确认';return '可新使用';}
  const materialTypes=[{key:'business',label:'营业执照／境外注册证明'},{key:'license',label:'经营许可证'},{key:'insurance',label:'旅责险'},{key:'quote',label:'报价单'}];
  function materials(d){return materialTypes.map(m=>({...m,required:m.key==='business'&&d.type!=='临时合作',pending:m.key==='license'}));}
  function createSession(){
    let sequence=10;
    const requests=[
      {id:'REQ-20260921-001',company:'福建凯撒',department:'产品采购部',applicant:'王珊',type:'新增合作',name:'北京协成国际旅行服务有限公司',registration:'91110105MA01XC2601',supplier:'',agreement:'',contact:'林娜',phone:'13800002601',service:'西欧定制团地接',destination:'法国 / 巴黎',reason:'增加冬季研学合作',start:'2026-11-01',end:'2027-03-31',business:'',terms:'建议实际回团后30天；以审批合同为准',attachments:[{kind:'business',name:'营业执照（示例）.pdf'}],status:'待处理',date:'2026-09-21',feedback:'',result:''},
      {id:'REQ-20260921-002',company:'福建凯撒',department:'产品采购部',applicant:'王珊',type:'续签／变更',name:'深圳新启航国际旅行社有限公司',supplier:'SUP-GRP-0002',agreement:'AGR-NQ-FJ-001',registration:'',contact:'林娜',phone:'13800002601',service:'东南亚地接服务续签',destination:'泰国 / 曼谷',reason:'原协议即将到期',start:'2027-01-01',end:'2027-12-31',business:'',terms:'保持原约定',attachments:[{kind:'business',name:'营业执照（示例）.pdf'}],status:'待补充',date:'2026-09-20',feedback:'请补充下一年度预计合作量。',result:''},
      {id:'REQ-20260921-003',company:'北京凯撒',department:'产品采购部',applicant:'陈虹',type:'临时合作',name:'北京会议摄影工作室',supplier:'',agreement:'',registration:'',contact:'王先生',phone:'13800000001',service:'会议摄影',destination:'中国 / 北京',reason:'原摄影团队无法到场',start:'2026-10-01',end:'2026-10-02',business:'MICE-BJ-1001',terms:'待双方确认',attachments:[],status:'待处理',date:'2026-09-21',feedback:'',result:''}
    ];
    requests.push({...copy(requests[1]),id:'REQ-20260919-004',date:'2026-09-19',type:'新增合作',status:'已完成',service:'冬季研学合作',reason:'增加冬季研学服务',start:'2026-10-01',end:'2027-03-31',formalId:'SUP-GRP-0002',formalAgreement:'AGR-NQ-APPROVED',application:'APR-AGR-20260919-008',external:'历史审批回执样例',feedback:'',result:'审批通过，申请自动完成；协议待归档。'});
    function find(id,company){return requests.find(r=>r.id===id&&(!company||r.company===company));}
    function validate(d,submit,records){if(!companies.includes(d.company))throw Error('当前公司不可用。');if(!types.includes(d.type))throw Error('请选择申请类型。');if(!d.name.trim())throw Error('请填写供应商全称。');if(d.type==='续签／变更'){const s=view(records,d.company).find(s=>s.id===d.supplier);if(!s||!s.agreements.some(a=>a.no===d.agreement))throw Error('请选择本公司供应商及原协议。');}if(submit){if(!d.applicant.trim()||!d.service.trim()||!d.reason.trim()||!d.contact.trim()||!d.phone.trim()||!d.destination.trim())throw Error('请填写申请人、合作内容、地区、原因、联系人及电话。');if(!d.start||!d.end||d.end<d.start)throw Error('请填写正确的希望合作日期。');if(d.type==='临时合作'&&!d.business.trim())throw Error('临时合作须填写本次团期／业务。');const missing=materials(d).find(m=>m.required&&!(d.attachments||[]).some(f=>f.kind===m.key&&f.name));if(missing)throw Error('请上传'+missing.label+'。');}}
    function save(data,submit,company,records,id){const old=id&&find(id,company);if(id&&!old)throw Error('申请不存在或不属于本公司。');if(old&&!['草稿','待补充'].includes(old.status))throw Error('当前申请不可编辑。');const d=copy(data);d.company=company;validate(d,submit,records);d.id=id||'REQ-'+new Date().toLocaleDateString('sv-SE').replace(/-/g,'')+'-'+String(++sequence).padStart(3,'0');d.status=submit?'待处理':old&&old.status==='待补充'?'待补充':'草稿';d.date=new Date().toLocaleDateString('sv-SE');d.feedback=old?old.feedback:'';d.result=old?old.result:'';if(old)requests.splice(requests.indexOf(old),1,d);else requests.unshift(d);return d;}
    function withdraw(id,company){const r=find(id,company);if(!r||(!['草稿','待处理'].includes(r.status)||r.formalId))throw Error('仅尚未办理的申请可撤回。');r.status='已撤回';}
    function link(id,data){const r=find(id);if(!r||r.status!=='待处理')throw Error('当前申请不可办理。');Object.assign(r,{formalId:data.formalId,formalAgreement:data.formalAgreement,application:data.application||'',status:data.submitted?'待发送致远':'待处理',external:data.submitted?'致远待对接，未发送':'办理草稿',result:''});return r;}
    function returnForChanges(id,note){const r=find(id);if(!r||r.status!=='待处理')throw Error('当前申请不可退回补充。');if(!note.trim())throw Error('请填写需补充的资料。');r.status='待补充';r.feedback=note.trim();return r;}
    function receipt(id,application,result,reason){const r=find(id);if(!r||!application||r.application!==application)throw Error('审批回执与本次申请不一致。');const states={approved:'已完成',returned:'待补充',rejected:'已拒绝'};if(!states[result])throw Error('审批结果不明确。');if(r.status===states[result])return r;if(!['待发送致远','审批中'].includes(r.status))throw Error('当前申请不接受审批回执。');r.status=states[result];r.external='致远审批回执';r.result=result==='approved'?'审批通过，申请自动完成；协议归档及生效条件另行处理。':reason||'';if(result==='returned')r.feedback=reason||'审批退回，请补充资料。';return r;}
    return {requests,find,save,withdraw,link,returnForChanges,receipt};
  }
  function receiveApproval(requests,masters,id,application,result,reason){
    const r=requests.find(id),a=masters.applications.find(a=>a.no===application);
    if(!r||!a||a.supplier!==r.formalId||a.agreement!==(r.formalAgreement||undefined))throw Error('回执无法对应本次供应商合作审批。');
    const s=masters.find(r.formalId),agreement=r.formalAgreement&&s.agreements.find(a=>a.no===r.formalAgreement);
    if(!s||(r.formalAgreement&&!agreement))throw Error('回执对应的供应商或协议不存在。');
    const previous=r.status;requests.receipt(id,application,result,reason);if(previous===r.status)return r;
    a.status=result==='approved'?'已通过':result==='returned'?'已退回':'已拒绝';a.external='已收到审批回执';a.reason=reason||'';
    if(agreement){agreement.status=result==='approved'?'待归档':a.status;agreement.reason=reason||'';}
    if(s.status!=='已准入')s.status=result==='approved'?'已准入':a.status;
    return r;
  }
  const tabs=(active,company)=>'<nav class="list-surface-tabs list-function-tabs supplier-page-tabs" aria-label="供应商页面">'+[['suppliers','合作供应商'],['requests','合作申请']].map(([key,label])=>'<a class="tab-item'+(active===key?' active':'')+'"'+(active===key?' aria-current="page"':'')+' href="'+(key==='suppliers'?'suppliers':'supplier-requests')+'.html?company='+encodeURIComponent(company)+'"><span class="list-tab-label">'+label+'</span></a>').join('')+'</nav>';
  root.SupplierBusinessData={materials,materialTypes,receiveApproval,tabs,companies,types,stages,copy,companyContext,view,usage,createSession};
})(typeof window==='undefined'?globalThis:window);
