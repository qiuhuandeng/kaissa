/* 原型演示样例；独立确认金额与执行资料，不按比例推造。 */
window.MicePrototypeSeed = {
  "version": 1,
  "sequence": 1000,
  "catalog": {
    "companies": [
      {
        "name": "北京凯撒",
        "departments": [
          "会奖业务部",
          "定制旅游部"
        ]
      },
      {
        "name": "福建凯撒",
        "departments": [
          "厦门会奖部",
          "产品中心"
        ]
      }
    ],
    "staff": [
      {
        "name": "张三",
        "companies": [
          "北京凯撒",
          "福建凯撒"
        ],
        "canPlan": true
      },
      {
        "name": "李梅",
        "companies": [
          "北京凯撒",
          "福建凯撒"
        ],
        "canPlan": true,
        "canQuote": true,
        "quotePermissionBasis": "已有报价岗位授权（原型样例）；项目分工仅限定可办理范围。"
      },
      {
        "name": "赵磊",
        "companies": [
          "北京凯撒"
        ],
        "canPlan": true,
        "canQuote": true,
        "quotePermissionBasis": "已有报价岗位授权（原型样例）；项目分工仅限定可办理范围。"
      },
      {
        "name": "王芳",
        "companies": [
          "北京凯撒"
        ],
        "canPlan": true
      },
      {
        "name": "陈刚",
        "companies": [
          "北京凯撒"
        ],
        "canPlan": false
      },
      {
        "name": "周伟",
        "companies": [
          "福建凯撒",
          "北京凯撒"
        ],
        "canPlan": true
      },
      {
        "name": "刘总监",
        "companies": [
          "北京凯撒"
        ],
        "canPlan": false
      }
    ],
    "customers": [
      {
        "name": "华辰医药有限公司",
        "contact": "王经理",
        "phone": "13800000001"
      },
      {
        "name": "华远保险有限公司",
        "contact": "李经理",
        "phone": "13800000002"
      },
      {
        "name": "北京科技发展有限公司",
        "contact": "陈经理",
        "phone": "13800000003"
      },
      {
        "name": "北京某科技有限公司",
        "contact": "王总助理",
        "phone": "13800010001"
      },
      {
        "name": "华远地产集团",
        "contact": "张经理",
        "phone": "13800010002"
      },
      {
        "name": "某区文化局",
        "contact": "李主任",
        "phone": "13800138001"
      },
      {
        "name": "某汽车销售集团",
        "contact": "徐总",
        "phone": "13800010003"
      },
      {
        "name": "某电商平台",
        "contact": "韩经理",
        "phone": "13800010004"
      },
      {
        "name": "启航国际学校",
        "contact": "周老师",
        "phone": "13800010005"
      }
    ],
    "suppliers": [
      "北京会议酒店",
      "华东会议服务有限公司",
      "北京旅游车队",
      "欧洲地接ABC",
      "上海会务设备公司"
    ]
  },
  "projects": [
    {
      "id": "PRJ-20261008-001",
      "name": "北京科技三亚奖励旅游",
      "customer": "北京科技发展有限公司",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "mode": "single",
      "kind": "奖励旅游",
      "start": "2026-10-20",
      "end": "2026-10-23",
      "sales": "陈刚",
      "owner": "张三",
      "scope": "客户确认的会议、旅游及配套服务",
      "basis": "客户确认材料（演示）",
      "status": "进行中",
      "budget": 40000,
      "contact": "陈经理",
      "phone": "13800000001",
      "members": [
        {
          "name": "张三",
          "role": "项目负责人",
          "activities": [],
          "start": "2026-10-20",
          "end": "2026-10-23"
        },
        {
          "name": "李梅",
          "role": "计调",
          "activities": [],
          "start": "2026-10-20",
          "end": "2026-10-23"
        }
      ],
      "frameworks": [],
      "attachments": [],
      "seedScenario": "S1"
    },
    {
      "id": "PRJ-20261008-002",
      "name": "华远保险年度奖励旅游",
      "customer": "华远保险有限公司",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "mode": "multi",
      "kind": "奖励旅游",
      "start": "2026-11-01",
      "end": "2026-11-30",
      "sales": "陈刚",
      "owner": "张三",
      "scope": "客户确认的会议、旅游及配套服务",
      "basis": "客户确认材料（演示）",
      "status": "进行中",
      "budget": 760000,
      "contact": "李经理",
      "phone": "13800000001",
      "members": [
        {
          "name": "张三",
          "role": "项目负责人",
          "activities": [],
          "start": "2026-11-01",
          "end": "2026-11-30"
        },
        {
          "name": "李梅",
          "role": "计调",
          "activities": [],
          "start": "2026-11-01",
          "end": "2026-11-30"
        }
      ],
      "frameworks": [],
      "attachments": [],
      "seedScenario": "S2"
    },
    {
      "id": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "mode": "multi",
      "kind": "会奖",
      "start": "2026-01-01",
      "end": "2026-12-31",
      "sales": "陈刚",
      "owner": "张三",
      "scope": "年度区域会议服务，按具体委托确认场次",
      "basis": "客户确认材料（演示）",
      "status": "进行中",
      "budget": null,
      "contact": "王经理",
      "phone": "13800000001",
      "members": [
        {
          "name": "张三",
          "role": "项目负责人",
          "activities": [],
          "start": "2026-01-01",
          "end": "2026-12-31"
        },
        {
          "name": "李梅",
          "role": "计调",
          "activities": [],
          "start": "2026-01-01",
          "end": "2026-12-31"
        }
      ],
      "frameworks": [
        {
          "id": "FW2026001",
          "number": "CTR-FRAME-2026-001",
          "customer": "华辰医药有限公司",
          "company": "北京凯撒",
          "start": "2026-01-01",
          "end": "2026-12-31",
          "scope": "区域会议",
          "nature": "上限",
          "amount": 5000000,
          "currency": "CNY",
          "status": "已签归档",
          "basis": "年度框架合同（演示）"
        }
      ],
      "attachments": [],
      "seedScenario": "S3"
    },
    {
      "id": "PRJ-20261008-004",
      "name": "华辰医药上海半日发布会",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "mode": "single",
      "kind": "会奖",
      "start": "2026-10-12",
      "end": "2026-10-12",
      "sales": "陈刚",
      "owner": "张三",
      "scope": "客户确认的会议、旅游及配套服务",
      "basis": "客户确认材料（演示）",
      "status": "进行中",
      "budget": 12000,
      "contact": "王经理",
      "phone": "13800000001",
      "members": [
        {
          "name": "张三",
          "role": "项目负责人",
          "activities": [],
          "start": "2026-10-12",
          "end": "2026-10-12"
        },
        {
          "name": "李梅",
          "role": "计调",
          "activities": [],
          "start": "2026-10-12",
          "end": "2026-10-12"
        }
      ],
      "frameworks": [],
      "attachments": [],
      "seedScenario": "S4"
    },
    {
      "id": "PRJ-20261008-005",
      "name": "欧洲商务会议与考察",
      "customer": "北京科技发展有限公司",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "mode": "single",
      "kind": "政企考察",
      "start": "2026-11-15",
      "end": "2026-11-20",
      "sales": "陈刚",
      "owner": "张三",
      "scope": "客户确认的会议、旅游及配套服务",
      "basis": "客户确认材料（演示）",
      "status": "进行中",
      "budget": null,
      "contact": "陈经理",
      "phone": "13800000001",
      "members": [
        {
          "name": "张三",
          "role": "项目负责人",
          "activities": [],
          "start": "2026-11-15",
          "end": "2026-11-20"
        },
        {
          "name": "李梅",
          "role": "计调",
          "activities": [],
          "start": "2026-11-15",
          "end": "2026-11-20"
        }
      ],
      "frameworks": [],
      "attachments": [],
      "seedScenario": "S5"
    },
    {
      "id": "PRJ-20260722-001",
      "name": "某科技公司2026年会欧洲行",
      "customer": "北京某科技有限公司",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "kind": "会奖",
      "mode": "single",
      "start": "2026-09-15",
      "end": "2026-09-24",
      "sales": "刘总监",
      "owner": "刘总监",
      "contact": "王总助理",
      "phone": "13800010001",
      "scope": "原单团已登记服务范围",
      "basis": "客户邮件确认",
      "status": "草稿",
      "budget": 1530000,
      "legacy": true,
      "members": [],
      "frameworks": [],
      "attachments": [],
      "legacyData": {
        "tab-status": "草稿",
        "type": "MICE",
        "source": "线下成交录入",
        "project-no": "PRJ-20260722-001",
        "customer": "北京某科技有限公司",
        "contact": "王总助理",
        "phone": "13800010001",
        "departure": "北京",
        "destination": "欧洲",
        "people": "80",
        "owner": "刘总监",
        "planner": "待确认",
        "travel-start": "2026-09-15",
        "travel-end": "2026-09-24",
        "amount": "1902000",
        "cost": "1530000",
        "payment": "首款30% / 尾款70%",
        "handover": "项目团未生成",
        "gap": "计调负责人、付款节点、客户确认材料待补",
        "confirm-basis": "客户邮件确认",
        "name": "某科技公司2026年会欧洲行"
      }
    },
    {
      "id": "PRJ-20260720-005",
      "name": "地产集团年度奖励旅游",
      "customer": "华远地产集团",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "kind": "奖励旅游",
      "mode": "single",
      "start": "2026-11-12",
      "end": "2026-11-18",
      "sales": "陈刚",
      "owner": "陈刚",
      "contact": "张经理",
      "phone": "13800010002",
      "scope": "原单团已登记服务范围",
      "basis": "盖章确认单",
      "status": "待确认",
      "budget": 1530000,
      "legacy": true,
      "members": [],
      "frameworks": [],
      "attachments": [],
      "legacyData": {
        "tab-status": "待生成项目团",
        "type": "奖励旅游",
        "source": "线下成交录入",
        "project-no": "PRJ-20260720-005",
        "customer": "华远地产集团",
        "contact": "张经理",
        "phone": "13800010002",
        "departure": "上海",
        "destination": "泰国曼谷清迈",
        "people": "120",
        "owner": "陈刚",
        "planner": "赵磊",
        "travel-start": "2026-11-12",
        "travel-end": "2026-11-18",
        "amount": "1800000",
        "cost": "1530000",
        "payment": "首款30% / 进度款50% / 尾款20%",
        "handover": "项目团未生成",
        "gap": "名单待导入、资源确认待补、成本待确认",
        "confirm-basis": "盖章确认单",
        "name": "地产集团年度奖励旅游"
      }
    },
    {
      "id": "PRJ-20260718-003",
      "name": "政府机关文化交流团",
      "customer": "某区文化局",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "kind": "政企考察",
      "mode": "single",
      "start": "2026-09-12",
      "end": "2026-09-17",
      "sales": "王芳",
      "owner": "王芳",
      "contact": "李主任",
      "phone": "13800138001",
      "scope": "原单团已登记服务范围",
      "basis": "客户邮件确认",
      "status": "进行中",
      "budget": 318000,
      "legacy": true,
      "members": [],
      "frameworks": [],
      "attachments": [],
      "legacyData": {
        "tab-status": "待出行",
        "type": "政企考察",
        "source": "线下成交录入",
        "project-no": "PRJ-20260718-003",
        "customer": "某区文化局",
        "contact": "李主任",
        "phone": "13800138001",
        "departure": "北京",
        "destination": "日本关西",
        "people": "25",
        "owner": "王芳",
        "planner": "李梅",
        "travel-start": "2026-09-12",
        "travel-end": "2026-09-17",
        "amount": "400000",
        "cost": "318000",
        "payment": "首款50% / 尾款50%",
        "handover": "项目团已生成",
        "gap": "名单待导入、交通酒店确认号待补",
        "schedule-no": "PRJ20260912003",
        "order-no": "KSPRJ20260718003",
        "contract-no": "CTR-PRJ-20260718-003",
        "receivable-no": "YS-PRJ-20260718-003",
        "confirm-basis": "客户邮件确认",
        "name": "政府机关文化交流团"
      }
    },
    {
      "id": "PRJ-20260615-006",
      "name": "汽车品牌经销商大会",
      "customer": "某汽车销售集团",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "kind": "会奖",
      "mode": "single",
      "start": "2026-07-12",
      "end": "2026-07-15",
      "sales": "王芳",
      "owner": "王芳",
      "contact": "徐总",
      "phone": "13800010003",
      "scope": "原单团已登记服务范围",
      "basis": "企业微信确认",
      "status": "进行中",
      "budget": 486000,
      "legacy": true,
      "members": [],
      "frameworks": [],
      "attachments": [],
      "legacyData": {
        "tab-status": "执行中",
        "type": "MICE",
        "source": "线下成交录入",
        "project-no": "PRJ-20260615-006",
        "customer": "某汽车销售集团",
        "contact": "徐总",
        "phone": "13800010003",
        "departure": "广州",
        "destination": "成都",
        "people": "45",
        "owner": "王芳",
        "planner": "赵磊",
        "travel-start": "2026-07-12",
        "travel-end": "2026-07-15",
        "amount": "580000",
        "cost": "486000",
        "payment": "首款30% / 尾款70%",
        "handover": "项目团已生成",
        "gap": "酒店确认号缺1项、实际成本待复核",
        "schedule-no": "PRJ20260712006",
        "order-no": "KSPRJ20260615006",
        "contract-no": "CTR-PRJ-20260615-006",
        "receivable-no": "YS-PRJ-20260615-006",
        "confirm-basis": "企业微信确认",
        "name": "汽车品牌经销商大会"
      }
    },
    {
      "id": "PRJ-20260520-007",
      "name": "互联网公司春季团建",
      "customer": "某电商平台",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "kind": "企业团建",
      "mode": "single",
      "start": "2026-05-18",
      "end": "2026-05-20",
      "sales": "陈刚",
      "owner": "陈刚",
      "contact": "韩经理",
      "phone": "13800010004",
      "scope": "原单团已登记服务范围",
      "basis": "合同确认",
      "status": "进行中",
      "budget": 812000,
      "legacy": true,
      "members": [],
      "frameworks": [],
      "attachments": [],
      "legacyData": {
        "tab-status": "已回团",
        "type": "企业团建",
        "source": "线下成交录入",
        "project-no": "PRJ-20260520-007",
        "customer": "某电商平台",
        "contact": "韩经理",
        "phone": "13800010004",
        "departure": "上海",
        "destination": "北京",
        "people": "200",
        "owner": "陈刚",
        "planner": "李梅",
        "travel-start": "2026-05-18",
        "travel-end": "2026-05-20",
        "amount": "960000",
        "cost": "812000",
        "payment": "首款40% / 尾款60%",
        "handover": "项目团已生成",
        "gap": "客户验收单待上传、实际成本待复核",
        "schedule-no": "PRJ20260518007",
        "order-no": "KSPRJ20260520007",
        "contract-no": "CTR-PRJ-20260520-007",
        "receivable-no": "YS-PRJ-20260520-007",
        "confirm-basis": "合同确认",
        "name": "互联网公司春季团建"
      }
    },
    {
      "id": "PRJ-20260418-009",
      "name": "新加坡科技研学定制团",
      "customer": "启航国际学校",
      "company": "北京凯撒",
      "department": "会奖业务部",
      "kind": "研学项目",
      "mode": "single",
      "start": "2026-04-18",
      "end": "2026-04-23",
      "sales": "周伟",
      "owner": "周伟",
      "contact": "周老师",
      "phone": "13800010005",
      "scope": "原单团已登记服务范围",
      "basis": "盖章确认单",
      "status": "已结项",
      "budget": 360000,
      "legacy": true,
      "members": [],
      "frameworks": [],
      "attachments": [],
      "legacyData": {
        "tab-status": "已结算",
        "type": "研学项目",
        "source": "线下成交录入",
        "project-no": "PRJ-20260418-009",
        "customer": "启航国际学校",
        "contact": "周老师",
        "phone": "13800010005",
        "departure": "厦门",
        "destination": "新加坡",
        "people": "36",
        "owner": "周伟",
        "planner": "赵磊",
        "travel-start": "2026-04-18",
        "travel-end": "2026-04-23",
        "amount": "428000",
        "cost": "360000",
        "payment": "首款50% / 尾款50%",
        "handover": "项目团已生成",
        "gap": "无关键缺口",
        "schedule-no": "PRJ20260418009",
        "order-no": "KSPRJ20260418009",
        "contract-no": "CTR-PRJ-20260418-009",
        "receivable-no": "YS-PRJ-20260418-009",
        "confirm-basis": "盖章确认单",
        "name": "新加坡科技研学定制团"
      }
    }
  ],
  "activities": [
    {
      "id": "PRJ20261000001",
      "projectId": "PRJ-20261008-001",
      "name": "三亚四日奖励旅游",
      "service": "旅游",
      "start": "2026-10-20",
      "end": "2026-10-23",
      "city": "三亚",
      "people": 60,
      "planner": "李梅",
      "scope": "客户确认的会议、旅游及配套服务",
      "status": "准备中",
      "reference": "",
      "commitmentId": "WY20261008001",
      "agenda": [],
      "roster": [
        {
          "id": "R1",
          "name": "演示游客01",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R2",
          "name": "演示游客02",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R3",
          "name": "演示游客03",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R4",
          "name": "演示游客04",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R5",
          "name": "演示游客05",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R6",
          "name": "演示游客06",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R7",
          "name": "演示游客07",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R8",
          "name": "演示游客08",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R9",
          "name": "演示游客09",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R10",
          "name": "演示游客10",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R11",
          "name": "演示游客11",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R12",
          "name": "演示游客12",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R13",
          "name": "演示游客13",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R14",
          "name": "演示游客14",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R15",
          "name": "演示游客15",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R16",
          "name": "演示游客16",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R17",
          "name": "演示游客17",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R18",
          "name": "演示游客18",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R19",
          "name": "演示游客19",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R20",
          "name": "演示游客20",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R21",
          "name": "演示游客21",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R22",
          "name": "演示游客22",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R23",
          "name": "演示游客23",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R24",
          "name": "演示游客24",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R25",
          "name": "演示游客25",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R26",
          "name": "演示游客26",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R27",
          "name": "演示游客27",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R28",
          "name": "演示游客28",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R29",
          "name": "演示游客29",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R30",
          "name": "演示游客30",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R31",
          "name": "演示游客31",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R32",
          "name": "演示游客32",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R33",
          "name": "演示游客33",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R34",
          "name": "演示游客34",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R35",
          "name": "演示游客35",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R36",
          "name": "演示游客36",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R37",
          "name": "演示游客37",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R38",
          "name": "演示游客38",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R39",
          "name": "演示游客39",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R40",
          "name": "演示游客40",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R41",
          "name": "演示游客41",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R42",
          "name": "演示游客42",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R43",
          "name": "演示游客43",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R44",
          "name": "演示游客44",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R45",
          "name": "演示游客45",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R46",
          "name": "演示游客46",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R47",
          "name": "演示游客47",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R48",
          "name": "演示游客48",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R49",
          "name": "演示游客49",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R50",
          "name": "演示游客50",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R51",
          "name": "演示游客51",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R52",
          "name": "演示游客52",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R53",
          "name": "演示游客53",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R54",
          "name": "演示游客54",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        },
        {
          "id": "R55",
          "name": "演示游客55",
          "group": "一组",
          "phone": "",
          "document": "",
          "arrival": "第一批",
          "needs": ""
        }
      ],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "nameMode": "实名服务"
    },
    {
      "id": "PRJ20261000010",
      "projectId": "PRJ-20261008-002",
      "name": "日本关西奖励旅游",
      "service": "旅游",
      "start": "2026-11-01",
      "end": "2026-11-05",
      "city": "大阪",
      "people": 40,
      "planner": "李梅",
      "scope": "客户确认的会议、旅游及配套服务",
      "status": "准备中",
      "reference": "",
      "commitmentId": "WY20261008002",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "PRJ20261000011",
      "projectId": "PRJ-20261008-002",
      "name": "泰国清迈奖励旅游",
      "service": "旅游",
      "start": "2026-11-04",
      "end": "2026-11-08",
      "city": "清迈",
      "people": 45,
      "planner": "赵磊",
      "scope": "客户确认的会议、旅游及配套服务",
      "status": "准备中",
      "reference": "",
      "commitmentId": "WY20261008002",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "PRJ20261000012",
      "projectId": "PRJ-20261008-002",
      "name": "三亚海岸奖励旅游",
      "service": "旅游",
      "start": "2026-11-07",
      "end": "2026-11-11",
      "city": "三亚",
      "people": 50,
      "planner": "王芳",
      "scope": "客户确认的会议、旅游及配套服务",
      "status": "准备中",
      "reference": "",
      "commitmentId": "WY20261008002",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "PRJ20261000013",
      "projectId": "PRJ-20261008-002",
      "name": "云南腾冲奖励旅游",
      "service": "旅游",
      "start": "2026-11-10",
      "end": "2026-11-14",
      "city": "腾冲",
      "people": 55,
      "planner": "李梅",
      "scope": "客户确认的会议、旅游及配套服务",
      "status": "准备中",
      "reference": "",
      "commitmentId": "WY20261008002",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "PRJ20261000014",
      "projectId": "PRJ-20261008-002",
      "name": "新加坡城市奖励旅游",
      "service": "旅游",
      "start": "2026-11-13",
      "end": "2026-11-17",
      "city": "新加坡",
      "people": 60,
      "planner": "赵磊",
      "scope": "客户确认的会议、旅游及配套服务",
      "status": "准备中",
      "reference": "",
      "commitmentId": "WY20261008002",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "PRJ20261000100",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议001",
      "service": "会议",
      "start": "2026-10-01",
      "end": "2026-10-01",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-001",
      "commitmentId": "WY20261008010",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-01",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000101",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议002",
      "service": "会议",
      "start": "2026-10-02",
      "end": "2026-10-02",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-002",
      "commitmentId": "WY20261008011",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-02",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000102",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议003",
      "service": "会议",
      "start": "2026-10-03",
      "end": "2026-10-03",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-003",
      "commitmentId": "WY20261008012",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-03",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000103",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议004",
      "service": "会议",
      "start": "2026-10-04",
      "end": "2026-10-04",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-004",
      "commitmentId": "WY20261008013",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-04",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000104",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议005",
      "service": "会议",
      "start": "2026-10-05",
      "end": "2026-10-05",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-005",
      "commitmentId": "WY20261008014",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-05",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000105",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议006",
      "service": "会议",
      "start": "2026-10-06",
      "end": "2026-10-06",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-006",
      "commitmentId": "WY20261008015",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-06",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000106",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议007",
      "service": "会议",
      "start": "2026-10-07",
      "end": "2026-10-07",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-007",
      "commitmentId": "WY20261008016",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-07",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000107",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议008",
      "service": "会议",
      "start": "2026-10-08",
      "end": "2026-10-08",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-008",
      "commitmentId": "WY20261008017",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-08",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000108",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议009",
      "service": "会议",
      "start": "2026-10-09",
      "end": "2026-10-09",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-009",
      "commitmentId": "WY20261008018",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-09",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000109",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议010",
      "service": "会议",
      "start": "2026-10-10",
      "end": "2026-10-10",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "已完成",
      "reference": "HC2026-010",
      "commitmentId": "WY20261008019",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-10-10",
      "completionBasis": "客户服务交付单（演示）"
    },
    {
      "id": "PRJ20261000110",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议011",
      "service": "会议",
      "start": "2026-11-11",
      "end": "2026-11-11",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-011",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000111",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议012",
      "service": "会议",
      "start": "2026-11-12",
      "end": "2026-11-12",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-012",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000112",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议013",
      "service": "会议",
      "start": "2026-11-13",
      "end": "2026-11-13",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-013",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000113",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议014",
      "service": "会议",
      "start": "2026-11-14",
      "end": "2026-11-14",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-014",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000114",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议015",
      "service": "会议",
      "start": "2026-11-15",
      "end": "2026-11-15",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-015",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000115",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议016",
      "service": "会议",
      "start": "2026-11-16",
      "end": "2026-11-16",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-016",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000116",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议017",
      "service": "会议",
      "start": "2026-11-17",
      "end": "2026-11-17",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-017",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000117",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议018",
      "service": "会议",
      "start": "2026-11-18",
      "end": "2026-11-18",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-018",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000118",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议019",
      "service": "会议",
      "start": "2026-11-19",
      "end": "2026-11-19",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-019",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000119",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议020",
      "service": "会议",
      "start": "2026-11-20",
      "end": "2026-11-20",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-020",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000120",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议021",
      "service": "会议",
      "start": "2026-11-21",
      "end": "2026-11-21",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-021",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000121",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议022",
      "service": "会议",
      "start": "2026-11-22",
      "end": "2026-11-22",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-022",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000122",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议023",
      "service": "会议",
      "start": "2026-11-23",
      "end": "2026-11-23",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-023",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000123",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议024",
      "service": "会议",
      "start": "2026-11-24",
      "end": "2026-11-24",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-024",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000124",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议025",
      "service": "会议",
      "start": "2026-11-25",
      "end": "2026-11-25",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-025",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000125",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议026",
      "service": "会议",
      "start": "2026-11-26",
      "end": "2026-11-26",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-026",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000126",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议027",
      "service": "会议",
      "start": "2026-11-27",
      "end": "2026-11-27",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-027",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000127",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议028",
      "service": "会议",
      "start": "2026-11-28",
      "end": "2026-11-28",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-028",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000128",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议029",
      "service": "会议",
      "start": "2026-11-01",
      "end": "2026-11-01",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-029",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000129",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议030",
      "service": "会议",
      "start": "2026-11-02",
      "end": "2026-11-02",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-030",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000130",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议031",
      "service": "会议",
      "start": "2026-11-03",
      "end": "2026-11-03",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-031",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000131",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议032",
      "service": "会议",
      "start": "2026-11-04",
      "end": "2026-11-04",
      "city": "杭州",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-032",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000132",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议033",
      "service": "会议",
      "start": "2026-11-05",
      "end": "2026-11-05",
      "city": "北京",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-033",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000133",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议034",
      "service": "会议",
      "start": "2026-11-06",
      "end": "2026-11-06",
      "city": "上海",
      "people": null,
      "planner": "李梅",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-034",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000134",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议035",
      "service": "会议",
      "start": "2026-11-07",
      "end": "2026-11-07",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-035",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000135",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议036",
      "service": "会议",
      "start": "2026-11-08",
      "end": "2026-11-08",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-036",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000136",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议037",
      "service": "会议",
      "start": "2026-11-09",
      "end": "2026-11-09",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-037",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000137",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议038",
      "service": "会议",
      "start": "2026-11-10",
      "end": "2026-11-10",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-038",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000138",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议039",
      "service": "会议",
      "start": "2026-11-11",
      "end": "2026-11-11",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-039",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000139",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议040",
      "service": "会议",
      "start": "2026-11-12",
      "end": "2026-11-12",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-040",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000140",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议041",
      "service": "会议",
      "start": "2026-11-13",
      "end": "2026-11-13",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-041",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000141",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议042",
      "service": "会议",
      "start": "2026-11-14",
      "end": "2026-11-14",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-042",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000142",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议043",
      "service": "会议",
      "start": "2026-11-15",
      "end": "2026-11-15",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-043",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000143",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议044",
      "service": "会议",
      "start": "2026-11-16",
      "end": "2026-11-16",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-044",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000144",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议045",
      "service": "会议",
      "start": "2026-11-17",
      "end": "2026-11-17",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-045",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000145",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议046",
      "service": "会议",
      "start": "2026-11-18",
      "end": "2026-11-18",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-046",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000146",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议047",
      "service": "会议",
      "start": "2026-11-19",
      "end": "2026-11-19",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-047",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000147",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议048",
      "service": "会议",
      "start": "2026-11-20",
      "end": "2026-11-20",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-048",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000148",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议049",
      "service": "会议",
      "start": "2026-11-21",
      "end": "2026-11-21",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-049",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000149",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议050",
      "service": "会议",
      "start": "2026-11-22",
      "end": "2026-11-22",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-050",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000150",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议051",
      "service": "会议",
      "start": "2026-11-23",
      "end": "2026-11-23",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-051",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000151",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议052",
      "service": "会议",
      "start": "2026-11-24",
      "end": "2026-11-24",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-052",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000152",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议053",
      "service": "会议",
      "start": "2026-11-25",
      "end": "2026-11-25",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-053",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000153",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议054",
      "service": "会议",
      "start": "2026-11-26",
      "end": "2026-11-26",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-054",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000154",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议055",
      "service": "会议",
      "start": "2026-11-27",
      "end": "2026-11-27",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-055",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000155",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议056",
      "service": "会议",
      "start": "2026-11-28",
      "end": "2026-11-28",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-056",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000156",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议057",
      "service": "会议",
      "start": "2026-11-01",
      "end": "2026-11-01",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-057",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000157",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议058",
      "service": "会议",
      "start": "2026-11-02",
      "end": "2026-11-02",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-058",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000158",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议059",
      "service": "会议",
      "start": "2026-11-03",
      "end": "2026-11-03",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-059",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000159",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议060",
      "service": "会议",
      "start": "2026-11-04",
      "end": "2026-11-04",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-060",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000160",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议061",
      "service": "会议",
      "start": "2026-11-05",
      "end": "2026-11-05",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-061",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000161",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议062",
      "service": "会议",
      "start": "2026-11-06",
      "end": "2026-11-06",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-062",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000162",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议063",
      "service": "会议",
      "start": "2026-11-07",
      "end": "2026-11-07",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-063",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000163",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议064",
      "service": "会议",
      "start": "2026-11-08",
      "end": "2026-11-08",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-064",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000164",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议065",
      "service": "会议",
      "start": "2026-11-09",
      "end": "2026-11-09",
      "city": "杭州",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-065",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000165",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议066",
      "service": "会议",
      "start": "2026-11-10",
      "end": "2026-11-10",
      "city": "北京",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-066",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000166",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议067",
      "service": "会议",
      "start": "2026-11-11",
      "end": "2026-11-11",
      "city": "上海",
      "people": null,
      "planner": "赵磊",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-067",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000167",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议068",
      "service": "会议",
      "start": "2026-11-12",
      "end": "2026-11-12",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-068",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000168",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议069",
      "service": "会议",
      "start": "2026-11-13",
      "end": "2026-11-13",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-069",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000169",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议070",
      "service": "会议",
      "start": "2026-11-14",
      "end": "2026-11-14",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-070",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000170",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议071",
      "service": "会议",
      "start": "2026-11-15",
      "end": "2026-11-15",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-071",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000171",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议072",
      "service": "会议",
      "start": "2026-11-16",
      "end": "2026-11-16",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-072",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000172",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议073",
      "service": "会议",
      "start": "2026-11-17",
      "end": "2026-11-17",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-073",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000173",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议074",
      "service": "会议",
      "start": "2026-11-18",
      "end": "2026-11-18",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-074",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000174",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议075",
      "service": "会议",
      "start": "2026-11-19",
      "end": "2026-11-19",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-075",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000175",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议076",
      "service": "会议",
      "start": "2026-11-20",
      "end": "2026-11-20",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-076",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000176",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议077",
      "service": "会议",
      "start": "2026-11-21",
      "end": "2026-11-21",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-077",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000177",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议078",
      "service": "会议",
      "start": "2026-11-22",
      "end": "2026-11-22",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-078",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000178",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议079",
      "service": "会议",
      "start": "2026-11-23",
      "end": "2026-11-23",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-079",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000179",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议080",
      "service": "会议",
      "start": "2026-11-24",
      "end": "2026-11-24",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-080",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000180",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议081",
      "service": "会议",
      "start": "2026-11-25",
      "end": "2026-11-25",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-081",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000181",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议082",
      "service": "会议",
      "start": "2026-11-26",
      "end": "2026-11-26",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-082",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000182",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议083",
      "service": "会议",
      "start": "2026-11-27",
      "end": "2026-11-27",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-083",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000183",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议084",
      "service": "会议",
      "start": "2026-11-28",
      "end": "2026-11-28",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-084",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000184",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议085",
      "service": "会议",
      "start": "2026-11-01",
      "end": "2026-11-01",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-085",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000185",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议086",
      "service": "会议",
      "start": "2026-11-02",
      "end": "2026-11-02",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-086",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000186",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议087",
      "service": "会议",
      "start": "2026-11-03",
      "end": "2026-11-03",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-087",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000187",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议088",
      "service": "会议",
      "start": "2026-11-04",
      "end": "2026-11-04",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-088",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000188",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议089",
      "service": "会议",
      "start": "2026-11-05",
      "end": "2026-11-05",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-089",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000189",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议090",
      "service": "会议",
      "start": "2026-11-06",
      "end": "2026-11-06",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-090",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000190",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议091",
      "service": "会议",
      "start": "2026-11-07",
      "end": "2026-11-07",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-091",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000191",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议092",
      "service": "会议",
      "start": "2026-11-08",
      "end": "2026-11-08",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-092",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000192",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议093",
      "service": "会议",
      "start": "2026-11-09",
      "end": "2026-11-09",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-093",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000193",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议094",
      "service": "会议",
      "start": "2026-11-10",
      "end": "2026-11-10",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-094",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000194",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议095",
      "service": "会议",
      "start": "2026-11-11",
      "end": "2026-11-11",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-095",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000195",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议096",
      "service": "会议",
      "start": "2026-11-12",
      "end": "2026-11-12",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-096",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000196",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议097",
      "service": "会议",
      "start": "2026-11-13",
      "end": "2026-11-13",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-097",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000197",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议098",
      "service": "会议",
      "start": "2026-11-14",
      "end": "2026-11-14",
      "city": "杭州",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-098",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000198",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议099",
      "service": "会议",
      "start": "2026-11-15",
      "end": "2026-11-15",
      "city": "北京",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-099",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000199",
      "projectId": "PRJ-20261008-003",
      "name": "区域会议100",
      "service": "会议",
      "start": "2026-11-16",
      "end": "2026-11-16",
      "city": "上海",
      "people": null,
      "planner": "王芳",
      "scope": "半日会议、会场设备及茶歇",
      "status": "草稿",
      "reference": "HC2026-100",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "completionBasis": ""
    },
    {
      "id": "PRJ20261000004",
      "projectId": "PRJ-20261008-004",
      "name": "上海半日发布会",
      "service": "会议",
      "start": "2026-10-12",
      "end": "2026-10-12",
      "city": "上海",
      "people": 20,
      "planner": "李梅",
      "scope": "会场、会议设备及茶歇",
      "status": "准备中",
      "reference": "",
      "commitmentId": "WY20261008004",
      "agenda": [
        {
          "date": "2026-10-12",
          "start": "09:00",
          "end": "12:00",
          "name": "产品发布与交流",
          "place": "上海会议中心",
          "owner": "李梅"
        }
      ],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "",
      "nameMode": "按人数交付"
    },
    {
      "id": "PRJ20261000005",
      "projectId": "PRJ-20261008-005",
      "name": "欧洲商务会议",
      "service": "会议加旅游",
      "start": "2026-11-15",
      "end": "2026-11-20",
      "city": "巴黎",
      "people": 20,
      "planner": "李梅",
      "scope": "客户确认的会议、旅游及配套服务",
      "status": "待确认",
      "reference": "",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "DRAFT-PRJ-20260722-001",
      "projectId": "PRJ-20260722-001",
      "name": "某科技公司2026年会欧洲行",
      "service": "会议加旅游",
      "start": "2026-09-15",
      "end": "2026-09-24",
      "city": "欧洲",
      "people": 80,
      "planner": "",
      "scope": "原单团已登记服务范围",
      "status": "草稿",
      "reference": "",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "DRAFT-PRJ-20260720-005",
      "projectId": "PRJ-20260720-005",
      "name": "地产集团年度奖励旅游",
      "service": "旅游",
      "start": "2026-11-12",
      "end": "2026-11-18",
      "city": "泰国曼谷清迈",
      "people": 120,
      "planner": "赵磊",
      "scope": "原单团已登记服务范围",
      "status": "待确认",
      "reference": "",
      "commitmentId": "",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "PRJ20260912003",
      "projectId": "PRJ-20260718-003",
      "name": "政府机关文化交流团",
      "service": "旅游",
      "start": "2026-09-12",
      "end": "2026-09-17",
      "city": "日本关西",
      "people": 25,
      "planner": "李梅",
      "scope": "原单团已登记服务范围",
      "status": "准备中",
      "reference": "",
      "commitmentId": "WY20261008302",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "PRJ20260712006",
      "projectId": "PRJ-20260615-006",
      "name": "汽车品牌经销商大会",
      "service": "会议加旅游",
      "start": "2026-07-12",
      "end": "2026-07-15",
      "city": "成都",
      "people": 45,
      "planner": "赵磊",
      "scope": "原单团已登记服务范围",
      "status": "执行中",
      "reference": "",
      "commitmentId": "WY20261008303",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": ""
    },
    {
      "id": "PRJ20260518007",
      "projectId": "PRJ-20260520-007",
      "name": "互联网公司春季团建",
      "service": "旅游",
      "start": "2026-05-18",
      "end": "2026-05-20",
      "city": "北京",
      "people": 200,
      "planner": "李梅",
      "scope": "原单团已登记服务范围",
      "status": "已完成",
      "reference": "",
      "commitmentId": "WY20261008304",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-05-20"
    },
    {
      "id": "PRJ20260418009",
      "projectId": "PRJ-20260418-009",
      "name": "新加坡科技研学定制团",
      "service": "旅游",
      "start": "2026-04-18",
      "end": "2026-04-23",
      "city": "新加坡",
      "people": 36,
      "planner": "赵磊",
      "scope": "原单团已登记服务范围",
      "status": "已完成",
      "reference": "",
      "commitmentId": "WY20261008305",
      "agenda": [],
      "roster": [],
      "resources": [],
      "materials": [],
      "completedAt": "2026-04-23"
    }
  ],
  "commitments": [
    {
      "id": "WY20261008001",
      "projectId": "PRJ-20261008-001",
      "name": "北京科技三亚奖励旅游服务确认",
      "reference": "KH-1",
      "version": 1,
      "activities": [
        "PRJ20261000001"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 50000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 15000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 35000,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-1",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080001"
    },
    {
      "id": "WY20261008002",
      "projectId": "PRJ-20261008-002",
      "name": "华远保险年度奖励旅游服务确认",
      "reference": "KH-2",
      "version": 1,
      "activities": [
        "PRJ20261000010",
        "PRJ20261000011",
        "PRJ20261000012",
        "PRJ20261000013",
        "PRJ20261000014"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 1000000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 300000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 700000,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-2",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080002"
    },
    {
      "id": "WY20261008010",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-10",
      "version": 1,
      "activities": [
        "PRJ20261000100"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-10",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080010"
    },
    {
      "id": "WY20261008011",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-11",
      "version": 1,
      "activities": [
        "PRJ20261000101"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-11",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080011"
    },
    {
      "id": "WY20261008012",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-12",
      "version": 1,
      "activities": [
        "PRJ20261000102"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-12",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080012"
    },
    {
      "id": "WY20261008013",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-13",
      "version": 1,
      "activities": [
        "PRJ20261000103"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-13",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080013"
    },
    {
      "id": "WY20261008014",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-14",
      "version": 1,
      "activities": [
        "PRJ20261000104"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-14",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080014"
    },
    {
      "id": "WY20261008015",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-15",
      "version": 1,
      "activities": [
        "PRJ20261000105"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-15",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080015"
    },
    {
      "id": "WY20261008016",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-16",
      "version": 1,
      "activities": [
        "PRJ20261000106"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-16",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080016"
    },
    {
      "id": "WY20261008017",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-17",
      "version": 1,
      "activities": [
        "PRJ20261000107"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-17",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080017"
    },
    {
      "id": "WY20261008018",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-18",
      "version": 1,
      "activities": [
        "PRJ20261000108"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-18",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080018"
    },
    {
      "id": "WY20261008019",
      "projectId": "PRJ-20261008-003",
      "name": "华辰医药2026年度区域会议服务确认",
      "reference": "KH-19",
      "version": 1,
      "activities": [
        "PRJ20261000109"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 25000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-19",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080019"
    },
    {
      "id": "WY20261008004",
      "projectId": "PRJ-20261008-004",
      "name": "华辰医药上海半日发布会服务确认",
      "reference": "KH-4",
      "version": 1,
      "activities": [
        "PRJ20261000004"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 20000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 6000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 14000,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-MICE-4",
      "approval": "本版本已批准（演示）",
      "orderId": "KS202610080004"
    },
    {
      "id": "WY20261008302",
      "projectId": "PRJ-20260718-003",
      "name": "政府机关文化交流团服务确认",
      "reference": "KH-302",
      "version": 1,
      "activities": [
        "PRJ20260912003"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 400000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 120000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 280000,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-PRJ-20260718-003",
      "approval": "本版本已批准（演示）",
      "orderId": "KSPRJ20260718003"
    },
    {
      "id": "WY20261008303",
      "projectId": "PRJ-20260615-006",
      "name": "汽车品牌经销商大会服务确认",
      "reference": "KH-303",
      "version": 1,
      "activities": [
        "PRJ20260712006"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 580000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 174000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 406000,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-PRJ-20260615-006",
      "approval": "本版本已批准（演示）",
      "orderId": "KSPRJ20260615006"
    },
    {
      "id": "WY20261008304",
      "projectId": "PRJ-20260520-007",
      "name": "互联网公司春季团建服务确认",
      "reference": "KH-304",
      "version": 1,
      "activities": [
        "PRJ20260518007"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 960000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 288000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 672000,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-PRJ-20260520-007",
      "approval": "本版本已批准（演示）",
      "orderId": "KSPRJ20260520007"
    },
    {
      "id": "WY20261008305",
      "projectId": "PRJ-20260418-009",
      "name": "新加坡科技研学定制团服务确认",
      "reference": "KH-305",
      "version": 1,
      "activities": [
        "PRJ20260418009"
      ],
      "pricing": "fixed",
      "currency": "CNY",
      "amount": 428000,
      "status": "已确认",
      "basis": "客户盖章服务确认单（演示）",
      "confirmedAt": "2026-10-01",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 128400,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 299600,
          "date": "2026-11-10"
        }
      ],
      "contractNo": "CTR-PRJ-20260418-009",
      "approval": "本版本已批准（演示）",
      "orderId": "KSPRJ20260418009"
    }
  ],
  "orders": [
    {
      "id": "KS202610080001",
      "projectId": "PRJ-20261008-001",
      "commitmentId": "WY20261008001",
      "customer": "北京科技发展有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 50000,
      "activities": [
        "PRJ20261000001"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-1",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 15000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 35000,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080002",
      "projectId": "PRJ-20261008-002",
      "commitmentId": "WY20261008002",
      "customer": "华远保险有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 1000000,
      "activities": [
        "PRJ20261000010",
        "PRJ20261000011",
        "PRJ20261000012",
        "PRJ20261000013",
        "PRJ20261000014"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-2",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 300000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 700000,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080010",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008010",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000100"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-10",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080011",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008011",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000101"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-11",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080012",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008012",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000102"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-12",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080013",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008013",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000103"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-13",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080014",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008014",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000104"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-14",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080015",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008015",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000105"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-15",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080016",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008016",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000106"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-16",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080017",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008017",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000107"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-17",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080018",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008018",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000108"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-18",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080019",
      "projectId": "PRJ-20261008-003",
      "commitmentId": "WY20261008019",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 25000,
      "activities": [
        "PRJ20261000109"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-19",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 7500,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 17500,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KS202610080004",
      "projectId": "PRJ-20261008-004",
      "commitmentId": "WY20261008004",
      "customer": "华辰医药有限公司",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 20000,
      "activities": [
        "PRJ20261000004"
      ],
      "status": "已确认",
      "contractNo": "CTR-MICE-4",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 6000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 14000,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KSPRJ20260718003",
      "projectId": "PRJ-20260718-003",
      "commitmentId": "WY20261008302",
      "customer": "某区文化局",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 400000,
      "activities": [
        "PRJ20260912003"
      ],
      "status": "已确认",
      "contractNo": "CTR-PRJ-20260718-003",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 120000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 280000,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KSPRJ20260615006",
      "projectId": "PRJ-20260615-006",
      "commitmentId": "WY20261008303",
      "customer": "某汽车销售集团",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 580000,
      "activities": [
        "PRJ20260712006"
      ],
      "status": "已确认",
      "contractNo": "CTR-PRJ-20260615-006",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 174000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 406000,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KSPRJ20260520007",
      "projectId": "PRJ-20260520-007",
      "commitmentId": "WY20261008304",
      "customer": "某电商平台",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 960000,
      "activities": [
        "PRJ20260518007"
      ],
      "status": "已确认",
      "contractNo": "CTR-PRJ-20260520-007",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 288000,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 672000,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    },
    {
      "id": "KSPRJ20260418009",
      "projectId": "PRJ-20260418-009",
      "commitmentId": "WY20261008305",
      "customer": "启航国际学校",
      "company": "北京凯撒",
      "currency": "CNY",
      "amount": 428000,
      "activities": [
        "PRJ20260418009"
      ],
      "status": "已确认",
      "contractNo": "CTR-PRJ-20260418-009",
      "nodes": [
        {
          "name": "首款",
          "percent": 30,
          "amount": 128400,
          "date": "2026-10-10"
        },
        {
          "name": "尾款",
          "percent": 70,
          "amount": 299600,
          "date": "2026-11-10"
        }
      ],
      "received": 0,
      "invoiced": 0
    }
  ],
  "costs": [
    {
      "id": "FY-S2-0",
      "projectId": "PRJ-20261008-002",
      "activityId": "PRJ20261000010",
      "name": "线路接待服务",
      "supplier": "华东会议服务有限公司",
      "currency": "CNY",
      "amount": 120000,
      "estimate": 120000,
      "budget": 120000,
      "status": "已确认",
      "unit": "场",
      "quantity": 1,
      "price": 120000,
      "paid": 0,
      "conditionLimit": 120000,
      "basis": "供应商采购确认（演示）",
      "taxStatus": "待核对",
      "allocations": []
    },
    {
      "id": "FY-S2-1",
      "projectId": "PRJ-20261008-002",
      "activityId": "PRJ20261000011",
      "name": "线路接待服务",
      "supplier": "华东会议服务有限公司",
      "currency": "CNY",
      "amount": 150000,
      "estimate": 150000,
      "budget": 150000,
      "status": "已确认",
      "unit": "场",
      "quantity": 1,
      "price": 150000,
      "paid": 0,
      "conditionLimit": 150000,
      "basis": "供应商采购确认（演示）",
      "taxStatus": "待核对",
      "allocations": []
    },
    {
      "id": "FY-S2-2",
      "projectId": "PRJ-20261008-002",
      "activityId": "PRJ20261000012",
      "name": "线路接待服务",
      "supplier": "华东会议服务有限公司",
      "currency": "CNY",
      "amount": 140000,
      "estimate": 140000,
      "budget": 140000,
      "status": "已确认",
      "unit": "场",
      "quantity": 1,
      "price": 140000,
      "paid": 0,
      "conditionLimit": 140000,
      "basis": "供应商采购确认（演示）",
      "taxStatus": "待核对",
      "allocations": []
    },
    {
      "id": "FY-S2-3",
      "projectId": "PRJ-20261008-002",
      "activityId": "PRJ20261000013",
      "name": "线路接待服务",
      "supplier": "华东会议服务有限公司",
      "currency": "CNY",
      "amount": 180000,
      "estimate": 180000,
      "budget": 180000,
      "status": "已确认",
      "unit": "场",
      "quantity": 1,
      "price": 180000,
      "paid": 0,
      "conditionLimit": 180000,
      "basis": "供应商采购确认（演示）",
      "taxStatus": "待核对",
      "allocations": []
    },
    {
      "id": "FY-S2-4",
      "projectId": "PRJ-20261008-002",
      "activityId": "PRJ20261000014",
      "name": "线路接待服务",
      "supplier": "华东会议服务有限公司",
      "currency": "CNY",
      "amount": 110000,
      "estimate": 110000,
      "budget": 110000,
      "status": "已确认",
      "unit": "场",
      "quantity": 1,
      "price": 110000,
      "paid": 0,
      "conditionLimit": 110000,
      "basis": "供应商采购确认（演示）",
      "taxStatus": "待核对",
      "allocations": []
    },
    {
      "id": "FY20261008001",
      "projectId": "PRJ-20261008-001",
      "activityId": "PRJ20261000001",
      "name": "酒店住宿",
      "supplier": "北京会议酒店",
      "currency": "CNY",
      "amount": 28000,
      "budget": 28000,
      "estimate": 28000,
      "status": "已确认",
      "unit": "间夜",
      "quantity": 40,
      "price": 700,
      "paid": 8000,
      "conditionLimit": 28000,
      "basis": "酒店采购确认单（演示）",
      "taxStatus": "未到票",
      "allocations": []
    },
    {
      "id": "FY20261008002",
      "projectId": "PRJ-20261008-001",
      "activityId": "PRJ20261000001",
      "name": "车辆及餐饮",
      "supplier": "北京旅游车队",
      "currency": "CNY",
      "amount": 12000,
      "budget": 12000,
      "estimate": 12000,
      "status": "已确认",
      "unit": "场",
      "quantity": 1,
      "price": 12000,
      "paid": 0,
      "conditionLimit": 12000,
      "basis": "接待确认单（演示）",
      "taxStatus": "已到待核",
      "allocations": []
    },
    {
      "id": "FY20261008003",
      "projectId": "PRJ-20261008-002",
      "activityId": "",
      "name": "项目策划及统筹",
      "supplier": "华东会议服务有限公司",
      "currency": "CNY",
      "amount": 60000,
      "budget": 60000,
      "estimate": 60000,
      "status": "已确认",
      "unit": "场",
      "quantity": 1,
      "price": 60000,
      "paid": 0,
      "conditionLimit": 60000,
      "basis": "统筹服务合同（演示）",
      "scopeType": "common",
      "taxStatus": "待核对",
      "allocations": []
    },
    {
      "id": "FY20261008005",
      "projectId": "PRJ-20261008-005",
      "activityId": "PRJ20261000005",
      "name": "欧洲会议接待",
      "supplier": "欧洲地接ABC",
      "currency": "EUR",
      "amount": 10000,
      "budget": 10000,
      "estimate": 10000,
      "budgetRate": 7.8,
      "agreedRate": 7.9,
      "referenceRate": 8,
      "status": "已确认",
      "unit": "场",
      "quantity": 1,
      "price": 10000,
      "paid": 0,
      "conditionLimit": 10000,
      "basis": "固定汇率7.90结算约定（演示）",
      "taxStatus": "未到票",
      "allocations": []
    }
  ],
  "requests": [
    {
      "id": "FK20261008001",
      "costId": "FY20261008001",
      "projectId": "PRJ-20261008-001",
      "amount": 4000,
      "paid": 0,
      "status": "审批中",
      "date": "2026-10-15",
      "basis": "采购付款节点（演示）"
    }
  ],
  "reconciliations": [],
  "customerSettlements": [],
  "settlements": [],
  "claims": [],
  "invoices": [],
  "adjustments": [],
  "approvals": [],
  "logs": []
};

/* 预置案例的详情演示资料。只补预置案例；用户新建项目不自动生成业务单据。 */
(function(root){
'use strict';
const d=root.MicePrototypeSeed,copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v)),base=copy(d),revision='detail-demo-20261009-2';
const round=n=>Math.round(n*100)/100,addDays=(date,n)=>{const t=new Date(date+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
const file=(name,text)=>{const content='原型演示资料，非正式业务凭据。\n'+text;return{name:name+'（演示）.txt',type:'text/plain',size:new TextEncoder().encode(content).length,text:content};};
const done=a=>a.status==='已完成',early=p=>['草稿','待确认'].includes(p.status);
const names=['张建国','王强','刘洋','陈红','赵明','孙丽','周伟','吴芳'];
const tax=(amount,rate=6)=>round(amount-amount/(1+rate/100));
d.moneyFlows=[{id:'DEMO-BANK-80000',company:'北京凯撒',customer:'北京科技发展有限公司',currency:'CNY',amount:80000,date:'2026-10-08',payer:'北京科技发展有限公司',basis:'原型演示银行到账记录，非真实资金'},{id:'DEMO-HC-250000',company:'北京凯撒',customer:'华辰医药有限公司',currency:'CNY',amount:250000,date:'2026-10-08',payer:'华辰医药有限公司',basis:'原型演示客户汇款记录，非真实资金'}];
for(const [index,p] of d.projects.entries()){
 const acts=d.activities.filter(a=>a.projectId===p.id),currency=p.seedScenario==='S5'?'EUR':'CNY',closed=p.status==='已结项';
 const quoteAmount=currency==='EUR'?16000:Number(p.legacyData?.amount)||(acts.length>10?25000:50000);
 p.demoDetails=true;p.settlementRule={days:30,basis:'本项目服务结束后30日提交结算资料（演示约定，非集团统一制度）'};
 p.attachments=[file('客户需求确认',p.name+'\n客户：'+p.customer+'\n服务期间：'+p.start+' 至 '+p.end+'\n服务范围：'+p.scope),file('项目分工表',p.name+'\n销售：'+p.sales+'\n负责人：'+p.owner+'\n计调负责日程、名单与采购核对。')];
 if(!p.members.length)p.members=[{name:p.sales,role:'销售',note:'客户需求、报价与合同沟通'},{name:p.owner,role:'项目负责',note:'服务方案与项目费用统筹'}];
 p.members.forEach(m=>Object.assign(m,{start:m.start||p.start,end:m.end||p.end,activities:m.activities||[],note:m.note||'项目服务协调及资料核对'}));
 p.members.push({name:'赵磊',role:'资源协作',start:p.start,end:p.end,activities:[acts[0].id],note:'酒店、用车及供应商确认资料'});
 if(!p.frameworks.length)p.frameworks=[{id:'DEMO-FW-'+p.id,number:'DEMO-HT-'+String(index+1).padStart(3,'0'),name:p.name+(p.mode==='multi'?'框架合同':'服务合作协议'),customer:p.customer,company:p.company,start:p.start,end:p.end,scope:p.scope,nature:p.mode==='multi'?'上限':'固定总价',amount:d.orders.filter(o=>o.projectId===p.id).reduce((n,o)=>n+o.amount,0)||quoteAmount,currency,status:early(p)?'待办理':'已签归档',basis:'项目服务合同样例，仅用于原型展示',attachments:[file('服务合同资料',p.name+'\n服务与付款条款核对样例。')]}];
 p.frameworks.forEach(f=>{f.name=f.name||p.name+'年度框架合同';f.attachments=f.attachments||[file('框架合同资料',f.number+'\n'+f.scope)];});
 const planners=[...new Set(acts.map(a=>a.planner||'李梅'))];
 p.delegations=planners.map((employee,i)=>({id:'DEMO-FG-'+p.id+'-'+i,employee,scope:p.mode==='multi'?'负责本人项目团的报价、服务安排及采购核对':'项目团服务安排与采购核对',cities:[],services:['会议','旅游','会议加旅游'],start:p.start,end:p.end,quoteMode:'confirm',canCreate:!closed,currency,control:'reference',businessAmount:p.mode==='multi'?round((p.frameworks[0].amount||quoteAmount)/planners.length):quoteAmount,costBudget:p.budget==null?20000:round(p.budget/planners.length),singleLimit:null,policyBasis:'项目分工登记样例；金额为计划参考',status:closed?'已结束':'有效'}));
 p.closeoutPlan={owner:p.owner,date:addDays(p.end,30),note:closed?'项目服务、客户对账与业务结算已完成':'按项目团完成情况核对客户对账、采购费用及未清款票'};
 if(closed)p.closeout={reason:'客户服务验收、供应商费用及业务结算核对完成（演示）',openItems:[],pendingOwner:p.owner,pendingPlan:'无遗留款票',exceptionBasis:'',date:addDays(p.end,15)};
 d.logs.push({id:'DEMO-LOG-'+p.id,projectId:p.id,action:'登记项目与分工',detail:p.name+'；'+planners.join('、')+'负责执行，'+p.sales+'负责报价及合同。',time:addDays(p.start,-20)+' 10:00',demo:true});
 for(const [ai,a] of acts.entries()){
  a.demoDetails=true;a.planner=a.planner||'李梅';a.people=a.people||30;a.confirmedPeople=done(a)?a.people:undefined;a.reference=a.reference||'DEMO-WT-'+a.id;
  a.nameMode=a.nameMode||(a.service==='会议'?'按人数交付':'实名服务');a.basis=a.basis||'客户委托确认单 '+a.reference+'（演示）';a.settlementDue=addDays(a.end,30);
  const tour=a.service==='旅游',mixed=a.service==='会议加旅游',city=a.city||'北京',meetingPlace=city+'会议中心',hotel=city+'商务酒店',nights=Math.max(1,Math.round((Date.parse(a.end)-Date.parse(a.start))/86400000));
  if(!a.agenda.length)a.agenda=[{id:a.id+'-RC-1',kind:tour?'旅游':'会议',date:a.start,start:'09:00',end:'10:00',title:tour?'抵达接站与入住安排':'参会签到与开场',place:tour?city+'机场':meetingPlace,owner:a.planner,note:tour?'分两批接站，核对名单后前往酒店':'会议资料发放、设备测试、签到',traffic:tour?'接机大巴2辆':'',hotel:tour?hotel:''},{id:a.id+'-RC-2',kind:tour?'旅游':'会议',date:a.start,start:'10:00',end:'12:00',title:tour?'城市文化参访':'主题分享与交流',place:tour?city+'文化景区':meetingPlace,owner:a.planner,note:tour?'讲解、参访及团队合影':'主题分享、分组交流、茶歇'},{id:a.id+'-RC-3',kind:tour||mixed?'旅游':'会议',date:tour||mixed?a.end:a.start,start:'14:00',end:'17:00',title:tour||mixed?'参访及返程送站':'总结交流与离场',place:tour||mixed?city+'市区':meetingPlace,owner:a.planner,note:tour||mixed?'清点人数与行李，按返程批次送站':'会议总结、回收设备与资料'}];
  a.agenda.forEach((r,i)=>{r.id=r.id||a.id+'-RC-'+i;r.kind=r.kind||(tour?'旅游':'会议');r.title=r.title||r.name;r.note=r.note||'客户已核对本时段服务安排（演示）';});
  a.agendaHistory=[{date:addDays(a.start,-10),version:'V1',title:tour?'接站及参访初版安排':'会议议程初版',reason:'根据客户确认人数调整签到与用车安排',owner:a.planner}];
  if(!a.roster.length)a.roster=names.slice(0,Math.min(8,a.people)).map((name,i)=>({id:a.id+'-MD-'+i,name:name+'（演示）'}));
  a.roster.forEach((r,i)=>Object.assign(r,{group:r.group||['一组','二组'][i%2],arrival:r.arrival||'第一批 08:30',departure:'返程第一批 17:00',room:tour||mixed?'双床房 '+(101+Math.floor(i/2)):'无需住宿',vehicle:a.service==='会议'?'无需用车':'1号车',needs:i===0?'素食餐':i===1?'靠前座位':'常规服务',phone:'138****'+String(1000+i),documentType:'其他',document:r.document||''}));
  a.resources=[{id:a.id+'-ZY-1',category:tour?'酒店':'会场设备',name:tour?hotel+'双床房':meetingPlace+'主会议室',supplier:tour?hotel:'华东会议服务有限公司',start:a.start,end:a.end,quantity:tour?Math.ceil(a.people/2)*nights:1,unit:tour?'间夜':'台天',spec:tour?'双床房，含早餐':'课桌式，投影与音响',batches:tour?'统一入住、按名单分房':'投影1套、话筒4支',point:tour?hotel:meetingPlace,contact:'王经理（演示）',status:early(p)?'待确认':'已确认',confirmNo:early(p)?'':'DEMO-ZY-'+a.id+'-1',requiresName:tour,attachments:[file('资源确认',a.name+'\n'+(tour?hotel:meetingPlace)+'服务安排样例。')]},{id:a.id+'-ZY-2',category:tour||mixed?'车辆':'餐饮',name:tour||mixed?city+'团队接送用车':city+'会议茶歇',supplier:tour||mixed?city+'旅游车队':'华东会议服务有限公司',start:a.start,end:a.end,quantity:tour||mixed?2*(nights+1):a.people,unit:tour||mixed?'辆天':'人次',spec:tour||mixed?'49座旅游大巴':'茶点、咖啡及水果',batches:tour||mixed?'到达及返程各一批':'上午与下午茶歇',point:tour||mixed?city+'机场／车站':meetingPlace,contact:'李经理（演示）',status:early(p)?'待确认':'已确认',confirmNo:early(p)?'':'DEMO-ZY-'+a.id+'-2',requiresName:false,attachments:[]}];
  a.attachments=[file('客户委托确认',a.name+'\n委托编号：'+a.reference+'\n服务日期：'+a.start+' 至 '+a.end),file(tour?'出团服务安排':'会议执行单',a.agenda.map(r=>r.date+' '+r.start+' '+r.title).join('\n'))];
  if(done(a)){a.completion={actualStart:a.start,actualEnd:a.end,actualPeople:a.people,basis:'客户签收服务交付单 DEMO-JF-'+a.id,delivery:'全部完成',recordedBy:a.planner,recordedAt:addDays(a.end,1)+' 10:00',files:[file('服务交付单',a.name+'服务已完成，实际人数'+a.people+'人。')]};a.acceptance={status:'已认可',confirmationId:'DEMO-KHDZ-'+p.id};}
  let c=d.commitments.find(c=>c.activities.includes(a.id));
  if(!c){const amount=acts.length>10?25000:quoteAmount;c={id:'DEMO-BJ-'+a.id,projectId:p.id,name:a.name+'服务报价单',reference:a.reference,version:1,activities:[a.id],pricing:'fixed',currency,amount,status:early(p)?'草稿':'已确认',basis:early(p)?'客户需求及报价方案（演示，待确认）':'客户盖章报价确认样例',confirmedAt:early(p)?'':addDays(a.start,-15),nodes:[],contractNo:'',approval:early(p)?'待提交':'本版本已批准（演示）'};d.commitments.push(c);}
  a.commitmentId=c.status==='已确认'?c.id:a.commitmentId;
  c.frameworkId=p.frameworks[0].id;c.taxEstimate={method:'standard',rate:6,basis:'原型演示按6%测算，正式计税方式由财务确认'};
  if(!c.nodes.length)c.nodes=[{name:'首款',percent:30,amount:round(c.amount*.3),date:addDays(a.start,-10)},{name:'尾款',percent:70,amount:round(c.amount*.7),date:addDays(a.end,15)}];
  c.nodes.forEach(n=>{n.due=n.date;});
  if(c.activities.length===1){c.nodes[0].date=c.nodes[0].due=addDays(a.start,-10);c.nodes[1].date=c.nodes[1].due=addDays(a.end,15);}
  let o=d.orders.find(o=>o.commitmentId===c.id);
  if(!o){o={id:'DEMO-DD-'+a.id,projectId:p.id,commitmentId:c.id,customer:p.customer,company:p.company,currency:c.currency,amount:c.amount,activities:copy(c.activities),status:c.status==='已确认'?'已确认':'待确认',contractNo:'DEMO-HT-'+a.id,nodes:copy(c.nodes),received:0,invoiced:0};d.orders.push(o);c.orderId=o.id;}
  o.taxEstimate=copy(c.taxEstimate);o.nodes=copy(c.nodes);
  if(!d.costs.some(c=>c.activityId===a.id)){
   const budget=round((a.originalBudget|| (currency==='EUR'?10000:acts.length>10?18000:p.budget||quoteAmount*.7))/100)*100;
   d.costs.push({id:'DEMO-FY-'+a.id+'-1',projectId:p.id,activityId:a.id,name:tour?'酒店与地接接待':'会场设备及会务服务',supplier:tour?hotel:'华东会议服务有限公司',currency,amount:budget,estimate:budget,budget,status:early(p)?'待确认':'已确认',unit:'项',quantity:1,price:budget,paid:0,conditionLimit:budget,basis:'供应商服务报价及采购确认样例',allocations:[]});
  }
  d.settlements.push({id:'DEMO-JS-'+a.id,projectId:p.id,activities:[a.id],contextActivityId:a.id,includeProjectCosts:closed,version:1,status:done(a)?'已确认':'草稿',basis:done(a)?'客户交付单、供应商结算单及费用核对表（演示）':'结算准备清单，待服务完成与客户认可后提交',pending:done(a)?'无':a.name+'尚未完成服务，完成后核对实际费用',history:[{action:done(a)?'确认业务结算':'建立结算草稿',basis:'项目团费用与服务资料样例'}]});
  const change={id:'DEMO-BG-'+a.id,projectId:p.id,activityId:a.id,targetId:a.id,type:'activity',kind:'改期',version:1,status:'已作废',before:{start:a.start,end:a.end,status:a.status},start:addDays(a.start,1),end:addDays(a.end,1),reason:'客户曾提出顺延一天，最终保留原服务日期',basis:'客户邮件确认保留原日期（演示）',amount:null};d.adjustments.push(change);
  d.approvals.push({id:'DEMO-SP-'+a.id,projectId:p.id,type:'项目团变更',sourceId:change.id,version:1,status:'已撤回',applicant:p.sales,approver:p.owner,basis:change.basis,opinion:'客户撤回改期需求，原日期保持',history:[{action:'撤回申请',opinion:'保留原服务日期'}]});
  d.logs.push({id:'DEMO-LOG-'+a.id,projectId:p.id,activityId:a.id,action:done(a)?'核对服务交付':'登记执行安排',detail:a.name+'；'+a.agenda.length+'项日程、'+a.resources.length+'项资源，主责计调'+a.planner+'。',time:addDays(a.start,-7)+' 14:30',demo:true});
 }
 if(!d.costs.some(c=>c.projectId===p.id&&!c.activityId))d.costs.push({id:'DEMO-GGFY-'+p.id,projectId:p.id,activityId:'',scopeType:'common',name:'项目策划及资料制作',supplier:'华东会议服务有限公司',currency,amount:currency==='EUR'?500:3000,budget:currency==='EUR'?500:3000,estimate:currency==='EUR'?500:3000,status:early(p)?'待确认':'已确认',unit:'项',quantity:1,price:currency==='EUR'?500:3000,paid:0,allocations:[],basis:'项目策划与资料制作采购确认样例'});
 if(acts.length>1)d.costs.push({id:'DEMO-KTFY-'+p.id,projectId:p.id,activityId:'',scopeType:'shared',activityIds:acts.map(a=>a.id),name:'统一会务物料与摄影服务',supplier:'华东会议服务有限公司',currency,amount:acts.length*200,budget:acts.length*200,estimate:acts.length*200,status:'已确认',unit:'项',quantity:acts.length,price:200,paid:0,commonAmount:0,allocations:acts.map(a=>({activityId:a.id,amount:200})),allocationBasis:'按每团实际使用一套物料及摄影服务分配（演示）',basis:'跨团物料及摄影采购单（演示）'});
 const orders=d.orders.filter(o=>o.projectId===p.id),finishedOrders=orders.filter(o=>o.activities.every(id=>done(acts.find(a=>a.id===id))));
 d.customerSettlements.push({id:'DEMO-KHDZ-'+p.id,projectId:p.id,start:p.start,end:p.end,currency,mode:'价款及服务确认',status:finishedOrders.length?'已确认':'草稿',version:1,lines:(finishedOrders.length?finishedOrders:orders).map(o=>({orderId:o.id,activityIds:o.activities,original:o.amount,accepted:o.amount,dispute:0,reason:''})),confirmBy:finishedOrders.length?p.contact:'',confirmDate:finishedOrders.length?addDays(finishedOrders.map(o=>acts.find(a=>a.id===o.activities[0]).end).sort().at(-1),1):'',basis:finishedOrders.length?'客户已核对已交付服务及金额（演示）':'预先整理对账资料，待服务完成后取得客户确认',due:addDays(p.end,15),attachments:[file('客户对账清单',p.name+'\n客户订单、服务与金额核对样例。')]});
}
for(const c of d.costs){
 const p=d.projects.find(p=>p.id===c.projectId),a=d.activities.find(a=>a.id===c.activityId),closed=p.status==='已结项',completed=closed||a&&done(a);
 Object.assign(c,{company:p.company,start:a?.start||p.start,end:a?.end||p.end,version:1,paymentTerms:'确认后支付30%，服务核对后支付尾款（演示）',conditionLimit:c.amount,expectedTaxRate:6,deductionMode:'full',deductionBasis:'预计票面税额可扣的原型样例；以财务核定为准',taxStatus:completed?'已核定':'已到待核',ticketNumber:'DEMO-FP-'+c.id,ticketAmount:c.amount,ticketRate:6,ticketTax:tax(c.amount),approvedTax:completed?tax(c.amount):null,attachments:[file('采购与票据核对',c.name+'\n供应商：'+c.supplier+'\n含税金额：'+c.amount+' '+c.currency)],financeBasis:completed?'票据与服务核对通过（原型演示）':''});
 if(c.currency!=='CNY')Object.assign(c,{budgetRate:c.budgetRate||7.8,agreedRate:c.agreedRate||7.9,referenceRate:c.referenceRate||8,rateBasis:c.rateBasis||'本项目合同约定结算汇率7.90（演示）'});
 (c.allocations||[]).forEach(al=>{al.approvedTax=completed?tax(al.amount):null;});
 if(!d.requests.some(r=>r.costId===c.id)){
  const amount=completed?c.amount:round(c.amount*.3),paid=completed?amount:c.paid||0;
  d.requests.push({id:'DEMO-FK-'+c.id,projectId:p.id,activityId:c.activityId,costId:c.id,supplier:c.supplier,company:p.company,currency:c.currency,amount,paid,status:completed?'已付款':'待财务复核',date:addDays(c.start,-7),purpose:c.name,basis:'供应商采购付款条款与服务确认样例',version:1,accountStatus:completed?'财务已核对':'待财务核对',verifiedAccount:completed?'演示供应商账户（尾号0668）':'',history:[{action:completed?'付款完成':'提交付款申请',reason:'本项目采购付款演示记录'}],payments:completed?[{amount,reference:'DEMO-BANK-'+c.id,date:addDays(c.end,5),result:'付款成功',basis:'原型演示付款回单'}]:[]});c.paid=paid;
 }
}
for(const o of d.orders){
 const p=d.projects.find(p=>p.id===o.projectId),acts=d.activities.filter(a=>o.activities.includes(a.id)),complete=acts.every(done),date=complete?addDays(acts.map(a=>a.end).sort().at(-1),3):addDays(acts.map(a=>a.start).sort()[0],-10),amount=complete?o.amount:round(o.amount*.3);
 o.received=complete?amount:0;o.invoiced=complete?amount:0;o.salesTaxAmount=complete?tax(o.amount):null;
 o.nodes.forEach(n=>{n.received=complete?n.amount:0;n.invoiced=complete?n.amount:0;});
 const flowId='DEMO-DZ-'+o.id;d.moneyFlows.push({id:flowId,company:p.company,customer:p.customer,payer:p.customer,currency:o.currency,amount,date,basis:'原型演示到账资料，非真实资金'});
 d.claims.push({id:'DEMO-RK-'+o.id,projectId:p.id,company:p.company,customer:p.customer,currency:o.currency,flowId,amount,status:complete?'已认款':early(p)?'已退回':'待财务认款',basis:'客户汇款附言与订单核对（演示）',reason:complete?'到账资料与客户订单核对一致':early(p)?'报价尚未完成客户确认，补齐后重新提交':'待财务核对到账资料',allocations:[{orderId:o.id,amount,node:complete?'首款及尾款':'首款',nodeParts:complete?o.nodes.map(n=>({name:n.name,amount:n.amount})):[{name:'首款',amount}]}],history:[{action:complete?'财务确认认款':'提交认领',reason:'到账与订单关联样例'}]});
 d.invoices.push({id:'DEMO-KP-'+o.id,projectId:p.id,company:p.company,customer:p.customer,title:p.customer,taxNo:'DEMO-TAX-'+p.id,currency:o.currency,service:acts.some(a=>a.service!=='旅游')?'会务服务':'旅游服务',invoiceKind:'增值税普通发票',taxRate:6,approvedRate:complete?6:null,amount,status:complete?'已开具':early(p)?'已退回':'待财务办理',recipient:'finance@example.com',note:p.name+'；'+acts.map(a=>a.name).join('、'),allocations:[{orderId:o.id,amount}],reason:complete?'财务审核与开具成功样例':early(p)?'客户确认资料待补充':'等待财务核对开票项目与税率',invoiceNo:complete?'DEMO-INV-'+o.id:'',date:complete?date:'',submissionRef:complete?'DEMO-EINV-'+o.id:'',demoPdf:complete,history:[{action:complete?'已开具':'提交开票申请',reason:'原型演示，未连接电子开票服务'}]});
}
// 已完成与筹备中的项目团分别列示客户对账，避免年度项目只覆盖已回团的部分。
for(const p of d.projects){const pending=d.orders.filter(o=>o.projectId===p.id&&!d.customerSettlements.some(r=>r.lines.some(l=>l.orderId===o.id)));if(pending.length)d.customerSettlements.push({id:'DEMO-KHDZ-DRAFT-'+p.id,projectId:p.id,start:p.start,end:p.end,currency:pending[0].currency,mode:'价款及服务确认',status:'草稿',version:1,lines:pending.map(o=>({orderId:o.id,activityIds:o.activities,original:o.amount,accepted:o.amount,dispute:0,reason:''})),confirmBy:'',confirmDate:'',basis:'筹备项目团对账草稿，待服务交付后核对实际金额',attachments:[]});}
// 已确认结算保存本次承担费用及服务完成依据，不在打开详情时重新推算历史。
for(const s of d.settlements.filter(s=>s.status==='已确认')){
 const costs=[];for(const c of d.costs.filter(c=>c.projectId===s.projectId)){
  let amount=null,kind='direct';if(c.activityId&&s.activities.includes(c.activityId))amount=c.amount;
  else if(!c.activityId){const al=c.allocations.filter(al=>s.activities.includes(al.activityId));if(al.length){amount=round(al.reduce((n,al)=>n+al.amount,0));kind=c.scopeType==='common'?'management':'shared';}else if(s.includeProjectCosts){amount=c.amount-c.allocations.reduce((n,al)=>n+al.amount,0);kind='project';}}
  if(amount!=null&&amount>0)costs.push({id:c.id,costId:c.id,name:c.name,supplier:c.supplier,currency:c.currency,status:c.status,basis:c.basis,sourceVersion:1,originalAmount:c.amount,kind,amount,activities:s.activities,allocationAmounts:c.allocations.filter(al=>s.activities.includes(al.activityId)),allocationBasis:c.allocationBasis||'',incomplete:false});
 }s.confirmedRecord={scopeVersion:2,activities:s.activities,includeProjectCosts:s.includeProjectCosts,costs,serviceResults:s.activities.map(id=>{const a=d.activities.find(a=>a.id===id);return{id,status:a.status,completion:copy(a.completion),acceptance:copy(a.acceptance)};})};
 s.submittedRecord=copy(s.confirmedRecord);s.attachments=[file('业务结算核对表',s.basis+'\n'+costs.map(c=>c.name+'：'+c.amount+' '+c.currency).join('\n'))];
 const p=d.projects.find(p=>p.id===s.projectId);
 d.approvals.push({id:'DEMO-SP-'+s.id,projectId:p.id,type:'业务结算',sourceId:s.id,amount:round(costs.reduce((n,c)=>n+c.amount,0)),currency:costs[0]?.currency||'CNY',version:1,status:'已通过',applicant:p.owner,approver:'刘总监',company:p.company,basis:s.basis,opinion:'服务交付与本次承担费用核对一致（演示）',history:[{decision:'通过',opinion:'核对通过（演示）',version:1,by:'刘总监'}]});
}
for(const c of d.costs){const recorded=d.requests.filter(r=>r.costId===c.id).reduce((sum,r)=>sum+(r.paid||0),0),paid=round((c.paid||0)-recorded);if(paid>0)d.requests.push({id:'DEMO-FK-PAID-'+c.id,projectId:c.projectId,activityId:c.activityId,costId:c.id,supplier:c.supplier,company:c.company,currency:c.currency,amount:paid,paid,status:'已付款',date:addDays(c.start,-14),purpose:c.name+'首付款',basis:'原有已付金额对应的演示付款记录',version:1,accountStatus:'财务已核对',verifiedAccount:'演示供应商账户（尾号0668）',history:[{action:'财务确认付款',reason:'首付款已完成，演示回单号DEMO-BANK-PAID-'+c.id}],payments:[{amount:paid,reference:'DEMO-BANK-PAID-'+c.id,date:addDays(c.start,-14),result:'付款成功',basis:'演示付款回单'}]});}
for(const supplier of new Set([...d.costs.map(c=>c.supplier),...d.activities.flatMap(a=>a.resources.map(r=>r.supplier))]))if(!d.catalog.suppliers.includes(supplier))d.catalog.suppliers.push(supplier);
// 每个项目只保留足以演示差异的样例；年度会议取4个已完成和4个待执行，费用合计不超过10笔。
const expanded=copy(d),sampleIds=new Set();
for(const p of d.projects){const rows=d.activities.filter(a=>a.projectId===p.id),pending=rows.filter(a=>!done(a)),planners=[...new Set(pending.map(a=>a.planner))],representatives=planners.map(name=>pending.find(a=>a.planner===name)),drafts=[...representatives,...pending.filter(a=>!representatives.includes(a))].slice(0,4);for(const a of rows.length>8?[...rows.filter(done).slice(0,4),...drafts]:rows)sampleIds.add(a.id);}
const presetIds=new Set(d.activities.map(a=>a.id));
function compact(target,protectedProjects=new Set()){
 const editable=pid=>!protectedProjects.has(pid),keepActivity=id=>!presetIds.has(id)||sampleIds.has(id);
 target.activities=target.activities.filter(a=>!editable(a.projectId)||keepActivity(a.id));
 for(const a of target.activities)if(editable(a.projectId)&&presetIds.has(a.id))a.roster=(a.roster||[]).slice(0,10);
 for(const p of target.projects)if(editable(p.id))for(const m of p.members||[])m.activities=(m.activities||[]).filter(keepActivity);
 for(const key of ['commitments','orders','settlements'])target[key]=target[key].filter(r=>!editable(r.projectId)||!r.activities?.length||r.activities.some(keepActivity));
 target.costs=target.costs.filter(c=>!editable(c.projectId)||!c.activityId||keepActivity(c.activityId));
 for(const c of target.costs)if(editable(c.projectId)&&c.id.startsWith('DEMO-KTFY-')){
  c.activityIds=c.activityIds.filter(keepActivity);c.allocations=c.allocations.filter(r=>keepActivity(r.activityId));
  c.quantity=c.activityIds.length;c.amount=c.budget=c.estimate=c.conditionLimit=c.ticketAmount=round(c.quantity*c.price);c.ticketTax=tax(c.amount);
  c.attachments=[file('采购与票据核对',c.name+'\n供应商：'+c.supplier+'\n含税金额：'+c.amount+' '+c.currency)];
 }
 const costById=new Map(target.costs.map(c=>[c.id,c])),orderIds=new Set(target.orders.map(o=>o.id));
 target.requests=target.requests.filter(r=>!editable(r.projectId)||costById.has(r.costId));
 for(const r of target.requests)if(editable(r.projectId)&&r.costId?.startsWith('DEMO-KTFY-'))r.amount=round(costById.get(r.costId).amount*.3);
 for(const key of ['claims','invoices'])target[key]=target[key].filter(r=>!editable(r.projectId)||r.allocations?.some(l=>orderIds.has(l.orderId)));
 for(const r of target.customerSettlements)if(editable(r.projectId))r.lines=r.lines.filter(l=>orderIds.has(l.orderId));
 target.customerSettlements=target.customerSettlements.filter(r=>!editable(r.projectId)||r.lines.length);
 for(const key of ['adjustments','logs'])target[key]=target[key].filter(r=>!editable(r.projectId)||!r.activityId||keepActivity(r.activityId));
 const sourceIds=new Set(['projects','commitments','settlements','adjustments','requests'].flatMap(k=>target[k].map(r=>r.id)));
 target.approvals=target.approvals.filter(r=>!editable(r.projectId)||sourceIds.has(r.sourceId));
 const removedFlows=new Set(expanded.claims.filter(r=>editable(r.projectId)&&!orderIds.has(r.allocations[0].orderId)).map(r=>r.flowId));
 target.moneyFlows=(target.moneyFlows||[]).filter(r=>!removedFlows.has(r.id));
 for(const r of target.settlements)if(editable(r.projectId))for(const key of ['submittedRecord','confirmedRecord'])for(const c of r[key]?.costs||[])if(costById.has(c.costId||c.id))c.originalAmount=costById.get(c.costId||c.id).amount;
 return target;
}
compact(d);d.demoDetailsRevision=revision;
// 升级已有演示会话：仅覆盖仍等于旧样例的字段，保留用户编辑、用户新建及已删除的原记录。
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function merge(current,before,after){
 if(equal(current,before)||current===undefined)return copy(after);
 if(Array.isArray(current)&&(before===undefined||Array.isArray(before))&&Array.isArray(after)){
  if(after.every(x=>x&&typeof x==='object'&&x.id)){
   const out=copy(current);for(const next of after){const prev=(before||[]).find(x=>x.id===next.id),at=out.findIndex(x=>x.id===next.id);if(at>=0&&prev)out[at]=merge(out[at],prev,next);else if(at<0&&!prev)out.push(copy(next));}return out;
  }if(after.every(x=>typeof x==='string'))return [...current,...after.filter(x=>!(before||[]).includes(x)&&!current.includes(x))];return current;
 }
 if(current&&before&&after&&typeof current==='object'&&!Array.isArray(current)&&!Array.isArray(after)){
  const out={...current};for(const key of Object.keys(after))out[key]=merge(current[key],before[key],after[key]);return out;
 }return current;
}
root.MicePrototypeDemo={revision,upgrade(saved){
 if(saved.demoDetailsRevision===revision)return saved;
 const protectedProjects=new Set(),before=saved.demoDetailsRevision?expanded:base;
 for(const key of ['projects','activities','commitments','orders','costs','requests','claims','invoices','settlements','adjustments','approvals'])for(const old of before[key]){
  const current=saved[key]?.find(r=>r.id===old.id);
  if(!current||['name','status','amount','currency','received','invoiced','paid','activities','projectId'].some(k=>!(key==='projects'&&k==='name')&&!equal(current[k],old[k])))protectedProjects.add(old.projectId||old.id);
 }
 for(const key of ['activities','commitments','orders','costs','requests','claims','invoices','settlements','customerSettlements'])for(const r of saved[key]||[])if(r.projectId&&!before[key].some(old=>old.id===r.id))protectedProjects.add(r.projectId);
 const result=merge(saved,before,d);
 const financial=['commitments','orders','costs','requests','customerSettlements','settlements','claims','invoices','adjustments','approvals'];
 // 用户已推进业务或修改金额的项目保留整套原业务记录，不能用新增样例改写办理结果。
 for(const key of ['activities','logs',...financial])result[key]=result[key].filter(r=>!protectedProjects.has(r.projectId)).concat(copy((saved[key]||[]).filter(r=>protectedProjects.has(r.projectId))));
 for(const a of result.activities)if(protectedProjects.has(a.projectId)){const prior=saved.activities.find(r=>r.id===a.id);for(const k of ['commitmentId','completion','acceptance']){if(prior?.[k]===undefined)delete a[k];else a[k]=copy(prior[k]);}}
 const projects=new Set(result.projects.map(p=>p.id)),activities=new Set(result.activities.map(a=>a.id));
 for(const key of ['activities',...financial,'logs'])result[key]=result[key].filter(r=>!r.id.startsWith('DEMO-')||(!r.projectId||projects.has(r.projectId))&&(!r.activityId||activities.has(r.activityId)));
 compact(result,protectedProjects);result.demoDetailsRevision=revision;return result;
}};
})(window);

/* 结算金额样例升级只作用于整套资料未改变的预置项目，不重算用户的历史结算。 */
(function(root){
 if(!root.MiceTaxModel)return;
 const d=root.MicePrototypeSeed,M=root.MiceModel,previous=M.clone(d),revision='settlement-tax-20261021';
 function complete(target){for(const s of target.settlements.filter(s=>s.status==='已确认')){s.confirmedRecord={...root.MiceTaxModel.settlementEvidence(target,s),version:s.version};s.submittedRecord=M.clone(s.confirmedRecord);}}
 complete(d);d.settlementTaxRevision=revision;
 const prior=root.MicePrototypeDemo.upgrade;
 root.MicePrototypeDemo.upgrade=function(saved){
  const upgraded=prior(saved);if(upgraded.settlementTaxRevision===revision)return upgraded;
  const result=M.clone(upgraded),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  for(const p of previous.projects){
   const unchanged=['projects','activities','orders','costs','settlements'].every(key=>{
    const rows=list=>list.filter(r=>key==='projects'?r.id===p.id:r.projectId===p.id).sort((a,b)=>a.id.localeCompare(b.id));
    return same(rows(upgraded[key]||[]),rows(previous[key]||[]));
   });
   if(unchanged)for(const s of result.settlements.filter(s=>s.projectId===p.id&&s.status==='已确认')){
    const seed=d.settlements.find(r=>r.id===s.id);s.submittedRecord=M.clone(seed.submittedRecord);s.confirmedRecord=M.clone(seed.confirmedRecord);
   }
  }
  result.settlementTaxRevision=revision;return result;
 };
})(window);

/* 项目团四状态：只转换当前团状态及旧筛选，不改历史单据和服务事实。 */
(function(root){
 const status=value=>root.MiceModel.activityStatus(value);
 const normalize=data=>{for(const a of data.activities||[])if(status(a.status)!==a.status){a.statusBeforeSimplification=a.statusBeforeSimplification||a.status;a.status=status(a.status);}return data;};
 normalize(root.MicePrototypeSeed);
 const prior=root.MicePrototypeDemo.upgrade;
 root.MicePrototypeDemo.upgrade=function(saved){
  const result=prior(saved);
  return result.activities?.some(a=>status(a.status)!==a.status)?normalize(JSON.parse(JSON.stringify(result))):result;
 };
})(window);

/* 旧欧洲项目团归入同一项目团档案。保留原单号、原金额及待核差异，不采用详情模板的比例预算。 */
(function(root){
 const M=root.MiceModel,revision='project-detail-20261024',pid='MICE-20250623-001',aid='PRJ-MICE-20260915-001';
 const project={id:pid,name:'北京某科技有限公司欧洲奖励旅游',customer:'北京某科技有限公司',company:'福建凯撒',department:'会奖业务部',mode:'single',kind:'奖励旅游',start:'2026-09-15',end:'2026-09-24',sales:'陈刚',owner:'高明',scope:'欧洲奖励旅游、酒店、晚宴及团建服务',basis:'V4 客户确认版',status:'进行中',budget:1458000,contact:'刘总监',phone:'',members:[{name:'高明',role:'项目负责人',activities:[aid],start:'2026-09-15',end:'2026-09-24'}],frameworks:[],attachments:[]};
 const activity={id:aid,projectId:pid,name:project.name,reference:'V4 客户确认版',service:'旅游',nameMode:'实名服务',city:'法国、瑞士、意大利',start:project.start,end:project.end,people:80,confirmedPeople:80,planner:'高明',status:'进行中',basis:'客户确认版项目订单 KSMICE20260704001',originalBudget:1458000,latestEstimate:1512600,scope:project.scope,roster:[],agenda:[],resources:[],attachments:[],visaRequirement:{required:true,country:'法国、瑞士、意大利',type:'申根旅游签证',basis:'欧洲奖励旅游服务范围；实际办签人员按名单核对'},leaders:[{id:'LEADER-MICE-001',leaderId:'LD-20260312001',name:'张建国',scope:'全程领队',start:project.start,end:project.end,status:'待领队确认',basis:'原团期结算登记领队',history:[]}],sourceChecks:['日期待核对：客户档案为2026-09-15至09-24，旧详情模板为2025-09-15至09-23。','名单待核对：原费用页标注80人已导入，但旧详情没有对应人员明细。'],legacyCostTotal:1512600,legacyReferences:[{no:'JS-PRJ-20250623',label:'原财务结算记录',path:'merchant/finance/finance-settlement.html'},{no:'PAY-MICE-20260915-001',label:'原付款申请（已驳回）',path:'merchant/tour/fulfillment-cost.html'}]};
 const source=[['往返交通','欧洲航空服务商',80,'人',3600,288000,'已确认','按企业团队名单锁定机票成本','交通'],['酒店住宿','欧洲酒店会务联盟',360,'间夜',5200,468000,'待确认','原单价5200与9晚×40间口径不一致；原总额468000保留，主酒店确认、尾款待账单','酒店'],['地接服务','欧洲DMC地接服务',80,'人',2800,224000,'待确认','地接总账单待客户行程确认后回传','地接'],['商务晚宴','巴黎宴会服务商',80,'人',1350,108000,'已确认','含场地、餐饮和基础搭建','餐饮'],['团建活动','欧洲活动执行公司',1,'项',185000,185000,'待确认','活动执行方案已确认，供应商账单待补','会场设备'],['领队服务','凯撒领队中心',2,'人',9800,19600,'已确认','双领队全程服务','领队']];
 const costs=source.map((r,i)=>({id:aid+'-C'+i,projectId:pid,activityId:aid,name:r[0],supplier:r[1],quantity:r[2],unit:r[3],price:r[4],amount:r[5],budget:r[5],estimate:r[5],status:r[6],basis:r[7],category:({酒店:'住宿',地接:'地接服务',领队:'领队服务'})[r[8]]||r[8],currency:'CNY',company:project.company,start:project.start,end:project.end,paid:0,amountMode:'total',scopeType:'direct',allocations:[],taxStatus:'待核定',expectedTaxRate:null,approvedTax:null,attachments:[]}));
 const order={id:'KSMICE20260704001',projectId:pid,activities:[aid],customer:project.customer,company:project.company,currency:'CNY',amount:1906000,received:1524800,invoiced:0,version:1,status:'已确认',pricing:'fixed',basis:'V4 客户确认版',nodes:[],history:[],legacyInvoiceUnknown:true};
 activity.resources=[{id:'CG-MICE-AIR-001',category:'交通',name:'北京—巴黎团队机票',supplier:'中国国际航空',start:project.start,end:project.start,quantity:80,unit:'人次',status:'待确认',requiresName:true,reference:'AIR-MICE-20260704-001',spec:'经济舱团队位',point:'北京首都T3 → 巴黎戴高乐T1',confirmNo:'',batches:'航班及订位记录待核对'},{id:'CG-MICE-AIR-002',category:'交通',name:'罗马—北京团队机票',supplier:'中国国际航空',start:project.end,end:project.end,quantity:80,unit:'人次',status:'待确认',requiresName:true,reference:'AIR-MICE-20260704-002',spec:'经济舱团队位',point:'罗马菲乌米奇诺 → 北京首都T3',confirmNo:'',batches:'航班及订位记录待核对'}];
 costs[1].legacyRequested=120000;
 const requests=[{id:'PAY-MICE-20260915-001',projectId:pid,activityId:aid,costId:costs[4].id,supplier:costs[4].supplier,company:project.company,currency:'CNY',amount:185000,paid:0,status:'已退回',version:1,basis:'原项目执行款申请',returnReason:'活动执行供应商账单缺少客户确认附件',history:[{action:'付款申请退回',reason:'活动执行供应商账单缺少客户确认附件'}]}];
 const additions={projects:[project],activities:[activity],orders:[order],costs,requests};
 function install(data){if(data.projectDetailRevision===revision)return data;for(const [key,rows]of Object.entries(additions))for(const row of rows)if(!data[key].some(v=>v.id===row.id))data[key].push(M.clone(row));if(!data.catalog.staff.some(p=>p.name==='高明'))data.catalog.staff.push({name:'高明',companies:['福建凯撒'],canPlan:true});
 for(const supplier of [...source.map(r=>r[1]),'中国国际航空'])if(!data.catalog.suppliers.some(v=>(typeof v==='string'?v:v.name)===supplier))data.catalog.suppliers.push(supplier);
 data.projectDetailRevision=revision;return data;}
 install(root.MicePrototypeSeed);
 const prior=root.MicePrototypeDemo.upgrade;
 root.MicePrototypeDemo.upgrade=saved=>{const data=prior(saved);return data.projectDetailRevision===revision?data:install(M.clone(data));};
})(window);

/* 可直接办理的结算案例。仅首次补入独立案例，不覆盖已有项目、已提交记录或用户的填写结果。 */
(function(root){
 const M=root.MiceModel,T=root.MiceTaxModel,revision='settlement-workflow-20261024',pid='PRJ-20261024-001';
 const additions={projects:[],activities:[],commitments:[],orders:[],costs:[],requests:[],claims:[],moneyFlows:[],customerSettlements:[],settlements:[],approvals:[],logs:[]};
 const file=(name,text)=>{const content='原型演示资料，非正式业务凭据。\n'+text;return{name:name+'（演示）.txt',type:'text/plain',text:content,size:new TextEncoder().encode(content).length};};
 const project={id:pid,name:'华东渠道伙伴交流项目',customer:'华东医疗器械有限公司',company:'北京凯撒',department:'会奖业务部',mode:'multi',kind:'会议',start:'2026-10-12',end:'2026-10-18',sales:'陈红',owner:'王芳',scope:'杭州、苏州及南京三场渠道交流会，会场、设备、茶歇与会务服务',basis:'三场客户服务委托（演示）',status:'进行中',budget:290000,contact:'刘洋',phone:'',members:[],frameworks:[],attachments:[file('客户服务委托','三场会议的服务内容与日期已确认。')]};
 additions.projects.push(project);
 const cases=[['杭州','12',106000,74200,''],['苏州','15',148400,106000,'草稿'],['南京','18',127200,90100,'已退回']];
 for(const [i,[city,day,income,amount,status]]of cases.entries()){
  const n=String(i+1).padStart(3,'0'),aid='PRJ20261024'+n,orderId='KS20261024'+n,commitmentId='BJ20261024'+n,costId='FY20261024'+n,acceptanceId='KHJS20261024'+n,date='2026-10-'+day,people=50+i*10;
  const basis=city+'场客户签收及供应商费用核对单（演示）',files=[file(city+'场服务完成确认',basis)];
  const a={id:aid,projectId:pid,name:city+'渠道伙伴交流会',reference:'WT20261024'+n,service:'会议',nameMode:'按人数交付',city,start:date,end:date,people,confirmedPeople:people,planner:'李梅',status:'已完成',basis:city+'场客户委托确认（演示）',scope:'会场、设备、茶歇及现场会务服务',commitmentId,originalBudget:amount,latestEstimate:amount+2120,settlementDue:'2026-10-31',agenda:[{id:aid+'-RC-1',kind:'会议',date,start:'09:00',end:'17:00',title:'渠道交流、产品说明与合作沟通',place:city+'会议中心',owner:'李梅',note:'按确认服务范围完成交付'}],agendaHistory:[],roster:[],resources:[{id:aid+'-ZY-1',category:'会场设备',name:city+'会议会场及设备',supplier:'华东会议服务有限公司',start:date,end:date,quantity:1,unit:'场',status:'已确认',confirmNo:'ZY20261024'+n}],attachments:files,materials:[],completedAt:date,completion:{actualStart:date,actualEnd:date,actualPeople:people,basis,delivery:'全部完成',recordedBy:'李梅',recordedAt:date+' 18:00',files},acceptance:{status:'已认可',confirmationId:acceptanceId},demoDetails:true};
  additions.activities.push(a);
  const taxEstimate={method:'standard',rate:6,basis:'会务服务税额测算样例，适用口径以财务确认为准'};
  additions.commitments.push({id:commitmentId,projectId:pid,name:a.name+'服务报价单',activities:[aid],pricing:'fixed',currency:'CNY',amount:income,status:'已确认',version:1,basis:'客户确认报价单（演示）',confirmedAt:'2026-10-09',taxEstimate,nodes:[]});
  additions.orders.push({id:orderId,projectId:pid,commitmentId,activities:[aid],customer:project.customer,company:project.company,currency:'CNY',amount:income,received:income/2,invoiced:0,discountAmount:0,discountBasis:'客户确认价，无另列优惠（演示）',version:1,status:'已确认',pricing:'fixed',basis:'客户确认报价单（演示）',taxEstimate,salesTaxAmount:i===2?null:T.split(income,6).tax,salesTaxBasis:i===2?'待财务核定':'财务核对销项税额（演示）',nodes:[{name:'首款',amount:income/2,received:income/2,invoiced:0},{name:'尾款',amount:income/2,received:0,invoiced:0}],history:[]});
  additions.costs.push({id:costId,projectId:pid,activityId:aid,name:a.name+'会场及会务服务',category:'会场设备',supplier:'华东会议服务有限公司',company:project.company,currency:'CNY',amount,budget:amount,estimate:amount,amountMode:'total',quantity:1,unit:'场',price:amount,start:date,end:date,scopeType:'direct',status:'已确认',basis,serviceConfirmed:true,deliveryBasis:basis,paid:amount/2,conditionLimit:amount,paymentTerms:'首款50%，服务完成核对后付尾款（演示）',paymentBasis:basis,version:1,expectedTaxRate:6,deductionMode:'full',deductionBasis:'可扣税额测算样例，以财务核定为准',taxStatus:i===2?'已到待核':'已核定',ticketNumber:'DEMO-FP-'+costId,ticketAmount:amount,ticketRate:6,ticketTax:T.split(amount,6).tax,approvedTax:i===2?null:T.split(amount,6).tax,financeBasis:i===2?'':'票据与本场服务核对一致（演示）',allocations:[],attachments:[file(city+'场采购与票据',basis)]});
  additions.customerSettlements.push({id:acceptanceId,projectId:pid,start:date,end:date,currency:'CNY',mode:'价款及服务确认',status:'已确认',version:1,lines:[{orderId,activityIds:[aid],original:income,accepted:income,dispute:0,reason:''}],confirmBy:project.contact,confirmDate:date,basis,attachments:files});
  const flowId='DZ20261024'+n;
  additions.moneyFlows.push({id:flowId,company:project.company,customer:project.customer,payer:project.customer,currency:'CNY',amount:income/2,date:'2026-10-10',basis:'客户首款到账（演示）'});
  additions.claims.push({id:'RK20261024'+n,projectId:pid,company:project.company,customer:project.customer,flowId,currency:'CNY',amount:income/2,status:'已认款',basis:'客户首款与原订单核对（演示）',allocations:[{orderId,amount:income/2,node:'首款'}],history:[]});
  additions.requests.push({id:'FK20261024'+n,projectId:pid,activityId:aid,costId,supplier:'华东会议服务有限公司',company:project.company,currency:'CNY',amount:amount/2,paid:amount/2,status:'已付款',version:1,date:'2026-10-10',basis:'原采购首款50%（演示）',purpose:a.name+'首款',accountStatus:'财务已核对',verifiedAccount:'演示供应商账户（尾号0668）',payments:[{amount:amount/2,reference:'DEMO-BANK-'+n,date:'2026-10-10',result:'付款成功',basis:'原型演示付款回单'}],history:[]});
  if(status){const r={id:'JS20261024'+n,projectId:pid,activities:[aid],contextActivityId:aid,includeProjectCosts:false,version:1,status,basis,pending:i===2?'税额待财务核定；客户尾款及供应商尾款在原单据继续办理。':'客户尾款及供应商尾款在原单据继续办理。',attachments:[file(city+'场结算核对表',basis)],noCost:'',savedAt:'2026-10-21T02:00:00.000Z',history:[{action:'保存结算草稿',version:1,at:'2026-10-21T02:00:00.000Z',by:'王芳',basis}]};
   if(status==='已退回'){r.submittedAt='2026-10-21T03:00:00.000Z';r.returnReason='请补充尾款安排及本场供应商确认资料';r.history.push({action:'提交结算',version:1,at:r.submittedAt,by:'王芳',basis});additions.approvals.push({id:'SP20261024003',type:'业务结算',sourceId:r.id,projectId:pid,version:1,status:'已退回',applicant:project.owner,company:project.company,basis,opinion:r.returnReason,decidedBy:'刘总监',decidedAt:'2026-10-22T02:00:00.000Z',history:[{decision:'退回',opinion:r.returnReason,version:1,by:'刘总监'}]});}
   additions.settlements.push(r);
  }
 }
 const common=(id,name,amount,scopeType)=>({id,projectId:pid,activityId:'',name,category:'会场设备',supplier:'华东会议服务有限公司',company:project.company,currency:'CNY',amount,budget:amount,estimate:amount,amountMode:'total',quantity:1,unit:'项',start:project.start,end:project.end,scopeType,status:'已确认',basis:'三场项目采购及分配依据（演示）',serviceConfirmed:true,deliveryBasis:'三场服务交付完成（演示）',paid:0,conditionLimit:amount,version:1,expectedTaxRate:6,deductionMode:'full',deductionBasis:'会务服务可扣测算样例，以财务核定为准',taxStatus:'已核定',ticketNumber:'DEMO-FP-'+id,ticketAmount:amount,ticketTax:T.split(amount,6).tax,approvedTax:T.split(amount,6).tax,financeBasis:'财务核对票据及分团税额（演示）',attachments:[file('公共采购分配依据',name)],allocations:[]});
 const shared=common('FY20261024004','三场统一设计及物料',6360,'shared');shared.activityIds=additions.activities.map(a=>a.id);shared.allocations=shared.activityIds.map(activityId=>({activityId,amount:2120,approvedTax:120}));shared.allocationBasis='按三场同量物料分配（演示）';shared.unallocated=0;
 const overhead=common('FY20261024005','项目整体策划统筹',10600,'common');overhead.commonAmount=10600;overhead.unallocated=0;
 additions.costs.push(shared,overhead);
 for(const r of additions.settlements)if(r.status==='已退回')r.submittedRecord=T.settlementEvidence(additions,r);
 function install(data){
  if(data.settlementWorkflowRevision===revision)return data;
  // 已存在同编号项目时不猜测哪些记录可替换。
  if(!data.projects.some(p=>p.id===pid))for(const [key,rows]of Object.entries(additions)){data[key]??=[];for(const row of rows)if(!data[key].some(r=>r.id===row.id))data[key].push(M.clone(row));}
  data.settlementWorkflowRevision=revision;return data;
 }
 install(root.MicePrototypeSeed);
 const prior=root.MicePrototypeDemo.upgrade;
 root.MicePrototypeDemo.upgrade=saved=>{const data=prior(saved);return data.settlementWorkflowRevision===revision?data:install(M.clone(data));};
})(window);

/* 用户要求所有预置项目团可办理结算：只更新一次示例阶段，后续办理结果不重置。 */
(function(root){
 'use strict';
 const M=root.MiceModel,seed=root.MicePrototypeSeed,revision='settlement-ready-demos-20261024';
 const activityIds=new Set(seed.activities.map(a=>a.id));
 function install(data){
  if(data.settlementReadyDemoRevision===revision)return data;
  const activities=data.activities.filter(a=>activityIds.has(a.id));
  const projectIds=new Set(activities.map(a=>a.projectId));
  for(const p of data.projects)if(projectIds.has(p.id)&&p.status!=='进行中')p.status='进行中';
  for(const a of activities){
   a.status='已完成';
   a.completedAt=a.completedAt||a.end;
   a.completion={actualStart:a.start,actualEnd:a.end,actualPeople:a.confirmedPeople??a.people,
    basis:'服务已完成，进入结算核对（演示）',delivery:'全部完成',recordedBy:a.planner||'项目负责人',recordedAt:a.end,
    ...(a.completion||{})};
  }
  const reopened=new Set();
  for(const r of data.settlements){
   // 用户另外创建的项目或与新团合并的结算不属于本次预置范围。
   if(!projectIds.has(r.projectId)||!(r.activities||[]).length||!r.activities.every(id=>activityIds.has(id))||!['审批中','已确认'].includes(r.status))continue;
   const previous=r.confirmedRecord||r.submittedRecord;
   if(previous)r.amountHistory=[...(r.amountHistory||[]),{version:r.version,submittedAt:r.submittedAt,record:M.clone(previous)}];
   r.version=(r.version||0)+1;
   r.status='草稿';
   r.submittedAt=null;r.confirmedAt=null;r.submittedRecord=null;r.confirmedRecord=null;
   r.history=[...(r.history||[]),{action:'保存结算草稿',version:r.version,at:'2026-10-24T02:00:00.000Z',by:'原型示例',basis:'示例调整为可继续核对结算，保留原金额版本'}];
   reopened.add(r.id);
  }
  for(const approval of data.approvals||[])if(reopened.has(approval.sourceId)&&['待审批','审批中','处理中','待处理'].includes(approval.status)){
   approval.status='已撤回';approval.opinion='示例已调整为结算草稿，重新提交后按新版本审批';
  }
  data.settlementReadyDemoRevision=revision;
  return data;
 }
 install(seed);
 const prior=root.MicePrototypeDemo.upgrade;
 root.MicePrototypeDemo.upgrade=saved=>{
  const data=prior(saved);
  return data.settlementReadyDemoRevision===revision?data:install(M.clone(data));
 };
})(window);

/* 项目团管理试用：补入草稿和执行中案例，保留原结算案例及已办理结果。 */
(function(root){
 'use strict';
 const M=root.MiceModel,revision='project-work-stages-20261024';
 const cases=[
  ['PRJ-20261008-003','DEMO-PREP-HC-001','杭州渠道会议','杭州','2026-11-05','李梅',30,20000,'草稿'],
  ['PRJ-20261008-003','DEMO-PREP-HC-002','苏州学术交流会','苏州','2026-11-12','赵磊',40,22000,'草稿'],
  ['PRJ-20261008-003','DEMO-PREP-HC-003','南京科室交流会','南京','2026-12-03','王芳',35,18000,'草稿'],
  ['PRJ-20261008-003','DEMO-PREP-HC-004','合肥区域会议','合肥','2026-12-17','李梅',45,23000,'草稿'],
  ['PRJ-20261008-003','DEMO-EXEC-HC-001','上海专家交流会','上海','2026-10-28','李梅',30,20000,'进行中'],
  ['PRJ-20261008-003','DEMO-EXEC-HC-002','宁波渠道说明会','宁波','2026-10-30','赵磊',40,22000,'进行中'],
  ['PRJ-20261008-002','DEMO-PREP-BX-001','厦门奖励旅游筹备','厦门','2026-11-15','李梅',60,120000,'草稿'],
  ['PRJ-20261008-002','DEMO-PREP-BX-002','成都奖励旅游筹备','成都','2026-11-20','赵磊',50,100000,'草稿']
 ];
 function install(data){
  if(data.projectWorkStagesRevision===revision)return data;
  for(const [pid,id,name,city,date,planner,people,budget,status]of cases){
   const p=data.projects.find(p=>p.id===pid),oid='DEMO-ORDER-'+id;
   if(!p||p.status!=='进行中'||data.activities.some(a=>a.id===id)||data.orders.some(o=>o.id===oid))continue;
   const service=pid.endsWith('002')?'旅游':'会议',basis=status==='草稿'?'客户服务需求筹备资料（演示），尚未成交':'客户已线下确认服务及价格（演示）';
   const a={id,projectId:pid,name,city,start:date,end:date,planner,people,originalBudget:budget,status,service,businessMode:service==='会议'?'会议专票团':'旅游单团',nameMode:service==='会议'?'按人数交付':'实名服务',scope:service==='会议'?'会议场地、设备、茶歇及现场会务服务':'交通、酒店及当地行程安排',basis,reference:'',agenda:[],roster:[],resources:[],attachments:[],demoStageCase:true};
   if(status==='进行中'){
    const amount=budget+8000;
    a.confirmedPeople=people;a.formationSource='order:'+oid;a.formation={source:a.formationSource,basis,by:planner,time:'2026-10-24 10:00'};
    a.agenda=[{id:id+'-AGENDA',kind:'会议',date,start:'09:00',end:'17:00',title:'交流与分组讨论',place:city+'会议中心',owner:planner,note:'场地及设备按资源安排核对'}];
    data.orders.push({id:oid,projectId:pid,activities:[id],name:name+'会务服务',customer:p.customer,company:p.company,currency:'CNY',amount,received:0,invoiced:0,version:1,status:'已确认',source:'成交登记',pricing:'fixed',basis,confirmationBasis:basis,confirmBy:p.contact||'客户负责人',confirmDate:'2026-10-24',nodes:[{name:'订金',amount:amount*0.3,received:0,invoiced:0,due:'2026-10-26'},{name:'尾款',amount:amount*0.7,received:0,invoiced:0,due:'2026-11-15'}],history:[]});
   }
   data.activities.push(a);
  }
  data.projectWorkStagesRevision=revision;return data;
 }
 install(root.MicePrototypeSeed);
 const prior=root.MicePrototypeDemo.upgrade;
 root.MicePrototypeDemo.upgrade=saved=>{const data=prior(saved);return data.projectWorkStagesRevision===revision?data:install(M.clone(data));};
})(window);

/* 每个预置项目均有草稿和进行中案例；只补独立记录，不重置用户办理。 */
(function(root){
 'use strict';
 const M=root.MiceModel,revision='all-project-stages-20261024',seed=root.MicePrototypeSeed,templates=[];
 for(const p of seed.projects){
  const rows=seed.activities.filter(a=>a.projectId===p.id),base=rows[0]||{};
  for(const status of ['草稿','进行中'])if(!rows.some(a=>a.status===status)){
   const id='DEMO-STAGE-'+p.id+(status==='草稿'?'-DRAFT':'-ACTIVE'),planner=seed.catalog.staff.find(s=>s.name===base.planner&&s.canPlan&&s.companies.includes(p.company))?.name||seed.catalog.staff.find(s=>s.canPlan&&s.companies.includes(p.company))?.name||'';
   templates.push({id,projectId:p.id,name:p.name+(status==='草稿'?' · 筹备场':' · 执行场'),status,service:base.service||'会议',businessMode:base.businessMode||p.businessMode||'旅游单团',start:p.start,end:p.start,city:base.city||'上海',planner,people:30,originalBudget:20000,scope:base.scope||p.scope,reference:'',nameMode:base.nameMode||'按人数交付',agenda:[],roster:[],resources:[],attachments:[],demoStageCase:true,...(status==='进行中'?{formation:{source:'直接建团',basis:'按项目服务计划开始执行准备（演示）',by:planner,time:'2026-10-24 10:00'}}:{})});
  }
 }
 function install(data){
  if(data.allProjectStagesRevision===revision)return data;
  for(const a of templates){const p=data.projects.find(p=>p.id===a.projectId);if(!p||p.status!=='进行中'||data.activities.some(r=>r.id===a.id))continue;data.activities.push(M.clone(a));}
  data.allProjectStagesRevision=revision;return data;
 }
 install(seed);
 const prior=root.MicePrototypeDemo.upgrade;
 root.MicePrototypeDemo.upgrade=saved=>{const data=prior(saved);return data.allProjectStagesRevision===revision?data:install(M.clone(data));};
})(window);

/* 收款约定和有依据的费用预计示例：只补未成交的筹备团，不覆盖已填写资料。 */
(function(root){
 const revision='collection-commercial-20261024',M=root.MiceModel;
 function install(data){if(data.collectionCommercialRevision===revision)return data;
  const a=data.activities.find(a=>a.id==='DEMO-PREP-BX-001');
  if(a&&!data.orders.some(o=>o.activities.includes(a.id)&&!['已取消','已作废'].includes(o.status))){
   if(!a.collectionPlan)a.collectionPlan=[{name:'订金',mode:'比例',ratio:30,dateKind:'约定',due:'2026-11-10',trigger:'客户约定的首款日期'},{name:'尾款',mode:'比例',ratio:70,dateKind:'预计',expectedDue:'2026-12-15',due:'',trigger:'开票后30天，预计开票日待核对'}];
   if(a.latestEstimate==null){a.latestEstimate=23000;(a.budgetHistory||=[]).push({after:23000,reason:'按本团服务范围核对费用预计（演示）',basis:'酒店、交通及接待费用预计清单（演示）',charge:'待客户确认'});}
  }
  data.collectionCommercialRevision=revision;return data;
 }
 install(root.MicePrototypeSeed);const prior=root.MicePrototypeDemo.upgrade;
 root.MicePrototypeDemo.upgrade=saved=>{const data=prior(saved);return data.collectionCommercialRevision===revision?data:install(M.clone(data));};
})(window);
