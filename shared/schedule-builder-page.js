(function () {
  var page = document.querySelector('[data-schedule-builder]');
  if (!page) return;

  var mode = page.getAttribute('data-schedule-builder');
  var params = new URLSearchParams(window.location.search);
  var currentStep = 0;
  var dirty = false;

  var data = {
    group: {
      label: '跟团线路',
      scheduleType: '普通团期',
      tagClass: 'tag tag-blue',
      prefix: 'GT',
      unit: '人',
      planLabel: '线路方案',
      departLabel: '出发日期',
      returnLabel: '返回日期',
      startLabel: '出发城市',
      endLabel: '返回城市',
      startValue: '北京',
      endValue: '北京',
      deadlineLabel: '尾款截止日期',
      defaultPrice: 29800,
      defaultStock: 30,
      approvalNo: 'APR-20260624-030',
      approvalNode: '线路负责人',
      products: [
        {
          name: '欧洲十国经典游',
          meta: '出境跟团，12天11晚，法德瑞意核心城市连线。',
          plans: [
            { name: '经济款', days: 12, basis: '三星/四星酒店，不含机票，成人参考价 ¥29,800' },
            { name: '品质款', days: 12, basis: '五星酒店，含往返机票，成人参考价 ¥59,800' }
          ]
        },
        {
          name: '日本关西深度游',
          meta: '大阪、京都、奈良经典连线，适合亲子和银发客群。',
          plans: [
            { name: '古都经济款', days: 7, basis: '当地四星酒店，不含机票，成人参考价 ¥9,800' },
            { name: '温泉品质款', days: 7, basis: '温泉酒店升级，含接送，成人参考价 ¥13,800' }
          ]
        }
      ],
      matrixColumns: ['价格库存项', '总名额', '预留', '可售', '销售价', '结算价', '说明'],
      matrix: [
        ['成人', 30, 2, 29800, 27600, '主销售价'],
        ['儿童占床', 8, 0, 26800, 24800, '按儿童政策'],
        ['儿童不占床', 8, 0, 23800, 21800, '不占床'],
        ['老人', 6, 0, 29800, 27600, '同成人']
      ],
      nodes: [
        ['报名截止日期', 'date', '2026-06-20'],
        ['尾款截止日期', 'date', '2026-06-25'],
        ['最低成团人数', 'number', '16'],
        ['单房差', 'text', '¥4,800']
      ]
    },
    cruise: {
      label: '邮轮线路',
      scheduleType: '邮轮团期',
      tagClass: 'tag tag-purple',
      prefix: 'CR',
      unit: '间',
      planLabel: '航线方案',
      departLabel: '开航日期',
      returnLabel: '返港日期',
      startLabel: '出发母港',
      endLabel: '返回母港',
      startValue: '巴塞罗那',
      endValue: '巴塞罗那',
      deadlineLabel: '全款截止日期',
      defaultPrice: 12800,
      defaultStock: 126,
      approvalNo: 'APR-20260624-036',
      approvalNode: '邮轮资源负责人',
      products: [
        {
          name: '理想号地中海邮轮',
          meta: '巴塞罗那母港往返，停靠马赛、热那亚、那不勒斯。',
          plans: [
            { name: '阳台舱优选', days: 8, basis: '阳台舱为主，含港务费与精选岸上行程' },
            { name: '套房礼遇', days: 8, basis: '套房权益，小团岸上游，优先登船' }
          ]
        },
        {
          name: '海洋交响号地中海邮轮',
          meta: '罗马登船，西地中海经典航次。',
          plans: [
            { name: '西地中海精华7晚', days: 8, basis: '内舱、海景、阳台、套房全舱型开售' }
          ]
        }
      ],
      matrixColumns: ['舱型', '总舱房', '预留', '可售', '成人价', '单人附加', '港口税费'],
      matrix: [
        ['内舱房', 42, 4, 12800, 4800, 980],
        ['海景房', 36, 3, 15800, 5800, 980],
        ['阳台房', 36, 4, 18800, 6800, 980],
        ['套房', 12, 2, 26800, 9800, 980]
      ],
      nodes: [
        ['航次号', 'text', 'MED-20260701'],
        ['乘客名单提交截止', 'date', '2026-06-18'],
        ['护照/签证资料截止', 'date', '2026-06-15'],
        ['在线登船值机开放', 'date', '2026-06-24']
      ]
    },
    train: {
      label: '专列线路',
      scheduleType: '专列团期',
      tagClass: 'tag tag-green',
      prefix: 'TR',
      unit: '铺',
      planLabel: '线路方案',
      departLabel: '发车日期',
      returnLabel: '回程日期',
      startLabel: '出发站',
      endLabel: '终到站',
      startValue: '西安站',
      endValue: '乌鲁木齐站',
      deadlineLabel: '全款截止日期',
      defaultPrice: 18800,
      defaultStock: 96,
      approvalNo: 'APR-20260624-032',
      approvalNode: '专列资源负责人',
      products: [
        {
          name: '丝绸之路专列',
          meta: '西安始发，兰州、张掖、敦煌、吐鲁番、乌鲁木齐连线。',
          plans: [
            { name: '舒适软卧', days: 12, basis: '软卧为主，标准地接，随车服务团队' },
            { name: '尊享包厢', days: 12, basis: '双人包厢权益，小团讲解，餐饮升级' }
          ]
        },
        {
          name: '东北林海雪原专列',
          meta: '哈尔滨、长白山、延吉冰雪旺季线路。',
          plans: [
            { name: '冰雪舒适线', days: 8, basis: '软卧铺位，景区餐，雪乡停靠' }
          ]
        }
      ],
      matrixColumns: ['车厢/铺位', '总铺位', '预留', '可售', '成人价', '儿童占铺', '附加费'],
      matrix: [
        ['四人软卧', 64, 6, 18800, 16800, 0],
        ['双人包厢', 24, 4, 26800, 23800, 6800],
        ['硬卧铺位', 32, 4, 15800, 13800, 0]
      ],
      nodes: [
        ['车次号', 'text', 'Y653'],
        ['购票名单提交截止', 'date', '2026-06-18'],
        ['集合站及时间', 'text', '西安站 18:30'],
        ['包列固定成本', 'text', '¥620,000']
      ]
    },
    free: {
      label: '自由行日期库存',
      scheduleType: '自由行库存',
      tagClass: 'tag tag-green',
      prefix: 'FT',
      unit: '套',
      planLabel: '套餐方案',
      departLabel: '使用日期',
      returnLabel: '可售截止日期',
      startLabel: '出发城市',
      endLabel: '目的地',
      startValue: '全国',
      endValue: '巴黎',
      deadlineLabel: '采购确认截止',
      defaultPrice: 6800,
      defaultStock: 36,
      approvalNo: 'APR-20260624-038',
      approvalNode: '自由行产品负责人',
      products: [
        {
          name: '巴黎自由行 5-7日',
          meta: '机票、酒店、接送机与当地玩乐组合，按使用日期维护套餐价格库存和采购批次。',
          plans: [
            { name: '机票+酒店套餐', days: 6, basis: '国际航空CA锁位，巴黎四星酒店，含接送机，套餐参考价 ¥6,800' },
            { name: '纯酒店套餐', days: 5, basis: '巴黎四星酒店3晚起订，可加当地玩乐，套餐参考价 ¥4,800' }
          ]
        },
        {
          name: '马来西亚自由行',
          meta: '吉隆坡与槟城机酒套餐，可选接送机和当地玩乐。',
          plans: [
            { name: '吉隆坡机酒5日', days: 5, basis: '往返机票锁位，市中心四星酒店，套餐参考价 ¥4,200' },
            { name: '槟城酒店套餐', days: 4, basis: '海边酒店3晚，可加订包车和门票，套餐参考价 ¥3,200' }
          ]
        }
      ],
      matrixColumns: ['套餐项', '日期库存', '预留', '可售', '销售价', '采购价', '供应商/批次'],
      matrix: [
        ['机票+酒店', 18, 2, 6800, 5600, '国际航空CA / 巴黎酒店直采'],
        ['纯酒店', 12, 1, 4800, 3900, '巴黎酒店直采'],
        ['接送机加购', 20, 0, 680, 420, '欧洲地接ABC'],
        ['当地玩乐加购', 16, 0, 980, 650, '巴黎玩乐供应商']
      ],
      nodes: [
        ['采购批次号', 'text', 'FT-PAR-202607'],
        ['酒店确认截止', 'date', '2026-06-22'],
        ['机票出票截止', 'date', '2026-06-20'],
        ['退改核损规则', 'text', '按机票/酒店/玩乐资源分别核损']
      ]
    }
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function money(value) {
    return '¥' + Number(value || 0).toLocaleString('zh-CN');
  }

  function markDirty() {
    dirty = true;
  }

  function addDays(value, days) {
    var date = value ? new Date(value) : new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function dateCode(value) {
    return (value || '0000-00-00').replace(/-/g, '').slice(2);
  }

  function selectedTypeKey() {
    var active = $('[data-schedule-type].active');
    return active ? active.getAttribute('data-schedule-type') : 'group';
  }

  function selectedType() {
    return data[selectedTypeKey()];
  }

  function selectedProduct() {
    return selectedType().products[$('#lineSelect').selectedIndex] || selectedType().products[0];
  }

  function selectedPlan() {
    return selectedProduct().plans[$('#planSelect').selectedIndex] || selectedProduct().plans[0];
  }

  function setType(typeKey) {
    if (!data[typeKey]) typeKey = 'group';
    $all('[data-schedule-type]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-schedule-type') === typeKey);
    });
    renderSelectors();
    renderContext();
    renderMatrix();
    renderTypeNodes();
    syncDates(true);
    renderPreviewIfNeeded();
  }

  function renderSelectors(preferredLine, preferredPlan) {
    var type = selectedType();
    var lineSelect = $('#lineSelect');
    var planSelect = $('#planSelect');

    lineSelect.innerHTML = type.products.map(function (product) {
      return '<option>' + product.name + '</option>';
    }).join('');

    if (preferredLine) {
      $all('option', lineSelect).some(function (option, index) {
        if (option.textContent === preferredLine) {
          lineSelect.selectedIndex = index;
          return true;
        }
        return false;
      });
    }

    planSelect.innerHTML = selectedProduct().plans.map(function (plan) {
      return '<option>' + plan.name + '</option>';
    }).join('');

    if (preferredPlan) {
      $all('option', planSelect).some(function (option, index) {
        if (option.textContent === preferredPlan) {
          planSelect.selectedIndex = index;
          return true;
        }
        return false;
      });
    }
  }

  function renderContext() {
    var type = selectedType();
    var product = selectedProduct();
    var plan = selectedPlan();
    $('#heroType').textContent = type.label;
    $('#heroType').className = type.tagClass;
    $('#heroTitle').textContent = product.name;
    $('#heroDesc').textContent = product.meta;
    $('#heroPlan').textContent = plan.name;
    $('#heroDuration').textContent = plan.days + '天' + Math.max(plan.days - 1, 0) + '晚';
    $('#heroUnit').textContent = type.defaultStock + type.unit;
    $('#planLabel').innerHTML = type.planLabel + ' <span class="req">*</span>';
    $('#planBasis').textContent = plan.basis;
    $('#lineMeta').value = product.meta + '\n' + type.planLabel + '：' + plan.name + '；' + plan.basis;
    $('#departLabel').innerHTML = type.departLabel + ' <span class="req">*</span>';
    $('#returnLabel').innerHTML = type.returnLabel + ' <span class="req">*</span>';
    $('#startLabel').innerHTML = type.startLabel + ' <span class="req">*</span>';
    $('#endLabel').innerHTML = type.endLabel + ' <span class="req">*</span>';
    $('#startPlace').value = type.startValue;
    $('#endPlace').value = type.endValue;
    $('#deadline2Label').textContent = type.deadlineLabel;
    $('#scheduleCodePreview').textContent = type.prefix + dateCode($('#departDate').value) + '001';
  }

  function syncDates(forceReturn) {
    var depart = $('#departDate').value;
    var plan = selectedPlan();
    if (depart && forceReturn) {
      $('#returnDate').value = addDays(depart, plan.days - 1);
      $('#deadlineDate').value = addDays(depart, -10);
      $('#deadline2').value = addDays(depart, -6);
    }
    var days = depart && $('#returnDate').value ? Math.round((new Date($('#returnDate').value) - new Date(depart)) / 86400000) + 1 : 0;
    $('#durationHint').textContent = days > 0 ? days + '天' + Math.max(days - 1, 0) + '晚' : '-';
    renderContext();
  }

  function matrixHeader() {
    return selectedType().matrixColumns.map(function (column) {
      return '<th>' + column + '</th>';
    }).join('');
  }

  function matrixRow(row) {
    return '<tr data-matrix-row>' +
      '<td><strong>' + row[0] + '</strong></td>' +
      '<td><input class="table-input" type="number" min="0" value="' + row[1] + '" data-total></td>' +
      '<td><input class="table-input" type="number" min="0" value="' + row[2] + '" data-reserve></td>' +
      '<td><span data-saleable>' + Math.max(row[1] - row[2], 0) + '</span></td>' +
      '<td><input class="table-input" type="number" min="0" value="' + row[3] + '" data-primary-price></td>' +
      '<td><input class="table-input" type="number" min="0" value="' + row[4] + '"></td>' +
      '<td><input class="table-input" type="text" value="' + row[5] + '"></td>' +
      '</tr>';
  }

  function renderMatrix() {
    $('#matrixHead').innerHTML = '<tr>' + matrixHeader() + '</tr>';
    $('#matrixRows').innerHTML = selectedType().matrix.map(matrixRow).join('');
    updateMatrixTotals();
  }

  function renderTypeNodes() {
    $('#typeNodeGrid').innerHTML = selectedType().nodes.map(function (node, index) {
      return '<div class="schedule-node-card"><label class="form-label" for="typeNode' + index + '">' + node[0] + '</label><input id="typeNode' + index + '" class="form-control" type="' + node[1] + '" value="' + node[2] + '"></div>';
    }).join('');
  }

  function matrixTotals() {
    return $all('[data-matrix-row]').reduce(function (summary, row) {
      var total = Number($('[data-total]', row).value || 0);
      var reserve = Number($('[data-reserve]', row).value || 0);
      var saleable = Math.max(total - reserve, 0);
      $('[data-saleable]', row).textContent = saleable;
      summary.total += total;
      summary.saleable += saleable;
      return summary;
    }, { total: 0, saleable: 0 });
  }

  function updateMatrixTotals() {
    var totals = matrixTotals();
    $('#matrixTotal').textContent = totals.total + selectedType().unit;
    $('#matrixSaleable').textContent = totals.saleable + selectedType().unit;
    $('#channelCapacity').textContent = totals.saleable;
    updateChannelTotals();
  }

  function updateChannelTotals() {
    var total = $all('.schedule-channel-input').reduce(function (sum, input) {
      return sum + Number(input.value || 0);
    }, 0);
    var capacity = Number($('#channelCapacity').textContent || 0);
    $('#channelTotal').textContent = total;
    $('#channelStatus').textContent = total > capacity ? '分配超过可售量' : '分配正常';
    $('#channelStatus').className = total > capacity ? 'tag tag-red' : 'tag tag-green';
  }

  function primaryPrice() {
    var first = $('[data-primary-price]');
    return first ? money(first.value) : money(selectedType().defaultPrice);
  }

  function channelMap() {
    return $all('.schedule-channel-input').reduce(function (map, input) {
      map[input.getAttribute('data-channel')] = Number(input.value || 0);
      return map;
    }, {});
  }

  function scheduleCode(index, date) {
    return selectedType().prefix + dateCode(date || $('#departDate').value) + String(index || 1).padStart(3, '0');
  }

  function schedulePayload(date, index) {
    var type = selectedType();
    var plan = selectedPlan();
    var depart = date || $('#departDate').value;
    var totals = matrixTotals();
    return {
      code: scheduleCode(index || 1, depart),
      product: selectedProduct().name,
      route: plan.name,
      batchType: type.scheduleType,
      depart: depart,
      back: addDays(depart, plan.days - 1),
      stock: totals.total,
      sold: 0,
      left: totals.saleable,
      unit: type.unit,
      stockLabel: totals.total + type.unit,
      leftLabel: totals.saleable + type.unit,
      channelSeats: channelMap(),
      price: primaryPrice(),
      planner: $('#plannerSelect').value,
      status: mode === 'batch' ? '待售' : '销售中',
      tabStatus: mode === 'batch' ? '待售' : '销售中',
      costStatus: type.scheduleType === '自由行库存' ? '采购批次待确认' : '未维护',
      costClass: 'tag tag-orange',
      locked: false,
      remark: type.label + '按' + type.planLabel + '生成，价格库存矩阵已同步',
      deadline: $('#deadlineDate').value || addDays(depart, -10)
    };
  }

  function renderSummary() {
    var type = selectedType();
    var totals = matrixTotals();
    $('#summaryContent').innerHTML = [
      '<div class="schedule-summary-card"><span>线路类型</span><strong>' + type.label + '</strong></div>',
      '<div class="schedule-summary-card"><span>线路/方案</span><strong>' + selectedProduct().name + ' / ' + selectedPlan().name + '</strong></div>',
      '<div class="schedule-summary-card"><span>日期</span><strong>' + $('#departDate').value + ' 至 ' + $('#returnDate').value + '</strong></div>',
      '<div class="schedule-summary-card"><span>价格库存</span><strong>' + totals.saleable + type.unit + '可售，起价' + primaryPrice() + '</strong></div>'
    ].join('');
  }

  function setStep(index) {
    var panels = $all('[data-builder-panel]');
    var buttons = $all('[data-builder-step]');
    currentStep = Math.max(0, Math.min(index, panels.length - 1));
    buttons.forEach(function (button, buttonIndex) {
      button.classList.toggle('active', buttonIndex === currentStep);
      button.classList.toggle('done', buttonIndex < currentStep);
    });
    panels.forEach(function (panel, panelIndex) {
      panel.classList.toggle('active', panelIndex === currentStep);
    });
    var next = $('[data-next-step]');
    if (next) {
      var submitText = selectedType().scheduleType === '自由行库存' ? '生成日期库存' : '生成团期';
      next.textContent = currentStep === panels.length - 1 ? (mode === 'batch' ? '确认开排' : submitText) : '下一步';
    }
    if (mode === 'batch' && currentStep === panels.length - 1) renderPreview();
    if (mode === 'single' && currentStep === panels.length - 1) renderSummary();
  }

  function openModal() {
    var modal = $('#builderSuccessModal');
    if (!modal) return;
    if (window.caesarUI && window.caesarUI.openLayer) window.caesarUI.openLayer(modal);
    else modal.classList.add('show');
  }

  function closeModal() {
    var modal = $('#builderSuccessModal');
    if (modal) modal.classList.remove('show');
  }

  function readPending() {
    try {
      return JSON.parse(window.localStorage.getItem('caesarPendingTeamCreates') || '{}');
    } catch (error) {
      return {};
    }
  }

  function writePending(item) {
    var type = selectedType();
    var pending = readPending();
    pending[type.approvalNo] = item;
    window.localStorage.setItem('caesarPendingTeamCreates', JSON.stringify(pending));
  }

  function readBatch() {
    try {
      return JSON.parse(window.localStorage.getItem('caesarBatchScheduleCreates') || '[]');
    } catch (error) {
      return [];
    }
  }

  function writeBatch(items) {
    var stored = readBatch();
    items.forEach(function (item) {
      var index = stored.findIndex(function (storedItem) {
        return storedItem.code === item.code;
      });
      if (index > -1) stored.splice(index, 1, item);
      else stored.unshift(item);
    });
    window.localStorage.setItem('caesarBatchScheduleCreates', JSON.stringify(stored));
  }

  function submitSingle() {
    renderSummary();
    var type = selectedType();
    writePending(schedulePayload(null, 1));
    $('#successTitle').textContent = type.scheduleType === '自由行库存' ? '日期库存已提交' : '团期已提交';
    $('#successText').textContent = type.label + '已提交审批，审批通过后生成' + (type.scheduleType === '自由行库存' ? '日期库存并同步采购批次。' : '团期并同步价格库存。');
    $('#approvalNo').textContent = type.approvalNo;
    $('#approvalNode').textContent = type.approvalNode;
    $('#approvalLink').href = 'schedules.html';
    $('#approvalLink').textContent = '返回列表';
    dirty = false;
    openModal();
  }

  function selectedWeekdays() {
    return $all('[name="batchWeekday"]:checked').map(function (input) {
      return Number(input.value);
    });
  }

  function excludedDates() {
    var field = $('#excludeDates');
    if (!field) return new Set();
    return new Set(field.value.split(/[,，\s]+/).map(function (item) {
      return item.trim();
    }).filter(Boolean));
  }

  function generatedDates() {
    var start = $('#batchStart') && $('#batchStart').value;
    var end = $('#batchEnd') && $('#batchEnd').value;
    if (!start || !end) return [];
    var weekdays = selectedWeekdays();
    var excludes = excludedDates();
    var dates = [];
    for (var date = new Date(start); date <= new Date(end); date.setDate(date.getDate() + 1)) {
      var value = date.toISOString().slice(0, 10);
      if (weekdays.indexOf(date.getDay()) > -1 && !excludes.has(value)) dates.push(value);
    }
    return dates;
  }

  function renderPreview() {
    if (mode !== 'batch') return;
    var type = selectedType();
    var plan = selectedPlan();
    var dates = generatedDates();
    $('#previewCount').textContent = dates.length + '个团期';
    $('#previewRows').innerHTML = dates.map(function (date, index) {
      var item = schedulePayload(date, index + 1);
      return '<tr data-preview-row><td><input type="checkbox" checked></td><td>' + item.code + '</td><td>' + item.depart + '</td><td>' + item.back + '</td><td>' + selectedProduct().name + '<br><span class="text-muted">' + plan.name + '</span></td><td>' + item.left + type.unit + '</td><td>' + item.price + '</td><td>' + Object.keys(item.channelSeats).map(function (key) { return key + ':' + item.channelSeats[key]; }).join(' ') + '</td></tr>';
    }).join('');
  }

  function renderPreviewIfNeeded() {
    if (mode === 'batch') renderPreview();
  }

  function confirmBatch() {
    renderPreview();
    var items = $all('[data-preview-row]').filter(function (row) {
      return $('input[type="checkbox"]', row).checked;
    }).map(function (row, index) {
      return schedulePayload(row.children[2].textContent.trim(), index + 1);
    });
    writeBatch(items);
    $('#successTitle').textContent = '批量开排完成';
    $('#successText').textContent = '已生成' + items.length + '个' + selectedType().label + '团期，并同步价格库存矩阵。';
    $('#approvalNo').textContent = '无需审批';
    $('#approvalNode').textContent = '已进入团期列表';
    $('#approvalLink').style.display = 'none';
    dirty = false;
    openModal();
  }

  function bindEvents() {
    $all('[data-schedule-type]').forEach(function (button) {
      button.addEventListener('click', function () {
        setType(button.getAttribute('data-schedule-type'));
        markDirty();
      });
    });

    $('#lineSelect').addEventListener('change', function () {
      renderSelectors($('#lineSelect').value);
      renderContext();
      syncDates(true);
      markDirty();
    });
    $('#planSelect').addEventListener('change', function () {
      renderContext();
      syncDates(true);
      markDirty();
    });
    $('#departDate').addEventListener('change', function () {
      syncDates(true);
      markDirty();
    });
    $('#returnDate').addEventListener('change', function () {
      syncDates(false);
      markDirty();
    });

    $('#matrixRows').addEventListener('input', function () {
      updateMatrixTotals();
      renderPreviewIfNeeded();
      markDirty();
    });

    $all('.schedule-channel-input').forEach(function (input) {
      input.addEventListener('input', function () {
        updateChannelTotals();
        renderPreviewIfNeeded();
        markDirty();
      });
    });

    $all('[data-builder-step]').forEach(function (button, index) {
      button.addEventListener('click', function () {
        setStep(index);
      });
    });

    var next = $('[data-next-step]');
    if (next) {
      next.addEventListener('click', function () {
        if (currentStep < $all('[data-builder-panel]').length - 1) setStep(currentStep + 1);
        else if (mode === 'batch') confirmBatch();
        else submitSingle();
      });
    }

    var prev = $('[data-prev-step]');
    if (prev) {
      prev.addEventListener('click', function () {
        setStep(currentStep - 1);
      });
    }

    $all('[data-save-draft]').forEach(function (button) {
      button.addEventListener('click', function () {
        dirty = false;
        if (window.caesarUI && window.caesarUI.toast) window.caesarUI.toast('草稿已保存');
      });
    });

    var submit = $('[data-submit-builder]');
    if (submit) {
      submit.addEventListener('click', function () {
        if (mode === 'batch') confirmBatch();
        else submitSingle();
      });
    }

    var preview = $('[data-preview-builder]');
    if (preview) {
      preview.addEventListener('click', function () {
        setStep($all('[data-builder-panel]').length - 1);
      });
    }

    $all('input, textarea, select', page).forEach(function (field) {
      field.addEventListener('input', markDirty);
      field.addEventListener('change', markDirty);
    });

    $all('[data-confirm-back]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (dirty && !window.confirm('当前内容未保存，确认离开吗？')) event.preventDefault();
      });
    });

    $all('[data-close-builder-modal]').forEach(function (button) {
      button.addEventListener('click', closeModal);
    });

    var done = $('[data-builder-success]');
    if (done) {
      done.addEventListener('click', function () {
        if (window.caesarNavigateTo) window.caesarNavigateTo('schedules.html');
        else window.location.href = 'schedules.html';
      });
    }

    if (mode === 'batch') {
      $all('[name="batchWeekday"], #batchStart, #batchEnd, #excludeDates').forEach(function (field) {
        field.addEventListener('change', renderPreview);
        field.addEventListener('input', renderPreview);
      });
    }
  }

  function init() {
    var type = params.get('type') || 'group';
    setType(data[type] ? type : 'group');
    renderSelectors(params.get('product') || '', params.get('route') || '');
    renderContext();
    renderMatrix();
    renderTypeNodes();
    syncDates(true);
    bindEvents();
    setStep(0);
    renderPreviewIfNeeded();
  }

  init();
})();
