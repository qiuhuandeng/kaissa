(function(root){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)), names={'12301':'12301',fadada:'法大大'}, generations={platform:'填写平台模板',file:'系统生成文件',manual:'到平台办理'};
const settings=()=>root.ContractPrepare?.settings||root.ContractSettings?.newState()||(typeof require!=='undefined'?require('./contract-settings-data').newState():null);
function binding(c){return c.submittedBinding||c.platformBinding||c.preparation?.templateSnapshot?.platformBinding||{provider:c.provider||'',generation:c.generation||'platform',version:c.templateVersion};}
function name(c){return names[binding(c).provider]||'来源待核实';}
function signing(c){return c.submittedSigning||c.signingConfig||c.preparation?.templateSnapshot?.signing||{order:'同时签署',documents:[{name:'合同正文',sign:true,roles:['必要游客／代表','我方公司'],position:'文末签署区（随分页定位）'}]};}
function regulatory(c){return c.regulatory||{result:'待确认',channel:'待确认',path:'待核实',evidence:''};}
function adopt(c,t,o){
 c.platformBinding=copy(t.platformBinding||{provider:t.provider,generation:t.generation,version:t.version,config:t.platformConfig||null});
 c.platformBinding.templateId=t.id;c.signingConfig=copy(t.signing);c.handling=t.generation==='manual'?'到平台办理':'平台签署并监管处理';
 const s=settings(),r=s?.regulatoryRules.find(r=>r.company===o.company&&r.business===o.business&&r.range===t.range);
 c.regulatory=copy(r||o.regulatoryExample||{result:'待确认',channel:'待确认',path:'待核实',evidence:''});
 c.filing=c.regulatory.result==='经确认不适用'?'经确认不适用':c.regulatory.result==='需要报送'?'未提交':'适用要求待确认';
 c.manualAccess=o.manualAccess||'query';
}
function packageKey(c){return JSON.stringify([c.company,c.version,c.template,c.templateVersion,c.platformBinding||binding(c),signing(c),c.preparedDocument||'',c.preparedHTML||'',c.signingPeople,c.preparation?.signers,c.people,c.signers.map(p=>[p.id,p.name,p.covers]),c.parties,c.attachments,c.amount,c.deadline,c.note,c.terms,c.termChanges]);}
function issues(c){
 if(c.channel==='线下归档')return [];
 const b=binding(c),out=[];
 if(!names[b.provider])out.push('签署平台来源待核实，不能默认改用其他平台');
 if(!generations[b.generation])out.push('文书生成方式待核实');
 const s=settings(),D=root.ContractSettings||(typeof require!=='undefined'?require('./contract-settings-data'):null);
 if(D&&s)out.push(...D.companyIssues(s.companies.find(x=>x.id===c.company),'2026-09-28',b.provider).map(x=>'平台授权管理员：'+x));
 if(c.reviewedPackage&&c.reviewedPackage!==packageKey(c))out.push('本次文书、平台或签署安排已改变，请重新预览并审核');
 if(c.submittedSigning&&c.signingConfig&&JSON.stringify(c.submittedSigning)!==JSON.stringify(c.signingConfig))out.push('已发起合同的签署安排不能途中改动');
 if(c.submittedBinding&&c.platformBinding&&JSON.stringify(c.submittedBinding)!==JSON.stringify(c.platformBinding))out.push('已发起的合同须沿用原平台，不能在途中换平台');
 return [...new Set(out)];
}
function review(c){c.reviewedPackage=packageKey(c);}
function freeze(c){c.submittedBinding=copy(binding(c));c.submittedSigning=copy(signing(c));c.requestId=c.id+'-申请-'+c.attempts;c.requestCompany=c.company;c.requestProvider=binding(c).provider;}
function number(c){return '演示-'+binding(c).provider+'-'+c.id;}
function identity(c,envelope){
 if(!envelope)return [];
 if(envelope.provider!==binding(c).provider||envelope.company!==c.company||envelope.contractId!==c.id)return ['结果所属平台、公司或合同不一致，保留原记录'];
 if(envelope.requestId&&envelope.requestId!==c.requestId)return ['非本次申请的结果，请核对原申请'];
 if(envelope.number&&c.platformNo&&envelope.number!==c.platformNo)return ['平台办理号与原申请不一致'];
 return [];
}
function orderIssues(c,side){const x=signing(c).order;if(side==='customer'&&x==='我方先签，客户后签'&&c.seal!=='已盖章')return ['按本份签署顺序，请先核对我方签章'];if(side==='company'&&x==='客户先签，我方后签'&&c.signers.some(p=>p.status!=='已签署'))return ['按本份签署顺序，全部必要客户完成后再核对我方签章'];return [];}
function completed(c){const r=regulatory(c);if(['未提交','待备案','适用要求待确认'].includes(c.filing))c.filing=r.result==='需要报送'?'待备案':r.result==='经确认不适用'?'经确认不适用':'适用要求待确认';}
function regulatoryIssues(c){const r=regulatory(c);if(c.status!=='已签署')return ['各方签署尚未完成'];if(r.result==='待确认'||!r.evidence)return ['监管适用要求及依据待管理员确认'];if(r.result==='经确认不适用')return ['已确认不适用监管报送，请保留确认依据'];if(r.channel==='待确认'||r.path==='待核实')return ['监管接收渠道或办理路径待核实'];return [];}
function setRegulatory(c,r){if(!['待确认','需要报送','经确认不适用'].includes(r.result))return ['请选择适用要求'];if(r.result!=='待确认'&&!r.evidence?.trim())return ['请填写监管要求确认依据'];if(r.result==='需要报送'&&(!r.channel||r.channel==='待确认'||!r.path||r.path==='待核实'))return ['请明确接收渠道和获准办理路径'];if(c.regulatoryAttempts||c.regulatorNo||c.filing==='已备案')return ['已有监管办理记录，保留原要求并先核对原申请'];c.regulatory=copy(r);c.filing=r.result==='经确认不适用'?'经确认不适用':r.result==='需要报送'?'未提交':'适用要求待确认';completed(c);return [];}
function fileResult(c,result){if(!['已签署','已解除'].includes(c.status))return ['尚无各方完成的签署文件'];if(!['已取得文件','暂未取得','签署证明待取得'].includes(result))return ['文件结果无效'];if(result==='已取得文件'){c.fileReady=true;c.proofReady=true;c.fileRecord={provider:binding(c).provider,company:c.company,number:c.platformNo,version:c.version,file:c.id+'_'+c.version+'_已签文件（样例）.html',proof:c.id+'_签署证明（样例）.html'};}else if(result==='签署证明待取得'){c.fileReady=true;if(c.proofReady!==true)c.proofReady=false;}c.fileMessage=result==='暂未取得'?'本次未取得，已取得文件保留':result;return [];}
root.ContractChannel={names,generations,binding,name,signing,regulatory,adopt,packageKey,issues,review,freeze,number,identity,orderIssues,completed,regulatoryIssues,setRegulatory,fileResult,settings};
if(typeof module!=='undefined')module.exports=root.ContractChannel;
})(typeof window==='undefined'?globalThis:window);
