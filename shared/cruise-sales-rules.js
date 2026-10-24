/* Shared example rules for the existing product, schedule and booking prototypes. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const templates = [
    { id:'transfer', name:'巴塞罗那机场接送', price:300, childPrice:150, category:'行前服务', supplier:'欧洲接送车队', required:false, capacity:40, exclusive:'机场接驳', resource:'下单前确认' },
    { id:'private', name:'巴塞罗那专车接送', price:500, childPrice:300, category:'行前服务', supplier:'欧洲接送车队', required:false, capacity:6, exclusive:'机场接驳', resource:'下单前确认' },
    { id:'insurance', name:'基础旅行保险', price:80, childPrice:0, category:'保障服务', supplier:'合作保险服务商', required:true, capacity:120, exclusive:'', resource:'占位后确认' },
    { id:'museum', name:'马赛博物馆加购', price:600, childPrice:0, category:'行中服务', supplier:'马赛地接服务商', required:false, capacity:3, exclusive:'马赛下午', resource:'下单前确认' },
    { id:'coast', name:'马赛海岸游加购', price:400, childPrice:200, category:'行中服务', supplier:'马赛地接服务商', required:false, capacity:20, exclusive:'马赛下午', resource:'下单前确认' }
  ];
  function plan(name) {
    const free = /B方案|岸上自由/.test(name);
    return { code:free?'B':'A', name:free?'B方案 · 岸上自由':'A方案 · 精选岸上', included:free?['insurance']:['transfer','insurance'], shore:free?'靠港自由活动，单港项目可加购':'马赛、热那亚精选岸上行程已含', feeMode:free?'已含':'另收', attachment:free?'B方案岸上自由行程.pdf':'A方案精选岸上行程.pdf' };
  }
  function tariff(spec, sourceRows) {
    const get=(id,fallback)=>{const row=(sourceRows||[]).find(x=>x.id===id);return row?Number(row.price):fallback;};
    const first=get('adultOccupancy',28800), third=get('thirdFourth',20800);
    return { first,second:first,third,fourth:third-2000,child:get('childOccupancy',23800),childNoBerth:get('childNoBerth',10800),single:8800,portTax:get('portTax',1850),service:600,fuel:0,maximum:/套房/.test(spec)?3:4 };
  }
  function quoteRoom(room, rates, feeMode) {
    const people=room.people||[], lines=people.map((p,i)=>{
      const key=p.kind==='child'&&['child','childNoBerth'].includes(p.basis)?p.basis:['first','second','third','fourth'][i];
      return {label:'第'+(i+1)+'人 · '+(p.kind==='child'?'儿童（'+p.age+'岁）':'成人')+' · '+(key==='child'?'儿童价':key==='childNoBerth'?'儿童不占床价':'同舱人次价'), quantity:1,price:rates[key]||0,amount:rates[key]||0};
    });
    if(people.length===1)lines.push({label:'单人附加费',quantity:1,price:rates.single,amount:rates.single});
    [['港务税','portTax'],['服务费','service'],['燃油费','fuel']].forEach(([label,key])=>{const amount=feeMode==='已含'?0:Number(rates[key]||0);lines.push({label:label+(feeMode==='已含'?'（船票已含，参考¥'+rates[key]+'/人）':'（另收）'),quantity:people.length,price:amount,amount:amount*people.length});});
    return {people:people.length,lines,total:lines.reduce((s,x)=>s+x.amount,0),overCapacity:people.length>rates.maximum};
  }
  function serviceQuote(items, chosen, included, people) {
    return items.map(item=>{
      const isIncluded=included.includes(item.id), selected=isIncluded||item.required||chosen.includes(item.id);
      if(!selected)return null;
      const adults=people.filter(p=>p.kind!=='child').length, children=people.length-adults;
      return {id:item.id,name:item.name,included:isIncluded,quantity:people.length,amount:isIncluded?0:adults*item.price+children*item.childPrice,capacity:item.capacity,exceeded:people.length>item.capacity,exclusive:item.exclusive,lines:[{label:item.name+(isIncluded?'（方案已含）':' · 成人'+adults+'人／儿童'+children+'人'),quantity:1,price:isIncluded?0:adults*item.price+children*item.childPrice,amount:isIncluded?0:adults*item.price+children*item.childPrice}]};
    }).filter(Boolean);
  }
  root.CaesarCruiseSalesRules={clone,escape,templates,plan,tariff,quoteRoom,serviceQuote};
})(typeof window==='undefined'?globalThis:window);
