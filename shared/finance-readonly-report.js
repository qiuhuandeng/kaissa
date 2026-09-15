(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./finance-cashflow-model.js'));
  else root.CaesarReadonlyReport = factory(root.CaesarCashflow);
})(typeof window === 'object' ? window : globalThis, function (base) {
  'use strict';
  // A single ZIP download with one CSV per report; no multiple-download permission needed.
  function zip(files) {
    const enc=new TextEncoder(),parts=[],central=[];let offset=0;
    const crc=bytes=>{let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;};
    for(const f of files){
      const name=enc.encode(f.name),data=enc.encode(f.data),checksum=crc(data);
      const local=new Uint8Array(30+name.length),v=new DataView(local.buffer);
      v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,checksum,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);local.set(name,30);
      const header=new Uint8Array(46+name.length),h=new DataView(header.buffer);
      h.setUint32(0,0x02014b50,true);h.setUint16(4,20,true);h.setUint16(6,20,true);h.setUint16(8,0x800,true);h.setUint32(16,checksum,true);h.setUint32(20,data.length,true);h.setUint32(24,data.length,true);h.setUint16(28,name.length,true);h.setUint32(42,offset,true);header.set(name,46);
      parts.push(local,data);central.push(header);offset+=local.length+data.length;
    }
    const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,central.reduce((n,a)=>n+a.length,0),true);e.setUint32(16,offset,true);
    return new Blob([...parts,...central,end],{type:'application/zip'});
  }
  function mount(host, config) {
    const esc = base.esc;
    const heading = config.headingLevel === 1 ? 'h1' : 'h2';
    let applied = { ...config.defaults }, result, page = 1, size = 10, sort = '', direction = 1, restorationError = '';
    const extra = new Set();
    let content = "main"; const contentStates = {};
    const current = () => config.explorer && content !== "main" ? result.sections.find(s => s.key === content) || result : result;
    const name = k => config.labels[k] || k;
    const control = f => '<label class="cf-field">' + esc(f.label || name(f.key)) + (f.options ? '<select name="' + f.key + '">' + f.options.map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + '</option>').join('') + '</select>' : '<input name="' + f.key + '" type="' + (f.type || 'search') + '">') + '</label>';
    host.classList.add('cf-page', 'fr-report');
    host.innerHTML = '<header class="cf-heading"><' + heading + (config.showTitle === false ? ' hidden' : '') + '>' + esc(config.title) + '</' + heading + '><button class="btn btn-secondary" type="button" data-fr-export><img src="../../shared/report-icons/download.svg" alt="" width="14" height="14">导出</button></header>' +
      '<div class="cf-tabs" role="tablist"' + (Object.keys(config.views).length === 1 ? ' hidden' : '') + '>' + Object.entries(config.views).map(([v, t]) => '<button type="button" role="tab" data-fr-view="' + v + '">' + esc(t) + '</button>').join('') + '</div>' +
      '<form class="cf-filters">' + config.filters.filter(f => !f.more).map(control).join('') + '<details class="cf-more"><summary>更多条件</summary><div class="cf-filter-more">' + config.filters.filter(f => f.more).map(control).join('') + '</div></details><div class="cf-filter-actions"><button class="btn btn-secondary" type="submit">查询</button><button class="btn btn-secondary" type="button" data-fr-reset>重置</button></div></form>' +
      '<p class="cf-error" role="alert" hidden></p><p class="cf-notice" data-fr-notice role="status"></p><details class="cf-columns"><summary>显示字段</summary><div data-fr-columns></div></details><div class="cf-scroll" data-fr-main tabindex="0"></div>' +
      '<div class="cf-pagination"><button class="btn btn-secondary" type="button" data-fr-prev aria-label="上一页"><img src="../../shared/report-icons/chevron-left.svg" alt="" width="14" height="14"></button><span data-fr-count></span><button class="btn btn-secondary" type="button" data-fr-next aria-label="下一页"><img src="../../shared/report-icons/chevron-right.svg" alt="" width="14" height="14"></button><label>每页<select data-fr-size><option>10</option><option>25</option><option>50</option></select></label></div><div data-fr-sections></div>' +
      '<details class="cf-definition"><summary>统计口径 · 待财务确认</summary><p>' + esc(config.definition) + '</p></details>';
    const form = host.querySelector('form');
    if(config.explorer){
      const all=document.createElement('button');all.type='button';all.className='btn btn-secondary';all.textContent='导出全部核对表';all.setAttribute('data-fr-export-all','');form.querySelector('.cf-filter-actions').append(all);
    }

    const availableExtras = () => typeof config.extras === 'function' ? config.extras(applied) : (config.extras || []);
    const cols = () => [...new Set([...(config.explorer ? current().columns || config.columns(applied) : config.columns(applied)), ...extra])];
    const totalDisplay = (r,k) => config.blankTotalText && !config.money.includes(k) && (r[k]==null||r[k]==='') ? '' : display(r,k);
    const display = (r, k) => config.money.includes(k) ? base.fmt(r[k]) : r[k] == null || r[k] === '' ? '未提供' : config.humanDates && /^\d{4}-\d{2}-\d{2}T/.test(String(r[k])) ? String(r[k]).replace('T',' ') : String(r[k]);
    const table = (rows, keys, sortable) => '<table><thead><tr>' + keys.map(k => '<th>' + (sortable ? '<button type="button" data-fr-sort="' + k + '">' + esc(name(k)) + (sort === k ? direction === 1 ? ' ↑' : ' ↓' : '') + '</button>' : esc(name(k))) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + keys.map(k => '<td class="' + (config.money.includes(k) ? 'cf-number' : 'cf-value') + '">' + esc(display(r, k)) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' + (rows.length ? '' : '<p class="cf-empty">' + (result.pending ? '资料不足，暂无可核对记录' : '当前条件无记录') + '</p>');
    function fields() { for (const f of config.filters) form.elements.namedItem(f.key).value = applied[f.key] ?? ''; }
    function render() {
      if(config.explorer) {
        if(content !== 'main' && !result.sections.some(s=>s.key===content))content='main';
        let toolbar=host.querySelector('[data-fr-explorer]');
        if(!toolbar){toolbar=document.createElement('div');toolbar.dataset.frExplorer='';toolbar.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px';host.querySelector('.cf-columns').before(toolbar);}
        const columnPicker=host.querySelector('.cf-columns');if(columnPicker)columnPicker.remove();
        toolbar.innerHTML='<h2 style="margin:0;font-size:16px">'+esc(current().title||config.views[applied.view])+'</h2><label>查看内容 <select data-fr-content aria-label="查看内容">'+[{key:'main',title:result.title||config.views[applied.view]},...result.sections].map(s=>'<option value="'+esc(s.key)+'"'+(content===s.key?' selected':'')+'>'+esc(s.title)+'</option>').join('')+'</select></label>';
        if(columnPicker)toolbar.append(columnPicker);
        toolbar.querySelector('label').hidden=!result.sections.length;
        host.querySelector('[data-fr-export-all]').hidden=!result.sections.length;

      }

        config.filters.forEach(f=>{const el=form.elements.namedItem(f.key);const visible=!f.visible||f.visible(applied);el.closest('label').hidden=!visible;el.disabled=!visible;});
      if(config.explorer){const more=form.querySelector('.cf-more');more.hidden=![...more.querySelectorAll('label')].some(e=>!e.hidden);}
      const rows = base.sort(current().rows, sort, direction), pages = Math.max(1, Math.ceil(rows.length / size)); page = Math.min(page, pages);
      host.querySelector('[data-fr-main]').innerHTML = table(rows.slice((page - 1) * size, page * size), cols(), true);
      if(config.explorer&&content==='main'&&result.totals?.length){const foot=document.createElement('tfoot');foot.innerHTML=result.totals.map(r=>'<tr>'+cols().map(k=>'<td>'+esc(totalDisplay(r,k))+'</td>').join('')+'</tr>').join('');host.querySelector('[data-fr-main] table').append(foot);}
      host.querySelector('[data-fr-count]').textContent = '第 ' + page + ' / ' + pages + ' 页 · 共 ' + rows.length + ' 条';
      host.querySelector('[data-fr-prev]').disabled = page === 1; host.querySelector('[data-fr-next]').disabled = page === pages;
      host.querySelector('[data-fr-notice]').textContent = result.notice;
      host.querySelectorAll('[data-fr-view]').forEach(b => { b.classList.toggle('active', b.dataset.frView === applied.view); b.setAttribute('aria-selected', b.dataset.frView === applied.view); });
      host.querySelector('[data-fr-columns]').innerHTML = availableExtras().map(k => '<label><input type="checkbox" data-fr-column="' + k + '"' + (extra.has(k) ? ' checked' : '') + '>' + esc(name(k)) + '</label>').join('');
      host.querySelector('[data-fr-sections]').innerHTML = config.explorer ? '' : result.sections.map(s => '<section class="cf-section"><h2>' + esc(s.title) + '</h2><div class="cf-scroll" tabindex="0" data-fr-section="' + s.key + '">' + table(s.rows, s.columns) + '</div></section>').join('');
      host.querySelector('[data-fr-export]').disabled = result.pending;
      if(config.onRender)config.onRender(host,applied,result);
    }
    function run(q) {
      const error = host.querySelector('.cf-error');
      try { const next = config.query(q); result = next; applied = { ...q }; restorationError = ''; page = 1; if(config.explorer){content='main';Object.keys(contentStates).forEach(k=>delete contentStates[k]);extra.clear();sort='';} error.hidden = true; render(); }
      catch (e) {
        if(config.clearOnError){applied={...q};restorationError=e.message;result={rows:[],sections:[],totals:[],pending:true,title:config.views[q.view],notice:e.message};page=1;render();}
        error.textContent = e.message; error.hidden = false;
      }
    }
    form.addEventListener('submit', event => { event.preventDefault(); run({ ...applied, ...Object.fromEntries(new FormData(form)) }); });
    host.addEventListener('click', event => {
      const b = event.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-fr-view')) { extra.clear(); run({ ...applied, view: b.dataset.frView }); fields(); }
      if (b.hasAttribute('data-fr-reset')) { extra.clear(); run({ ...config.defaults, view: applied.view }); fields(); }
      if (b.hasAttribute('data-fr-prev')) { page--; render(); }
      if (b.hasAttribute('data-fr-next')) { page++; render(); }
      if (b.hasAttribute('data-fr-sort')) { direction = sort === b.dataset.frSort ? -direction : 1; sort = b.dataset.frSort; render(); }
      if(b.hasAttribute('data-fr-export-all')) {
        const metadata=[[config.title,config.views[applied.view]],['资料',result.notice],...config.filters.filter(f=>!f.visible||f.visible(applied)).map(f=>[f.label,applied[f.key]||'全部'])];
        const files=[{...result,title:result.title||config.views[applied.view]},...result.sections].map(s=>{
          const keys=s.columns||config.columns(applied),data=[...metadata,[],[s.title],keys.map(name),...s.rows.map(r=>keys.map(k=>config.money.includes(k)?r[k]:display(r,k)))];
          return {name:s.title+'.csv',data:base.csv(data)};
        });
        const url=URL.createObjectURL(zip(files)),a=document.createElement('a');a.href=url;a.download=config.title+'-核对资料.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
      if (b.hasAttribute('data-fr-export')) {
        const data = [[config.title, config.views[applied.view]], ['资料', result.notice], ['统计口径', config.definition], ...config.filters.filter(f=>!config.explorer||!f.visible||f.visible(applied)).map(f => [f.label || name(f.key), f.options ? (f.options.find(o => o[0] === applied[f.key]) || ['', '全部'])[1] : applied[f.key] || '全部']), ['排序', name(sort), direction === 1 ? '升序' : '降序']];
        const add = (title, rows, keys) => data.push([], [title], keys.map(name), ...rows.map(r => keys.map(k => config.money.includes(k) ? r[k] : display(r, k))));
        add(config.explorer ? current().title : '全部查询结果', base.sort(current().rows, sort, direction), cols()); if(config.exportTotals&&content==='main'&&result.totals?.length)data.push(...result.totals.map(r=>cols().map(k=>config.money.includes(k)?r[k]:totalDisplay(r,k)))); if(!config.explorer)result.sections.forEach(s => add(s.title, s.rows, s.columns));
        const url = URL.createObjectURL(new Blob([base.csv(data)], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = config.title + (config.explorer ? '-' + current().title : '') + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
    host.addEventListener('change', event => {
      const b = event.target;
      if(b.hasAttribute('data-fr-content')) {
        contentStates[content]={page,size,sort,direction,extra:[...extra]};content=b.value;
        const saved=contentStates[content]||{page:1,size:10,sort:'',direction:1,extra:[]};
        page=saved.page;size=saved.size;sort=saved.sort;direction=saved.direction;extra.clear();saved.extra.forEach(k=>extra.add(k));render();host.querySelector('[data-fr-size]').value=size;
      }
      if (b.hasAttribute('data-fr-size')) { size = +b.value; page = 1; render(); }
      if (b.hasAttribute('data-fr-column')) { b.checked ? extra.add(b.dataset.frColumn) : extra.delete(b.dataset.frColumn); render(); }
    });
    fields(); run(applied);
    window.CaesarReportNavigation?.bind(host, {
      capture: () => ({ applied, page, size, sort, direction, extra: [...extra], restorationError, content, contentStates }),
      restore: s => {
        applied = { ...s.applied, dataset: config.defaults.dataset }; restorationError = s.restorationError || '';
        try { if (restorationError) throw new Error(restorationError); result = config.query(applied); }
        catch (error) {
          restorationError = error.message; applied = { ...config.defaults, view: s.applied.view };
          result = { rows: [], sections: [], pending: true, notice: '上次查询条件已失效，请重新选择后查询。' + restorationError };
        }
        content = s.content || 'main';Object.assign(contentStates,s.contentStates||{});
        page = s.page; size = s.size; sort = s.sort; direction = s.direction; extra.clear(); s.extra.forEach(k => extra.add(k)); fields(); render(); host.querySelector('[data-fr-size]').value = size;
        if (restorationError) { const error = host.querySelector('.cf-error'); error.textContent = result.notice; error.hidden = false; return false; }
      },
      activate: view => { extra.clear(); run({ ...config.defaults, view }); fields(); }
    });
    return { refresh: () => run(applied), applied: () => ({ ...applied }) };
  }
  return { mount };
});
