/* Product sharing and customer preview, scoped to the existing mobile prototype. */
window.createProductSharing=function(env){
  'use strict';
  const {M,S,esc,icon,btn,badge,back,field,select,textarea,errors,empty,dayList,go,save,toast,confirm}=env;
  const state=()=>env.state(),route=()=>env.route();
  const guestId=new URLSearchParams(location.search).get('share');
  const verified=new Set();
  const sid=()=>route().sid||guestId;
  const product=id=>M.products.find(p=>p.id===id);
  const link=id=>{const url=new URL('index.html',location.href);url.search='';url.hash='';url.searchParams.set('share',id);return url.href;};
  const date=v=>v||'日期待定';
  const header=title=>guestId?`<div class="share-guest-header"><span>CAISSA · 凯撒旅游</span><h1>${title}</h1></div>`:back(title);
  const proto='<p class="share-prototype">业务原型 · 同一浏览器演示 · 顾问资料为示例</p>';
  const intro=p=>`<div class="share-product-brief"><img src="assets/${esc(p.image)}" alt="${esc(p.subtitle)}"><div><h2>${esc(p.title)}</h2><p>${esc(p.departure)}出发 · ${p.days}日 · ${esc(p.type)}</p></div></div>`;
  const facts=rows=>`<dl class="share-facts">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const terms=p=>`<div class="card card-pad"><h3>费用包含</h3><p class="small">${esc(p.includes)}</p><h3 class="gap">费用不含</h3><p class="small">${esc(p.excludes)}</p><h3 class="gap">退改约定</h3><p class="small">${esc(p.policy)}</p></div>`;
  function shareForm(){
    const r=route(),p=product(r.id),d=r.demandId&&M.demand(state(),r.demandId),kind=r.date&&p.dates.some(z=>z.date===r.date&&z.seats>0)?'quote':'intro';
    const records=state().productShares.filter(x=>x.productId===p.id);
    return back('推荐分享')+intro(p)+`<form data-form="product-share">${errors()}<div class="card card-pad">${select('推荐内容','kind',[['intro','产品介绍'],['quote','具体出行报价']],kind)}<p class="small">产品介绍展示起价；具体报价按日期、人数及儿童规格核算。</p><fieldset class="share-quote-fields" ${kind==='intro'?'hidden disabled':''}>${select('出发日期','date',[['','请选择日期'],...p.dates.filter(x=>x.seats>0).map(z=>[z.date,z.date+' · 余'+z.seats+'位'])],r.date||'')}<div class="fields-two">${field('成人','adults',d?.adults||2,'number','min="1" max="20"')}${field('儿童','children',d?.children||0,'number','min="0" max="10"')}</div><div class="share-child-fields" ${d?.children?'':'hidden'}>${field('儿童年龄（2–11岁）','childAge',d?.childAge??'','number','min="2" max="11"')}${select('儿童规格','childBed',[['','请选择'],'不占床','占床'],d?.children?'不占床':'')}</div><div class="share-live-price" aria-live="polite"><span>本次参考总额</span><strong id="share-total">—</strong><p id="share-quote-note" class="small"></p></div></fieldset></div><div class="card card-pad">${d?`<p class="small">本次客户 · ${esc(M.customer(state(),d.customerId).name)} · ${esc(d.destination)}</p><input type="hidden" name="customerId" value="${esc(d.customerId)}">`:select('推荐客户','customerId',[['','公开产品推荐'],...state().customers.map(c=>[c.id,c.name])],'')}${field('推荐有效期','expires',S.afterDays(7),'date',`min="${M.TODAY}"`)}<p class="small">指定客户的推荐需核对身份后查看。有效期可调整，价格和余位须在预订前再次核对。</p></div>${terms(p)}<label class="check"><input type="checkbox" name="checked">已核对对客价格、费用与退改内容</label>${btn('生成对客推荐','submit-form','primary block gap')}</form><div class="hint gap">生成后可预览客户版、复制链接。分享不锁位、不生成订单，也不自动发送给客户。</div>${records.length?`<div class="section-head"><h2>本产品推荐记录</h2><span class="small">${records.length}条</span></div><div class="card">${records.map(x=>`<button class="list-row share-history" data-action="share-result" data-id="${x.id}"><span><strong>${x.kind==='quote'?'具体出行报价':'产品介绍'} · ${x.customerId?esc(M.customer(state(),x.customerId)?.name||'指定客户'):'公开推荐'}</strong><small>${x.created} · ${x.revoked?'已停止':x.expires+'前有效'}</small></span>${icon('arrow')}</button>`).join('')}</div>`:''}`;
  }
  function result(){
    const x=state().productShares.find(x=>x.id===sid());if(!x)return back('推荐分享')+empty('推荐不存在','请返回产品重新生成');const p=product(x.productId),rows=state().shareConsultations.filter(z=>z.shareId===x.id);
    let warning='';try{const v=S.view(state(),x.id);if(v.changed)warning=v.reason;}catch(e){warning=e.message;}
    return back('推荐内容')+`<div class="share-result-head">${icon(x.revoked?'clock':'check')}<h2>${x.revoked?'已停止分享':'推荐内容已准备'}</h2><p>预览确认后，再分享给客户。</p></div>${intro(p)}${warning?`<div class="hint warn gap">${esc(warning)}</div>`:''}<div class="card card-pad">${facts([['推荐内容',x.kind==='quote'?'具体出行报价':'产品介绍'],['推荐客户',x.customerId?esc(M.customer(state(),x.customerId)?.name||'指定客户'):'公开推荐'],['参考价格',x.kind==='quote'?M.money(x.total):M.money(x.introPrice)+'起 / 成人'],...(x.kind==='quote'?[['日期与人数',x.date+' · '+x.adults+'成人'+(x.children?' · '+x.children+'儿童（'+esc(x.childBed)+'）':'')]]:[]),['有效至',x.expires],['旅游顾问',esc(x.advisor.name)+' · '+esc(x.advisor.store)]])}${x.revoked?'':`<label class="field">分享链接<input class="share-link" aria-label="分享链接" value="${esc(link(x.id))}" readonly></label><div class="actions">${btn('复制链接','share-copy','secondary',`data-id="${x.id}"`)}${btn('客户版预览','share-preview','primary',`data-id="${x.id}"`)}</div>`}</div><p class="small">本地演示链接需在同一浏览器打开；跨设备分享及真实身份验证待正式服务接入。</p><div class="section-head"><h2>客户咨询</h2><span class="small">${rows.length}条</span></div>${rows.length?rows.map(z=>`<div class="card card-pad"><div class="row"><h3>${esc(z.name)}</h3>${badge(z.status)}</div><p class="small">${esc(z.phone)} · ${date(z.date)} · ${z.pax}人</p><p class="small">${esc(z.note||'希望了解本次产品')}</p>${btn(z.demandId?'查看本次需求':'核对并接待',z.demandId?'share-open-demand':'share-receive','secondary block gap',`data-id="${z.demandId||z.id}"`)}</div>`).join(''):'<p class="small gap">客户通过推荐页提交的咨询显示在这里。</p>'}${!x.revoked?btn('停止本条分享','share-revoke','secondary block gap',`data-id="${x.id}"`):''}`;
  }
  function auth(){return header('专属出行推荐')+`<div class="card card-pad"><h2>核对您的身份</h2><p class="small">这条推荐仅向指定客户提供，请使用顾问登记的手机号。</p><form data-form="share-auth">${errors()}${field('客户手机号','phone','','tel','maxlength="11" autocomplete="off"')}${field('演示验证码','code','','text','maxlength="6" inputmode="numeric" autocomplete="off"')}<p class="small">本地演示验证码为123456，不发送短信；请使用演示客户资料。</p>${btn('查看推荐','submit-form','primary block gap')}</form></div>${proto}`;}
  function guest(){
    let v;try{v=S.view(state(),sid());}catch(e){return header('客户版推荐')+empty('暂时无法查看',esc(e.message))+proto;}
    const {share:x,product:p}=v;if(x.customerId&&!verified.has(x.id))return auth();
    return header('顾问推荐')+intro(p)+`${v.changed?`<div class="hint warn gap">${esc(v.reason)}，以下为原推荐参考信息，请向顾问重新核对。</div>`:''}<div class="card card-pad">${facts(x.kind==='quote'?[['出发日期',x.date],['出行人数',x.adults+'成人'+(x.children?' · '+x.children+'儿童（'+esc(x.childBed)+'，'+x.childAge+'岁）':'')],['成人单价',M.money(x.adultUnit)],...(x.children?[['儿童单价',M.money(x.childUnit)]]:[]),[v.changed?'原参考总价':'参考总价',`<strong class="price">${M.money(x.total)}</strong>`],['有效至',x.expires]]:[['出发地',esc(p.departure)],['参考价格',M.money(x.introPrice)+'起 / 成人'],['有效至',x.expires]])}<p class="small gap">${x.mode==='二次确认'?'本团期需要二次确认。':''}分享不代表锁位或成交，价格与资源以预订核对为准。</p></div><div class="section-head"><h2>行程安排</h2></div><div class="card card-pad">${p.itinerary.length?dayList({days:p.itinerary}):`<p>${esc(p.subtitle)}</p><p class="small">详细行程请向顾问核对。</p>`}</div>${terms(p)}<div class="card card-pad"><h3>${esc(x.advisor.name)} · 您的旅游顾问</h3><p class="small">${esc(x.advisor.store)} · ${esc(x.advisor.company)}</p><p class="small">联系电话 ${esc(x.advisor.phone)}</p></div>${proto}<div class="sticky-actions">${btn('咨询本次出行','share-consult','primary block',`data-id="${x.id}"`)}</div>`;
  }
  function consultPage(){
    let v;try{v=S.view(state(),sid());}catch(e){return header('咨询顾问')+empty('暂时无法办理',esc(e.message))+proto;}
    const x=v.share;if(x.customerId&&!verified.has(x.id))return auth();
    if(route().done)return header('咨询顾问')+`<div class="share-result-head">${icon('check')}<h2>咨询已提交</h2><p>${esc(x.advisor.name)}将就本次出行与您核对。</p></div><p class="small">尚未生成订单，也未保留名额。</p>${btn('返回推荐','share-preview','primary block gap',`data-id="${x.id}"`)}${proto}`;
    const c=x.customerId&&M.customer(state(),x.customerId);
    return header('咨询顾问')+intro(v.product)+`<form data-form="share-consult">${errors()}${field('您的姓名','name',c?.name||'')}${field('联系手机号','phone',c?.phone||'','tel',`maxlength="11" ${c?'readonly':''}`)}${field('意向出发日期（可留空）','date',x.date||'','date',`min="${M.TODAY}"`)}${field('出行人数','pax',x.kind==='quote'?x.adults+x.children:2,'number','min="1" max="30"')}${textarea('想了解什么','note','','placeholder="例如：儿童费用、行程节奏、酒店安排"')}<label class="check"><input type="checkbox" name="consent">同意顾问就本次出行联系我</label>${btn('提交咨询','submit-form','primary block gap')}</form>${proto}`;
  }
  function receive(){
    const x=state().shareConsultations.find(x=>x.id===route().id),p=product(x.productId),q=state().productShares.find(q=>q.id===x.shareId),known=q.kind==='quote'&&q.adults+q.children===x.pax;
    return back('核对客户需求')+`<div class="card card-pad"><h2>${esc(x.name)}</h2><p class="small">${esc(x.phone)} · 咨询${x.pax}人</p><p class="small">来源：${esc(p.title)}</p><p>${esc(x.note||'暂无补充')}</p></div><form data-form="share-receive">${errors()}${field('目的地','destination',({p1:'日本',p2:'三亚',p3:'瑞士'})[p.id]||p.subtitle)}${field('出发城市','departure',p.departure)}${field('意向出发日期（可留空）','date',x.date,'date')}${field('行程天数','days',p.days,'number','min="1" max="30"')}<div class="fields-two">${field('成人（请核对）','adults',known?q.adults:'','number','min="1" max="20"')}${field('儿童（请核对）','children',known?q.children:'','number','min="0" max="10"')}</div>${field('儿童年龄（可稍后补充）','childAge',known?q.childAge??'':'','number','min="0" max="17"')}${textarea('需求与偏好','preference',x.note)}<p class="small">按手机号核对已有客户，保留原客户档案；接待后建立本次独立需求，不生成订单。</p>${btn('保存本次需求','submit-form','primary block gap')}</form>`;
  }
  function sync(form){
    if(form?.dataset.form!=='product-share')return;
    const quoteFields=form.querySelector('.share-quote-fields'),isQuote=form.elements.kind.value==='quote';quoteFields.hidden=!isQuote;quoteFields.disabled=!isQuote;
    form.querySelector('.share-child-fields').hidden=Number(form.elements.children.value)<=0;
    if(isQuote){try{const q=S.quote({...Object.fromEntries(new FormData(form)),productId:route().id});form.querySelector('#share-total').textContent=M.money(q.total);form.querySelector('#share-quote-note').textContent=q.mode+' · 不占用名额';}catch(e){form.querySelector('#share-total').textContent='待核对';form.querySelector('#share-quote-note').textContent=e.message;}}
  }
  async function action(a,el){
    const id=el.dataset.id;
    if(guestId&&a==='back'){env.clean();await go('share-guest',{sid:guestId},true);return true;}
    switch(a){
      case 'share-start':await go('product-share',{id,date:route().date||el.dataset.date||'',demandId:route().demandId||''});return true;
      case 'share-result':await go('share-result',{sid:id});return true;
      case 'share-preview':await go('share-guest',{sid:id});return true;
      case 'share-consult':await go('share-consult',{sid:id});return true;
      case 'share-copy':try{await navigator.clipboard.writeText(link(id));toast('链接已复制，请自行发送给客户');}catch{toast('复制受限，请长按分享链接复制');}return true;
      case 'share-revoke':if(await confirm('停止本条分享？','停止后原链接不可继续查看，已有咨询记录保留。')){S.revoke(state(),id);save();env.render();}return true;
      case 'share-receive':await go('share-receive',{id});return true;
      case 'share-open-demand':await go('intent',{id});return true;
      default:return false;
    }
  }
  async function submit(type,f,form){
    switch(type){
      case 'product-share':{const x=S.create(state(),{...f,productId:route().id,demandId:route().demandId||'',checked:form.elements.checked.checked});if(!save()){state().productShares=state().productShares.filter(z=>z.id!==x.id);throw Error('浏览器无法保存推荐，请检查存储设置后重试');}env.clean();await go('share-result',{sid:x.id},true);return true;}
      case 'share-auth':verified.add(S.verify(state(),sid(),f.phone,f.code));env.clean();await go('share-guest',{sid:sid()},true);return true;
      case 'share-consult':{S.consult(state(),sid(),{...f,consent:form.elements.consent.checked},verified.has(sid()));save();env.clean();await go('share-consult',{sid:sid(),done:true},true);return true;}
      case 'share-receive':{const d=S.accept(state(),route().id,{...f,dateMode:f.date?'exact':'unknown',month:'',dateEnd:'',adults:f.adults===''?NaN:Number(f.adults),children:f.children===''?NaN:Number(f.children),childAge:f.childAge===''?null:Number(f.childAge),days:Number(f.days),budget:null});save();env.clean();await go('intent',{id:d.id},true);toast('已接待并建立本次需求');return true;}
      default:return false;
    }
  }
  return {guestId,screens:{'product-share':shareForm,'share-result':result,'share-guest':guest,'share-consult':consultPage,'share-receive':receive},action,submit,sync};
};
