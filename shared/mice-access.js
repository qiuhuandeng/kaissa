(function(){'use strict';const U=MiceUI,D=U.store.data;let profile='auto';const profiles={owner:{name:'张三',company:'北京凯撒',role:'负责人'},combined:{name:'李梅',company:'北京凯撒',role:'销操兼岗'},sales:{name:'陈刚',company:'北京凯撒',role:'销售'},planner:{name:'李梅',company:'北京凯撒',role:'计调'},plannerZhao:{name:'赵磊',company:'北京凯撒',role:'计调'},plannerWang:{name:'王芳',company:'北京凯撒',role:'计调'},collaborator:{name:'周伟',company:'北京凯撒',role:'协作查看'},approver:{name:'刘总监',company:'北京凯撒',role:'审批人'},finance:{name:'财务复核员',company:'北京凯撒',role:'财务'},foreign:{name:'福建协作',company:'福建凯撒',role:'协作查看'}};
function current(){return {...(profile==='auto'?profiles[location.pathname.includes('/finance/')?'finance':location.pathname.includes('/approval/')?'approver':location.pathname.includes('/sales/')?'sales':'owner']:profiles[profile]||profiles.owner),superAdmin:true};}
function allowed(action,project){
 if(['cost-search','cost-reset','cost-clear-activity'].includes(action))return true;
 const p=project||contextProject();
 // 岗位只说明职责。结束项目仍按业务状态限制新增办理，查看和输出保持可用。
 if(p&&['已结项','已终止'].includes(p.status)&&!(/^(tab|report-export|project-info|cost-adjust|approval-view)/.test(action)||/-(view|export|print)$/.test(action)))return false;
 return true;
}
function contextProject(){if(window.MiceActivity?.project)return MiceActivity.project;const q=U.q,id=q.get('projectId')||(location.pathname.includes('product-custom-detail')?q.get('id'):''),a=U.store.find('activities',q.get('id')||q.get('activityId')),o=U.store.find('orders',q.get('orderNo'));return U.store.find('projects',id||a?.projectId||o?.projectId);}
function enforce(){const app=document.querySelector('#mice-app');if(!app)return;for(const b of app.querySelectorAll('[data-mice-action]')){const reason=b.dataset.unavailable||(!allowed(b.dataset.miceAction,U.store.find('projects',b.dataset.project))?'当前业务状态不可办理':'');b.disabled=!!reason;b.title=reason;}}

document.addEventListener('click',e=>{const b=e.target.closest('[data-mice-action]');if(b&&!allowed(b.dataset.miceAction,U.store.find('projects',b.dataset.project))){e.preventDefault();e.stopImmediatePropagation();U.toast('当前业务状态不可办理','error');}},true);let queued=false;U.ready(()=>{enforce();new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enforce();});}).observe(document.querySelector('.content')||document.body,{childList:true,subtree:true});});window.MiceAccess={useFixture(name){sessionStorage.setItem('caesar-mice-access-fixture',name);location.reload();},current,allowed,project:p=>!!p};
})();
