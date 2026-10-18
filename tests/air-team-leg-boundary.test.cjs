const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../shared/air-orders-model.js');
function team(){const o=M.blank();o.type='团队票';M.teamSource.mode(o,'按团期');M.teamSource.selectGroup(o,'EU20261120001');M.teamSource.selectSeat(o,'AIR-EU-20261120');o.bookingPnr='TEAM26';o.bookingAirlineNo='CA26';M.syncTickets(o);return o;}
test('机位识别包含去返程，解除引用后原行程成为待采购内容',()=>{
  const o=team();assert.ok(o.legs.every(l=>M.seatForLeg(o,l)?.id===o.seat));
  M.teamSource.selectSeat(o,'');assert.ok(o.legs.every(l=>M.seatForLeg(o,l)===null));assert.equal(o.legs[0].flight,'CA931');assert.equal(o.bookingPnr,'');
});
test('额外航段只承接名单中勾选的人，不套用主行程订座',()=>{
  const o=team(),l=M.additionalLeg('LX');Object.assign(l,{from:'SHA',to:'PEK',flight:'CA1502',date:'2026-11-19',carrier:'中国国际航空',supplier:'中国国际航空'});o.legs.push(l);M.syncTickets(o);
  assert.equal(o.tickets.length,8);assert.ok(M.validate(o).some(e=>e.includes('团队名单选择乘客')));
  assert.ok(M.templateGroups(o,'中国国际航空','2026.1').every(g=>g.rows.every(r=>!r.includes('CA1502'))));
  l.people=[o.people[0].id];M.syncTickets(o);const extra=o.tickets.filter(t=>t.legId==='LX');assert.equal(extra.length,1);assert.equal(extra[0].personId,o.people[0].id);assert.equal(extra[0].pnr,'');assert.equal(extra[0].airlineNo,'');assert.ok(o.tickets.filter(t=>t.legId!=='LX').every(t=>t.pnr==='TEAM26'));
  l.people=[];M.syncTickets(o);assert.equal(o.tickets.length,8);
});
test('更换主机位保留独立的额外航段和人段记录，来源切换仍清理全部',()=>{
  const o=team(),l=M.additionalLeg('LX');l.people=[o.people[0].id];o.legs.push(l);M.syncTickets(o);o.tickets.find(t=>t.legId==='LX').pnr='EXTRA1';
  M.teamSource.selectSeat(o,'');M.teamSource.selectSeat(o,'AIR-EU-20261120');M.syncTickets(o);
  assert.equal(o.legs.length,3);assert.equal(o.tickets.find(t=>t.legId==='LX').pnr,'EXTRA1');assert.ok(o.tickets.filter(t=>t.legId!=='LX').every(t=>!t.pnr));
  M.teamSource.mode(o,'外部委托');assert.ok(o.legs.every(l=>!l.additional));assert.equal(o.tickets.length,0);
});
test('已出票的额外航段不能通过取消最后一位乘客抹去',()=>{
  const o=team(),l=M.additionalLeg('LX');l.people=[o.people[0].id];o.legs.push(l);M.syncTickets(o);o.tickets.find(t=>t.legId==='LX').state='已出票';const next=M.copy(o);next.legs[2].people=[];
  assert.throws(()=>M.protectIssued(o,next),/移除人段/);
});
