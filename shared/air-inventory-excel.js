/* 本地 XLSX / CSV 读写，仅解析本原型采购模板；不执行公式与外部链接。 */
(function(root){
  'use strict';
  const headers=['采购类型','供应商','采购协议','去程航班','回程航班','出发日期','回程日期','采购数量','采购单价','舱位','币种','加价','退位截止日','供应确认依据','包机航次','加价方式'];
  const fields=['type','supplier','agreement','out','back','date','returnDate','qty','price','cabin','currency','markup','cutoff','evidence','charter','markupType'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function col(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
  function csvParse(text){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';}else value+=c;}if(value||row.length){row.push(value);rows.push(row);}return rows;}
  function xml(s){const d=new DOMParser().parseFromString(s,'application/xml');if(d.querySelector('parsererror'))throw Error('Excel 文件内容损坏');return d;}
  async function read(file){
    if(file.size>10*1024*1024)throw Error('请选择10MB以内的采购模板');
    let grid=[];
    if(/\.csv$/i.test(file.name))grid=csvParse((await file.text()).replace(/^\uFEFF/,''));
    else if(/\.xlsx$/i.test(file.name)){
      const zip=await JSZip.loadAsync(await file.arrayBuffer());
      const readXML=async name=>{const f=zip.file(name);if(!f)throw Error('Excel缺少工作表或不符合标准XLSX格式');const s=await f.async('string');if(s.length>15000000)throw Error('Excel工作表过大');return xml(s);};
      const wb=await readXML('xl/workbook.xml'),rels=await readXML('xl/_rels/workbook.xml.rels');
      const sheet=wb.querySelector('sheet');if(!sheet)throw Error('Excel没有工作表');
      const rid=sheet.getAttribute('r:id');const rel=Array.from(rels.getElementsByTagName('Relationship')).find(r=>r.getAttribute('Id')===rid);
      if(!rel||rel.getAttribute('TargetMode')==='External')throw Error('不支持外部工作表');
      const target=rel.getAttribute('Target');const worksheet=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');
      const sh=await readXML(worksheet),strings=zip.file('xl/sharedStrings.xml')?Array.from((await readXML('xl/sharedStrings.xml')).getElementsByTagName('si')).map(si=>Array.from(si.getElementsByTagName('t')).map(t=>t.textContent).join('')):[];
      grid=Array.from(sh.getElementsByTagName('row')).map(row=>{const arr=[];Array.from(row.getElementsByTagName('c')).forEach(c=>{const letters=(c.getAttribute('r')||'A1').match(/^[A-Z]+/)[0];let n=0;for(const ch of letters)n=n*26+ch.charCodeAt(0)-64;let v=c.querySelector('v')?.textContent||'';if(c.querySelector('f'))v='[公式请转为值]';else if(c.getAttribute('t')==='s')v=strings[Number(v)]||'';else if(c.getAttribute('t')==='inlineStr')v=Array.from(c.getElementsByTagName('t')).map(t=>t.textContent).join('');arr[n-1]=v;});return arr;});
    }else throw Error('请使用 .xlsx 或 UTF-8 CSV 文件；旧版 .xls 请先另存为 .xlsx');
    if(grid.length<2)throw Error('文件没有采购数据');if(grid.length>501)throw Error('每次最多导入500行');
    const names=grid[0].map(s=>String(s||'').trim());
    const required=headers.filter(h=>!['包机航次','回程航班','回程日期','加价方式'].includes(h));
    const missing=required.filter(h=>!names.includes(h));if(missing.length)throw Error('模板缺少列：'+missing.join('、'));
    return grid.slice(1).map((cells,index)=>{const r={sourceRow:index+2};fields.forEach((f,i)=>{let v=String(cells[names.indexOf(headers[i])]??'').trim();if(['date','returnDate','cutoff'].includes(f)&&/^\d{5}(\.0+)?$/.test(v)){v=new Date(Date.UTC(1899,11,30)+Number(v)*86400000).toISOString().slice(0,10);}r[f]=v;});return r;}).filter(r=>fields.some(f=>r[f]!==''&&f!=='markupType')).map(r=>({...r,markupType:r.markupType||'固定金额'}));
  }
  async function workbook(rows,errors){
    const head=errors?headers.concat(['原文件行号','错误原因']):headers;
    const grid=[head,...rows.map((r,i)=>fields.map(f=>r[f]??(f==='markupType'?'固定金额':'')).concat(errors?[r.sourceRow||i+2,(errors[i]||[]).join('；')]:[]))];
    const zip=new JSZip();
    zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="机位采购" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
    zip.file('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="18" width="22" customWidth="1"/></cols><sheetData>'+grid.map((row,i)=>'<row r="'+(i+1)+'">'+row.map((v,j)=>'<c r="'+col(j)+(i+1)+'" t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData></worksheet>');
    return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',compression:'DEFLATE'});
  }
  async function download(name,rows,errors){const blob=await workbook(rows,errors),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  root.AirInventoryExcel={headers,fields,read,workbook,download};
})(window);
