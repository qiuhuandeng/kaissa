/* 团期仍按本团办理；按船方航次集中查看时只汇总一次共用舱位。 */
(function (root) {
  'use strict';
  const I = root.CaesarCruiseInventory, E = I.esc;
  function relation(item) {
    if (!/邮轮/.test(item.batchType || '')) return null;
    const s = I.read(), p = I.products.find(p => p.id === item.cruiseProduct) || I.products.find(p => p.schedule === item.code);
    const id = item.cruiseVoyage || item.cruiseSupply?.voyage?.id;
    // Legacy groups without an explicit relationship must not borrow another ship's voyage by date.
    const candidates = id ? s.voyages.filter(v => v.id === id) : p ? s.voyages.filter(v => v.products.includes(p.id) && v.date === item.depart) : [];
    return candidates.length === 1 ? {s, v: candidates[0], p} : null;
  }
  function examples() {
    return (root.CaesarCruiseSupply?.schedules || []).map(sample => {
      const item = {code:sample.code, batchType:'邮轮航次', depart:sample.departDate};
      const c = relation(item); if (!c) return null;
      const rate = root.CaesarCruiseSalesSupply.rates(root.CaesarCruiseSalesSupply.context({voyage:c.v.id, product:c.p.id}), 'BA');
      return {...item, product:c.p.name, route:sample.name, back:sample.returnDate, cruiseVoyage:c.v.id, cruiseProduct:c.p.id,
        unit:'间', stock:c.s.stocks.filter(st=>st.voyage===c.v.id).reduce((n,st)=>n+I.count(c.s,st).total,0), sold:sample.sold, left:0, price:rate?'¥'+rate.first.toLocaleString():'待定价',
        planner:'王强', saleStatus:'开放报名', executionStatus:'未出团', settlementStatus:'未结算', status:'开放报名',
        remark:'沿用既有邮轮供给示例的邮轮团期；各团共用船方舱位', deadline:'2026-11-05'};
    }).filter(Boolean);
  }
  function facts(item) {
    const c=relation(item), R=root.CaesarCruiseRooms;
    if(!c||!R) return null;
    const s=R.read(), groups=s.groups.filter(g=>g.voyage===c.v.id&&g.schedule===item.code);
    const people=s.people.filter(p=>groups.some(g=>g.members.includes(p.id)));
    return {groups,people,missing:people.filter(p=>R.missing(p,c.v.back).length).length,
      assigned:groups.filter(g=>g.room).length,orders:[...new Set(groups.map(g=>g.order))]};
  }
  function center(voyage, page, returnTo, schedule) {
    const q = new URLSearchParams({voyage, returnTo});
    if (schedule) q.set('scheduleNo', schedule);
    return '../cruise/' + page + '.html?' + q;
  }
  function grouped(items, rowHtml, returnTo, voyageFilter) {
    const groups = new Map();
    items.forEach(({item,index}) => {
      const c = relation(item), id = c?.v.id || '';
      if (voyageFilter && id !== voyageFilter) return;
      if (!groups.has(id)) groups.set(id,{c,items:[]});
      groups.get(id).items.push({item,index});
    });
    if (!groups.size) return '<tr><td colspan="9" class="cruise-schedule-empty">当前条件下没有邮轮团期</td></tr>';
    return [...groups].map(([id,g]) => {
      const v=g.c?.v, ship=v && root.CaesarCruiseResources.ships.find(s=>s.id===v.ship);
      const stocks=v?g.c.s.stocks.filter(s=>s.voyage===id):[];
      const total=stocks.reduce((n,s)=>n+I.count(g.c.s,s).total,0), available=stocks.reduce((n,s)=>n+I.count(g.c.s,s).available,0);
      const links=v?[['passenger-manifests','名单'],['room-assignments','分房'],['lifeboat-groups','救生艇'],['dining-assignments','用餐'],['service-groups','其他分组']].map(([page,label])=>'<a class="table-link" href="'+E(center(id,page,returnTo))+'">'+label+'</a>').join(''):'';
      const title=v?(ship?.name||v.ship)+' · '+v.date+' 开航':'待关联船方航次';
      const meta=v?id+' · '+g.items.length+'个邮轮团期 · 共用舱位 '+total+'间 / 余 '+available+'间 · '+I.stateLabel(v.status):g.items.length+'个历史邮轮团期 · 保留原团期办理';
      return '<tr class="cruise-schedule-group" data-voyage="'+E(id)+'"><td colspan="9"><div class="cruise-schedule-group-bar"><div><strong>'+E(title)+'</strong><span>'+E(meta)+'</span></div><nav aria-label="整航次集中安排">'+links+'</nav></div></td></tr>'+g.items.map(({item,index})=>rowHtml(item,index)).join('');
    }).join('');
  }
  root.CaesarCruiseScheduleView={relation,examples,center,grouped,facts};
  document.addEventListener('DOMContentLoaded',()=>{
    const wrap=document.querySelector('.schedule-list-table');
    if(wrap)new ResizeObserver(()=>wrap.style.setProperty('--cruise-group-width',wrap.clientWidth+'px')).observe(wrap);
  });
})(window);
