/* 两端共用供应商详情展示，字段权限由调用方及只读数据范围决定。 */
(function(root){
  const e=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const info=pairs=>'<dl class="supplier-info-grid">'+pairs.map(([k,v])=>'<div><dt>'+e(k)+'</dt><dd>'+e(v||'—')+'</dd></div>').join('')+'</dl>';
  const card=(title,html,tools='')=>'<article class="supplier-card"><div class="supplier-card-head"><h2>'+e(title)+'</h2>'+tools+'</div>'+html+'</article>';
  const basic=(s,internal=false)=>card('基本资料',info([['供应商全称',s.name],['英文名称',s.english],['品牌名称',s.brand],['供应商分类',s.categories.join('、')],['注册地',s.registered],['注册登记号',s.registration],['公司地址',s.address],['法人',s.legal],['总经理',s.manager],...(internal?[['法人电话',s.legalPhone],['总经理电话',s.managerPhone],['我方负责人',s.owner],['备注',s.remark]]:[])]));
  const contacts=(s,agreements)=>card('业务联系人',info([['联系人',s.contact],['电话',s.phone],['微信号',s.wechat],['邮箱',s.email]]))+card('公司合作联系人',agreements.flatMap(a=>a.bodies.map(b=>'<div class="supplier-contact-row"><strong>'+e(b.company)+'</strong><span>'+e(b.contact||'待补充')+' · '+e(b.phone||'电话待补充')+'</span><small>'+e(a.name)+'</small></div>')).join('')||'<p class="supplier-empty">暂无合作联系人</p>')+card('服务能力与地区',info([['主要服务内容',s.service],['服务地区',s.places.map(p=>p[1]==='全区域'?p[0]+' / 全区域':p[0]+' / '+p[1]+' / '+(p[2]||'全国／全地区')).join('；')],['可承接团组类型',s.groups.join('、')]]));
  const products=(s,company,base)=>card('提供产品',s.id==='SUP-GRP-0007'?'<ul class="supplier-product-links"><li><strong>欧洲黄金三角12日</strong><a href="'+base+'product-market.html?company='+encodeURIComponent(company||'福建凯撒')+'">查看外采产品</a></li></ul>':'<p class="supplier-empty">暂无关联产品记录</p>');
  root.SupplierDetailView={escape:e,info,card,basic,contacts,products};
})(typeof window==='undefined'?globalThis:window);
