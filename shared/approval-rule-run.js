/* Page-local approval rehearsal; never writes source business documents. */
(function(root){
  'use strict';
  const M=typeof module==='object'&&module.exports?require('./approval-config-model.js'):root.ApprovalConfigModel;
  const terminal=['approved','rejected','returned','withdrawn'];
  function validSignature(value){
    if(!Array.isArray(value)||value.length>100)return false;
    let length=0,count=0;
    for(const stroke of value){
      if(!Array.isArray(stroke)||stroke.length>5000)return false;
      for(let i=0;i<stroke.length;i++){
        const p=stroke[i];if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<0||p[0]>480||p[1]<0||p[1]>160)return false;
        count++;if(i)length+=Math.hypot(p[0]-stroke[i-1][0],p[1]-stroke[i-1][1]);
      }
    }
    return count>=3&&length>=12;
  }
  function start(state,template,context,version='当前草稿'){
    const result=M.trial(state,template,context);if(result.errors.length)return {errors:result.errors};
    const run={template:M.clone(template),context:{...M.clone(context),scene:template.scene},version,round:1,status:'running',index:0,history:[],steps:[],issue:[]};
    run.steps=result.steps.filter(s=>s.type==='approval').map(s=>({node:M.clone(s.executionNode||M.getNode(template,s.nodeId)),members:null,approved:[],available:[]}));
    refresh(state,run);return {errors:[],run};
  }
  const current=run=>run.steps[run.index];
  const pending=run=>{const s=current(run);if(!s||run.status!=='running')return [];const ids=(s.members||[]).filter(id=>!s.approved.some(a=>a.person===id));return s.node.mode==='sequential'?ids.slice(0,1):ids;};
  function log(run,entry){const record={id:M.uid(),at:new Date().toLocaleString('zh-CN'),round:run.round,version:run.version,...entry};run.history.push(record);return record;}
  function complete(step){return step.node.mode==='any'?step.approved.length>0:step.members?.length>0&&step.members.every(id=>step.approved.some(a=>a.person===id));}
  function refresh(state,run){
    if(terminal.includes(run.status))return;
    const rules=M.rulesFor(run.template);run.issue=[];run.status='running';
    while(run.index<run.steps.length){
      const s=current(run);
      if(complete(s)){run.index++;continue;}
      const unresolved=s.members?s.members.filter(id=>!s.approved.some(a=>a.person===id)):null;
      const node=unresolved?{...s.node,source:'member',members:unresolved}:s.node;
      const result=M.approvers(state,node,run.context,true,rules);s.available=result.ids;
      if(result.errors.length){run.status='paused';run.issue=result.errors;return;}
      s.members=[...new Set([...s.approved.map(a=>a.person),...result.ids])];
      for(const notice of result.notices||[])if(!s.notices?.includes(notice)){s.notices=[...(s.notices||[]),notice];log(run,{nodeId:s.node.id,title:s.node.title,decision:'handover',opinion:notice});}
      let reused=false;
      for(const id of pending(run)){
        if(rules.repeat==='every')continue;
        const previous=run.steps[run.index-1];
        if(rules.repeat==='consecutive'&&!previous?.approved.some(a=>a.person===id))continue;
        const evidence=run.history.find(a=>a.round===run.round&&a.decision==='approve'&&!a.automatic&&a.person===id&&a.nodeId!==s.node.id);
        if(!evidence)continue;
        const record=log(run,{nodeId:s.node.id,title:s.node.title,person:id,decision:'approve',automatic:true,reference:evidence.id,opinion:'免重复审批，沿用'+evidence.title+'的同意结果'});
        s.approved.push(record);reused=true;
        if(s.node.mode==='any')break;
      }
      if(complete(s)){run.index++;continue;}
      if(reused)continue;
      return;
    }
    run.status='approved';
  }
  function decide(state,run,{person,decision,opinion='',signature=[]}){
    if(terminal.includes(run.status))return ['本次申请已结束处理'];
    refresh(state,run);if(run.status!=='running')return run.issue.length?run.issue:['当前没有待处理节点'];
    const r=M.rulesFor(run.template),errors=[],s=current(run);
    if(!pending(run).includes(person))errors.push('当前人员没有本节点办理权');
    if(!['approve','return','reject'].includes(decision))errors.push('请选择处理结果');
    if(decision==='return'&&!r.returnAllowed)errors.push('本模板不允许退回补充');
    if((decision!=='approve'||r.approveOpinionRequired)&&!opinion.trim())errors.push('请填写审批意见');
    if(decision==='approve'&&r.signatureRequired&&!validSignature(signature))errors.push('请完成手写签名');
    if(errors.length)return errors;
    const record=log(run,{nodeId:s.node.id,title:s.node.title,person,decision,opinion:opinion.trim(),signature:decision==='approve'&&r.signatureRequired?M.clone(signature):[]});
    if(decision==='approve'){s.approved.push(record);refresh(state,run);}else run.status=decision==='return'?'returned':'rejected';
    return [];
  }
  function handover(state,run,{recipient,reason='',person,administrator=false}){
    if(terminal.includes(run.status))return ['本次申请已结束处理'];
    refresh(state,run);const s=current(run),r=M.rulesFor(run.template),errors=[];
    if(!s)return ['没有待处理节点'];
    if(administrator?run.status!=='paused':run.status!=='running'||!r.transferAllowed||!pending(run).includes(person))errors.push('当前不能转交');
    if(!M.eligible(state,recipient,run.context.company)||recipient===run.context.applicant)errors.push('请选择本公司有审批授权且不是申请人的接替人');
    if(!administrator&&(recipient===person||s.members?.includes(recipient)))errors.push('接替人不能是自己或本节点已有审批人');
    if(s.approved.some(a=>a.person===recipient))errors.push('接替人已完成本节点审批，请另选人员');
    if(administrator&&s.available.includes(recipient))errors.push('接替人已在本节点待审批，请另选人员');
    if(!reason.trim())errors.push('请填写交接原因');
    if(errors.length)return errors;
    s.members=administrator?[...new Set([...s.approved.map(a=>a.person),...s.available,recipient])]:s.members.map(id=>id===person?recipient:id);
    log(run,{nodeId:s.node.id,title:s.node.title,person:administrator?'administrator':person,decision:'handover',opinion:reason.trim(),recipient});
    refresh(state,run);return [];
  }
  function withdraw(run,reason=''){
    if(!M.rulesFor(run.template).withdrawAllowed||!['running','paused'].includes(run.status))return ['当前不允许撤回'];
    if(!reason.trim())return ['请填写撤回原因'];
    log(run,{person:run.context.applicant,decision:'withdraw',opinion:reason.trim()});run.status='withdrawn';return [];
  }
  function resubmit(state,run,context){
    if(run.status!=='returned')return ['只有退回的申请可以重新提交'];
    const next=start(state,run.template,context,run.version);if(next.errors.length)return next.errors;
    run.round++;run.context=next.run.context;run.steps=next.run.steps;run.index=0;run.status='running';run.issue=[];
    log(run,{person:run.context.applicant,decision:'resubmit',opinion:context.reason?.trim()||'修改后重新提交，重新核对审批结果'});refresh(state,run);return [];
  }
  const api={start,current,pending,refresh,decide,handover,withdraw,resubmit,validSignature};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ApprovalRuleRun=api;
})(typeof window!=='undefined'?window:globalThis);
