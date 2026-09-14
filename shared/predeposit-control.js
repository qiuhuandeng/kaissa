(function (root) {
  'use strict';
  root.initPredepositControl = function (options) {
    var M = root.PredepositControlModel, role = options.role, finance = role === 'finance';
    var list = document.querySelector(finance ? '.predeposit-list-surface' : '.store-predeposit-surface');
    if (!list || list.dataset.pdReady) return;
    list.dataset.pdReady = 'true'; list.classList.add('pd-master');
    var accounts = M.seed(), requests = M.requests(), rows = list.querySelector('tbody'), selected = null, editing = null, mode = '', dirty = false, closeTimer;
    if(finance)Object.keys(options.accounts).forEach(function(id){
      var old=options.accounts[id];
      if(old.type!=='门店预存'||accounts.some(function(a){return old.store.replace(/^厦门/,'')===a.name;}))return;
      var held=M.amount(old.frozen);
      accounts.push({id:id,name:old.store,accountNo:old.accountNo,holder:old.store,company:old.company,currency:'人民币',purpose:'门店订单预存',ledger:M.amount(old.available)+held,held:held,pendingCount:old.pending.length,disputes:0,status:old.status,restrictions:[],reason:'',holds:held?[{no:'原金额冻结记录',source:'订单金额冻结，详见交易明细',amount:held}]:[],history:[{date:'2026-09-14',action:'账户资料核对',operator:'公司财务',reason:old.lastChange}]});
    });
    var escape = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
    var button = function (action,label,id) { return '<button type="button" class="btn btn-secondary" data-pd-action="'+action+'"'+(id?' data-pd-id="'+escape(id)+'"':'')+'>'+label+'</button>'; };
    var grid = function (items) { return '<dl class="fa-grid">'+items.map(function(p){return '<div><dt>'+escape(p[0])+'</dt><dd>'+escape(p[1])+'</dd></div>';}).join('')+'</dl>'; };
    var toolbar = document.createElement('section'); toolbar.className='pd-toolbar';
    toolbar.innerHTML='<nav class="tab-bar" aria-label="预存账户视图">'+button('accounts','预存账户')+button('requests','开户申请')+'</nav>'+(!finance?button('new','申请开户'):'');
    list.before(toolbar);
    var applications = document.createElement('section'); applications.className='fa-table pd-applications'; applications.hidden=true; list.after(applications);
    var layer = document.createElement('div'); layer.id='predepositControlDrawer'; layer.className='modal-overlay drawer-overlay fa-layer'; layer.hidden=true; layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="modal drawer-modal drawer-xl" role="dialog" aria-modal="true" aria-labelledby="pdTitle"><div class="modal-header"><div class="modal-title" id="pdTitle">账户管理</div>'+button('dismiss','×')+'</div><div class="modal-body"></div><p class="fa-error" hidden role="alert"></p><div class="modal-footer"></div></div>';list.after(layer);
    var body=layer.querySelector('.modal-body'), footer=layer.querySelector('.modal-footer');
    var views={accounts:list,requests:applications};
    function selectView(name){Object.keys(views).forEach(function(k){views[k].hidden=k!==name;});toolbar.querySelectorAll('[data-pd-action]').forEach(function(b){b.classList.toggle('active',b.dataset.pdAction===name);});}
    function registerView(name,label,element){views[name]=element;toolbar.querySelector('nav').insertAdjacentHTML('beforeend',button(name,label));}
    function error(message) { var e=layer.querySelector('.fa-error');e.textContent=message;e.hidden=!message; }
    function show(title,content,actions) { clearTimeout(closeTimer);dirty=false;layer.querySelector('#pdTitle').textContent=title;body.innerHTML=content;footer.innerHTML=button('dismiss','关闭')+(actions||'');error('');root.caesarUI.openLayer(layer);setTimeout(function(){if(layer.isConnected&&!layer.hidden)root.caesarUI.syncDrawerTitle(layer,{title:title});},50); }
    function dismiss() { if(dirty&&!root.confirm('尚未保存，确认放弃本次修改？'))return;layer.classList.remove('show');layer.classList.add('closing');closeTimer=setTimeout(function(){layer.classList.remove('closing');layer.hidden=true;layer.setAttribute('aria-hidden','true');},360); }
    function approvalLink(r) { return '<a href="'+(finance?'../approval/approvals.html':'../../approval/approvals.html')+'?view=todo&approvalNo='+encodeURIComponent(r.approval)+'">'+escape(r.approval)+'</a>'; }
    function requestTable() {
      applications.innerHTML='<table class="fa-requests"><thead><tr><th>开户申请号</th><th>门店</th><th>负责公司 / 币种</th><th>申请状态</th><th>操作</th></tr></thead><tbody>'+requests.map(function(r){return '<tr><td>'+escape(r.id)+'</td><td>'+escape(r.name)+'</td><td>福建凯撒 / '+escape(r.currency)+'</td><td>'+escape(r.status)+'</td><td>'+button('request','详情',r.id)+'</td></tr>';}).join('')+'</tbody></table>';
    }
    function sync() {
      accounts.forEach(function(a){
        var row=Array.from(rows.children).find(function(r){return r.dataset.pdId===a.id || r.dataset.account===a.accountNo || r.dataset.accountNo===a.accountNo || ((!finance || r.dataset.type==='门店预存') && r.dataset.store && r.dataset.store.replace(/^厦门/,'')===a.name);});
        if(!row){ row=document.createElement('tr');row.innerHTML=Array(finance?9:7).fill('<td></td>').join('');rows.append(row);row.dataset.pdNew='true'; }
        if(!row.dataset.pdId&&row.dataset.accountNo)row.dataset.previousAccountNo=row.dataset.accountNo;
        row.dataset.pdId=a.id;row.dataset.store=a.name;row.dataset.status=a.status;row.dataset.account=a.accountNo;row.dataset.accountNo=a.accountNo;row.dataset.available=M.money(a.ledger-a.held);row.dataset.frozen=M.money(a.held);row.dataset.settle='预存';
        if(finance){
          var id=row.dataset.accountId||a.id;row.dataset.accountId=id;row.dataset.type='门店预存';
          var old=options.accounts[id];
          if(!old){old={objectName:a.name,type:'门店预存',store:a.name,company:'福建凯撒',owner:'公司财务',threshold:'¥0',lastChange:'开户确认',pending:[],deductions:[],ledger:[],adjustments:[]};options.accounts[id]=old;}
          old.accountNo=a.accountNo;old.available=row.dataset.available;old.frozen=row.dataset.frozen;old.status=a.status;old.controlAccount=a;
          row.dataset.process=old.pending.map(function(p){return ({recharge:'充值待确认',deduction:'扣款待确认',refund:'退款待申请',adjust:'调整待审批'})[p.actionType]||p.type;}).join('、');
          if(!row.dataset.pdInitialized && a.id==='pd-3'){old.pending=[{no:'CZSQ20260626003',type:'门店充值',source:'门店充值申请',amount:'¥30,000',status:'待确认',actionType:'recharge',actionText:'确认充值'}];old.deductions=[];old.adjustments=[];old.ledger=[];}
          if(!row.dataset.pdInitialized && a.id==='pd-5'){old.pending=[{no:'TZ20260621001',type:'金额解冻',source:'争议金额冻结 DJ20260625008',amount:'¥8,000',status:'审批中',actionType:'adjust',actionText:'审批单'}];old.ledger=[];old.adjustments=[{no:'DJ20260625008',type:'金额冻结',amount:'¥8,000',approval:'APR-20260625-031',status:'已生效',operator:'公司财务'}];}
          row.dataset.pdInitialized='true';
          row.children[0].innerHTML='<strong>'+escape(a.name)+'</strong><span class="text-muted">'+escape(a.accountNo)+'</span>';row.children[1].textContent='门店预存';row.children[2].textContent=a.company.replace('国际旅行社有限公司','');row.children[3].textContent=row.dataset.available;row.children[4].textContent=row.dataset.frozen;row.children[5].textContent=a.pendingCount+'笔';row.children[6].textContent=a.history[0].action;
        } else {
          row.children[0].innerHTML='<strong>'+escape(a.name)+'</strong><span class="text-muted">'+escape(a.accountNo)+'</span>';
          row.children[1].innerHTML='<strong>可用 '+row.dataset.available+'</strong><span class="text-muted">冻结 '+row.dataset.frozen+'</span>';
          if(row.dataset.pdNew){row.children[2].textContent='无在途';row.children[3].textContent='—';row.children[4].textContent=a.history[0].action;}
        }
        row.children[finance?7:5].innerHTML='<span class="tag '+(a.status==='冻结'?'tag-orange':a.status==='正常'?'tag-green':'tag-gray')+'">'+a.status+'</span>';
        var cell=row.lastElementChild;
        cell.querySelectorAll('[data-pd-action]').forEach(function(el){el.remove();});
        if(finance)cell.innerHTML=options.actionCell(options.accounts[row.dataset.accountId]);
        else if(row.dataset.pdNew)cell.innerHTML='';
        var oldDetail=cell.querySelector('[data-open-account]');if(oldDetail)oldDetail.textContent='交易明细';
        cell.insertAdjacentHTML('afterbegin',button('account','账户',a.id));
        cell.querySelectorAll('[data-open-apply]').forEach(function(b){b.disabled=!!M.blocked(a,'recharge');b.title=M.blocked(a,'recharge');});
      });
      if(finance)[list.querySelector('thead tr')].concat(Array.from(rows.children)).forEach(function(row){[5,6].forEach(function(i){row.children[i].classList.add('pd-low-frequency');});});
      var pagination=document.getElementById(finance?'predepositPagination':'accountPagination');if(pagination)pagination.textContent='共'+rows.children.length+'条';
      requestTable();
    }
    function account(a) {
      selected=a;mode='account';
      var restrictions={recharge:'充值',deduction:'订单扣款',refund:'余额退款'};
      var content=grid([['门店 / 账户号',a.name+' / '+a.accountNo],['账户状态',a.status],['余额归属方',a.holder],['负责公司',a.company],['币种',a.currency],['用途',a.purpose],['账面余额',M.money(a.ledger)],['金额冻结 / 可用余额',M.money(a.held)+' / '+M.money(a.ledger-a.held)]])+
        '<h3>整户控制</h3><p>'+escape(a.status==='已关闭'?'账户已关闭，保留历史查询和对账。':a.status==='冻结'?'限制：'+a.restrictions.map(function(v){return restrictions[v];}).join('、')+'。'+a.reason:'账户正常，可按业务条件办理充值、扣款及退款。')+'</p><p class="fa-note">整户冻结不改变账面余额和金额冻结；查询、对账及历史交易记录继续保留。客户预存、保证金和待结收益分别管理，不计入本账户可用余额。</p>'+
        '<h3>金额冻结明细</h3>'+ (a.holds.length?'<div class="fa-table"><table><thead><tr><th>冻结单号</th><th>来源</th><th>金额</th></tr></thead><tbody>'+a.holds.map(function(h){return '<tr><td>'+escape(h.no)+'</td><td>'+escape(h.source)+'</td><td>'+M.money(h.amount)+'</td></tr>';}).join('')+'</tbody></table>':'<p>无有效金额冻结。</p>')+
        '<h3>关闭检查</h3>'+grid(M.closeChecks(a).map(function(c){return [c.label,c.ok?'已满足':'未满足'];}))+
        '<h3>账户处理记录</h3><div class="fa-table"><table><thead><tr><th>时间</th><th>操作 / 经办人</th><th>原因 / 依据</th></tr></thead><tbody>'+a.history.map(function(h){return '<tr><td>'+h.date+'</td><td>'+h.action+' / '+h.operator+'</td><td>'+escape(h.reason)+'</td></tr>';}).join('')+'</tbody></table>'+
        '<p class="fa-note"><a href="'+(finance?'finance-reconciliation.html':'reconciliation.html')+'">查看对账记录</a></p>';
      var actions=finance&&a.status!=='已关闭'?button(a.status==='正常'?'freeze':'restore',a.status==='正常'?'整户冻结':'恢复账户')+button('close','关闭账户'):a.status==='已关闭'&&!finance?button('reopen','重新申请开户'):'';
      show('账户管理',content,actions);
    }
    function controlForm(action) {
      mode=action;var labels={freeze:'整户冻结',restore:'恢复账户',close:'关闭账户'};
      var content=grid([['门店',selected.name],['账户号',selected.accountNo],['账面余额',M.money(selected.ledger)],['金额冻结',M.money(selected.held)]]);
      if(action==='freeze')content+='<fieldset class="fa-checks"><legend>限制的操作（至少一项）</legend><label><input type="checkbox" name="restriction" value="recharge">充值</label><label><input type="checkbox" name="restriction" value="deduction" checked>订单扣款</label><label><input type="checkbox" name="restriction" value="refund" checked>余额退款</label></fieldset>';
      if(action==='restore')content+='<p>恢复本账户的整户限制。仍有效的订单及争议金额冻结保持不变，可用余额仍为 '+M.money(selected.ledger-selected.held)+'。</p>';
      if(action==='close')content+=grid(M.closeChecks(selected).map(function(c){return [c.label,c.ok?'已满足':'未满足'];}))+'<p>所有检查通过后才能关闭；已关闭账户保留记录，再次使用须重新开户。</p>';
      content+='<label class="fa-field">处理原因（必填）<textarea name="reason" rows="3"></textarea></label>';
      show(labels[action],content,button('execute','确认'+labels[action]));
    }
    function requestDetail(r) {
      editing=r;mode='request';
      var content=grid([['门店',r.name],['开户申请号',r.id],['申请状态',r.status],['正式账户号',r.accountNo||'尚未开通'],['余额归属方',r.holder],['负责公司',r.company],['币种',r.currency],['用途',r.purpose],['开户资料',r.proof]])+
        '<p>核准记录：'+(r.approval?approvalLink(r):'尚未提交')+'</p>'+(r.reused?'<p>已随财务配置核准，覆盖本次余额归属方、公司、币种及用途，直接引用原核准结果。</p>':'')+(r.reason?'<p>退回原因：'+escape(r.reason)+'</p>':'')+'<p class="fa-note">门店提交申请 → 财务在审批中心审核 → 公司财务执行开通。审核通过后仍须开通成功才生成账户号。</p>';
      var actions=finance&&r.status==='待开通'?button('activate','开通账户'):!finance&&['草稿','已退回','已撤回'].indexOf(r.status)>=0?button('edit','编辑申请'):!finance&&r.status==='审批中'?button('withdraw','撤回申请'):'';
      show('开户申请',content,actions);
    }
    function form(r) {
      editing=r||{id:'KHSQ'+Date.now(),name:'五缘湾门店',holder:'五缘湾门店',company:'福建凯撒国际旅行社有限公司',currency:'人民币',purpose:'门店订单预存',proof:'',status:'草稿'};mode='form';
      var names=['五缘湾门店','湖里门店','杏林门店','开元门店','东海门店'];if(names.indexOf(editing.name)<0)names.push(editing.name);
      show('申请开户','<div class="fa-form-grid"><label class="fa-field">门店<select name="store">'+names.map(function(n){return '<option'+(n===editing.name?' selected':'')+'>'+n+'</option>';}).join('')+'</select></label><label class="fa-field">余额归属方<input name="holder" value="'+escape(editing.holder)+'" readonly></label><label class="fa-field">负责公司<input value="'+escape(editing.company)+'" readonly></label><label class="fa-field">币种<input value="人民币" readonly></label><label class="fa-field">用途<input value="门店订单预存" readonly></label></div><label class="fa-field">开户资料及协议说明（必填）<textarea name="proof" rows="3">'+escape(editing.proof)+'</textarea></label><p class="fa-note">按门店已核准财务配置带入。需要变更余额归属方、公司、币种或用途时，先调整财务配置。已有完整核准申请可在开户申请中直接查看。</p>',button('draft','保存草稿')+button('submit','提交审核'));
    }
    function guard(action, legacy) { var a=legacy&&legacy.controlAccount;return a?M.blocked(a,action):legacy&&legacy.status==='已关闭'?'账户已关闭，仅可查询历史记录。':''; }
    function click(event) {
      if(!list.isConnected)return;
      var b=event.target.closest('[data-pd-action]');if(!b)return;
      if(!toolbar.contains(b)&&!applications.contains(b)&&!layer.contains(b)&&!list.contains(b))return;
      var action=b.dataset.pdAction;
      try {
        if(views[action]){selectView(action);return;}
        if(action==='dismiss'){dismiss();return;}
        if(action==='account'){account(accounts.find(function(a){return a.id===b.dataset.pdId;}));return;}
        if(action==='request'){requestDetail(requests.find(function(r){return r.id===b.dataset.pdId;}));return;}
        if(action==='new'){form();return;}
        if(action==='reopen'){form({id:'KHSQ'+Date.now(),name:selected.name,holder:selected.holder,company:selected.company,currency:selected.currency,purpose:selected.purpose,proof:'',status:'草稿'});return;}
        if(action==='edit'){form(editing);return;}
        if(['freeze','restore','close'].indexOf(action)>=0){controlForm(action);return;}
        if(action==='execute'){M.control(selected,mode,body.querySelector('[name=reason]').value,Array.from(body.querySelectorAll('[name=restriction]:checked')).map(function(e){return e.value;}),role);sync();account(selected);return;}
        if(action==='activate'){var a=M.open(editing,accounts,role);sync();account(a);return;}
        if(action==='withdraw'){editing.status='已撤回';requestTable();requestDetail(editing);return;}
        if(action==='draft'||action==='submit'){
          var r=Object.assign({},editing,{name:body.querySelector('[name=store]').value,holder:body.querySelector('[name=holder]').value,proof:body.querySelector('[name=proof]').value});
          if(action==='submit')M.validate(r,accounts,requests);
          r.status=action==='draft'?'草稿':'审批中';if(action==='submit'){r.approval='APR-'+r.id;r.reason='';}
          var index=requests.findIndex(function(x){return x.id===r.id;});if(index<0)requests.push(r);else requests[index]=r;
          requestTable();requestDetail(r);
        }
      }catch(e){error(e.message);}
    }
    [toolbar,applications,layer,list].forEach(function(el){el.addEventListener('click',click);});
    layer.addEventListener('input',function(){dirty=true;});layer.addEventListener('change',function(e){dirty=true;if(e.target.name==='store')body.querySelector('[name=holder]').value=e.target.value;});
    layer.addEventListener('click',function(e){if(e.target===layer)dismiss();});
    layer.addEventListener('keydown',function(e){if(e.key==='Escape'){e.stopPropagation();dismiss();}});
    sync();
    var query=new URLSearchParams(location.search);var target=query.get('opening');
    if(target){(function wait(){if(!list.isConnected)return;if(!root.caesarUI){setTimeout(wait,50);return;}var r=requests.find(function(x){return x.id===target;});if(r){list.hidden=true;applications.hidden=false;requestDetail(r);}})();}
    return {guard:guard,sync:sync,accounts:accounts,registerView:registerView,selectView:selectView};
  };
})(window);
