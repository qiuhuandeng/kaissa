(function () {
  if (window.caesarScheduleRouteCatalog) return;

  var routeCatalog = [
    {
      product: "欧洲十国经典游",
      productTitle: "欧洲十国经典游 12日11晚",
      productCode: "GT-EU-001",
      type: "参团游",
      typeKey: "outbound",
      batchType: "普通团期",
      travelType: "出境游",
      route: "A线 法德意12天",
      routeCode: "EU-A",
      prefix: "EU",
      days: 12,
      nights: 11,
      destination: "法国/德国/意大利",
      departure: "北京",
      owner: "张明",
      capacity: 30,
      unit: "人",
      price: "¥12,800",
      schedules: [
        ["EU20260718001", "2026-07-18", "2026-07-29", "2026-07-12", 30, 18, "¥12,800", "销售中", "出团准备"],
        ["EU20260805001", "2026-08-05", "2026-08-16", "2026-07-30", 30, 9, "¥13,200", "销售中", "筹备中"],
        ["EU20260912001", "2026-09-12", "2026-09-23", "2026-09-05", 28, 0, "¥12,600", "筹备中", "未开始"]
      ]
    },
    {
      product: "欧洲十国经典游",
      productTitle: "欧洲十国经典游 12日11晚",
      productCode: "GT-EU-001",
      type: "参团游",
      typeKey: "outbound",
      batchType: "普通团期",
      travelType: "出境游",
      route: "B线 荷比德法12天",
      routeCode: "EU-B",
      prefix: "EU",
      days: 12,
      nights: 11,
      destination: "荷兰/比利时/德国/法国",
      departure: "北京",
      owner: "张明",
      capacity: 26,
      unit: "人",
      price: "¥12,500",
      schedules: [
        ["EU20260728001", "2026-07-28", "2026-08-08", "2026-07-22", 26, 19, "¥12,500", "销售中", "出团准备"],
        ["EU20260826001", "2026-08-26", "2026-09-06", "2026-08-19", 26, 6, "¥12,300", "销售中", "筹备中"]
      ]
    },
    {
      product: "欧洲十国经典游",
      productTitle: "欧洲十国经典游 12日11晚",
      productCode: "GT-EU-001",
      type: "参团游",
      typeKey: "outbound",
      batchType: "普通团期",
      travelType: "出境游",
      route: "C线 瑞意深度10天",
      routeCode: "EU-C",
      prefix: "EU",
      days: 10,
      nights: 9,
      destination: "瑞士/意大利",
      departure: "北京",
      owner: "张明",
      capacity: 24,
      unit: "人",
      price: "¥15,800",
      schedules: [
        ["EU20261003001", "2026-10-03", "2026-10-12", "2026-09-26", 24, 4, "¥15,800", "筹备中", "未开始"]
      ]
    },
    {
      product: "日本关西深度游",
      productTitle: "日本关西深度游 7日6晚",
      productCode: "GT-JP-002",
      type: "参团游",
      typeKey: "outbound",
      batchType: "普通团期",
      travelType: "出境游",
      route: "关西古都7日",
      routeCode: "JP-A",
      prefix: "JP",
      days: 7,
      nights: 6,
      destination: "大阪/京都/奈良",
      departure: "上海",
      owner: "李梅",
      capacity: 25,
      unit: "人",
      price: "¥8,980",
      schedules: [
        ["JP20260712001", "2026-07-12", "2026-07-18", "2026-07-06", 25, 17, "¥8,980", "销售中", "出团准备"],
        ["JP20260809001", "2026-08-09", "2026-08-15", "2026-08-03", 25, 11, "¥9,280", "销售中", "筹备中"]
      ]
    },
    {
      product: "日本关西深度游",
      productTitle: "日本关西深度游 7日6晚",
      productCode: "GT-JP-002",
      type: "参团游",
      typeKey: "outbound",
      batchType: "普通团期",
      travelType: "出境游",
      route: "京都奈良慢游线",
      routeCode: "JP-B",
      prefix: "JP",
      days: 7,
      nights: 6,
      destination: "京都/奈良/大阪",
      departure: "上海",
      owner: "李梅",
      capacity: 22,
      unit: "人",
      price: "¥9,680",
      schedules: [
        ["JP20260905001", "2026-09-05", "2026-09-11", "2026-08-30", 22, 5, "¥9,680", "筹备中", "未开始"]
      ]
    },
    {
      product: "理想号地中海邮轮",
      productTitle: "理想号地中海邮轮 8天7晚",
      productCode: "CR-MED-001",
      type: "邮轮",
      typeKey: "cruise",
      batchType: "邮轮航次",
      travelType: "出境游",
      route: "地中海西线 / 阳台舱",
      routeCode: "CR-A",
      prefix: "CR",
      days: 8,
      nights: 7,
      destination: "巴塞罗那/马赛/热那亚",
      departure: "巴塞罗那母港",
      owner: "赵明",
      capacity: 30,
      unit: "间",
      price: "¥28,800",
      schedules: [
        ["CR20260802001", "2026-08-02", "2026-08-09", "2026-07-20", 30, 23, "¥28,800", "销售中", "舱房确认"],
        ["CR20260912001", "2026-09-12", "2026-09-19", "2026-08-30", 30, 8, "¥27,600", "筹备中", "未开始"]
      ]
    },
    {
      product: "理想号地中海邮轮",
      productTitle: "理想号地中海邮轮 8天7晚",
      productCode: "CR-MED-001",
      type: "邮轮",
      typeKey: "cruise",
      batchType: "邮轮航次",
      travelType: "出境游",
      route: "地中海东线 / 套房",
      routeCode: "CR-B",
      prefix: "CR",
      days: 8,
      nights: 7,
      destination: "雅典/圣托里尼/罗马",
      departure: "雅典港",
      owner: "赵明",
      capacity: 18,
      unit: "间",
      price: "¥36,800",
      schedules: [
        ["CR20261001001", "2026-10-01", "2026-10-08", "2026-09-18", 18, 3, "¥36,800", "筹备中", "未开始"]
      ]
    },
    {
      product: "东方丝路专列",
      productTitle: "丝绸之路专列 12日11晚",
      productCode: "TR-SILK-001",
      type: "专列",
      typeKey: "train",
      batchType: "专列班期",
      travelType: "境内游",
      route: "西安敦煌乌鲁木齐线 / 软卧",
      routeCode: "TR-A",
      prefix: "TR",
      days: 12,
      nights: 11,
      destination: "西安/敦煌/乌鲁木齐",
      departure: "西安站",
      owner: "王强",
      capacity: 96,
      unit: "铺",
      price: "¥19,800",
      schedules: [
        ["TR20260718001", "2026-07-18", "2026-07-29", "2026-07-10", 96, 71, "¥19,800", "销售中", "铺位确认"]
      ]
    },
    {
      product: "东方丝路专列",
      productTitle: "丝绸之路专列 12日11晚",
      productCode: "TR-SILK-001",
      type: "专列",
      typeKey: "train",
      batchType: "专列班期",
      travelType: "境内游",
      route: "丝路全景线 / 包厢",
      routeCode: "TR-B",
      prefix: "TR",
      days: 12,
      nights: 11,
      destination: "西安/张掖/敦煌/吐鲁番",
      departure: "西安站",
      owner: "王强",
      capacity: 48,
      unit: "铺",
      price: "¥29,800",
      schedules: []
    },
    {
      product: "三亚亲子5日游",
      productTitle: "三亚亲子5日游",
      productCode: "GT-HN-003",
      type: "参团游",
      typeKey: "domestic",
      batchType: "普通团期",
      travelType: "境内游",
      route: "亚特兰蒂斯亲子线",
      routeCode: "HN-A",
      prefix: "HN",
      days: 5,
      nights: 4,
      destination: "三亚/亚龙湾/海棠湾",
      departure: "广州/深圳",
      owner: "赵明",
      capacity: 40,
      unit: "人",
      price: "¥6,800",
      schedules: []
    },
    {
      product: "敦煌历史文化研学7日",
      productTitle: "敦煌历史文化研学7日",
      productCode: "ST-DH-001",
      type: "研学",
      typeKey: "study",
      batchType: "研学营期",
      travelType: "境内游",
      route: "敦煌艺术与历史课堂",
      routeCode: "ST-A",
      prefix: "ST",
      days: 7,
      nights: 6,
      destination: "敦煌",
      departure: "北京/上海",
      owner: "张明",
      capacity: 40,
      unit: "名",
      price: "¥8,800",
      schedules: [
        ["ST20260712001", "2026-07-12", "2026-07-18", "2026-07-05", 40, 32, "¥8,800", "销售中", "资料收集中"],
        ["ST20260805001", "2026-08-05", "2026-08-11", "2026-07-29", 40, 19, "¥8,800", "销售中", "筹备中"]
      ]
    },
    {
      product: "北京故宫非遗研学5日",
      productTitle: "北京故宫非遗研学5日",
      productCode: "ST-BJ-002",
      type: "研学",
      typeKey: "study",
      batchType: "研学营期",
      travelType: "境内游",
      route: "故宫非遗体验线",
      routeCode: "ST-B",
      prefix: "ST",
      days: 5,
      nights: 4,
      destination: "北京",
      departure: "全国",
      owner: "李梅",
      capacity: 30,
      unit: "名",
      price: "¥6,600",
      schedules: [
        ["ST20260720001", "2026-07-20", "2026-07-24", "2026-07-13", 30, 12, "¥6,600", "销售中", "授权书待补"]
      ]
    },
    {
      product: "新加坡科技创新研学6日",
      productTitle: "新加坡科技创新研学6日",
      productCode: "ST-SG-003",
      type: "研学",
      typeKey: "study",
      batchType: "研学营期",
      travelType: "出境游",
      route: "新加坡科技课堂",
      routeCode: "ST-C",
      prefix: "ST",
      days: 6,
      nights: 5,
      destination: "新加坡",
      departure: "上海",
      owner: "王强",
      capacity: 30,
      unit: "名",
      price: "¥12,800",
      schedules: [
        ["ST20260805002", "2026-08-05", "2026-08-10", "2026-07-29", 30, 21, "¥12,800", "销售中", "健康信息待补"]
      ]
    },
    {
      product: "上海艺术博物馆研学4日",
      productTitle: "上海艺术博物馆研学4日",
      productCode: "ST-SH-004",
      type: "研学",
      typeKey: "study",
      batchType: "研学营期",
      travelType: "境内游",
      route: "上海艺术博物馆课程",
      routeCode: "ST-D",
      prefix: "ST",
      days: 4,
      nights: 3,
      destination: "上海",
      departure: "上海",
      owner: "李梅",
      capacity: 30,
      unit: "名",
      price: "¥4,980",
      schedules: []
    }
  ];


  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function objectName(batchType) {
    if (batchType === "邮轮航次") return "航次";
    if (batchType === "专列班期") return "班期";
    if (batchType === "研学营期") return "营期";
    return "团期";
  }

  function organizationForRoute(route) {
    route = route || {};
    if (route.typeKey === "cruise") return "产品中心 / 邮轮部";
    if (route.typeKey === "train") return "产品中心 / 专列部";
    if (route.typeKey === "study") return "产品中心 / 研学部";
    if (route.typeKey === "domestic") return "短线中心 / 国内部";
    if (/日本|关西|新加坡|亚洲/.test((route.product || "") + (route.destination || ""))) return "长线中心 / 亚洲部";
    return "长线中心 / 欧洲部";
  }

  routeCatalog.forEach(function (route) {
    route.company = route.company || "福建凯撒";
    route.ownerOrg = route.ownerOrg || organizationForRoute(route);
  });

  function statusClass(status) {
    if (status === "销售中" || status === "启售") return "tag tag-green";
    if (status === "已停售" || status === "停售") return "tag tag-orange";
    if (status === "筹备中") return "tag tag-blue";
    return "tag tag-gray";
  }

  window.caesarScheduleRouteCatalog = routeCatalog;
  window.caesarScheduleRouteHelper = {
    routes: routeCatalog,
    objectName: objectName,
    organizationForRoute: organizationForRoute,
    statusClass: statusClass,
    escapeHtml: escapeHtml
  };
})();
