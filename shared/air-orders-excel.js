/* 本地 XLSX / CSV 读写，仅解析本原型票务模板；不执行公式与外部链接。 */
(function(root){
  'use strict';
  const headers=['交易类型','出票日期','票号','原票号','订座编号','航司订单号','乘客姓名','证件号码','出行日期','航班号','出发机场','到达机场','票价','税费','采购结算额','结算客户','销售价','币种','内部供票','团号','金额口径','更正依据','承运航司','供票供应商','报价依据'];
  const fields=['type','issuedDate','ticket','original','pnr','airlineNo','name','docNo','date','flight','from','to','fare','tax','cost','customer','sale','currency','internal','group','amountScope','changeReason','carrier','supplier','priceBasis'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function col(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
  function csvParse(text){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';}else value+=c;}if(value||row.length){row.push(value);rows.push(row);}return rows;}
  function xml(s){const d=new DOMParser().parseFromString(s,'application/xml');if(d.querySelector('parsererror'))throw Error('Excel 文件内容损坏');return d;}
  async function readGrid(file){
    if(file.size>10*1024*1024)throw Error('请选择10MB以内的票务模板');
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
    if(grid.length<2)throw Error('文件没有票务数据');if(grid.length>501)throw Error('每次最多导入500行');
    return grid;
  }
  async function read(file,mode='日报'){const grid=await readGrid(file);
    if(mode==='票号回填'){
      const F=root.AirImportFlow,names=grid[0].map(s=>String(s||'').trim());
      const missing=['乘客姓名','航班号','出行日期','票号','订座编号','航司订单号','出票日期'].filter(h=>!names.includes(h));
      if(missing.length)throw Error('票号回填模板缺少列：'+missing.join('、'));
      return grid.slice(1).map((cells,i)=>{const r={sourceRow:i+2,type:'出票'};F.refillFields.forEach((f,k)=>{let v=String(cells[names.indexOf(F.refillHeaders[k])]??'').trim();if(['date','issuedDate'].includes(f)&&/^\d{5}(\.0+)?$/.test(v))v=new Date(Date.UTC(1899,11,30)+Number(v)*86400000).toISOString().slice(0,10);r[f]=v;});return r;}).filter(r=>F.refillFields.some(f=>r[f]!==''));
    }
    const mapping=root.AirClose?.load().mappings.find(x=>x.id==='BSP');const names=grid[0].map(s=>{const name=String(s||'').trim(),index=mapping?.columns.indexOf(name);return index>=0?mapping.fields[index]:name;});if(new Set(names).size!==names.length)throw Error('映射后存在重复表头');const required=['交易类型','票号','乘客姓名','出行日期','航班号','出发机场','到达机场','票价','税费','采购结算额'];
    const missing=required.filter(h=>!names.includes(h));if(missing.length)throw Error('模板缺少列：'+missing.join('、'));
    return grid.slice(1).map((cells,index)=>{const r={sourceRow:index+2};fields.forEach((f,i)=>{let v=String(cells[names.indexOf(headers[i])]??'').trim();if(['date','issuedDate'].includes(f)&&/^\d{5}(\.0+)?$/.test(v)){v=new Date(Date.UTC(1899,11,30)+Number(v)*86400000).toISOString().slice(0,10);}r[f]=v;});return r;}).filter(r=>fields.some(f=>r[f]!==''));
  }
  async function workbook(rows,errors,customGrid){
    const head=errors?headers.concat(['原文件行号','错误原因']):headers;
    const grid=customGrid||[head,...rows.map((r,i)=>fields.map(f=>r[f]??'').concat(errors?[r.sourceRow||i+2,(errors[i]||[]).join('；')]:[]))];
    const zip=new JSZip();
    zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="票务资料" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
    zip.file('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="24" width="22" customWidth="1"/></cols><sheetData>'+grid.map((row,i)=>'<row r="'+(i+1)+'">'+row.map((v,j)=>'<c r="'+col(j)+(i+1)+'" t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData></worksheet>');
    return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',compression:'DEFLATE'});
  }
  async function download(name,rows,errors,customGrid){const blob=await workbook(rows,errors,customGrid),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  async function readRoster(file){
    const grid=await readGrid(file),C=root.AirCharterOrder,names=grid[0].map(x=>String(x||'').trim());
    const missing=C.importHeaders.filter(h=>!names.includes(h));if(missing.length)throw Error('名单模板缺少列：'+missing.join('、'));if(new Set(names).size!==names.length)throw Error('名单模板存在重复表头');
    return grid.slice(1).map((cells,i)=>{const r={sourceRow:i+2};C.importFields.forEach((key,k)=>{let v=String(cells[names.indexOf(C.importHeaders[k])]??'').trim();if(['birth','expiry'].includes(key)){if(/^\d{5}(\.0+)?$/.test(v))v=new Date(Date.UTC(1899,11,30)+Number(v)*86400000).toISOString().slice(0,10);else v=v.replace(/\//g,'-');}r[key]=v;});return r;}).filter(r=>C.importFields.some(k=>r[k]!==''));
  }
  root.AirOrdersExcel={headers,fields,read,readRoster,readGrid,workbook,download};
})(window);
