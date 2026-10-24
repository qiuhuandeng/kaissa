/* Shared prototype reference materials. Edits stay on the current page. */
(function (root) {
  'use strict';
  var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  var escape = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var ports = [
    ['shanghai','上海吴淞口','Shanghai Wusongkou','中国','上海','Asia/Shanghai','吴淞口国际邮轮港','CNY',''],
    ['barcelona','巴塞罗那港','Port of Barcelona','西班牙','巴塞罗那','Europe/Madrid','Barcelona / BCN','EUR',''],
    ['marseille','马赛港','Port of Marseille','法国','马赛','Europe/Paris','Marseille / 马赛','EUR',''],
    ['genoa','热那亚港','Port of Genoa','意大利','热那亚','Europe/Rome','Genoa / Genova','EUR',''],
    ['naples','那不勒斯港','Port of Naples','意大利','那不勒斯','Europe/Rome','Napoli / Naples','EUR',''],
    ['rome','奇维塔韦基亚港','Port of Civitavecchia','意大利','罗马','Europe/Rome','罗马港 / Civitavecchia','EUR',''],
    ['fukuoka','博多港','Port of Hakata','日本','福冈','Asia/Tokyo','福冈 / Hakata','JPY',''],
    ['nagasaki','长崎港','Port of Nagasaki','日本','长崎','Asia/Tokyo','Nagasaki','JPY',''],
    ['singapore','滨海湾邮轮中心','Marina Bay Cruise Centre','新加坡','新加坡','Asia/Singapore','Singapore / 新加坡港','SGD',''],
    ['santorini','圣托里尼港','Port of Santorini','希腊','圣托里尼','Europe/Athens','Santorini / 锡拉','EUR','']
  ].map(function (r) { var p={}; ['id','name','english','country','city','timezone','aliases','currency','tax'].forEach(function(k,i){p[k]=r[i];}); p.note='税费参考由船方资料维护；当期收费以航次为准。'; return p; });
  function cabin(code, category, max, area) { return {code:code, category:category, name:category+'双人房 '+code, standard:2, maximum:max, extra:max>2?'支持':'不支持', child:'需确认', area:area, view:category==='内舱'?'无窗':category==='海景'?'海景窗':'阳台', facilities:'独立卫浴、空调、保险箱', beds:'双床可合并'}; }
  var ships = [
    {id:'ideal',name:'理想号',company:'地中海邮轮',supplier:'地中海邮轮中国销售中心',home:'shanghai',tonnage:'17.16万吨 / 2019年',capacity:'4,888人'},
    {id:'glory',name:'地中海荣耀号 MSC-GLORY',company:'地中海邮轮',supplier:'地中海邮轮中国销售中心',home:'barcelona',tonnage:'船方资料待核',capacity:'船方资料待核'},
    {id:'oasis',name:'海洋绿洲号 OASIS',company:'皇家加勒比',supplier:'皇家加勒比中国区',home:'barcelona',tonnage:'22.81万吨 / 2009年',capacity:'6,780人'},
    {id:'venice',name:'歌诗达威尼斯号 COSTA-VENICE',company:'歌诗达邮轮',supplier:'歌诗达邮轮华东销售部',home:'rome',tonnage:'13.55万吨 / 2019年',capacity:'5,260人'}
  ].map(function(s,i){
    s.rooms='船方资料待核';s.version='资料示例 v1';
    s.description=s.name+'船舶介绍示例：主餐厅、自助餐厅、剧院及公共休闲空间；实际设施以船方资料为准。';
    s.facilities='主餐厅、自助餐厅、剧院、泳池'; s.policy='儿童登船、无障碍服务和特殊饮食须按船方要求确认。';
    s.image='../../client/assets/product-cruise.jpg';s.imageName='船舶展示图（示例）';s.attachments=[];
    s.cabins=[cabin(i===2?'ZI':'IC','内舱',4,'16㎡'),cabin('OV','海景',4,'18㎡'),cabin('BA','阳台',4,'22㎡'),cabin('BC','阳台',2,'20㎡'),cabin('SU','套房',4,'36㎡')];
    s.cabins.forEach(function(c){if((s.id==='ideal'||s.id==='oasis')&&c.category!=='套房'||s.id==='glory'&&c.code==='IC')c.child='支持';});return s;
  });
  function stop(port, text, arrival, departure) {return {port:port,text:text,arrival:arrival||'',departure:departure||'',meal:'船上用餐 / 船上住宿',overnight:false};}
  var west=[stop('barcelona','巴塞罗那登船，码头协助办理登船手续。','','18:00'),stop('marseille','马赛靠港，岸上游按所选方案安排。','08:00','18:00'),stop('genoa','热那亚靠港。','08:00','18:00'),stop('','海上巡游，船上自由活动。'),stop('naples','那不勒斯靠港。','08:00','18:00'),stop('rome','罗马港靠港。','07:00','19:00'),stop('','海上巡游。'),stop('barcelona','返回巴塞罗那，办理离船手续。','08:00','')];
  var routes=[
    {id:'japan',name:'日韩短线假期',code:'MED-20260912',ship:'ideal',duration:'5晚6天',season:'全年',enabled:true,days:[stop('shanghai','上海吴淞口登船。','','17:00'),stop('','海上巡游。'),stop('fukuoka','福冈靠港。','08:00','18:00'),stop('nagasaki','长崎靠港。','08:00','18:00'),stop('','海上巡游。'),stop('shanghai','上海离船。','08:00','')]},
    {id:'west',name:'地中海经典线',code:'MED-WEST-8D',ship:'ideal',duration:'7晚8天',season:'4—10月',enabled:true,days:[stop('barcelona','巴塞罗那登船。','','18:00'),stop('marseille','马赛靠港。','08:00','18:00'),stop('','海上巡游。'),stop('naples','那不勒斯靠港。','08:00','18:00'),stop('santorini','圣托里尼靠港。','08:00','18:00'),stop('','海上巡游。'),stop('','海上巡游。'),stop('rome','罗马港离船。','08:00','')]},
    {id:'glory-west',name:'荣耀号地中海经典航线',code:'GLORY-WEST-8D',ship:'glory',duration:'7晚8天',season:'4—10月',enabled:true,days:west},
    {id:'oasis-west',name:'西地中海精华',code:'RC-WEST-7D',ship:'oasis',duration:'7晚8天',season:'5—9月',enabled:true,days:clone(west)}
  ];
  function portName(id) {var p=ports.find(function(p){return p.id===id;});return p?p.name:'海上日';}
  function portOptions(value, sea) {return (sea?'<option value="">海上日</option>':'')+ports.map(function(p){return '<option value="'+p.id+'"'+(p.id===value?' selected':'')+'>'+escape(p.name+' · '+p.country+'/'+p.city)+'</option>';}).join('');}
  function options(values, current) {return values.map(function(v){return '<option'+(v===current?' selected':'')+'>'+escape(v)+'</option>';}).join('');}
  root.CaesarCruiseResources={ports:ports,ships:ships,routes:routes,clone:clone,escape:escape,portName:portName,portOptions:portOptions,options:options};
})(window);
