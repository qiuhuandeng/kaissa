(function () {
  var page = document.querySelector('[data-schedule-builder]');
  if (!page) return;

  var mode = page.getAttribute('data-schedule-builder');
  var isSupplierSchedule = page.hasAttribute('data-supplier-schedule-builder');
  var params = new URLSearchParams(window.location.search);
  var currentStep = 0;
  var dirty = false;

  var data = {
    group: {
      label: '参团游产品',
      scheduleType: '普通团期',
      objectName: '团期',
      tagClass: 'tag tag-blue',
      prefix: 'GT',
      unit: '人',
      planLabel: '产品航线',
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
      approvalNode: '产品负责人',
      products: [
        {
          name: '欧洲十国经典游',
          meta: '旅游类型：出境游，12天11晚，法德瑞意核心城市连线。',
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
      matrixTitle: '人群价格与名额',
      matrixColumns: ['价格结构', '成人价', '儿童价', '单房差', '服务费', '补差'],
      matrix: [
        { label: '标准团费', total: 30, reserve: 0, cells: [{ kind: 'primaryPrice', value: 29800 }, { type: 'number', value: 26800 }, { type: 'number', value: 4800 }, { type: 'number', value: 0 }, { type: 'number', value: 0 }] },
        { label: '优惠团费', total: 0, reserve: 0, cells: [{ type: 'number', value: 27800 }, { type: 'number', value: 24800 }, { type: 'number', value: 4800 }, { type: 'number', value: 0 }, { type: 'number', value: 0 }] }
      ],
      nodes: [
        ['报名截止日期', 'date', '2026-06-20'],
        ['尾款截止日期', 'date', '2026-06-25'],
        ['最低成团人数', 'number', '16'],
        ['单房差', 'text', '¥4,800']
      ]
    },
    free: {
      label: '自由行',
      scheduleType: '自由行出行日期',
      objectName: '出行日期',
      tagClass: 'tag tag-green',
      prefix: 'FT',
      unit: '套',
      planLabel: '套餐线路',
      departLabel: '出行开始',
      returnLabel: '出行结束',
      startLabel: '出发城市',
      endLabel: '目的地',
      startValue: '全国',
      endValue: '兰卡威',
      deadlineLabel: '确认截止日期',
      defaultPrice: 3680,
      defaultStock: 36,
      approvalNo: 'SUP-SCH-20260702-041',
      approvalNode: '凯撒代理运营',
      products: [
        {
          name: '兰卡威机票酒店套餐',
          meta: '全国出发，按出行日期维护机票、酒店房晚与接送机余量。',
          plans: [
            { name: '机票+酒店5天4晚', days: 5, basis: '含往返机票、四星海边酒店、接送机，成人供应商价 ¥3,680' },
            { name: '酒店+接送机4晚', days: 5, basis: '四星酒店房晚+接送机，房态按每日回传' }
          ]
        },
        {
          name: '巴黎自由行套餐',
          meta: '巴黎市区酒店、国际机票和当地玩乐可选组合。',
          plans: [
            { name: '机票+酒店5晚', days: 6, basis: '国际机票+巴黎四星酒店，成人供应商价 ¥6,980' },
            { name: '纯酒店5晚', days: 6, basis: '巴黎四星酒店5晚，可加购接送机' }
          ]
        }
      ],
      matrixTitle: '套餐价格与余量',
      matrixColumns: ['套餐结构', '成人价', '儿童价', '单房差', '服务费', '补差'],
      matrix: [
        { label: '机票酒店套餐', total: 36, reserve: 0, cells: [{ kind: 'primaryPrice', value: 3680 }, { type: 'number', value: 3280 }, { type: 'number', value: 0 }, { type: 'number', value: 0 }, { type: 'number', value: 0 }] },
        { label: '纯酒店套餐', total: 18, reserve: 0, cells: [{ type: 'number', value: 2980 }, { type: 'number', value: 2680 }, { type: 'number', value: 0 }, { type: 'number', value: 0 }, { type: 'number', value: 0 }] },
        { label: '当地玩乐套餐', total: 24, reserve: 0, cells: [{ type: 'number', value: 980 }, { type: 'number', value: 780 }, { type: 'number', value: 0 }, { type: 'number', value: 0 }, { type: 'number', value: 0 }] }
      ],
      nodes: [
        ['房态回传截止', 'date', '2026-07-10'],
        ['出票确认时限', 'text', '名单齐后24小时'],
        ['酒店保留时效', 'text', '确认后48小时'],
        ['旺季二次确认', 'text', '周末与节假日需询房']
      ]
    },
    cruise: {
      label: '邮轮产品',
      scheduleType: '邮轮航次',
      objectName: '航次',
      tagClass: 'tag tag-purple',
      prefix: 'CR',
      unit: '间',
      planLabel: '产品线路',
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
            { name: '地中海经典航线', days: 8, basis: '巴塞罗那登离船，停靠马赛、热那亚、那不勒斯，舱房按航次售卖' },
            { name: '爱琴海岛屿航线', days: 8, basis: '雅典登离船，米科诺斯、圣托里尼等港口，舱房按航次售卖' }
          ]
        },
        {
          name: '海洋交响号地中海邮轮',
          meta: '罗马登船，西地中海经典航次。',
          plans: [
            { name: '西地中海精华航线', days: 8, basis: '罗马登船，西地中海经典停靠港，舱房按航次售卖' }
          ]
        }
      ],
      matrixTitle: '舱型价格与舱房',
      matrixColumns: ['舱房售卖', '成人价', '儿童价', '单房差', '港务税/服务费', '升舱差价'],
      matrix: [
        {
          label: '内舱 IC',
          total: 42,
          reserve: 0,
          cells: [
            { kind: 'primaryPrice', value: 12800 },
            { type: 'number', value: 9800 },
            { type: 'number', value: 4800 },
            { type: 'number', value: 1800 },
            { type: 'number', value: 0 }
          ]
        },
        {
          label: '海景 OC',
          total: 36,
          reserve: 0,
          cells: [
            { kind: 'primaryPrice', value: 15800 },
            { type: 'number', value: 12800 },
            { type: 'number', value: 5800 },
            { type: 'number', value: 1800 },
            { type: 'number', value: 3000 }
          ]
        },
        {
          label: '阳台 BC',
          total: 36,
          reserve: 0,
          cells: [
            { kind: 'primaryPrice', value: 18800 },
            { type: 'number', value: 14800 },
            { type: 'number', value: 6800 },
            { type: 'number', value: 1800 },
            { type: 'number', value: 6000 }
          ]
        },
        {
          label: '套房 ST',
          total: 12,
          reserve: 0,
          cells: [
            { kind: 'primaryPrice', value: 26800 },
            { type: 'number', value: 21800 },
            { type: 'number', value: 9800 },
            { type: 'number', value: 1800 },
            { type: 'number', value: 14000 }
          ]
        }
      ],
      nodes: [
        ['航次名称', 'text', '地中海7月1日航次'],
        ['乘客名单提交截止', 'date', '2026-06-18'],
        ['护照/签证资料截止', 'date', '2026-06-15'],
        ['Final Payment Date', 'date', '2026-06-01'],
        ['在线登船值机开放', 'date', '2026-06-24']
      ]
    },
    train: {
      label: '专列产品',
      scheduleType: '专列班期',
      objectName: '班期',
      tagClass: 'tag tag-green',
      prefix: 'TR',
      unit: '铺',
      planLabel: '专列线路',
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
            { name: '丝路经典线', days: 12, basis: '西安始发，兰州、张掖、敦煌、吐鲁番、乌鲁木齐串联，铺位按班期售卖' },
            { name: '丝路深度线', days: 12, basis: '增加敦煌与吐鲁番深度游览，车厢铺位按班期售卖' }
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
      matrixTitle: '席别价格与铺位',
      matrixColumns: ['席别/铺位', '成人价', '儿童价', '单铺差', '服务费', '升铺差价'],
      matrix: [
        {
          label: '软卧下铺',
          total: 48,
          reserve: 0,
          cells: [
            { kind: 'primaryPrice', value: 19800 },
            { type: 'number', value: 17800 },
            { type: 'number', value: 0 },
            { type: 'number', value: 800 },
            { type: 'number', value: 1000 }
          ]
        },
        {
          label: '软卧上铺',
          total: 36,
          reserve: 0,
          cells: [
            { kind: 'primaryPrice', value: 18800 },
            { type: 'number', value: 16800 },
            { type: 'number', value: 0 },
            { type: 'number', value: 800 },
            { type: 'number', value: 0 }
          ]
        },
        {
          label: '硬卧中铺',
          total: 32,
          reserve: 0,
          cells: [
            { kind: 'primaryPrice', value: 15800 },
            { type: 'number', value: 13800 },
            { type: 'number', value: 0 },
            { type: 'number', value: 600 },
            { type: 'number', value: -3000 }
          ]
        },
        {
          label: '软卧包厢',
          total: 12,
          reserve: 0,
          cells: [
            { kind: 'primaryPrice', value: 36800 },
            { type: 'number', value: 32800 },
            { type: 'number', value: 0 },
            { type: 'number', value: 1200 },
            { type: 'number', value: 18000 }
          ]
        }
      ],
      nodes: [
        ['班期名称', 'text', '丝路7月班期'],
        ['购票名单提交截止', 'date', '2026-06-18'],
        ['铺位确认回传', 'date', '2026-06-22'],
        ['集合站及时间', 'text', '西安站 18:30'],
        ['包列固定成本', 'text', '¥620,000']
      ]
    },
    study: {
      label: '研学产品',
      scheduleType: '研学营期',
      objectName: '营期',
      tagClass: 'tag tag-green',
      prefix: 'ST',
      unit: '名',
      planLabel: '产品线路',
      departLabel: '开营日期',
      returnLabel: '结营日期',
      startLabel: '集合城市',
      endLabel: '解散城市',
      startValue: '北京',
      endValue: '北京',
      deadlineLabel: '报名截止日期',
      defaultPrice: 9600,
      defaultStock: 30,
      approvalNo: 'APR-20260624-038',
      approvalNode: '研学产品负责人',
      products: [
        {
          name: '北京航天研学营',
          meta: '适合小学高年级至初中学生，覆盖航天课程、基地参访和项目制任务。',
          plans: [
            { name: '航天科技7日', days: 7, basis: '航天基地课程、导师带教、营地住宿，学生参考价 ¥9,600' },
            { name: '航天科技冬令', days: 6, basis: '冬令营课程、家长告知材料、未成年人保险' }
          ]
        },
        {
          name: '新加坡科技研学线',
          meta: '面向初高中学生，覆盖高校参访、创新课程和英语任务。',
          plans: [
            { name: '创新科技8日', days: 8, basis: '高校参访、科技企业课堂、双语导师，学生参考价 ¥18,800' }
          ]
        }
      ],
      matrixTitle: '研学价格与名额',
      matrixColumns: ['名额结构', '学生价', '陪同价', '课程/服务费', '保险费', '备注'],
      matrix: [
        { label: '学生名额', total: 30, reserve: 0, cells: [{ kind: 'primaryPrice', value: 9600 }, { type: 'number', value: 0 }, { type: 'number', value: 1200 }, { type: 'number', value: 120 }, { type: 'text', value: '六年级以上' }] },
        { label: '家长陪同', total: 6, reserve: 0, cells: [{ type: 'number', value: 6200 }, { type: 'number', value: 6200 }, { type: 'number', value: 600 }, { type: 'number', value: 120 }, { type: 'text', value: '可选陪同' }] }
      ],
      nodes: [
        ['营期名称', 'text', '北京航天研学营暑期营期'],
        ['适合年级', 'text', '小学五年级-初二'],
        ['班级数量', 'number', '2'],
        ['每班上限', 'number', '15'],
        ['导师配置', 'text', '航天导师2名/安全员1名'],
        ['学校名称', 'text', '北京市示范学校'],
        ['实名制截止', 'date', '2026-06-18'],
        ['保险要求', 'text', '未成年人意外险+旅行责任险']
      ]
    }
  };

  data.outbound = Object.assign({}, data.group, {
    label: '参团游线路',
    prefix: 'OB'
  });
  data.domestic = Object.assign({}, data.group, {
    label: '参团游线路',
    prefix: 'CN',
    products: [
      {
        name: '三亚亲子5日游',
        meta: '旅游类型：境内游，5天4晚，三亚、亚龙湾、海棠湾亲子度假。',
        plans: [
          { name: '亲子标准款', days: 5, basis: '海岛酒店、接送和亲子活动，成人参考价 ¥4,800' },
          { name: '度假升级款', days: 5, basis: '高星酒店、精选景区和亲子活动，成人参考价 ¥7,800' }
        ]
      },
      {
        name: '西藏深度探索7日',
        meta: '旅游类型：境内游，7天6晚，成都出发，拉萨及周边深度游览。',
        plans: [
          { name: '高原标准款', days: 7, basis: '当地酒店、景区首道门票、中文导游，成人参考价 ¥4,800' }
        ]
      }
    ]
  });

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

  function isPeopleScheduleType(typeKey) {
    return typeKey === 'group' || typeKey === 'outbound' || typeKey === 'domestic';
  }

  function requiresProcurementInventory(typeKey) {
    return typeKey === 'group' || typeKey === 'outbound' || typeKey === 'domestic' || typeKey === 'cruise' || typeKey === 'train';
  }

  function selectedType() {
    return data[selectedTypeKey()];
  }

  function inferTypeFromProductName(productName) {
    var name = String(productName || '');
    var matched = '';
    Object.keys(data).some(function (typeKey) {
      return data[typeKey].products.some(function (product) {
        if (product.name === name) {
          matched = typeKey;
          return true;
        }
        return false;
      });
    });
    if (matched) return matched;
    if (/邮轮/.test(name)) return 'cruise';
    if (/专列/.test(name)) return 'train';
    if (/自由行|机票|酒店|套餐/.test(name)) return 'free';
    if (/研学/.test(name)) return 'study';
    return '';
  }

  function selectedProduct() {
    return selectedType().products[$('#lineSelect').selectedIndex] || selectedType().products[0];
  }

  function selectedPlan() {
    return selectedProduct().plans[$('#planSelect').selectedIndex] || selectedProduct().plans[0];
  }

  function selectedResourceDemand() {
    if (!requiresProcurementInventory(selectedTypeKey())) return null;
    var demand = $('#trafficDemand');
    var borrowSource = $('#resourceBorrowSource');
    if (!demand || !borrowSource) return null;
    var isBound = demand.value === '绑定已采购交通';
    if (!borrowSource) return null;
    var borrowQty = $('#resourceBorrowQty');
    var borrowStatus = $('#resourceBorrowStatus');
    var sourceOption = borrowSource && borrowSource.options[borrowSource.selectedIndex];
    var optionQty = sourceOption ? Number(sourceOption.getAttribute('data-qty') || 0) : 0;
    return {
      bindMode: demand.value,
      bound: isBound,
      trafficDemand: demand.value,
      defaultRoute: isBound && sourceOption ? sourceOption.textContent : '',
      useMethod: isBound ? '保存后占用交通可分配库存' : '手工维护团期名额',
      expectedPeople: $('#matrixTotal') ? $('#matrixTotal').textContent : '',
      borrowSource: isBound && borrowSource ? borrowSource.value : '',
      borrowQty: isBound && borrowQty ? Number(borrowQty.value || optionQty || 0) : 0,
      borrowStatus: isBound ? (borrowStatus ? borrowStatus.value || '已绑定' : '已绑定') : '未绑定',
      sourceDepart: sourceOption ? sourceOption.getAttribute('data-depart') : '',
      sourceBack: sourceOption ? sourceOption.getAttribute('data-back') : '',
      sourceQty: optionQty,
      sourceUnit: sourceOption ? sourceOption.getAttribute('data-unit') || selectedType().unit : selectedType().unit
    };
  }

  function resourceBorrowOptions() {
    var typeKey = selectedTypeKey();
    if (typeKey === 'cruise') {
      return [
        { value: 'CRU-BLK-20261003-001', label: '理想号 MED-20261003 上海吴淞口 · 全舱型 · 可分配126间', depart: '2026-10-03', back: '2026-10-10', qty: 126, unit: '间' },
        { value: 'CRU-BLK-20260912-003', label: '理想号 MED-20260912 上海吴淞口 · 全舱型 · 可分配38间', depart: '2026-09-12', back: '2026-09-19', qty: 38, unit: '间' }
      ];
    }
    if (typeKey === 'train') {
      return [
        { value: 'TRN-BLK-20260920-001', label: 'Y653 西安-乌鲁木齐 2026/09/20 · 全席别 · 可分配96铺', depart: '2026-09-20', back: '2026-09-28', qty: 96, unit: '铺' },
        { value: 'TRN-BLK-20261005-002', label: 'Y654 乌鲁木齐-西安 2026/10/05 · 全席别 · 可分配72铺', depart: '2026-10-05', back: '2026-10-13', qty: 72, unit: '铺' }
      ];
    }
    return [
      { value: 'AIR-CT-20260908-001|经济舱G舱', label: 'CA937 北京-巴黎 2026/09/08 · 经济舱G舱 · 可分配30座', depart: '2026-09-08', back: '2026-09-19', qty: 30, unit: '座' },
      { value: 'AIR-CT-20260908-001|经济舱K舱', label: 'CA937 北京-巴黎 2026/09/08 · 经济舱K舱 · 可分配20座', depart: '2026-09-08', back: '2026-09-19', qty: 20, unit: '座' }
    ];
  }

  function renderResourceBorrowOptions() {
    var source = $('#resourceBorrowSource');
    var qty = $('#resourceBorrowQty');
    var status = $('#resourceBorrowStatus');
    if (!source) return;
    var options = resourceBorrowOptions();
    source.innerHTML = options.map(function (option) {
      return '<option value="' + option.value + '" data-depart="' + option.depart + '" data-back="' + option.back + '" data-qty="' + option.qty + '" data-unit="' + (option.unit || selectedType().unit) + '">' + (option.label || option.value) + '</option>';
    }).join('');
    if (qty) qty.value = $('#trafficDemand') && $('#trafficDemand').value === '绑定已采购交通' && options[0] ? Math.min(options[0].qty, quotaPlanCount() || Number(selectedType().defaultStock || options[0].qty)) : 0;
    if (status) status.value = $('#trafficDemand') && $('#trafficDemand').value === '绑定已采购交通' ? '已绑定' : '未绑定';
  }

  function applyResourceBindingDefaults(updateDates) {
    var demand = $('#trafficDemand');
    var source = $('#resourceBorrowSource');
    var qty = $('#resourceBorrowQty');
    var status = $('#resourceBorrowStatus');
    if (!demand || !source || !qty) return;
    var bound = demand.value === '绑定已采购交通';
    var option = source.options[source.selectedIndex];
    source.disabled = !bound;
    qty.disabled = !bound;
    if (!bound) {
      qty.value = 0;
      if (status) status.value = '未绑定';
      return;
    }
    if (option && !Number(qty.value || 0)) {
      qty.value = Math.min(Number(option.getAttribute('data-qty') || 0), trafficBindingCapacity() || Number(option.getAttribute('data-qty') || 0));
    }
    if (status) status.value = '已绑定';
    if (updateDates) applyResourceBorrowDates();
  }

  function quotaPlanCount() {
    var field = $('#quotaPlanCount');
    if (field) return Number(field.value || 0);
    return 0;
  }

  function adultCount() {
    var field = $('#adultCount');
    if (field) return Number(field.value || 0);
    return 0;
  }

  function reserveHours() {
    var field = $('#reserveHours');
    if (field) return Number(field.value || 0);
    return 0;
  }

  function quotaDisplayUnit() {
    if (selectedTypeKey() === 'cruise') return '人';
    return selectedType().unit;
  }

  function syncQuotaPlanningFields() {
    var qty = $('#resourceBorrowQty');
    if (qty && $('#quotaPlanCount')) qty.value = quotaPlanCount();
  }

  function applyResourceBorrowDates() {
    var source = $('#resourceBorrowSource');
    if (!source || !source.options.length || !requiresProcurementInventory(selectedTypeKey())) return;
    var option = source.options[source.selectedIndex];
    var depart = option.getAttribute('data-depart');
    var back = option.getAttribute('data-back');
    if (depart && $('#departDate')) $('#departDate').value = depart;
    if (back && $('#returnDate')) $('#returnDate').value = back;
    if (depart && $('#deadlineDate')) $('#deadlineDate').value = addDays(depart, -10);
    if (depart && $('#deadline2')) $('#deadline2').value = addDays(depart, -6);
    if ($('#durationHint')) {
      var days = depart && back ? Math.round((new Date(back) - new Date(depart)) / 86400000) + 1 : 0;
      $('#durationHint').textContent = days > 0 ? days + '天' + Math.max(days - 1, 0) + '晚' : '-';
    }
  }

  function resourceBorrowCheckText() {
    var demand = selectedResourceDemand();
    if (!demand || !demand.bound) return '未绑定交通，按手工名额销售';
    var capacity = trafficBindingCapacity();
    if (demand.borrowQty > demand.sourceQty) return '占用数量超过交通可分配库存';
    if (demand.borrowQty < capacity) return '占用数量小于计划数量';
    return '保存后占用交通可分配库存';
  }

  function trafficBindingCapacity() {
    if ($('#quotaPlanCount')) return quotaPlanCount();
    if (isPeopleScheduleType(selectedTypeKey())) {
      var firstRow = $('[data-matrix-row]');
      if (firstRow) {
        var total = $('[data-total]', firstRow);
        var reserve = $('[data-reserve]', firstRow);
        return Math.max(Number(total ? total.value : 0) - Number(reserve ? reserve.value : 0), 0);
      }
    }
    return matrixTotals().saleable;
  }

  function renderResourceDemandContext() {
    syncQuotaPlanningFields();
    var demand = selectedResourceDemand();
    var sourceField = $('[data-resource-source-field]');
    var needsResource = requiresProcurementInventory(selectedTypeKey());
    if (sourceField) sourceField.hidden = !needsResource;
    applyResourceBindingDefaults(false);
    var check = $('#resourceBorrowCheck');
    var demandLabel = $('#trafficDemandLabel');
    var sourceLabel = $('#resourceBorrowSourceLabel');
    var qtyLabel = $('#resourceBorrowQtyLabel');
    var quotaLabel = $('#quotaPlanCountLabel');
    var adultLabel = $('#adultCountLabel');
    var matrixTitle = $('#matrixSectionTitle');
    if (demandLabel) demandLabel.textContent = '名额来源';
    if (sourceLabel) sourceLabel.textContent = selectedTypeKey() === 'cruise' ? '选择邮轮舱房' : selectedTypeKey() === 'train' ? '选择专列铺位' : '选择交通';
    if (qtyLabel) qtyLabel.textContent = selectedTypeKey() === 'cruise' ? '占用舱房' : selectedTypeKey() === 'train' ? '占用铺位' : '占用座位';
    if (quotaLabel) quotaLabel.textContent = selectedTypeKey() === 'train' ? '计划铺位' : selectedTypeKey() === 'study' ? '学生名额' : '计划客';
    if (adultLabel) adultLabel.textContent = selectedTypeKey() === 'study' ? '陪同人数' : '成人数';
    if (matrixTitle) matrixTitle.textContent = selectedType().matrixTitle || '价格结构';
    if (check) check.textContent = needsResource ? resourceBorrowCheckText() : '按当前名额与价格生成';
  }

  function defaultPlanDays(type) {
    if (type.scheduleType === '邮轮航次') return 8;
    if (type.scheduleType === '自由行出行日期') return 5;
    if (type.scheduleType === '研学营期') return 7;
    return 12;
  }

  function setType(typeKey) {
    if (typeKey === 'group') typeKey = 'outbound';
    if (!data[typeKey]) typeKey = 'group';
    $all('[data-schedule-type]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-schedule-type') === typeKey);
    });
    renderSelectors();
    renderContext();
    renderMatrix();
    renderTypeNodes();
    syncDates(true);
    renderResourceBorrowOptions();
    renderResourceDemandContext();
    renderPreviewIfNeeded();
  }

  function renderSelectors(preferredLine, preferredPlan) {
    var type = selectedType();
    var lineSelect = $('#lineSelect');
    var planSelect = $('#planSelect');
    var preferredProduct = null;

    type.products.forEach(function (product) {
      if (product.name === preferredLine) preferredProduct = product;
    });

    if (preferredLine && !preferredProduct) {
      preferredProduct = {
        name: preferredLine,
        meta: '待开排产品',
        plans: [{ name: preferredPlan || '默认线路', days: defaultPlanDays(type), basis: '按当前线路开排' }]
      };
      type.products.unshift(preferredProduct);
    }

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

    var currentProduct = selectedProduct();
    if (preferredPlan && !currentProduct.plans.some(function (plan) { return plan.name === preferredPlan; })) {
      currentProduct.plans.unshift({ name: preferredPlan, days: defaultPlanDays(type), basis: '按当前线路开排' });
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
    if (mode !== 'batch') {
      var pageTitleText = '新建' + type.objectName;
      var pageTitle = document.querySelector('.page-title');
      var submitButton = $('[data-submit-builder]');
      var successButton = $('[data-builder-success]');
      document.title = pageTitleText + ' - 凯撒旅游';
      if (pageTitle) pageTitle.textContent = pageTitleText;
      if (submitButton) submitButton.textContent = '生成' + type.objectName;
      if (successButton) successButton.textContent = '进入' + type.objectName + '列表';
    }
    $('#heroType').textContent = type.label;
    $('#heroType').className = type.tagClass;
    $('#heroTitle').textContent = product.name;
    var heroDesc = $('#heroDesc');
    if (heroDesc) heroDesc.textContent = product.meta;
    $('#heroPlan').textContent = plan.name;
    $('#heroDuration').textContent = plan.days + '天' + Math.max(plan.days - 1, 0) + '晚';
    $('#heroUnit').textContent = type.defaultStock + type.unit;
    $('#planLabel').innerHTML = type.planLabel + ' <span class="req">*</span>';
    $('#planBasis').textContent = plan.basis;
    $('#lineMeta').value = product.meta + '\n' + type.planLabel + '：' + plan.name + '；' + plan.basis + '\n' + inheritedConfigText(type);
    $('#departLabel').innerHTML = type.departLabel + ' <span class="req">*</span>';
    $('#returnLabel').innerHTML = type.returnLabel + ' <span class="req">*</span>';
    $('#startLabel').innerHTML = type.startLabel + ' <span class="req">*</span>';
    $('#endLabel').innerHTML = type.endLabel + ' <span class="req">*</span>';
    $('#startPlace').value = type.startValue;
    $('#endPlace').value = type.endValue;
    $('#deadline2Label').textContent = type.deadlineLabel;
    $('#scheduleCodePreview').textContent = type.prefix + dateCode($('#departDate').value) + '001';
    if ($('#quotaPlanCount')) {
      var defaultQuota = selectedTypeKey() === 'cruise' ? 30 : type.defaultStock;
      $('#quotaPlanCount').value = defaultQuota;
    }
    if ($('#adultCount')) {
      $('#adultCount').value = selectedTypeKey() === 'study' ? 4 : Math.max(Math.floor(Number($('#quotaPlanCount') ? $('#quotaPlanCount').value : type.defaultStock) * 0.6), 0);
    }
    if ($('#reserveHours') && !Number($('#reserveHours').value || 0)) $('#reserveHours').value = 24;
    renderResourceDemandContext();
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

  function matrixInputCell(cell) {
    var type = cell.type || (typeof cell.value === 'number' ? 'number' : 'text');
    var min = type === 'number' ? ' min="0"' : '';
    return '<td><input class="table-input" type="' + type + '"' + min + ' value="' + cell.value + '"></td>';
  }

  function matrixObjectCell(cell, row) {
    if (cell.kind === 'total') {
      return '<td><input class="table-input" type="number" min="0" value="' + row.total + '" data-total></td>';
    }
    if (cell.kind === 'reserve') {
      return '<td><input class="table-input" type="number" min="0" value="' + row.reserve + '" data-reserve></td>';
    }
    if (cell.kind === 'saleable') {
      return '<td><span data-saleable>' + Math.max(row.total - row.reserve, 0) + '</span></td>';
    }
    if (cell.kind === 'primaryPrice') {
      return '<td><input class="table-input" type="number" min="0" value="' + cell.value + '" data-primary-price></td>';
    }
    return matrixInputCell(cell);
  }

  function matrixRow(row) {
    if (!Array.isArray(row)) {
      return '<tr data-matrix-row data-row-total="' + Number(row.total || 0) + '" data-row-reserve="' + Number(row.reserve || 0) + '">' +
        '<td><strong>' + row.label + '</strong></td>' +
        row.cells.map(function (cell) { return matrixObjectCell(cell, row); }).join('') +
        '</tr>';
    }
    var lastType = typeof row[5] === 'number' ? 'number' : 'text';
    var lastMin = lastType === 'number' ? ' min="0"' : '';
    return '<tr data-matrix-row>' +
      '<td><strong>' + row[0] + '</strong></td>' +
      '<td><input class="table-input" type="number" min="0" value="' + row[1] + '" data-total></td>' +
      '<td><input class="table-input" type="number" min="0" value="' + row[2] + '" data-reserve></td>' +
      '<td><span data-saleable>' + Math.max(row[1] - row[2], 0) + '</span></td>' +
      '<td><input class="table-input" type="number" min="0" value="' + row[3] + '" data-primary-price></td>' +
      '<td><input class="table-input" type="number" min="0" value="' + row[4] + '"></td>' +
      '<td><input class="table-input" type="' + lastType + '"' + lastMin + ' value="' + row[5] + '"></td>' +
      '</tr>';
  }

  function renderMatrix() {
    $('#matrixHead').innerHTML = '<tr>' + matrixHeader() + '</tr>';
    $('#matrixRows').innerHTML = selectedType().matrix.map(matrixRow).join('');
    updateMatrixTotals();
  }

  function inheritedConfigText(type) {
    if (!type) return '继承配置：行程安排、费用规则、签证与证件';
    if (type.objectName === '航次') return '继承配置：航线与船舶、航程与登离船、舱房售卖、费用与证件';
    if (type.objectName === '班期') return '继承配置：线路与运营、行程与接驳、车厢铺位、费用与证件';
    if (type.objectName === '出行日期') return '继承配置：套餐基础、资源组合、可售规则、费用与证件';
    if (type.objectName === '营期') return '继承配置：课程行程、安全材料、费用规则、证件要求';
    return '继承配置：行程安排、大交通、费用规则、签证与证件';
  }

  function renderTypeNodes() {
    $('#typeNodeGrid').innerHTML = selectedType().nodes.map(function (node, index) {
      return '<div class="schedule-node-card"><label class="form-label" for="typeNode' + index + '">' + node[0] + '</label><input id="typeNode' + index + '" class="form-control" type="' + node[1] + '" value="' + node[2] + '"></div>';
    }).join('');
  }

  function setTypeNodeValue(labels, value) {
    if (!value) return;
    var names = Array.isArray(labels) ? labels : [labels];
    $all('#typeNodeGrid .schedule-node-card').some(function (card) {
      var label = $('.form-label', card);
      var input = $('.form-control', card);
      if (!label || !input) return false;
      var text = label.textContent.trim();
      if (names.indexOf(text) === -1) return false;
      input.value = value;
      return true;
    });
  }

  function applyInboundScheduleDefaults() {
    var start = params.get('travelStart') || params.get('departDate');
    var end = params.get('travelEnd') || params.get('returnDate');
    var people = params.get('people') || params.get('quota') || params.get('students');
    var scheduleName = params.get('campName') || params.get('scheduleName') || params.get('voyageName') || params.get('periodName');
    if (start && $('#departDate')) $('#departDate').value = start;
    if (end && $('#returnDate')) $('#returnDate').value = end;
    else if (start && $('#returnDate')) $('#returnDate').value = addDays(start, selectedPlan().days - 1);
    if (start && $('#deadlineDate')) $('#deadlineDate').value = addDays(start, -10);
    if (start && $('#deadline2')) $('#deadline2').value = addDays(start, -6);
    if (people && $('#quotaPlanCount')) $('#quotaPlanCount').value = people;
    if (people && $('#adultCount') && selectedTypeKey() === 'study') $('#adultCount').value = Math.min(4, Number(people || 0));
    setTypeNodeValue(['营期名称', '班期名称', '航次名称'], scheduleName);
    if (scheduleName && $('#executeRemark') && !$('#executeRemark').value) $('#executeRemark').value = '来源营期：' + scheduleName;
    if ($('#durationHint') && $('#departDate') && $('#returnDate')) {
      var days = $('#departDate').value && $('#returnDate').value ? Math.round((new Date($('#returnDate').value) - new Date($('#departDate').value)) / 86400000) + 1 : 0;
      $('#durationHint').textContent = days > 0 ? days + '天' + Math.max(days - 1, 0) + '晚' : '-';
    }
    if ($('#scheduleCodePreview') && $('#departDate')) $('#scheduleCodePreview').textContent = selectedType().prefix + dateCode($('#departDate').value) + '001';
    if ($('#heroUnit') && $('#quotaPlanCount')) $('#heroUnit').textContent = $('#quotaPlanCount').value + selectedType().unit;
    updateMatrixTotals();
  }

  function matrixTotals() {
    var planned = quotaPlanCount();
    if ($('#quotaPlanCount')) return { total: planned, saleable: planned };
    return $all('[data-matrix-row]').reduce(function (summary, row) {
      var totalInput = $('[data-total]', row);
      var reserveInput = $('[data-reserve]', row);
      var total = Number(totalInput ? totalInput.value : row.getAttribute('data-row-total') || 0);
      var reserve = Number(reserveInput ? reserveInput.value : row.getAttribute('data-row-reserve') || 0);
      var saleable = Math.max(total - reserve, 0);
      var saleableCell = $('[data-saleable]', row);
      if (saleableCell) saleableCell.textContent = saleable;
      summary.total += total;
      summary.saleable += saleable;
      return summary;
    }, { total: 0, saleable: 0 });
  }

  function updateMatrixTotals() {
    var totals = matrixTotals();
    $('#matrixTotal').textContent = totals.total + quotaDisplayUnit();
    $('#matrixSaleable').textContent = totals.saleable + quotaDisplayUnit();
    if ($('#channelCapacity')) $('#channelCapacity').textContent = totals.saleable;
    updateChannelTotals();
    renderResourceDemandContext();
  }

  function updateChannelTotals() {
    if (!$('#channelCapacity') || !$('#channelTotal') || !$('#channelStatus')) return;
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
    var saleStatusField = $('#saleStatus');
    var executionStatusField = $('#executionStatus');
    var settlementStatusField = $('#settlementStatus');
    var saleStatus = saleStatusField ? saleStatusField.value : '筹备中';
    var executionStatus = executionStatusField ? executionStatusField.value : '未出团';
    var settlementStatus = settlementStatusField ? settlementStatusField.value : '未维护成本';
    var resourceDemand = selectedResourceDemand();
    var groupModeField = $('#groupModeSelect');
    var privateCustomerField = $('#privateCustomerInput');
    var customProjectField = $('#customProjectInput');
    var privateSaleScopeField = $('#privateSaleScope');
    var privateGroupNoteField = $('#privateGroupNote');
    var groupMode = groupModeField ? groupModeField.value : '散拼';
    var privateCustomer = privateCustomerField ? privateCustomerField.value.trim() : '';
    var customProjectNo = customProjectField ? customProjectField.value.trim() : '';
    var privateSaleScope = privateSaleScopeField ? privateSaleScopeField.value : '';
    var privateGroupNote = privateGroupNoteField ? privateGroupNoteField.value.trim() : '';
    if (mode === 'batch') {
      saleStatus = '筹备中';
      executionStatus = '未出团';
      settlementStatus = '未维护成本';
    }
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
      unit: quotaDisplayUnit(),
      stockLabel: totals.total + quotaDisplayUnit(),
      leftLabel: totals.saleable + quotaDisplayUnit(),
      channelSeats: channelMap(),
      price: primaryPrice(),
      adultCount: adultCount(),
      reserveHours: reserveHours(),
      planner: $('#plannerSelect').value,
      saleStatus: saleStatus,
      executionStatus: executionStatus,
      settlementStatus: settlementStatus,
      status: saleStatus,
      tabStatus: saleStatus + ' ' + executionStatus + ' ' + settlementStatus,
      costStatus: settlementStatus,
      costClass: 'tag tag-orange',
      locked: false,
      trafficDemand: resourceDemand ? resourceDemand.trafficDemand : '',
      defaultFlightRoute: resourceDemand ? resourceDemand.defaultRoute : '',
      flightUseMethod: resourceDemand ? resourceDemand.useMethod : '',
      trafficBindingMode: resourceDemand && resourceDemand.bound ? '绑定已采购交通' : '手工录入名额',
      trafficResource: resourceDemand && resourceDemand.bound ? resourceDemand.defaultRoute : '',
      trafficResourceValue: resourceDemand && resourceDemand.bound ? resourceDemand.borrowSource : '',
      trafficResourceQty: resourceDemand && resourceDemand.bound ? resourceDemand.borrowQty : 0,
      trafficResourceUnit: resourceDemand && resourceDemand.bound ? resourceDemand.sourceUnit : '',
      trafficResourceStatus: resourceDemand && resourceDemand.bound ? '已绑定' : '未绑定',
      resourceBorrowSource: resourceDemand ? resourceDemand.borrowSource : '',
      resourceBorrowQty: resourceDemand ? resourceDemand.borrowQty : 0,
      resourceBorrowStatus: resourceDemand ? resourceDemand.borrowStatus : '',
      groupMode: groupMode,
      privateCustomer: privateCustomer,
      customProjectNo: customProjectNo,
      privateSaleScope: privateSaleScope,
      privateGroupNote: privateGroupNote,
      remark: (privateGroupNote || type.label + '按' + type.planLabel + '生成，团期日期、价格与余量已确认') + (groupMode === '项目团' && privateCustomer ? '；指定客户：' + privateCustomer : ''),
      deadline: $('#deadlineDate').value || addDays(depart, -10)
    };
  }

  function renderSummary() {
    var type = selectedType();
    var totals = matrixTotals();
    var demand = selectedResourceDemand();
    var summary = [
      '<div class="schedule-summary-card"><span>产品类型</span><strong>' + type.label + '</strong></div>',
      '<div class="schedule-summary-card"><span>产品/线路</span><strong>' + selectedProduct().name + ' / ' + selectedPlan().name + '</strong></div>',
      '<div class="schedule-summary-card"><span>日期</span><strong>' + $('#departDate').value + ' 至 ' + $('#returnDate').value + '</strong></div>',
      '<div class="schedule-summary-card"><span>名额价格</span><strong>' + totals.saleable + quotaDisplayUnit() + '，成人' + adultCount() + '，起价' + primaryPrice() + '</strong></div>',
      '<div class="schedule-summary-card"><span>预留时长</span><strong>' + reserveHours() + '小时</strong></div>'
    ];
    if ($('#groupModeSelect')) {
      summary.push('<div class="schedule-summary-card"><span>团队来源</span><strong>' + $('#groupModeSelect').value + '</strong></div>');
      if ($('#groupModeSelect').value === '项目团') {
        summary.push('<div class="schedule-summary-card"><span>客户专属</span><strong>' + (($('#privateCustomerInput') && $('#privateCustomerInput').value.trim()) || '待选择客户') + '</strong></div>');
      }
    }
    summary.push('<div class="schedule-summary-card"><span>资源占用</span><strong>' + (demand && demand.bound ? (demand.borrowQty + (demand.sourceUnit || type.unit) + '，' + resourceBorrowCheckText()) : '按当前名额生成') + '</strong></div>');
    $('#summaryContent').innerHTML = summary.join('');
  }

  function validateResourceBorrow() {
    var demand = selectedResourceDemand();
    if (!demand || !demand.bound) return true;
    if (demand.borrowQty > demand.sourceQty || demand.borrowQty < trafficBindingCapacity()) {
      if (window.caesarUI && window.caesarUI.toast) window.caesarUI.toast('绑定交通库存不足，请调整价格库存或占用数量', { type: 'warning' });
      return false;
    }
    return true;
  }

  function validatePrivateGroup() {
    var groupModeField = $('#groupModeSelect');
    var privateCustomerField = $('#privateCustomerInput');
    if (!groupModeField || groupModeField.value !== '项目团') return true;
    if (privateCustomerField && privateCustomerField.value.trim()) return true;
    if (window.caesarUI && window.caesarUI.toast) window.caesarUI.toast('项目团必须关联单团项目客户', { type: 'warning' });
    if (privateCustomerField) privateCustomerField.focus();
    return false;
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
      next.textContent = currentStep === panels.length - 1 ? (isSupplierSchedule ? '提交凯撒确认' : (mode === 'batch' ? '确认开排' : '生成' + selectedType().objectName)) : '下一步';
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

  function readRouteScheduleContext() {
    try {
      return JSON.parse(window.localStorage.getItem('caesarRouteScheduleContext') || '{}');
    } catch (error) {
      return {};
    }
  }

  function scheduleListHref() {
    var product = params.get('productName') || params.get('product') || '';
    var type = params.get('type') || selectedTypeKey();
    if (!product) return 'schedules.html';
    var listParams = new URLSearchParams();
    listParams.set('productName', product);
    if (type) listParams.set('type', type);
    return 'schedules.html?' + listParams.toString();
  }

  function syncBackLinks() {
    $all('[data-confirm-back]').forEach(function (link) {
      link.href = scheduleListHref();
    });
  }

  function appendRouteContextMeta(routeContext) {
    if (!routeContext || !routeContext.product) return;
    var lineMeta = $('#lineMeta');
    if (!lineMeta) return;
    var pieces = ['来源产品：' + routeContext.product];
    if (routeContext.route) pieces.push('承接产品线路：' + routeContext.route);
    pieces.push(inheritedConfigText(selectedType()));
    if (routeContext.ownerOrg) pieces.push('承接组织：' + routeContext.ownerOrg);
    if (routeContext.supplier) pieces.push('供货方：' + routeContext.supplier);
    if (routeContext.flightRouteResource) pieces.push('航线资源：' + routeContext.flightRouteResource);
    if (routeContext.flightUsePolicy) pieces.push('用位方式：' + routeContext.flightUsePolicy);
    if (Array.isArray(routeContext.resourceRefs) && routeContext.resourceRefs.length) {
      pieces.push('线路资源：' + routeContext.resourceRefs.slice(0, 4).join('、'));
    }
    lineMeta.value = lineMeta.value + '\n' + pieces.join('；');
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
    if (!validateResourceBorrow()) return;
    if (!validatePrivateGroup()) return;
    var type = selectedType();
    writePending(schedulePayload(null, 1));
    $('#successTitle').textContent = isSupplierSchedule ? type.objectName + '已提交凯撒确认' : type.objectName + '已提交';
    $('#successText').textContent = isSupplierSchedule ? type.label + '已提交凯撒确认，凯撒采用后生成代理销售' + type.objectName + '。' : type.label + '已提交审批，审批通过后生成' + type.objectName + '并确认价格与余量。';
    $('#approvalNo').textContent = isSupplierSchedule ? 'SUP-' + scheduleCode(1, $('#departDate').value) : type.approvalNo;
    $('#approvalNode').textContent = isSupplierSchedule ? '凯撒代理运营' : type.approvalNode;
    $('#approvalLink').href = scheduleListHref();
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
    $('#previewCount').textContent = dates.length + '个' + type.objectName;
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
    if (!validateResourceBorrow()) return;
    var items = $all('[data-preview-row]').filter(function (row) {
      return $('input[type="checkbox"]', row).checked;
    }).map(function (row, index) {
      return schedulePayload(row.children[2].textContent.trim(), index + 1);
    });
    writeBatch(items);
    $('#successTitle').textContent = isSupplierSchedule ? '批量团期已提交凯撒确认' : '批量开排完成';
    $('#successText').textContent = isSupplierSchedule ? '已生成' + items.length + '个供应商' + selectedType().objectName + '草稿并提交凯撒确认。' : '已生成' + items.length + '个' + selectedType().label + selectedType().objectName + '，价格与余量已确认。';
    $('#approvalNo').textContent = isSupplierSchedule ? '待凯撒确认' : '无需审批';
    $('#approvalNode').textContent = isSupplierSchedule ? '凯撒代理运营' : '已进入' + selectedType().objectName + '列表';
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

    $all('#trafficDemand, #defaultFlightRoute, #flightUseMethod, #resourceBorrowSource, #resourceBorrowQty, #resourceBorrowStatus').forEach(function (field) {
      field.addEventListener('change', function () {
        if (field.id === 'trafficDemand') applyResourceBindingDefaults(false);
        if (field.id === 'resourceBorrowSource') applyResourceBindingDefaults(false);
        renderResourceDemandContext();
        if (mode === 'single') renderSummary();
        else renderPreviewIfNeeded();
        markDirty();
      });
      field.addEventListener('input', function () {
        renderResourceDemandContext();
        if (mode === 'single') renderSummary();
        else renderPreviewIfNeeded();
        markDirty();
      });
    });

    $('#matrixRows').addEventListener('input', function () {
      updateMatrixTotals();
      renderPreviewIfNeeded();
      markDirty();
    });

    $all('#quotaPlanCount, #adultCount, #reserveHours').forEach(function (input) {
      input.addEventListener('input', function () {
        updateMatrixTotals();
        renderPreviewIfNeeded();
        markDirty();
      });
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
        var href = scheduleListHref();
        if (window.caesarNavigateTo) window.caesarNavigateTo(href);
        else window.location.href = href;
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
    var routeContext = readRouteScheduleContext();
    var fromProduct = params.get('source') === 'product' || params.get('source') === 'studyProduct';
    var requestedProduct = params.get('product') || params.get('productName') || (fromProduct ? routeContext.product : '') || '';
    var requestedRoute = params.get('route') || (fromProduct ? routeContext.route : '') || '';
    var type = params.get('type') || (fromProduct && routeContext.type) || inferTypeFromProductName(requestedProduct) || 'group';
    if (type === 'free' && !isSupplierSchedule) {
      var url = '../product/product-free-travel-list.html?tab=calendar&product=' + encodeURIComponent(requestedProduct) + '&route=' + encodeURIComponent(requestedRoute);
      if (window.caesarNavigateTo) window.caesarNavigateTo(url);
      else window.location.replace(url);
      return;
    }
    setType(data[type] ? type : 'group');
    renderSelectors(requestedProduct, requestedRoute);
    renderContext();
    renderMatrix();
    renderTypeNodes();
    syncDates(true);
    applyInboundScheduleDefaults();
    renderResourceBorrowOptions();
    renderResourceDemandContext();
    if (fromProduct) appendRouteContextMeta(routeContext);
    syncBackLinks();
    bindEvents();
    setStep(0);
    renderPreviewIfNeeded();
  }

  init();
})();
