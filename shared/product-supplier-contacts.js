/* 产品端只读联系资料样例：不加载合同、费用、内部备注或银行账户。
 * company/contactAccess 为独立验收场景参数，不是登录权限或生产鉴权。
 * 旧产品供应商保持独立身份，不按相似名称合并到新供应商档案。 */
(function (root) {
  'use strict';
  const companies = ['福建凯撒','北京凯撒','上海凯撒','亿步','体坛','亿步山西分公司'];
  const fixtures = [
    ['北京国旅地接部', [['福建凯撒','周宁','13800002611'],['北京凯撒','赵琳','13800002612']]],
    ['欧洲联合地接社', [['福建凯撒','林娜','13800002601'],['北京凯撒','林娜','13800002601'],['上海凯撒','林娜','13800002601']]],
    ['巴厘岛阳光地接', [['北京凯撒','陈莉','13800002613']]],
    ['地中海邮轮有限公司', [['福建凯撒','张海','13800002614']]],
    ['泰国东方地接社', [['福建凯撒','刘青','13800002615']]],
    ['樱花旅游地接', [['福建凯撒','王敏','13800002616'],['上海凯撒','杨悦','13800002617']]],
    ['南半球旅游', [['上海凯撒','孙明','13800002618']]],
    ['东南亚精品地接', [['福建凯撒','李晴','13800002619']]],
    ['中国铁路合作局', [['福建凯撒','郑华','13800002620']]],
    ['地中海旅游集团', [['福建凯撒','吴宁','13800002621']]],
    ['兰卡威酒店直采', [['福建凯撒','许静','13800002622']]],
    ['布拉格优选旅游', [['福建凯撒','程远','13800002623']]]
  ];
  function context(search) {
    const q = new URLSearchParams(search || '');
    return {company:q.has('company') ? q.get('company') : '福建凯撒', contactAccess:!q.has('contactAccess') || q.get('contactAccess') === 'allowed'};
  }
  const current = context(root.location ? root.location.search : '');
  function visible(name, ctx = current, kind) {
    if (!companies.includes(ctx.company)) return false;
    if (kind === 'internal') return name === '北京凯撒' && ctx.company === '福建凯撒';
    const supplier = fixtures.find(s => s[0] === name);
    return !!supplier && supplier[1].some(b => b[0] === ctx.company);
  }
  function contact(name, ctx = current) {
    if (!ctx.contactAccess || !visible(name, ctx)) return null;
    const b = fixtures.find(s => s[0] === name)[1].find(b => b[0] === ctx.company);
    return {supplier:name, company:b[0], contact:b[1], phone:b[2]};
  }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function nameHtml(name, kind) {
    if (!visible(name, current, kind)) return '无查看权限';
    return kind !== 'internal' && contact(name) ? '<button type="button" class="product-supplier-link" data-product-supplier="'+esc(name)+'" aria-label="查看'+esc(name)+'联系信息">'+esc(name)+'</button>' : esc(name);
  }
  function href(value) {
    const url = new URL(value, 'https://prototype.invalid/');
    url.searchParams.set('company', current.company);
    url.searchParams.set('contactAccess', current.contactAccess ? 'allowed' : 'none');
    return value.split('?')[0].split('#')[0] + '?' + url.searchParams.toString() + url.hash;
  }
  function mountContext(anchor) {
    if (!anchor) return;
    const line = document.createElement('p');
    line.className = 'product-supplier-scope text-muted';
    line.textContent = '查看公司：' + (companies.includes(current.company) ? current.company : '无授权公司') + (new URLSearchParams(root.location.search).has('company') || new URLSearchParams(root.location.search).has('contactAccess') ? '（权限样例）' : '');
    anchor.appendChild(line);
  }
  let overlay, opener;
  function close() {
    if (!overlay) return;
    if (root.caesarUI) root.caesarUI.closeLayer(overlay);
    overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true');
    if (opener && opener.isConnected) opener.focus();
  }
  function open(name, trigger) {
    const data = contact(name);
    if (!data) return false;
    opener = trigger || document.activeElement;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay drawer-overlay product-supplier-contact';
      overlay.setAttribute('aria-hidden','true');
      overlay.innerHTML = '<div class="modal drawer-modal" role="dialog" aria-modal="true" aria-labelledby="productSupplierTitle"><div class="modal-header"><div id="productSupplierTitle" class="modal-title">供应商联系信息</div><button type="button" class="modal-close" data-contact-close aria-label="关闭">×</button></div><div class="modal-body"></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-contact-close>关闭</button></div></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click',e=>{if(e.target===overlay || e.target.closest('[data-contact-close]')) close();});
      overlay.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
        if(e.key==='Tab'){
          const buttons=overlay.querySelectorAll('button');
          if(e.shiftKey && document.activeElement===buttons[0]){e.preventDefault();buttons[1].focus();}
          else if(!e.shiftKey && document.activeElement===buttons[1]){e.preventDefault();buttons[0].focus();}
        }
      });
    }
    overlay.querySelector('.modal-body').innerHTML = '<p class="product-supplier-name">'+esc(data.supplier)+'</p><section class="drawer-section"><div class="drawer-section-head"><h3 class="drawer-section-title">本公司合作联系人</h3></div><dl class="product-supplier-fields">'+[['签约主体',data.company],['业务联系人',data.contact],['联系电话',data.phone]].map(r=>'<div><dt>'+r[0]+'</dt><dd>'+esc(r[1]||'暂未登记')+'</dd></div>').join('')+'</dl></section>';
    if (root.caesarUI) root.caesarUI.openLayer(overlay);
    overlay.querySelector('#productSupplierTitle').textContent = '供应商联系信息';
    overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');overlay.querySelector('button').focus();
    return true;
  }
  root.ProductSupplierContacts = {context,current,visible,contact,nameHtml,href,mountContext,open};
  if (root.document) document.addEventListener('click',e=>{const button=e.target.closest('[data-product-supplier]');if(button){e.preventDefault();open(button.dataset.productSupplier,button);}});
})(typeof window === 'undefined' ? globalThis : window);
