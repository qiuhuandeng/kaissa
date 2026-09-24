/* 独立移动端演示资料。沿用领队档案身份和派团状态语义，不回写后台。 */
(function () {
  'use strict';
  const accounts = [
    { id: 'LD-20260312001', name: '张建国', phone: '13800004521', type: '全职领队', region: '欧洲、英国、地中海邮轮' },
    { id: 'LD-20260601009', name: '赵明', phone: '13700005612', type: '外聘领队', region: '专列、国内、英国' }
  ];
  const journeys = {
    europe: [
      ['北京 → 巴黎', '首都机场T3集合，核对护照及签证，乘国际航班前往巴黎。', '机上餐', '巴黎 Mercure 酒店'],
      ['巴黎', '巴黎市区游览，卢浮宫按预约时段入场。', '早 / 午 / 晚', '巴黎 Mercure 酒店'],
      ['巴黎 → 布鲁塞尔', '乘旅游巴士前往布鲁塞尔，游览大广场。', '早 / 午 / 晚', '布鲁塞尔 NH 酒店'],
      ['布鲁塞尔 → 阿姆斯特丹', '前往荷兰，运河区步行游览。', '早 / 午 / 晚', '阿姆斯特丹 Novotel 酒店'],
      ['阿姆斯特丹 → 科隆', '前往德国，游览科隆大教堂外观。', '早 / 午 / 晚', '科隆 Mercure 酒店'],
      ['科隆 → 卢森堡', '卢森堡老城游览，注意石板路行走安全。', '早 / 午 / 晚', '卢森堡 Novotel 酒店'],
      ['卢森堡 → 卢塞恩', '前往瑞士，游览湖区及卡佩尔廊桥。', '早 / 午 / 晚', '卢塞恩 Ibis Styles 酒店'],
      ['卢塞恩 → 瓦杜兹 → 因斯布鲁克', '途经列支敦士登，抵达奥地利。', '早 / 午 / 晚', '因斯布鲁克当地酒店'],
      ['因斯布鲁克 → 威尼斯', '前往意大利，乘接驳船进入威尼斯主岛。', '早 / 午 / 晚', '威尼斯 Mestre 酒店'],
      ['威尼斯 → 圣马力诺 → 佛罗伦萨', '游览圣马力诺后前往佛罗伦萨。', '早 / 午 / 晚', '佛罗伦萨当地酒店'],
      ['佛罗伦萨 → 罗马', '罗马市区游览，斗兽场以最终预约时段为准。', '早 / 午 / 晚', '罗马当地酒店'],
      ['罗马 → 北京', '早餐后前往机场，办理退税及返程值机。', '早 / 机上餐', '机上'],
      ['抵达北京', '抵达首都机场，核对行李并结束行程。', '机上餐', '无']
    ],
    japan: [
      ['北京 → 大阪', '首都机场集合，抵达关西机场后入住酒店。', '机上餐 / 晚', '大阪难波酒店'],
      ['大阪', '大阪城公园及市区游览。', '早 / 午 / 晚', '大阪难波酒店'],
      ['大阪 → 京都', '乘旅游巴士前往京都，游览清水寺。', '早 / 午 / 晚', '京都四条酒店'],
      ['京都', '岚山步行游览，下午自由活动。', '早 / 午', '京都四条酒店'],
      ['京都 → 奈良', '奈良公园游览，提醒游客文明喂鹿。', '早 / 午 / 晚', '奈良当地酒店'],
      ['奈良 → 大阪', '返回大阪，整理返程资料。', '早 / 午 / 晚', '大阪难波酒店'],
      ['大阪 → 北京', '关西机场集合，乘机返回北京。', '早 / 机上餐', '无']
    ],
    sanya: [
      ['北京 → 三亚', '接机，办理酒店入住。', '机上餐 / 晚', '三亚亚特兰蒂斯酒店'],
      ['海棠湾', '亲子水族馆活动，核对儿童安全须知。', '早 / 午 / 晚', '三亚亚特兰蒂斯酒店'],
      ['亚龙湾', '热带森林公园游览，注意防晒和补水。', '早 / 午 / 晚', '三亚亚特兰蒂斯酒店'],
      ['海棠湾', '酒店亲子活动，下午自由活动。', '早', '三亚亚特兰蒂斯酒店'],
      ['三亚 → 北京', '核对行李，送机返程。', '早 / 机上餐', '无']
    ],
    uk: [
      ['北京 → 伦敦', '首都机场集合，乘机抵达伦敦。', '机上餐', '伦敦当地酒店'],
      ['伦敦', '大英博物馆预约参观，泰晤士河步行游览。', '早 / 午 / 晚', '伦敦当地酒店'],
      ['伦敦 → 牛津', '大学城游览，下午前往科茨沃尔德。', '早 / 午 / 晚', '牛津当地酒店'],
      ['牛津 → 曼彻斯特', '乘旅游巴士前往曼彻斯特。', '早 / 午 / 晚', '曼彻斯特当地酒店'],
      ['曼彻斯特 → 爱丁堡', '抵达爱丁堡，老城游览。', '早 / 午 / 晚', '爱丁堡当地酒店'],
      ['爱丁堡', '城堡预约参观，下午整理返程资料。', '早 / 午 / 晚', '爱丁堡当地酒店'],
      ['爱丁堡 → 北京', '机场集合，乘机返回北京。', '早 / 机上餐', '机上'],
      ['抵达北京', '核对行李，结束行程。', '机上餐', '无']
    ]
  };
  function travelers(domestic) {
    return [
      { name: '刘洋', phone: '13800001001', document: domestic ? '身份证 1101****1028' : '护照 EJ****1028', room: '双人间 · 与陈红同住', need: '', status: '资料已齐', visa: domestic ? '无需签证' : '已获签' },
      { name: '陈红', phone: '13800001002', document: domestic ? '身份证 1101****2086' : '护照 EJ****2086', room: '双人间 · 与刘洋同住', need: '素食', status: '资料已齐', visa: domestic ? '无需签证' : '已获签' },
      { name: '孙丽', phone: '13800001003', document: domestic ? '身份证 1101****3042' : '护照 EK****3042', room: '双人间 · 与周伟同住', need: '需轮椅协助、低楼层房间', status: domestic ? '资料已齐' : '签证待回传', visa: domestic ? '无需签证' : '待回传' },
      { name: '周伟', phone: '13800001004', document: domestic ? '身份证 1101****4081' : '护照 EK****4081', room: '双人间 · 与孙丽同住', need: '', status: '资料已齐', visa: domestic ? '无需签证' : '已获签' },
      { name: '吴芳', phone: '13800001005', document: domestic ? '身份证 1101****5063' : '护照 EL****5063', room: '双人间 · 与郑华同住', need: '不食海鲜', status: '资料已齐', visa: domestic ? '无需签证' : '已获签' },
      { name: '郑华', phone: '13800001006', document: domestic ? '身份证 1101****6024' : '护照 EL****6024', room: '双人间 · 与吴芳同住', need: '', status: '资料已齐', visa: domestic ? '无需签证' : '已获签' }
    ];
  }
  function make(id, title, route, start, end, status, journey) {
    return {
      id, title, route, start, end, status, leaderId: accounts[0].id, role: '全程领队', version: 1,
      stage: status === '出团中' ? '出团中' : status === '已完成' ? '已回团' : '出发准备',
      operator: '张明', operatorPhone: '13800008866', meeting: start + ' 07:00', place: '北京首都机场 T3 国际出发4层',
      deadline: '2026-09-26 18:00', itinerary: journeys[journey] || [], travelers: travelers(journey === 'sanya'),
      resources: journey ? [
        { type: '交通', name: journey === 'europe' ? '国际航空 CA937 / CA940' : journey === 'japan' ? '国际航空 CA927 / CA928' : journey === 'sanya' ? '国际航空 北京 ⇄ 三亚' : '国际航空 北京 ⇄ 英国', status: '已确认', detail: '往返经济舱 · 6名游客，领队1名；航班时刻见出团通知。' },
        { type: '酒店', name: journey === 'europe' ? '欧洲酒店行程安排' : journey === 'sanya' ? '三亚亚特兰蒂斯酒店' : '行程指定酒店', status: journey === 'europe' ? '部分确认' : '已确认', detail: journey === 'europe' ? '巴黎酒店已确认，罗马酒店待回传；全程双人间3间、领队单人间1间。' : '双人间3间、领队单人间1间，含早餐；入住日期见每日行程。' },
        { type: '用车', name: journey === 'europe' ? '欧洲地接ABC · 19座旅游巴士' : '当地地接 · 19座旅游巴士', status: journey === 'europe' ? '待确认' : '已确认', detail: journey === 'europe' ? '司机姓名、车牌待回传；计调张明跟进。' : '司机王师傅 · 车牌尾号6821，机场接送及行程内用车。' },
        { type: '餐饮', name: '行程内团队餐', status: '已确认', detail: '陈红素食、吴芳不食海鲜已向地接备注；自由活动日按行程安排。' },
        { type: '保险', name: '太平洋旅行保险', status: '已确认', detail: '6名游客及1名领队已投保；保障日期覆盖服务期间。' }
      ] : [],
      docs: [
        { id: 'notice', name: '出团通知', version: 'V2', date: '2026-09-24 09:00', ready: true },
        { id: 'itinerary', name: '行程确认单', version: 'V1', date: '2026-09-23 16:30', ready: true },
        { id: 'contact', name: '带团联系表', version: 'V1', date: '2026-09-23 16:30', ready: true },
        { id: 'hotel', name: '酒店确认单', version: '待发布', date: '', ready: false }
      ],
      events: [{ time: '2026-09-23 15:00', title: '计调发出排团', text: '张明安排张建国担任全程领队。' }], changes: [], read: false
    };
  }
  function seed() {
    const pending = make('EU-FRA-20260720-001', '欧洲十国经典游', '欧洲十国环游13天', '2026-10-20', '2026-11-01', '待确认', 'europe');
    const adjusted = make('JP-KIX-20261012-001', '日本关西深度游', '关西古都7日', '2026-10-12', '2026-10-18', '调整待确认', 'japan');
    adjusted.version = 2; adjusted.meeting = '2026-10-12 08:30'; adjusted.place = '北京首都机场 T3 国际出发6号门';
    adjusted.changes = [ ['集合时间', '2026-10-12 07:00', adjusted.meeting], ['集合地点', 'T3 国际出发4号门', adjusted.place] ];
    adjusted.events.push({ time: '2026-09-23 17:20', title: '领队确认排团', text: '张建国确认原排团安排。' }, { time: '2026-09-24 09:20', title: '排团调整', text: '航班时刻调整，集合顺延90分钟，请按最新安排重新确认。' });
    const confirmed = make('EU-UK-20261003-001', '英国经典8日游', '伦敦 · 牛津 · 爱丁堡', '2026-10-03', '2026-10-10', '已确认', 'uk');
    confirmed.read = true; confirmed.events.push({ time: '2026-09-23 17:00', title: '领队确认排团', text: '张建国已确认服务日期和集合信息。' });
    const active = make('CN-SYA-20260923-001', '三亚亲子5日游', '亚特兰蒂斯亲子线', '2026-09-23', '2026-09-27', '出团中', 'sanya');
    active.place = '北京首都机场 T3 国内出发'; active.read = true;
    active.events.push({ time: '2026-09-23 09:00', title: '已实际出行', text: '计调登记领队实际出行，团队正常在途。' });
    const canceled = make('EU-DE-20260930-002', '德国深度9日游', '德国深度线', '2026-09-30', '2026-10-08', '已取消');
    canceled.reason = '团期未成团，计调取消本次派团。无需前往集合点。'; canceled.events.push({ time: '2026-09-24 10:10', title: '取消派团', text: canceled.reason });
    const replaced = make('CR-MED-20261110-001', '理想号地中海邮轮', '地中海西线', '2026-11-10', '2026-11-17', '已更换');
    replaced.reason = '因服务分工调整，本团已更换领队为王强。你无需出团。'; replaced.events.push({ time: '2026-09-24 11:00', title: '更换领队', text: replaced.reason });
    return [pending, adjusted, confirmed, active, canceled, replaced];
  }
  window.LeaderMobileData = { accounts, seed };
})();
