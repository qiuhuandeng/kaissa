(function(){
  'use strict';
  const anchor=document.getElementById('handoverList');if(!anchor)return;
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const section=document.createElement('section');section.id='projectEnterpriseContract';section.className='detail-section project-enterprise-contract';anchor.after(section);
  const settings=ContractSettings.newState();let mode='线下归档';
  function render(){const p=window.ProjectContractContext||{},t=settings.templates.find(t=>t.business===p.business&&t.customer==='企业'&&t.status==='启用'&&t.verified&&settings.companies.some(c=>c.fullName===p.company&&t.companies.includes(c.id))),available=!!t;
    if(!available)mode='线下归档';
    const params=new URLSearchParams({source:'customProject',type:'project',projectNo:p.projectNo||'',orderNo:p.orderNo||'',customer:p.customer||'',product:p.product||'',amount:p.amount||'',travelStart:p.start||'',travelEnd:p.end||'',company:p.company||'',signing:mode});
    section.innerHTML=`<div class="detail-section-header"><div><div class="detail-section-title">项目合同</div></div><span class="tag tag-orange">${p.orderNo?'待准备签约资料':'待项目订单确认'}</span></div><div class="project-enterprise-summary"><div><span>企业客户</span><strong>${e(p.customer||'待确认')}</strong></div><div><span>项目确认金额</span><strong>${p.amount?'¥'+Number(p.amount).toLocaleString('zh-CN'):'待确认'}</strong></div><div><span>签约公司</span><strong>${e(p.company||'待核对')}</strong></div><div><span>授权代表</span><strong>待核对（项目联系人：${e(p.representative||'待补')}）</strong></div></div><div class="form-grid"><label class="form-group"><span class="form-label">签约方式</span><select class="form-control" id="projectContractMode"><option ${mode==='线下归档'?'selected':''}>线下归档</option><option ${mode==='电子签约'?'selected':''} ${available?'':'disabled'}>电子签约</option></select></label><div class="form-group"><span class="form-label">企业电子模板</span><strong>${available?e(t.name+' '+t.version):'适用公司及企业模板待核对'}</strong></div></div><div class="detail-section-actions">${p.orderNo?`<a class="btn btn-primary" id="projectContractEntry" href="../sales/contracts.html?${e(params.toString())}">准备项目合同</a>`:'<span class="text-muted">确认项目订单后办理合同。</span>'}<a class="btn btn-secondary" href="../sales/contract-templates.html">查看合同模板</a></div>`;
    section.querySelector('#projectContractMode').addEventListener('change',ev=>{mode=ev.target.value;render();});
  }
  window.addEventListener('project-contract-context',render);render();
})();
