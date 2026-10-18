(function () {
  'use strict';
  const params=new URLSearchParams(location.search), legacyNo=params.get('contractNo')||'',kind=params.get('kind')||(legacyNo.startsWith('CRU')?'cruise':legacyNo.startsWith('TRN')?'train':'air');
  if(['cruise','train'].includes(kind))return;
  const M=window.AirInventory,X=window.AirInventoryExcel;
  document.title='机位管理 - 凯撒旅游';
  const old=document.getElementById('traffic-procurement-legacy'),root=document.createElement('div');root.id='air-inventory';old.replaceWith(root);
  const records=M.seed(),groups=[],selected=new Set();let tab='全部',role='超级管理员',page=1,drawerState=null,dirty=false,focusBefore=null,confirmAction=null;
  const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=s=>root.querySelector(s),$$=s=>Array.from(root.querySelectorAll(s));
  const money=n=>Number(n||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const option=(val,label,current)=>`<option value="${h(val)}" ${String(current)===String(val)?'selected':''}>${h(label)}</option>`;
  const options=(arr,current,blank='请选择')=>(blank===null?'':option('',blank,current))+arr.map(x=>typeof x==='string'?option(x,x,current):option(x.id,x.name,current)).join('');
  const btn=(text,action,id='',cls='btn btn-secondary',extra='')=>`<button type="button" class="${cls}" data-air="${action}" data-id="${h(id)}" ${extra}>${h(text)}</button>`;
  const link=(text,action,id='',extra='')=>btn(text,action,id,'air-link',extra);
  const can=()=>true;
  function checkRole(){}
  const find=id=>records.find(r=>r.id===id);
  function toast(text){const el=$('#air-toast');el.textContent=text;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4500);}
  function error(e){const el=$('#air-error');if(el){el.textContent=e.message||e;el.hidden=false;el.scrollIntoView({block:'nearest'});}else toast(e.message||e);}
  const field=(label,key,value,type='text',extra='')=>`<label class="air-field"><span>${h(label)}</span><input name="${key}" data-field="${key}" type="${type}" value="${h(value)}" ${extra}></label>`;
  const select=(label,key,opts)=>`<label class="air-field"><span>${h(label)}</span><select name="${key}" data-field="${key}">${opts}</select></label>`;
  const section=(title,body,actions='')=>`<section class="air-section"><h3>${h(title)}${actions}</h3>${body}</section>`;
  const kv=(label,value)=>`<div><dt>${h(label)}</dt><dd>${h(value||'—')}</dd></div>`;
  const flight=id=>M.flights.find(f=>f.id===id);
  function flightSegments(r){
    const segments=Array.isArray(r.flightSegments)?M.clone(r.flightSegments):['out',...(r.back?['back']:[])].map(direction=>({direction,flight:r[direction]||''}));
    const seen=new Set();return segments.map(segment=>{
      if(!seen.has(segment.direction)&&r[segment.direction]!=null&&r[segment.direction]!==segment.flight)segment={direction:segment.direction,flight:r[segment.direction]};
      seen.add(segment.direction);const f=flight(segment.flight);return {...segment,from:segment.from??f?.from??'',to:segment.to??f?.to??''};
    });
  }
  const markupType=r=>r.markupType??'固定金额';
  const markupLabel=r=>markupType(r)==='比例'?'加价比例（%）':markupType(r)==='固定金额'?'加价金额（'+r.currency+'/席）':'加价值';
  const markupDisplay=r=>r.markup===''||r.markup==null?'待补':markupType(r)==='比例'?Number(r.markup)+'%':money(r.markup)+' '+r.currency+'/席';
  function markupFields(r,rowIndex){const row=rowIndex!=null,attrs=key=>row?`data-row="${rowIndex}" data-rowkey="${key}"`:`name="${key}" data-field="${key}"`;
    return `<div class="air-markup-fields${row?'':' air-markup-with-currency'}">${row?'':select('币种','currency',options(['CNY','USD','EUR'],r.currency,null))+field('采购单价（'+r.currency+'/席）','price',r.price,'number','id="air-generate-price" min="0" step="0.01"')}<label class="air-field"><span>加价方式</span><select ${attrs('markupType')}>${options(['固定金额','比例'],markupType(r),markupType(r)===''?'按航期分别填写':null)}</select></label><label class="air-field"><span>${h(markupLabel(r))}</span><input ${attrs('markup')} type="number" min="0" step="0.01" value="${h(r.markup)}" placeholder="${markupType(r)==='比例'?'请输入加价比例':'请输入加价金额'}"></label></div>`;
  }
  function identity(r){return `<div class="air-identity"><strong>${h(r.out||'未选航班')}${r.back?' / '+h(r.back):''} · ${h(flight(r.out)?.name||'航线待补')}</strong><span>${h(r.id)} · ${h(r.supplier||'供应商待选')} · ${h(r.cabin||'舱位待补')}</span></div>`;}
  root.innerHTML=window.AirList.html(`<section class="list-page-panel"><div class="list-page-head"><h1 class="page-title">机位管理</h1></div></section>
    <section class="air-surface"><div class="air-filter"><input id="air-keyword" type="search" aria-label="航班、采购编号或供应商" placeholder="航班 / 采购编号 / 供应商"><select id="air-type" aria-label="采购类型">${options(['系列位','单团位','包机位'],'','全部类型')}</select><label>出发日期 <input id="air-start" type="date" aria-label="出发开始日期"></label><span>至</span><input id="air-end" type="date" aria-label="出发结束日期"><select id="air-risk" aria-label="截止或异常筛选">${options(['7日内付款到期','付款已逾期','7日内退位截止','待退位确认','损耗待确认'],'','全部提醒')}</select>${btn('查询','search')}${btn('重置','reset')}<div class="air-filter-actions">${btn('Excel导入','import')}${btn('新增采购','create','','btn btn-primary')}</div></div>
    <div class="air-toolbar"><div id="air-tabs" class="air-tabs" role="tablist"></div><div class="air-selection"><span id="air-selected">未选择</span>${btn('按机位建团','groups')}</div></div>
    <div class="air-table-scroll" id="air-list-scroll"><table class="air-table air-list"><colgroup><col class="air-check-col"><col class="air-flight-col"><col class="air-date-col"><col class="air-type-col"><col class="air-quantity-col"><col class="air-allocated-col"><col class="air-deadline-col"><col class="air-status-col"><col class="air-action-col"></colgroup><thead><tr><th><input type="checkbox" id="air-select-all" aria-label="选择当前页"></th><th>航线 / 航班</th><th>出行日期</th><th>采购类型</th><th>可用 / 有效机位</th><th>已分配 / 订单占用</th><th>最近截止日</th><th id="air-status-heading">采购状态</th><th class="air-actions">操作</th></tr></thead><tbody id="air-rows"></tbody></table></div>
    <div class="air-pagination"><span id="air-total"></span><div>${btn('上一页','prev')}<span id="air-page"></span>${btn('下一页','next')}</div></div></section>
    <p class="air-session-note">演示资料 · 本页操作在刷新后重置</p>
    <div id="air-overlay" class="air-overlay modal-overlay drawer-overlay" data-static="true" hidden><section class="air-drawer modal drawer-modal" role="dialog" aria-modal="true" aria-labelledby="air-drawer-title"><header><div><h2 id="air-drawer-title"></h2><span id="air-drawer-meta"></span></div>${btn('×','close','','air-close','aria-label="关闭抽屉"')}</header><div id="air-drawer-body" class="air-drawer-body"></div><footer id="air-drawer-footer"></footer></section></div>
    <div id="air-confirm-overlay" class="air-confirm-overlay modal-overlay" data-static="true" hidden><section class="air-confirm modal modal-sm modal-confirm" role="alertdialog" aria-modal="true" aria-labelledby="air-confirm-title"><h2 id="air-confirm-title"></h2><p id="air-confirm-text"></p><div>${btn('取消','confirm-cancel')}${btn('确认','confirm-yes','','btn btn-primary')}</div></section></div>
    <div id="air-toast" role="status" hidden></div>`);
  function filtered(){const keyword=$('#air-keyword').value.trim().toLowerCase(),type=$('#air-type').value,start=$('#air-start').value,end=$('#air-end').value,risk=$('#air-risk').value;
    const today=new Date().toLocaleDateString('en-CA'),until=M.addDays(today,7);
    return records.filter(r=>(tab==='全部'||r.status===tab)&&(!keyword||[r.id,r.out,r.back,...flightSegments(r).map(s=>s.flight),r.supplier,r.charter,...r.allocations.map(a=>a.name)].join(' ').toLowerCase().includes(keyword))&&(!type||type===r.type)&&(!start||r.date>=start)&&(!end||r.date<=end)&&(!risk||(risk==='待退位确认'?M.stats(r).pendingReturn>0:risk==='损耗待确认'?r.returns.some(x=>x.status==='已确认'&&x.loss===null):risk==='付款已逾期'?r.status==='执行中'&&r.payments.some(p=>!p.paid&&p.date<today):risk==='7日内退位截止'?r.cutoff>=today&&r.cutoff<=until:r.payments.some(p=>!p.paid&&p.date>=today&&p.date<=until))));}
  function nextDeadline(r){const dates=[{date:r.cutoff,name:'退位截止'},...(r.payments||[]).filter(p=>!p.paid).map(p=>({date:p.date,name:p.name}))].filter(x=>x.date).sort((a,b)=>a.date.localeCompare(b.date));return dates[0];}
  function rowActions(r){const view=link('详情','detail',r.id);if(r.status==='草稿')return (can('purchase')?link('编辑','edit',r.id)+link('提交','submit',r.id):'')+view;
    if(r.status==='待确认')return(can('purchase')?link('核对','review',r.id)+link('撤回','withdraw',r.id):'')+view;
    if(r.status==='执行中')return(can('allocation')?link('分配','allocate',r.id):'')+view+(can('purchase')?`<details class="air-more"><summary>更多</summary><div>${link('申请变更','change',r.id)}${link('申请退位','return',r.id)}${link('关闭采购','close-record',r.id)}</div></details>`:'');return view;}
  function renderList(){const all=filtered();page=Math.min(page,Math.max(1,Math.ceil(all.length/10)));const visible=all.slice((page-1)*10,page*10);
    $('#air-tabs').innerHTML=['全部','草稿','待确认','执行中','已关闭','已取消'].map(t=>`<button type="button" role="tab" aria-selected="${tab===t}" class="tab-item ${tab===t?'active':''}" data-air="tab" data-id="${t}">${t}<span class="tab-count">${t==='全部'?records.length:records.filter(r=>r.status===t).length}</span></button>`).join('');
    $('#air-status-heading').textContent=tab==='全部'?'采购状态':'经办人';
    $('#air-rows').innerHTML=visible.map(r=>{const s=M.stats(r),d=nextDeadline(r),booked=`${s.allocated} / ${s.occupied} 席`;return `<tr data-record="${h(r.id)}"><td><input type="checkbox" data-select="${h(r.id)}" aria-label="选择${h(r.id)}" ${selected.has(r.id)?'checked':''}></td><td><div class="air-cell"><strong title="${h(flight(r.out)?.name||'航线待补')}">${h(flight(r.out)?.name||'航线待补')}</strong><span>${h(r.out)}${r.back?' / '+h(r.back):''} · ${h(r.cabin)}</span><small>${h(r.id)}</small></div></td><td><div class="air-cell"><span>${h(r.date||'待填写')}</span><small>${r.back?'回 '+h(r.returnDate||'待填写'):'单程'}</small></div></td><td>${h(r.type)}</td><td><div class="air-cell"><strong class="air-number">${r.status==='执行中'||r.status==='已关闭'?`${s.available} / ${s.effective} 席`:'—'}</strong><small>${s.returned?'已退回 '+s.returned+' 席':'采购 '+s.original+' 席'}</small></div></td><td><div class="air-cell"><span class="air-number">${booked}</span><small>已出票 ${s.issued} 席</small></div></td><td><div class="air-cell"><span>${h(d?.date||'—')}</span><small>${h((d?.name||'未设付款计划')+(d&&r.status==='执行中'?' · '+M.deadlineState(d.date,false,new Date().toLocaleDateString('en-CA')):''))}${s.pendingReturn?' · 待退 '+s.pendingReturn+' 席':''}</small></div></td><td>${tab==='全部'?`<span class="air-status air-status-${r.status==='执行中'?'blue':r.status==='待确认'?'orange':'gray'}">${h(r.status)}</span>`:'周伟'}</td><td class="air-actions"><div class="air-row-actions">${rowActions(r)}</div></td></tr>`;}).join('')||'<tr><td colspan="9" class="air-empty">没有符合条件的机位采购</td></tr>';
    $('#air-total').textContent=`共 ${all.length} 条`;$('#air-page').textContent=`${page} / ${Math.max(1,Math.ceil(all.length/10))}`;$('#air-selected').textContent=selected.size?`已选 ${selected.size} 条`:'未选择';$('#air-select-all').checked=visible.length>0&&visible.every(r=>selected.has(r.id));
    $('[data-air="create"]').disabled=!can('purchase');$('[data-air="import"]').disabled=!can('purchase');
  }
  function openDrawer(title,body,footer,meta=''){$('#air-overlay .air-drawer').classList.remove('air-inventory-import-drawer');focusBefore=document.activeElement;$('#air-drawer-title').textContent=title;$('#air-drawer-meta').textContent=meta;$('#air-drawer-body').innerHTML='<div id="air-error" class="air-error" role="alert" hidden></div>'+body;$('#air-drawer-footer').innerHTML=footer;$('#air-overlay').hidden=false;$('#air-overlay').classList.add('show');$('#air-overlay').setAttribute('aria-hidden','false');document.body.classList.add('air-layer-open');$('#air-drawer-body').scrollTop=0;requestAnimationFrame(()=>$('[data-air="close"]').focus());dirty=false;}
  function closeDrawer(force=false){if(dirty&&!force){ask('放弃未保存的修改？','本次尚未提交的内容将不保留。',()=>closeDrawer(true));return;}if(drawerState?.returnToDetail){const r=find(drawerState.id);dirty=false;detail(r,'机位分配');return;}$('#air-overlay').hidden=true;$('#air-overlay').classList.remove('show');$('#air-overlay').setAttribute('aria-hidden','true');drawerState=null;dirty=false;document.body.classList.remove('air-layer-open');if(focusBefore?.isConnected)focusBefore.focus();}
  function ask(title,text,fn){$('#air-confirm-title').textContent=title;$('#air-confirm-text').textContent=text;confirmAction=fn;$('#air-confirm-overlay').hidden=false;$('#air-confirm-overlay').classList.add('show');$('#air-confirm-overlay').setAttribute('aria-hidden','false');$('[data-air="confirm-cancel"]').focus();}
  function procurementDetails(r){
    const agreement=M.agreements.find(item=>item.id===r.agreement);
    const agreementName=agreement?agreement.name+'（'+agreement.id+'）':r.agreement;
    const isCharter=r.type==='包机位';
    const conditions=section('采购条件',`<dl class="air-kv air-kv-three">${kv('采购类型',r.type)}${kv('采购公司',r.company)}${kv('供应商',r.supplier)}${kv('采购协议',agreementName)}${kv('舱位',r.cabin)}${isCharter?kv('包机项目',r.charterProject||'未关联'):kv('退位截止日',r.cutoff)}${isCharter?kv('币种',r.currency):''}${kv('供应确认依据',r.evidence)}${r.type==='包机位'||r.charter?kv('包机航次',r.charter||'待填写'):''}${kv('采购状态',r.status)}</dl>`);
    const segments=flightSegments(r);
    const flights=section('航班信息',segments.map((segment,i)=>{
      const airportName=code=>airports.find(a=>a.id===code)?.name||code;
      return `<dl class="air-kv air-flight-detail">${kv('第'+(i+1)+'段',segment.direction==='out'?'去程':'回程')}${kv('航班',segment.flight||'待填写')}${kv('出发地',airportName(segment.from))}${kv('目的地',airportName(segment.to))}</dl>`;
    }).join(''));
    const dates=section(isCharter?'航期与数量':'航期与价格',`<dl class="air-kv air-kv-three">${isCharter?'':kv('币种',r.currency)+kv('加价方式',markupType(r))+kv(markupLabel(r),markupDisplay(r))}${kv('出发日期',r.date)}${kv('回程日期',r.back?(r.returnDate||'待填写'):'单程')}${kv('采购数量',r.qty+' 席')}${isCharter?kv('计价方式',r.charterPricing||'按席单价')+kv('本航次采购总额',money(M.purchaseAmount(r))+' '+r.currency):''}${kv(isCharter&&r.charterPricing==='按航次总额'?'折合每席':'采购单价',r.price===''||r.price==null?'待填写':money(r.price)+' '+r.currency+'/席')}</dl>`);
    const hasPre=r.preDept||r.preProduct||r.preOwner||r.preQty;
    const pre=section('前置分配',hasPre?`<dl class="air-kv air-kv-three">${kv('分配部门',r.preDept||'暂不分配')}${kv('负责产品',M.products.find(p=>p.id===r.preProduct)?.name||r.preProduct||'暂不指定')}${kv('负责计调',r.preOwner||'暂不指定')}${kv('每期分配数量',r.preQty?r.preQty+' 席':'未填写')}</dl>`:'<p class="air-muted">未设置</p>');
    const terms=isCharter?section('退位约定',`<dl class="air-kv air-kv-three">${kv('是否允许退位',r.returnPolicy||'按原协议')}${r.returnPolicy!=='不可退位'?kv('退位截止日',r.cutoff):''}${kv('退位／取消条件',r.returnTerms||'按原协议')}</dl>`):'';
    return conditions+flights+dates+terms+pre;
  }
  function detail(r,which='采购资料',review=false){drawerState={mode:'detail',id:r.id,which};const s=M.stats(r);
    let content='';
    if(which==='采购资料')content=procurementDetails(r);
    if(which==='机位分配')content=section('数量核对',`<div class="air-counts">${[['采购',s.original],['已退回',s.returned],['有效机位',s.effective],['公共余位',s.available],['已分配未订',s.unbooked],['订单占用',s.occupied],['其中已出票',s.issued]].map(([n,q])=>`<div><span>${n}</span><strong>${q}<small> 席</small></strong></div>`).join('')}</div><p class="air-muted">公共余位 ${s.available} ＋ 已分配未订 ${s.unbooked} ＋ 订单占用 ${s.occupied} ＝ 有效机位 ${s.effective}。${s.pendingReturn?'待退位确认 '+s.pendingReturn+' 席，尚未扣减。':''}</p>${r.cutoff&&r.cutoff<=M.addDays(new Date().toLocaleDateString('en-CA'),7)&&s.effective>s.occupied?'<p class="air-warning">退位截止 '+h(r.cutoff)+'，尚有 '+(s.effective-s.occupied)+' 席未订；请核对余位安排及协议退位条件。</p>':''}`)+allocationTable(r,r.status==='执行中');
    if(which==='付款安排')content=section('付款计划',`${r.paymentReview?'<p class="air-warning">采购已变更，付款计划待财务复核；已申请与实付记录保留。</p>':''}<div class="air-table-scroll"><table class="air-table air-detail-table"><thead><tr><th>节点 / 截止日</th><th>计划金额</th><th>申请记录</th><th>实付金额</th><th>操作</th></tr></thead><tbody>${r.payments.map((p,i)=>`<tr><td><div class="air-cell"><strong>${h(p.name)}</strong><span>${h(p.date)}</span><small>${h(M.deadlineState(p.date,p.paid,new Date().toLocaleDateString('en-CA')))}</small></div></td><td>${money(p.amount)} ${h(r.currency)}</td><td>${h(p.request||'未申请')}</td><td>${money(p.paid)} ${h(r.currency)}</td><td>${can('purchase')&&r.status==='执行中'&&!p.request&&!p.paid?link('付款申请','payment',r.id,`data-index="${i}"`):p.paid?'已付':p.request?'待财务处理':'—'}</td></tr>`).join('')||'<tr><td colspan="5" class="air-empty">尚未设置付款计划</td></tr>'}</tbody></table></div><p class="air-muted">付款申请由财务审核、执行，实付以付款记录为准。</p>`);
    if(which==='变更记录')content=section('采购变更与供应商退位',recordChanges(r))+section('操作记录',`<ol class="air-history">${r.logs.map(l=>`<li><strong>${h(l.action)}</strong><span>${h(l.detail)}</span><small>${h(l.time)} · ${h(l.by)}</small></li>`).join('')}</ol>`);
    openDrawer(review?'核对采购':'机位详情',identity(r)+`<div class="air-tabs air-detail-tabs">${['采购资料','机位分配','付款安排','变更记录'].map(t=>btn(t,'detail-tab',t,which===t?'active':'')).join('')}</div>`+content,(r.status==='草稿'&&can('purchase')?btn('取消采购','cancel-record',r.id):'')+(r.status==='待确认'&&can('purchase')?btn('退回草稿','withdraw',r.id)+btn('确认入库','confirm-stock',r.id,'btn btn-primary'):'')+btn('关闭','close'));
  }
  function allocationTable(r,editable){return section('分配明细',`<div class="air-table-scroll"><table class="air-table air-detail-table"><thead><tr><th>部门 / 团期 / 分销客户</th><th>来源额度</th><th>分配 / 可释放</th><th>订单占用 / 出票</th><th>产品 / 计调</th>${editable?'<th>操作</th>':''}</tr></thead><tbody>${r.allocations.filter(a=>a.qty).map(a=>`<tr><td><div class="air-cell"><strong>${h(a.name)}</strong><small>${h(a.kind)}</small></div></td><td>${h(r.allocations.find(p=>p.id===a.parent)?.name||'公共余位')}</td><td>${a.qty} / ${M.free(r,a.id)} 席</td><td>${a.occupied} / ${a.issued} 席</td><td><div class="air-cell"><span>${h(M.products.find(p=>p.id===a.product)?.name||'—')}</span><small>${h(a.owner||'待分配')}</small></div></td>${editable?`<td>${M.free(r,a.id)>0?link('释放','release',a.id):'—'}</td>`:''}</tr>`).join('')||`<tr><td colspan="6" class="air-empty">尚未分配，可先分到部门，无需团号</td></tr>`}</tbody></table></div>`);}
  function recordChanges(r){return `<div class="air-table-scroll"><table class="air-table air-detail-table"><thead><tr><th>单号 / 类型</th><th>数量</th><th>原因 / 确认依据</th><th>状态</th><th>损耗金额</th><th>操作</th></tr></thead><tbody>${[...r.returns.map(x=>({...x,kind:'退位'})),...r.changes.map(x=>({...x,kind:'采购变更'}))].map(x=>`<tr><td><div class="air-cell"><strong>${h(x.id)}</strong><small>${x.kind}</small></div></td><td>${x.kind==='退位'?x.qty:x.before+' → '+x.after} 席</td><td><div class="air-cell"><span>${h(x.reason)}</span><small>${h(x.evidence||'确认依据待补')}</small></div></td><td>${h(x.status)}</td><td>${x.kind==='退位'?(x.loss==null?'待确认':money(x.loss)+' '+r.currency):'—'}</td><td>${can('purchase')&&x.status==='待确认'?link('核对','review-change',x.id,`data-kind="${x.kind}"`):'—'}</td></tr>`).join('')||'<tr><td colspan="6" class="air-empty">暂无变更记录</td></tr>'}</tbody></table></div>`;}
  function newBase(){return{company:M.company,type:'系列位',supplier:'中国国际航空',agreement:'CA-JP-2026-01',out:'CA927',back:'CA928',date:'2027-02-05',returnDate:'2027-02-11',qty:30,price:3200,markupType:'固定金额',markup:0,cabin:'经济舱G',currency:'CNY',cutoff:'2026-12-20',evidence:'国航机位采购确认资料（演示）',charter:'',payments:[],preDept:'',preQty:'',preProduct:'',preOwner:''};}
  const charterForm=()=>drawerState?.mode==='editor'&&drawerState.data.type==='包机位'&&!drawerState.importMode;
  function charterDefaults(){return {...newBase(),type:'包机位',supplier:'海南航空',agreement:'HU-CH-2026-01',out:'HU7995',back:'HU7996',date:'2026-12-19',returnDate:'2026-12-24',qty:160,price:4000,charterProject:'马累12月19日包机',charter:'12月19日往返航次',charterPricing:'按航次总额',charterTotal:640000,returnPolicy:'不可退位',returnTerms:'已确认包机款按协议承担；航司同意调整时另行确认。',cutoff:'',evidence:'海航包机确认书 HU-MLE-1219',payments:[{name:'首款',date:'2026-10-25',amount:128000},{name:'尾款',date:'2026-12-10',amount:512000}]};}
  function charterData(raw){const defaults=charterDefaults(),d={...defaults,...M.clone(raw)};
    ['charterProject','charter','charterPricing','returnPolicy','returnTerms','date','currency','supplier','agreement','evidence','cabin'].forEach(k=>{if(d[k]===''||d[k]==null)d[k]=defaults[k];});
    d.qty=Number(d.qty)>0?Number(d.qty):defaults.qty;d.price=Number(d.price)>0?Number(d.price):defaults.price;
    d.charterTotal=Number(d.charterTotal)>0?Number(d.charterTotal):d.qty*d.price;
    if(d.charterPricing==='按航次总额')d.price=d.charterTotal/d.qty;else d.charterTotal=d.qty*d.price;
    if(!d.back)d.returnDate='';else if(!d.returnDate)d.returnDate=defaults.returnDate;
    if(d.returnPolicy==='不可退位')d.cutoff='';
    return d;
  }
  function switchPurchaseType(type){const ds=drawerState,was=ds.editorType||ds.data.type,isCharter=type==='包机位';
    if((was==='包机位')===isCharter||ds.importMode){ds.data.type=type;ds.editorType=type;ds.rows.forEach(r=>{delete r.type;});renderEditor();dirty=true;return;}
    ds.typeDrafts=ds.typeDrafts||{};ds.typeDrafts[was==='包机位'?'charter':'regular']=M.clone({data:ds.data,rows:ds.rows,flightRows:ds.flightRows,filename:ds.filename});
    const saved=ds.typeDrafts[isCharter?'charter':'regular'];
    if(saved)Object.assign(ds,M.clone(saved));else{ds.data=isCharter?charterDefaults():newBase();ds.rows=[{selected:true}];ds.flightRows=null;ds.filename='';}
    ds.data.type=type;ds.editorType=type;ds.expanded=-1;renderEditor();dirty=true;
  }
  function charterFields(d){const total=d.charterPricing==='按航次总额';return section('航期与数量',`<div class="air-form-grid">${field('出发日期','date',d.date,'date')}${d.back?field('回程日期','returnDate',d.returnDate,'date'):''}${field('采购座位数','qty',d.qty,'number')}${select('计价方式','charterPricing',options(['按航次总额','按席单价'],d.charterPricing,null))}${total?field('本航次采购总额（'+d.currency+'）','charterTotal',d.charterTotal,'number','step="0.01"'):field('采购单价（'+d.currency+'/席）','price',d.price,'number','step="0.01"')}<div class="air-field"><span>${total?'折合每席（'+d.currency+'）':'本航次采购总额（'+d.currency+'）'}</span><input id="air-charter-amount" readonly value="${money(total?Number(d.charterTotal)/Number(d.qty||1):Number(d.qty)*Number(d.price))}"></div></div>`);}
  function createEditor(existing,importMode=false){if(importMode)return startInventoryImport();checkRole('purchase');let data=existing?M.clone(existing):newBase();if(data.type==='包机位')data=charterData({...data,charterProject:data.charterProject||data.charter?.replace(/第.*航次/,'')||'',charterPricing:data.charterPricing||'按席单价',returnPolicy:data.returnPolicy||'按协议退位',returnTerms:data.returnTerms||'按采购协议约定执行。'});drawerState={mode:'editor',editorType:data.type,editing:existing?.id,data,rows:[{date:data.date,returnDate:data.returnDate,qty:data.qty,price:data.price,selected:true}],importMode,expanded:-1};renderEditor();}
  function mergedRows(){if(charterForm())return [charterData(drawerState.data)];return drawerState.rows.map(r=>{const row={...drawerState.data,...r,company:M.company};if(Array.isArray(row.flightSegments))row.flightSegments=flightSegments(row);return row;});}
  const airports=Array.from(new Map(M.flights.flatMap(f=>[[f.from,{id:f.from,name:f.name.split(' → ')[0]}],[f.to,{id:f.to,name:f.name.split(' → ')[1]}]])).values());
  function initFlightRows(){const ds=drawerState;ds.flightRows=flightSegments(ds.data);if(!Array.isArray(ds.data.flightSegments)&&!ds.data.back&&ds.rows.some(r=>r.back))ds.flightRows.push({direction:'back',flight:'',from:'',to:''});}
  function setEditorFlight(direction,value,clearDates=false){const ds=drawerState;ds.data[direction]=value;ds.rows.forEach(r=>{delete r[direction];});if(direction==='back'){
    const duration=Number($('#air-generate-duration')?.value??6);
    if(charterForm()){if(clearDates)ds.data.returnDate='';else if(value&&!ds.data.returnDate)ds.data.returnDate=M.addDays(ds.data.date,duration);return;}
    ds.rows.forEach(r=>{if(clearDates)r.returnDate='';else if(value&&!r.returnDate&&M.validDate(r.date))r.returnDate=M.addDays(r.date,duration);});
    ds.data.returnDate=ds.rows[0]?.returnDate||'';
  }}
  function syncFlightRows(){const ds=drawerState;
    ds.flightRows.sort((a,b)=>(a.direction==='out'?0:1)-(b.direction==='out'?0:1));
    ['out','back'].forEach(direction=>{const rows=ds.flightRows.filter(r=>r.direction===direction);setEditorFlight(direction,rows[0]?.flight||'',!rows.length);});
    ds.data.flightSegments=M.clone(ds.flightRows);ds.rows.forEach(r=>{delete r.flightSegments;});
  }
  function renderFlightRows(){const ds=drawerState;if(!ds.flightRows)initFlightRows();
    $('#air-flight-editor').innerHTML=ds.flightRows.map((r,i)=>{
      const direction='第'+(i+1)+'段'+(r.direction==='out'?'去程':'回程');
      const control=(label,key,opts,required=false)=>`<label class="air-field air-flight-${key}"><span>${label}${required?' <em class="air-required">*</em>':''}</span><select data-flight-row="${i}" data-flight-key="${key}" aria-label="${direction}${label}" ${required?'aria-required="true"':''}>${opts}</select></label>`;
      return `<div class="air-flight-row">${control('第'+(i+1)+'段','direction',['out','back'].map(key=>`<option value="${key}" ${r.direction===key?'selected':''}>${key==='out'?'去程':'回程'}</option>`).join(''))}${control('航班','flight',options(M.flights.map(f=>({id:f.id,name:f.id+' · '+f.name})),r.flight,'请选择航班'),true)}${control('出发地','from',options(airports,r.from),true)}${control('目的地','to',options(airports,r.to),true)}${link('删除','remove-flight',i,`aria-label="删除${direction}航班"`)}</div>`;
    }).join('')||'<p class="air-muted">暂无航段，可点击“添加航段”填写。</p>';
    if(charterForm()&&$('#air-charter-dates'))$('#air-charter-dates').innerHTML=charterFields(ds.data);
    const duration=$('#air-generate-duration');if(duration){duration.disabled=!ds.flightRows.some(r=>r.direction==='back');duration.closest('label').hidden=duration.disabled;}
  }
  function renderEditor(){if(drawerState.importFlow)return renderInventoryImport();const d=drawerState.data,ds=drawerState,isCharter=charterForm();ds.editorType=d.type;
    const typeField=select('采购类型','type',options(['系列位','单团位','包机位'],d.type,'按航期分别填写'));
    const common=section('采购条件',`<div class="air-form-grid">${typeField}${field('采购公司','company',M.company,'text','readonly')}${select('供应商','supplier',options([...new Set(M.agreements.filter(a=>!isCharter||a.types.includes('包机位')).map(a=>a.supplier))],d.supplier))}${select(isCharter?'包机／切位协议':'采购协议','agreement',options(M.agreements.filter(a=>!isCharter||a.types.includes('包机位')).map(a=>({id:a.id,name:a.id+' · '+a.name})),d.agreement,'明确选择供应协议'))}${field('舱位','cabin',d.cabin)}${isCharter?select('币种','currency',options(['CNY','USD','EUR'],d.currency,null)):field('退位截止日','cutoff',d.cutoff,'date')}${isCharter?field('包机项目','charterProject',d.charterProject)+field('包机航次','charter',d.charter):''}${field('供应确认依据','evidence',d.evidence)}${ds.importMode?field('包机航次（包机位填写）','charter',d.charter):''}</div>`);

    const g=ds.generate||(ds.generate={start:d.date,gap:7,count:Math.max(1,ds.rows.length),duration:6,qty:d.qty});
    const generateField=(label,key,unit='',type='number')=>`<label class="air-field"><span>${label}</span><span class="air-unit-input"><input id="air-generate-${key}" data-generator="${key}" type="${type}" value="${h(g[key])}" ${type==='number'?'min="'+(key==='duration'?0:1)+'"':''}>${unit?'<em>'+unit+'</em>':''}</span></label>`;
    const generate=!ds.editing?`<div class="air-editor-group"><div class="air-group-heading"><strong>航期设置</strong></div><div class="air-generator">${generateField('开始日期','start','','date')}${generateField('航期间隔','gap','天')}${generateField('航期数','count','期')}${generateField('往返间隔','duration','天')}${generateField('每期席位','qty','席')}${btn('生成航期','generate')}</div></div>`:'';
    const importPanel=!ds.editing?`<div id="air-import-panel" class="air-import-tools" ${ds.importOpen||ds.importMode?'':'hidden'}><label class="btn btn-secondary">选择文件<input id="air-file" type="file" accept=".xlsx,.csv" hidden></label>${link('下载模板','template')}<span id="air-import-filename">${h(ds.filename||'支持 Excel / CSV；未选择文件时保留当前资料')}</span></div>`:'';
    const dateRows=isCharter?'<div id="air-charter-dates">'+charterFields(d)+'</div>':section('航期与价格',`<div class="air-pricing-workspace">${importPanel}${generate}<div class="air-editor-group air-pricing-group"><div class="air-group-heading"><strong>统一价格</strong><span>下方可逐期调整</span></div><div id="air-markup-editor">${markupFields(d)}</div></div><div id="air-preview"></div></div>`,!ds.editing?btn(ds.importOpen||ds.importMode?'收起导入':'导入航期','toggle-import','','btn btn-secondary',`aria-expanded="${!!(ds.importOpen||ds.importMode)}" aria-controls="air-import-panel"`):'');
    const payments=section(isCharter?'协议付款安排':'付款安排',`<div id="air-payment-editor">${paymentEditor(d)}</div>${link('添加付款节点','add-payment')}<span class="air-muted"> 按确认的付款计划填写，金额不是实付。</span>`);
    const terms=isCharter?section('退位约定',`<div class="air-form-grid">${select('是否允许退位','returnPolicy',options(['不可退位','按协议退位'],d.returnPolicy,null))}${d.returnPolicy==='按协议退位'?field('退位截止日','cutoff',d.cutoff,'date'):''}${field('退位／取消条件','returnTerms',d.returnTerms)}</div>`):'';
    const pre=section('前置分配（选填）',`<div class="air-form-grid">${select('分配部门','preDept',options(['日本产品部','欧洲产品部','包机经营部'],d.preDept,'暂不分配'))}${select('负责产品','preProduct',options(M.products,d.preProduct,'暂不指定'))}${field('负责计调','preOwner',d.preOwner)}${field('每期分配数量','preQty',d.preQty,'number','min="1"')}</div>`);
    openDrawer(ds.editing?'编辑采购':ds.importMode?'导入机位采购':'新增机位采购',common+section('航班信息','<div id="air-flight-editor"></div>',btn('添加航段','add-flight'))+dateRows+payments+terms+pre,btn('取消','close')+btn('保存草稿','save-draft')+btn(isCharter?'提交采购':'提交有效行','save-submit','','btn btn-primary'),'');renderFlightRows();renderPreview();
  }
  function paymentEditor(d){return d.payments.map((p,i)=>`<div class="air-payment-line"><label>节点 <select data-payment="${i}" data-paykey="name">${options(d.type==='包机位'?[...new Set(['首款','进度款','尾款','全款',p.name])]:['一押','二押','尾款','全款'],p.name,null)}</select></label><label>截止日 <input type="date" data-payment="${i}" data-paykey="date" value="${h(p.date)}"></label><label>每航期金额 <input type="number" min="0" step="0.01" data-payment="${i}" data-paykey="amount" value="${h(p.amount)}"></label>${link('删除','remove-payment',i)}</div>`).join('')||'<p class="air-muted">暂无付款节点，可先保存采购，再按协议维护。</p>';}
  function previewStatus(errors,index){return errors.length?link('待核对 · '+errors.length,'expand-row',index,`aria-label="查看第${index+1}期核对提示"`).replace('class="air-link"','class="air-link air-review-link"'):'<span class="air-ready">已就绪</span>';}
  function previewSummary(rows,errors){return '已选 '+rows.filter((r,i)=>drawerState.rows[i].selected!==false).length+' 期'+(errors.some(e=>e.length)?' · '+errors.filter(e=>e.length).length+' 期待核对':'');}
  function renderPreview(){if(charterForm())return;const ds=drawerState,rows=mergedRows(),errs=M.batchValidate(rows,records);ds.errors=errs;
    $('#air-preview').innerHTML=`<div class="air-preview-head"><strong>航期明细 <span class="air-period-count">${rows.length}</span></strong><span id="air-preview-summary">${previewSummary(rows,errs)}</span>${ds.filename?link('导出待核对行','download-errors','',errs.some(e=>e.length)?'':'hidden'):''}</div><div class="air-table-scroll air-preview-scroll"><table class="air-table air-preview-table"><colgroup><col style="width:40px"><col style="width:48px"><col style="width:144px"><col style="width:144px"><col style="width:88px"><col><col style="width:116px"><col style="width:96px"></colgroup><thead><tr><th><input type="checkbox" id="air-preview-all" aria-label="选择全部航期" ${rows.length&&ds.rows.every(r=>r.selected!==false)?'checked':''}></th><th>${ds.filename?'文件行':'序号'}</th><th>出发日期</th><th>回程日期</th><th>席位</th><th>采购单价</th><th>核对</th><th class="air-preview-actions">操作</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><input type="checkbox" data-preview-select="${i}" aria-label="选择航期${i+1}" ${ds.rows[i].selected!==false?'checked':''}></td><td class="air-row-number">${ds.filename?r.sourceRow||i+2:i+1}</td>${['date','returnDate','qty','price'].map(k=>`<td><input data-row="${i}" data-rowkey="${k}" aria-label="第${i+1}行${k}" type="${['qty','price'].includes(k)?'number':'date'}" value="${h(r[k])}" ${k==='returnDate'&&!r.back?'disabled':''} ${k==='price'?'step="0.01"':''}></td>`).join('')}<td>${previewStatus(errs[i],i)}</td><td class="air-preview-actions">${link(ds.expanded===i?'收起':'调整','expand-row',i)}${!ds.editing?link('移除','remove-row',i):''}</td></tr>${ds.expanded===i?`<tr class="air-expanded-row"><td colspan="8"><div class="air-row-notes" ${errs[i].length?'':'hidden'}><strong>核对提示</strong><span>${errs[i].map(h).join('；')}</span></div><div class="air-row-editor air-form-grid">${['type','supplier','agreement','out','back','cabin','currency','cutoff','evidence','charter'].map(k=>`<label class="air-field"><span>${h(X.headers[X.fields.indexOf(k)])}</span><input data-row="${i}" data-rowkey="${k}" value="${h(r[k])}"></label>`).join('')}${markupFields(r,i)}</div></td></tr>`:''}`).join('')||'<tr><td colspan="8" class="air-empty">暂无航期，请生成或导入</td></tr>'}</tbody></table></div>`;
    const all=$('#air-preview-all');if(all)all.indeterminate=ds.rows.some(r=>r.selected!==false)&&ds.rows.some(r=>r.selected===false);
  }
  function validatePreview(){
    if(drawerState?.mode!=='editor'||charterForm())return;
    const rows=mergedRows(),errors=M.batchValidate(rows,records);drawerState.errors=errors;
    const summary=$('#air-preview-summary');if(summary)summary.textContent=previewSummary(rows,errors);
    const notes=$('.air-row-notes'),expanded=errors[drawerState.expanded]||[];if(notes){notes.hidden=!expanded.length;notes.querySelector('span').textContent=expanded.join('；');}
    const download=$('#air-preview [data-air="download-errors"]');if(download)download.hidden=!errors.some(e=>e.length);
    $$('#air-preview tbody tr').filter(tr=>tr.querySelector('[data-preview-select]')).forEach((tr,i)=>{tr.children[6].innerHTML=previewStatus(errors[i],i);});
  }
  function saveEditor(draft){checkRole('purchase');const ds=drawerState,rows=mergedRows(),errors=charterForm()?rows.map(()=>[]):M.batchValidate(rows,records);const chosen=rows.map((r,i)=>({r,i})).filter(x=>ds.rows[x.i].selected!==false&&(draft||!errors[x.i].length));if(!chosen.length){renderPreview();throw Error(draft?'请至少选择一个航期':'所选行均未通过校验，请修正标红内容');}
    chosen.forEach(({r})=>{if(ds.editing){const original=find(ds.editing);if(original.status!=='草稿')throw Error('只能编辑草稿');Object.assign(original,r,{id:ds.editing,status:draft?'草稿':'待确认'});M.log(original,draft?'保存草稿':'提交采购',r.date);}else records.unshift(M.make(r,draft?'草稿':'待确认'));});
    const indexes=new Set(chosen.map(x=>x.i));ds.rows=ds.rows.filter((_,i)=>!indexes.has(i));dirty=false;renderList();if(ds.rows.length){renderPreview();toast(`${chosen.length} 行已${draft?'保存草稿':'提交核对'}；剩余 ${ds.rows.length} 行保留`);}else{closeDrawer(true);toast(`已${draft?'保存':'提交'} ${chosen.length} 个航期${draft?'草稿':'，核对确认后入库'}`);}
  }
  function startInventoryImport(){const d=newBase();drawerState={mode:'editor',importFlow:true,importMode:true,stage:'source',data:d,rows:Array.from({length:3},(_,i)=>({...d,date:M.addDays(d.date,i*7),returnDate:M.addDays(d.returnDate,i*7),sourceRow:i+2,selected:true})),filename:'机位采购演示资料',demo:true,expanded:-1};renderInventoryImport();}
  function inventoryImportSteps(){return '<ol class="air-import-steps">'+['选择资料','核对数据','导入结果'].map((s,i)=>'<li class="'+(i===['source','review','result'].indexOf(drawerState.stage)?'current':'')+'"><span>'+(i+1)+'</span>'+s+'</li>').join('')+'</ol>';}
  function renderInventoryImport(){const ds=drawerState;let body='',footer='';
    if(ds.stage==='source'){body=section('采购资料',`<label class="air-import-upload"><input id="air-file" type="file" accept=".xlsx,.csv" aria-label="选择机位采购文件"><strong>选择 Excel / CSV 文件</strong><span>可选；未选择时保留下方演示资料</span></label><p class="air-muted">${h(ds.filename)} · ${ds.rows.length} 个航期</p><div class="air-table-scroll"><table class="air-table"><thead><tr><th>航班</th><th>出发日期</th><th>席位</th><th>采购单价</th></tr></thead><tbody>${mergedRows().slice(0,5).map(r=>`<tr><td>${h(r.out)} / ${h(r.back)}</td><td>${h(r.date)}</td><td>${h(r.qty)}</td><td>${money(r.price)} ${h(r.currency)}</td></tr>`).join('')}</tbody></table></div>`);footer=btn('下载模板','template')+btn('下一步：核对数据','inventory-import-next','','btn btn-primary');}
    if(ds.stage==='review'){body=section('核对采购航期',`<p class="air-muted">${h(ds.filename)} · 可逐行调整，缺少资料的记录保留为草稿。</p><div id="air-preview"></div>`);footer=btn('上一步','inventory-import-source')+btn('确认导入','inventory-import-apply','','btn btn-primary');}
    if(ds.stage==='result'){body=section('导入结果',`<p>已提交 ${ds.result.filter(r=>r.state==='待确认').length} 条 · 草稿 ${ds.result.filter(r=>r.state==='草稿').length} 条 · 跳过 ${ds.result.filter(r=>r.state==='跳过').length} 条</p><div class="air-table-scroll"><table class="air-table"><thead><tr><th>来源行</th><th>采购编号 / 航期</th><th>结果</th><th>说明</th></tr></thead><tbody>${ds.result.map(r=>`<tr><td>${r.sourceRow}</td><td>${h(r.id||'—')}<br>${h(r.date)}</td><td>${h(r.state)}</td><td>${h(r.note)}</td></tr>`).join('')}</tbody></table></div>`);footer=btn('完成','inventory-import-finish','','btn btn-primary');}
    openDrawer('导入机位采购',inventoryImportSteps()+body,btn('关闭','close')+footer);$('#air-overlay .air-drawer').classList.add('air-inventory-import-drawer');if(ds.stage==='review')renderPreview();
  }
  function applyInventoryImport(){const ds=drawerState;if(ds.stage!=='review')return;ds.result=mergedRows().map((r,i)=>{const errors=M.validate(r,records),duplicate=errors.some(e=>e.includes('重复'));if(ds.rows[i].selected===false||duplicate)return{sourceRow:r.sourceRow||i+2,date:r.date,state:'跳过',note:duplicate?'已有相同采购，未重复建立':'本次未选择'};const record=M.make(r,errors.length?'草稿':'待确认');records.unshift(record);return{sourceRow:r.sourceRow||i+2,date:r.date,id:record.id,state:record.status,note:errors.length?errors.join('；'):'等待核对入库'};});ds.stage='result';dirty=false;renderList();renderInventoryImport();}
  function allocation(r){checkRole('allocation');drawerState={mode:'allocation',id:r.id,data:{kind:'部门额度',parent:'',company:M.company,name:'',product:'',owner:'',qty:1}};renderAllocation();}
  function schedulesFor(r){return [{id:'MATCH',name:'JP-'+r.date.replaceAll('-','')+'-002',company:M.company,date:r.date,returnDate:r.returnDate,out:r.out,back:r.back,capacity:30,product:'JP'},{id:'OTHERDATE',name:'JP-20261218-003（日期不同）',company:M.company,date:'2026-12-18',returnDate:'2026-12-24',out:'CA927',back:'CA928',capacity:30,product:'JP'},{id:'OTHERCOMPANY',name:'JP-'+r.date.replaceAll('-','')+'-004（福建凯撒）',company:'福建凯撒国际旅行社',date:r.date,returnDate:r.returnDate,out:r.out,back:r.back,capacity:30,product:'JP'},...groups.filter(g=>g.record===r.id).map(g=>({id:g.no,name:g.no,company:g.company,date:g.date,returnDate:g.returnDate,out:r.out,back:r.back,capacity:Number(g.qty),product:drawerState.data.product||'JP'}))];}
  function renderAllocation(){const ds=drawerState,r=find(ds.id),d=ds.data,s=M.stats(r);const parentOptions=[{id:'',name:'公共余位 · '+s.available+'席'},...r.allocations.filter(a=>a.kind==='部门额度').map(a=>({id:a.id,name:a.name+' · 可下分 '+M.free(r,a.id)+'席'}))];
    openDrawer('机位分配',identity(r)+`<div class="air-allocation-bar"><span>有效 ${s.effective} 席 · 公共余位 ${s.available} 席 · 已分配 ${s.allocated} 席</span></div>`+section('新增分配',`<div class="air-form-grid">${select('分配方式','kind',options(['部门额度','团期使用','外部分销'],d.kind,null))}${select('来源额度','parent',options(parentOptions,d.parent,null))}${select('使用公司','company',options([M.company,'福建凯撒国际旅行社'],d.company,null))}${d.kind==='团期使用'?select('选择团期','schedule',options(schedulesFor(r),d.schedule)):select(d.kind==='部门额度'?'分配部门':'分销客户','name',options(d.kind==='部门额度'?['日本产品部','欧洲产品部','包机经营部']:['北京远行旅行社','上海寰游旅行社'],d.name))}${select('负责产品','product',options(M.products,d.product,'暂不指定'))}${field('负责计调','owner',d.owner)}${field('分配数量','qty',d.qty,'number','min="1"')}</div>`),btn('取消','close')+btn('确认分配','allocate-save','','btn btn-primary'));}
  let scheduleHost=null,scheduleContext=null,scheduleTimer=null,scheduleFocus=null;
  const scheduleMessageTarget=location.protocol==='file:'?'*':location.origin;
  function isScheduleOrigin(origin){return location.protocol==='file:'?['null','file://'].includes(origin):origin===location.origin;}
  function sendScheduleContext(){
    const frame=scheduleHost?.querySelector('iframe');if(!frame||!scheduleContext||scheduleContext.sent)return;
    scheduleContext.sent=true;frame.contentWindow.postMessage({type:'caesar:air-seats:prefill',detail:scheduleContext},scheduleMessageTarget);
  }
  function closeScheduleBuilder(){clearTimeout(scheduleTimer);scheduleHost?.remove();scheduleHost=null;scheduleContext=null;document.body.classList.remove('product-schedule-batch-drawer-open');if(scheduleFocus?.isConnected)scheduleFocus.focus();}
  function openScheduleBuilder(list){
    if(!list.length)throw Error('请先勾选需要建团的机位采购');
    if(list.some(r=>r.status!=='执行中'||M.free(r)<=0))throw Error('请选择已确认入库且有公共余位的机位采购');
    const r=list[0];
    if(list.some(x=>!['company','agreement','type','out','back','cabin','currency'].every(k=>x[k]===r[k])))throw Error('请按相同公司、协议、航班及舱位分批建团');
    const related=[...list].sort((a,b)=>a.date.localeCompare(b.date));
    const product=M.products.find(p=>p.out===r.out&&p.back===r.back);
    const context={id:r.id,company:r.company,agreement:r.agreement,cabin:r.cabin,currency:r.currency,product:product?.name||'',route:product?.plan||'',flights:[{direction:'去程',...flight(r.out)},...(r.back?[{direction:'回程',...flight(r.back)}]:[])],dates:related.map(x=>({record:x.id,date:x.date,returnDate:x.returnDate,available:M.free(x)}))};
    closeScheduleBuilder();scheduleFocus=document.activeElement.closest('details')?.querySelector('summary')||document.activeElement;$$('details[open]').forEach(el=>el.open=false);scheduleContext={...context,sent:false,created:false};
    scheduleHost=document.createElement('div');scheduleHost.className='product-schedule-batch-drawer-host air-schedule-builder-host loading';
    scheduleHost.innerHTML='<iframe class="product-schedule-batch-drawer-frame" title="新建团期" src="schedules.html?open=batch&amp;embed=batchDrawer&amp;source=airInventory&amp;v=20261018-air-builder4"></iframe><div class="air-schedule-loading modal-overlay drawer-overlay show"><section class="modal drawer-modal" role="dialog" aria-modal="true" aria-labelledby="air-schedule-loading-title"><div class="modal-header"><h2 id="air-schedule-loading-title" class="modal-title">新建团期</h2><button type="button" class="modal-close" data-schedule-cancel aria-label="关闭新建团期">×</button></div><div class="modal-body" role="status">正在载入新建团期…</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-schedule-cancel>取消</button></div></section></div>';
    scheduleHost.querySelectorAll('[data-schedule-cancel]').forEach(button=>button.addEventListener('click',closeScheduleBuilder));
    scheduleHost.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeScheduleBuilder();}});
    document.body.append(scheduleHost);document.body.classList.add('product-schedule-batch-drawer-open');
    scheduleHost.querySelector('[data-schedule-cancel]').focus();
    scheduleTimer=setTimeout(()=>{if(scheduleHost?.classList.contains('loading')){closeScheduleBuilder();toast('新建团期暂未打开，请重试');}},15000);
  }
  window.addEventListener('message',event=>{
    const frame=scheduleHost?.querySelector('iframe');if(!frame||event.source!==frame.contentWindow||!isScheduleOrigin(event.origin))return;
    const message=event.data||{};
    if(message.type==='caesar:batch-drawer:ready')sendScheduleContext();
    if(message.type==='caesar:air-seats:prefilled'){clearTimeout(scheduleTimer);scheduleHost.querySelector('.air-schedule-loading')?.remove();scheduleHost.classList.remove('loading');scheduleHost.classList.add('show');document.body.classList.add('product-schedule-batch-drawer-open');}
    if(message.type==='caesar:batch-drawer:created'&&!scheduleContext.created){
      scheduleContext.created=true;
      (message.detail?.schedules||[]).forEach(g=>{const date=scheduleContext.dates.find(x=>x.date===g.depart);if(date)groups.push({no:g.code,record:date.record,company:scheduleContext.company,date:g.depart,returnDate:g.back,qty:g.stock,product:g.product});});
      toast('已创建 '+(message.detail?.schedules||[]).length+' 个筹备中团期');
    }
    if(message.type==='caesar:batch-drawer:close')closeScheduleBuilder();
  });
  function simple(mode,r,entry){checkRole(mode==='release'?'allocation':'purchase');drawerState={mode,id:r.id,entry,data:{qty:1,reason:'',evidence:'',loss:''}};let body='',title='';
    if(mode==='return'){title='申请供应商退位';body=section('退位申请',`<p class="air-muted">公共余位 ${M.stats(r).available} 席，待确认退位 ${M.stats(r).pendingReturn} 席。部门或团期额度须先释放；已出票请从原订单办理退票。</p><div class="air-form-grid">${field('退位数量','qty',1,'number','min="1"')}${field('退位原因','reason','')}</div>`);}
    if(mode==='change'){title='申请采购变更';drawerState.data.qty=r.qty;body=section('数量变更',`<p class="air-muted">当前采购 ${r.qty} 席，已退回 ${M.stats(r).returned} 席，已分配 ${M.stats(r).allocated} 席。供应商确认后生效。</p><div class="air-form-grid">${field('变更后采购量','qty',r.qty,'number','min="1"')}${field('变更原因','reason','')}</div><p class="air-muted">已申请及实付金额保留；变更后由财务复核付款安排。</p>`);}
    if(mode==='release'){const a=r.allocations.find(x=>x.id===entry);title='释放分配额度';body=section(a.name,`<p class="air-muted">可释放 ${M.free(r,entry)} 席；回到${a.parent?'上级部门额度':'公共余位'}，不会退回供应商。</p>${field('释放数量','qty',1,'number','min="1"')}`);}
    if(mode==='confirm-return'){const a=r.returns.find(x=>x.id===entry);title='核对供应商退位';body=section('供应商确认',`<p>申请退位 ${a.qty} 席 · ${h(a.reason)}</p><div class="air-form-grid">${field('供应商确认依据','evidence','')}${field('确认损耗金额（可留空待确认）','loss','','number','min="0" step="0.01"')}</div><p class="air-muted">按协议和供应商确认填写损耗，不自动套用比例。确认退位后才扣减机位。</p>`);}
    if(mode==='confirm-change'){const a=r.changes.find(x=>x.id===entry);title='核对采购变更';body=section('供应商确认',`<p>${a.before} → ${a.after} 席 · ${h(a.reason)}</p>${field('供应商确认依据','evidence','')}`);}
    openDrawer(title,identity(r)+body,btn('取消','close')+btn(mode.startsWith('confirm')?'确认生效':mode==='release'?'确认释放':'提交申请','simple-save','','btn btn-primary'),r.id);
  }
  async function action(a,id,el){
    if(a==='close')return closeDrawer();
    if(a==='confirm-cancel'){confirmAction=null;$('#air-confirm-overlay').hidden=true;$('#air-confirm-overlay').classList.remove('show');$('#air-confirm-overlay').setAttribute('aria-hidden','true');return;}
    if(a==='confirm-yes'){const fn=confirmAction;confirmAction=null;$('#air-confirm-overlay').hidden=true;$('#air-confirm-overlay').classList.remove('show');$('#air-confirm-overlay').setAttribute('aria-hidden','true');if(fn)fn();return;}
    if(a==='tab'){tab=id;page=1;renderList();return;}
    if(a==='search'){page=1;if($('#air-start').value&&$('#air-end').value&&$('#air-start').value>$('#air-end').value)throw Error('开始日期不能晚于结束日期');renderList();return;}
    if(a==='reset'){$('#air-keyword').value='';$('#air-type').value='';$('#air-start').value='';$('#air-end').value='';$('#air-risk').value='';page=1;renderList();return;}
    if(a==='prev'||a==='next'){page=Math.max(1,page+(a==='next'?1:-1));renderList();return;}
    if(a==='inventory-import-next'){drawerState.stage='review';return renderInventoryImport();}
    if(a==='inventory-import-source'){drawerState.stage='source';return renderInventoryImport();}
    if(a==='inventory-import-apply')return applyInventoryImport();
    if(a==='inventory-import-finish')return closeDrawer(true);
    if(a==='create'||a==='import')return createEditor(null,a==='import');
    if(a==='detail'||a==='review')return detail(find(id),'采购资料',a==='review');
    if(a==='detail-tab')return detail(find(drawerState.id),id);
    if(a==='edit')return createEditor(find(id));
    if(a==='withdraw'){checkRole('purchase');return ask('撤回采购？','采购将回到草稿，可重新编辑。',()=>{find(id).status='草稿';M.log(find(id),'撤回采购','返回草稿');closeDrawer(true);renderList();});}
    if(a==='cancel-record'){checkRole('purchase');const r=find(id);if(r.status!=='草稿')throw Error('仅草稿采购可以取消');return ask('取消采购？','采购取消后保留记录，不再进入分配。',()=>{r.status='已取消';M.log(r,'取消采购','草稿取消');closeDrawer(true);renderList();});}
    if(a==='submit'){checkRole('purchase');const r=find(id),errors=r.charterPricing?[]:M.validate(r,records,r.id);if(errors.length){createEditor(r);throw Error(errors.join('；'));}r.status='待确认';M.log(r,'提交采购','等待核对');renderList();return toast('已提交核对');}
    if(a==='confirm-stock'){checkRole('purchase');const r=find(id);M.confirm(r,records,!!r.charterPricing);renderList();return detail(r);}
    if(a==='close-record'){checkRole('purchase');const r=find(id);if(r.returns.some(x=>x.status==='待确认')||r.changes.some(x=>x.status==='待确认'))throw Error('存在待确认变更，暂不能关闭');if(r.allocations.some(x=>x.occupied>x.issued))throw Error('仍有订单未出票，暂不能关闭');return ask('关闭采购？','关闭后停止新增分配，保留采购、分配与付款记录供核对。',()=>{r.status='已关闭';M.log(r,'关闭采购','停止分配');renderList();});}
    if(a==='add-flight'){const ds=drawerState,direction=!ds.flightRows.some(r=>r.direction==='out')?'out':!ds.flightRows.some(r=>r.direction==='back')?'back':'out';const opposite=flight(ds.data[direction==='out'?'back':'out']);const f=flight(ds.data[direction])||M.flights.find(f=>f.from===opposite?.to&&f.to===opposite?.from)||M.flights[0];const added={direction,flight:f.id,from:f.from,to:f.to};ds.flightRows.push(added);syncFlightRows();dirty=true;renderFlightRows();renderPreview();$(`[data-flight-row="${ds.flightRows.indexOf(added)}"][data-flight-key="flight"]`).focus();return;}
    if(a==='remove-flight'){drawerState.flightRows.splice(Number(id),1);syncFlightRows();dirty=true;renderFlightRows();renderPreview();return;}
    if(a==='toggle-import'){const panel=$('#air-import-panel'),open=panel.hidden;panel.hidden=!open;drawerState.importOpen=open;drawerState.importMode=false;el.textContent=open?'收起导入':'导入航期';el.setAttribute('aria-expanded',String(open));return;}
    if(a==='generate'){const ds=drawerState,integer=(value,fallback,min,max)=>Number.isInteger(Number(value))&&value!==''?Math.min(max,Math.max(min,Number(value))):fallback,start=M.validDate($('#air-generate-start').value)?$('#air-generate-start').value:ds.data.date,gap=integer($('#air-generate-gap').value,7,1,365),count=integer($('#air-generate-count').value,1,1,100),duration=integer($('#air-generate-duration').value,6,0,365),qty=integer($('#air-generate-qty').value,30,1,9999),price=ds.data.price;ds.generate={start,gap,count,duration,qty};Object.entries(ds.generate).forEach(([key,value])=>{$('#air-generate-'+key).value=value;});const run=()=>{ds.rows=Array.from({length:count},(_,i)=>({date:M.addDays(start,i*gap),returnDate:ds.data.back?M.addDays(start,i*gap+duration):'',qty,price,selected:true}));ds.expanded=-1;renderPreview();dirty=true;};if(ds.rows.length>1||ds.filename)return ask('替换当前航期预览？','当前预览尚未入库，生成后将替换。',run);run();return;}
    if(a==='expand-row'){drawerState.expanded=drawerState.expanded===Number(id)?-1:Number(id);return renderPreview();}
    if(a==='remove-row'){drawerState.rows.splice(Number(id),1);dirty=true;return renderPreview();}
    if(a==='add-payment'){const d=drawerState.data;if(d.type!=='包机位'&&d.payments.length>=3)throw Error('最多设置一押、二押与尾款三个节点');d.payments.push({name:d.type==='包机位'?'进度款':['一押','二押','尾款'][d.payments.length],date:'',amount:''});$('#air-payment-editor').innerHTML=paymentEditor(d);dirty=true;return;}
    if(a==='remove-payment'){drawerState.data.payments.splice(Number(id),1);$('#air-payment-editor').innerHTML=paymentEditor(drawerState.data);dirty=true;renderPreview();return;}
    if(a==='save-draft'||a==='save-submit')return saveEditor(a==='save-draft');
    if(a==='template'){await X.download('航服机位采购模板.xlsx',[]);return toast('字段模板已下载');}
    if(a==='download-errors'){const rows=mergedRows(),errors=M.batchValidate(rows,records),bad=rows.map((r,i)=>({r,e:errors[i]})).filter(x=>x.e.length);if(!bad.length)throw Error('暂无错误行');await X.download('机位采购错误行.xlsx',bad.map(x=>x.r),bad.map(x=>x.e));return;}
    if(a==='allocate')return allocation(find(id));
    if(a==='allocate-save'){checkRole('allocation');const ds=drawerState,r=find(ds.id);let d={...ds.data};if(d.kind==='团期使用'){const s=schedulesFor(r).find(x=>x.id===d.schedule);if(!s)throw Error('请选择团期');if(d.company!==s.company)throw Error('所选团期公司与使用公司不一致');d={...d,...s,id:undefined,qty:d.qty,parent:d.parent,kind:d.kind,owner:d.owner};}M.allocate(r,d);dirty=false;renderList();if(ds.returnToDetail)detail(r,'机位分配');else closeDrawer(true);return toast('分配已保存');}
    if(a==='groups')return openScheduleBuilder(records.filter(r=>selected.has(r.id)));
    if(['return','change'].includes(a))return simple(a,find(id));
    if(a==='release'){simple('release',find(drawerState.id),id);drawerState.returnToDetail=true;return;}
    if(a==='review-change')return simple(el.dataset.kind==='退位'?'confirm-return':'confirm-change',find(drawerState.id),id);
    if(a==='simple-save'){const ds=drawerState,r=find(ds.id),d=ds.data;checkRole(ds.mode==='release'?'allocation':'purchase');if(ds.mode==='return')M.requestReturn(r,d.qty,d.reason);if(ds.mode==='change')M.requestChange(r,d.qty,d.reason);if(ds.mode==='release')M.release(r,ds.entry,d.qty);if(ds.mode==='confirm-return')M.confirmReturn(r,ds.entry,d.evidence,d.loss);if(ds.mode==='confirm-change')M.confirmChange(r,ds.entry,d.evidence);dirty=false;renderList();if(ds.mode==='release')detail(r,'机位分配');else detail(r,'变更记录');return toast('处理已保存');}
    if(a==='payment'){checkRole('purchase');const r=find(id),i=Number(el.dataset.index),p=r.payments[i];return ask('提交付款申请？',p.name+' · '+money(p.amount)+' '+r.currency+'，截止 '+p.date+'。提交后由财务继续处理。',()=>{M.paymentRequest(r,i);detail(r,'付款安排');toast('已提交付款申请，实付金额未变');});}
  }
  root.addEventListener('click',e=>{const b=e.target.closest('[data-air]');if(!b)return;Promise.resolve().then(()=>action(b.dataset.air,b.dataset.id,b)).catch(error);});
  root.addEventListener('input',e=>{const t=e.target;if(t.dataset.generator&&drawerState?.mode==='editor'){drawerState.generate[t.dataset.generator]=t.value;dirty=true;return;}if(drawerState?.mode==='editor'&&t.dataset.field==='type')return;if(t.dataset.field&&drawerState?.data){drawerState.data[t.dataset.field]=t.value;if(drawerState.mode==='editor')drawerState.rows.forEach(r=>{delete r[t.dataset.field];});dirty=true;}if(t.dataset.row!=null&&drawerState?.mode==='editor'){drawerState.rows[Number(t.dataset.row)][t.dataset.rowkey]=t.value;dirty=true;}if(t.dataset.field==='price'&&drawerState?.mode==='editor'&&!charterForm())$$('[data-rowkey="price"]').forEach(el=>{el.value=t.value;});if(t.dataset.payment!=null){drawerState.data.payments[Number(t.dataset.payment)][t.dataset.paykey]=t.value;dirty=true;}if(charterForm()&&['qty','price','charterTotal'].includes(t.dataset.field)){const d=drawerState.data;$('#air-charter-amount').value=money(d.charterPricing==='按航次总额'?Number(d.charterTotal)/Number(d.qty||1):Number(d.qty)*Number(d.price));}if(t.dataset.groupIndex!=null){drawerState.rows[Number(t.dataset.groupIndex)][t.dataset.groupkey]=t.type==='checkbox'?t.checked:t.value;dirty=true;}});
  root.addEventListener('change',async e=>{try{const t=e.target;
    if(t.dataset.field==='type'&&drawerState?.mode==='editor')return switchPurchaseType(t.value);
    if(charterForm()&&['charterPricing','returnPolicy','currency'].includes(t.dataset.field)){const ds=drawerState,d=ds.data;d[t.dataset.field]=t.value;if(t.dataset.field==='charterPricing'){if(t.value==='按席单价')d.price=Number(d.charterTotal)/Number(d.qty||1);else d.charterTotal=Number(d.price)*Number(d.qty);}renderEditor();dirty=true;return;}
    if(t.dataset.field==='markupType'&&drawerState?.mode==='editor'){
      const ds=drawerState;ds.data.markupType=t.value;ds.data.markup=0;ds.rows.forEach(r=>{delete r.markupType;delete r.markup;});
      $('#air-markup-editor').innerHTML=markupFields(ds.data);$('#air-markup-editor input').focus();dirty=true;renderPreview();return;
    }
    if(t.dataset.field==='currency'&&drawerState?.mode==='editor'&&$('#air-markup-editor'))$('#air-markup-editor').innerHTML=markupFields(drawerState.data);
    if(t.dataset.row!=null&&t.dataset.rowkey==='markupType'&&drawerState?.mode==='editor'){drawerState.rows[Number(t.dataset.row)].markup=0;dirty=true;renderPreview();return;}
    if(t.dataset.row!=null&&t.dataset.rowkey==='currency'&&drawerState?.mode==='editor'){renderPreview();return;}
    if(t.dataset.flightRow!=null&&drawerState?.mode==='editor'){
      const ds=drawerState,r=ds.flightRows[Number(t.dataset.flightRow)],key=t.dataset.flightKey;
      if(key==='direction'){
        r.direction=t.value;
      }else if(key==='flight'){
        r.flight=t.value;const f=flight(r.flight);r.from=f?.from||'';r.to=f?.to||'';
      }else{
        r[key]=t.value;const f=flight(r.flight);if(f&&(f.from!==r.from||f.to!==r.to))r.flight='';
        const matches=M.flights.filter(f=>f.from===r.from&&f.to===r.to);if(matches.length===1)r.flight=matches[0].id;
      }
      syncFlightRows();dirty=true;renderFlightRows();renderPreview();return;
    }
    if(t.id==='air-role'){role='superadmin';renderList();return;}
    if(t.id==='air-select-all'){filtered().slice((page-1)*10,page*10).forEach(r=>t.checked?selected.add(r.id):selected.delete(r.id));renderList();return;}
    if(t.dataset.select){t.checked?selected.add(t.dataset.select):selected.delete(t.dataset.select);renderList();return;}
    if(t.id==='air-preview-all'){drawerState.rows.forEach(r=>{r.selected=t.checked;});renderPreview();return;}
    if(t.dataset.previewSelect!=null){drawerState.rows[Number(t.dataset.previewSelect)].selected=t.checked;const all=$('#air-preview-all');all.checked=drawerState.rows.every(r=>r.selected!==false);all.indeterminate=drawerState.rows.some(r=>r.selected!==false)&&drawerState.rows.some(r=>r.selected===false);validatePreview();return;}
    if(t.dataset.field&&drawerState?.data){drawerState.data[t.dataset.field]=t.value;if(drawerState.mode==='editor')drawerState.rows.forEach(r=>{delete r[t.dataset.field];});dirty=true;if(drawerState.mode==='allocation'&&['kind','parent'].includes(t.dataset.field)){const keepDirty=dirty;renderAllocation();dirty=keepDirty;}if(drawerState.mode==='editor')validatePreview();}
    if(t.dataset.row!=null||t.dataset.payment!=null)validatePreview();
    if(t.id==='air-file'&&t.files[0]){const ds=drawerState,file=t.files[0];let parsed;try{parsed=await X.read(file);}catch(_){toast('文件未读入，保留当前资料，可继续核对');return;}if(drawerState!==ds||!parsed.length)return;const apply=()=>{ds.rows=parsed.map(r=>({...r,selected:true}));ds.filename=file.name;ds.demo=false;ds.importOpen=true;ds.expanded=-1;delete ds.data.flightSegments;['type','supplier','agreement','out','back','cabin','currency','cutoff','evidence','charter','price','markupType','markup'].forEach(k=>{ds.data[k]=parsed.every(r=>r[k]===parsed[0][k])?parsed[0][k]:'';});initFlightRows();renderEditor();dirty=true;toast('已读取 '+parsed.length+' 行，请核对');};if(!ds.demo&&(ds.rows.length>1||ds.filename))ask('替换当前导入预览？','当前预览尚未提交，新的文件将替换这些行。',apply);else apply();t.value='';}
  }catch(err){error(err);}});
  root.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='air-keyword'){page=1;renderList();}const layer=!$('#air-confirm-overlay').hidden?$('#air-confirm-overlay'):!$('#air-overlay').hidden?$('#air-overlay'):null;if(!layer)return;if(e.key==='Escape'){e.preventDefault();if(!$('#air-confirm-overlay').hidden){$('#air-confirm-overlay').hidden=true;$('#air-confirm-overlay').classList.remove('show');$('#air-confirm-overlay').setAttribute('aria-hidden','true');confirmAction=null;}else closeDrawer();}if(e.key==='Tab'){const f=Array.from(layer.querySelectorAll('button,input,select,textarea,[tabindex]')).filter(x=>!x.disabled&&x.offsetParent!==null);if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0]?.focus();}}});
  renderList();
  if(legacyNo){const match=find(legacyNo);if(match)detail(match);else toast('未找到该采购编号，请从列表选择');}
  // 仅供原型验收读取；状态修改经同一业务规则，不持久化到其他页面。
  window.AirInventoryPage={records,groups,get state(){return drawerState;},render:renderList};
})();
