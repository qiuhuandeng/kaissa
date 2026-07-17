# 系统菜单与业务对象地图

更新时间：2026-07-17

本文是全链路验收第 2 步产物。它只固化“当前菜单和页面分别承载什么业务对象”，不在本步整改页面。

当前地图以 [shared/nav-merchant.js](../shared/nav-merchant.js) 的实际导航为准。后续验收报告、页面归属和标题命名都优先使用当前实际菜单名。

## 1. 全链路菜单坐标

| 链路节点 | 当前主菜单 | 直达入口 | 主要业务对象 | 核心角色 | 验收边界 |
|---|---|---|---|---|---|
| 资源源头 | 资源 | 基础资源、航空资源、邮轮资源、专列资源、供应商、领队资源 | 可复用资源主数据、协议和模板 | 产品、资源、采购配置 | 只做基础资料和协议规则，不承接订单、付款、NC。 |
| 产品和方案 | 产品中心 | 外采产品 / 产品市场、代理产品；自营产品 / 产品管理、单团项目；销售政策 / 定价策略、佣金政策、退改规则 | 自营产品、产品线路、代理产品、外采包装、单团需求、销售政策 | 产品经理、运营 | 维护可售结构，不在产品页做财务执行。 |
| 动态供给和履约 | 履约中心 | 团期管控、团期结算、签证办理；交通采购 / 机票切位、邮轮包舱、专列包铺 | 团期、航次、班期、项目团、采购库存、成本项、签证办理单 | 计调、团控、采购、签证专员、项目经理 | 团期和项目承接执行、名单、资源、成本，不直接确认财务付款。 |
| 销售交易 | 销售中心 | 产品预订、意向订单、订单管理、收款认领、合同管理、售后处理 | 报价、订单、合同、认款发起、售后申请 | 销售、门店、订单客服 | 处理客户交易和售后申请，不执行财务退款和付款。 |
| 自有销售网络 | 门店中心 | 门店经营、门店管理、门店成员、预存余额、门店对账 | 门店、顾问、预存账户、门店对账 | 门店运营、店长、门店财务 | 门店视角管理销售网络和资金节点，财务最终确认在财务模块。 |
| 外部渠道 | 渠道中心 | 分销渠道、佣金规则、分销台账、分销对账、OTA平台 | 分销商、OTA、佣金、渠道对账 | 渠道运营 | 渠道配置和对账归渠道，订单和售后主处理仍回销售中心。 |
| 营销运营 | 营销中心 | 活动管理、优惠券、发券中心；网店装修、专题活动、素材中心；营销分析 | 营销活动、优惠券、小程序页面、素材、专题 | 营销运营 | 管营销触达和权益发放，不替代订单收款和财务确认。 |
| 客户会员 | 客户 | 散客会员、企业客户、会员规则 | 会员、企业客户、联系人、会员规则 | 销售、会员运营 | 客户档案和经营，不替代订单处理。 |
| 财务承接 | 财务 | 财务工作台；到账流水、收款认款、应收、预收、预存、转款、渠道结算、退款执行；供应商账单、应付、付款申请、付款执行、付款退回、回单核销、预付；业务结算、结算调整、门店对账、期间关账；发票、资金、NC、报表 | 财务单据和凭证 | 门店财务、总部财务 | 财务确认和 NC 推送主场，不维护名单、资源、行程。 |
| 审批控制 | 审批 | 待我审批、我发起的、抄送我、审批总览、审批配置 | 审批单 | 审批人、发起人 | 审批业务动作是否生效，不承接原业务明细维护。 |
| AI能力 | AI | 线路拆解、竞品分析、签证审查、出行助理 | AI工具任务 | 产品、销售、签证、客服 | 作为能力入口，不替代业务对象。 |
| 基础配置 | 系统设置 | 组织架构、员工任职、基础参数、通知模板 | 组织、员工、参数、模板 | 系统管理员 | 系统配置，不承载交易对象。 |

## 2. 资源模块地图

| 菜单名称 | 页面 | 业务对象 | 上游 | 下游 | 验收关注 |
|---|---|---|---|---|---|
| 资源 > 基础资源 > 景点库 | `merchant/resource/resource-masterdata.html?type=poi` | 景点主数据 | 人工维护、AI拆解 | 线路方案、行程节点 | 不应展示订单、成本、付款等动态业务。 |
| 资源 > 基础资源 > 酒店库 | `merchant/resource/resource-masterdata.html?type=hotel` | 酒店主数据 | 供应商资料、人工维护 | 方案住宿、自由行套餐、成本项引用 | 不应做团期房量确认。 |
| 资源 > 基础资源 > 餐厅库 | `merchant/resource/resource-masterdata.html?type=restaurant` | 餐厅主数据 | 人工维护 | 方案餐食、成本引用 | 不应做供应商账单处理。 |
| 资源 > 基础资源 > 车型库 | `merchant/resource/resource-masterdata.html?type=vehicle` | 车型主数据 | 人工维护、供应商资料 | 方案用车、项目用车 | 不应承接具体团期车辆调度。 |
| 资源 > 基础资源 > 别名库 | `merchant/resource/resource-masterdata.html?type=alias` | 别名标准 | 人工维护 | AI拆解、资源匹配 | 只做标准化辅助。 |
| 资源 > 航空资源 > 航空公司 | `merchant/resource/resource-airlines.html` | 航空公司档案 | 航司资料 | 航线、协议、采购库存 | 只做档案，不维护具体切位。 |
| 资源 > 航空资源 > 航线库 | `merchant/resource/resource-flight-routes.html` | 常用航线模板 | 航司、机场、目的地 | 方案交通、机票切位 | 不维护具体日期数量。 |
| 资源 > 航空资源 > 航司协议 | `merchant/resource/resource-flight-block.html` | 航司协议规则 | 航司、供应商 | 交通采购、成本付款节点 | 协议规则和具体锁位要分开。 |
| 资源 > 邮轮资源 > 船公司 | `merchant/resource/resource-cruise-companies.html` | 船公司档案 | 船司资料 | 船只、协议、包舱 | 不直接处理航次订单。 |
| 资源 > 邮轮资源 > 船只档案 | `merchant/resource/resource-cruise-ships.html` | 船只和基础舱型 | 船公司 | 邮轮方案舱型结构 | 船只模板不是可售方案。 |
| 资源 > 邮轮资源 > 邮轮模板 | `merchant/resource/resource-cruise-routes.html` | 邮轮航线/航次模板 | 船只、母港 | 邮轮线路和方案 | 不等同于具体团期库存。 |
| 资源 > 专列资源 > 运营商 | `merchant/resource/resource-train-operators.html` | 专列运营商 | 运营商资料 | 专列模板、包铺 | 不直接做班期结算。 |
| 资源 > 专列资源 > 车次库 | `merchant/resource/resource-train-trips.html` | 车次基础档案 | 运营商 | 专列模板、包铺 | 不维护具体包铺库存。 |
| 资源 > 专列资源 > 专列模板 | `merchant/resource/resource-train-routes.html` | 专列线路/铺位模板 | 车次、运营商 | 专列方案、班期铺位 | 模板和销售方案要分层。 |
| 资源 > 产品配置 > 目的地分类 | `merchant/product/product-destination-config.html` | 目的地字典 | 系统配置 | 线路、产品筛选 | 配置类，不触发财务。 |
| 资源 > 产品配置 > 出发地配置 | `merchant/product/product-departure-config.html` | 出发地字典 | 系统配置 | 线路、团期、订单 | 配置类，不触发财务。 |
| 资源 > 供应商 | `merchant/resource/suppliers.html` | 供应商档案 | 资质维护 | 成本、应付、发票 | 供应商不是分销商。 |
| 资源 > 领队资源 | `merchant/resource/resource-tour-leaders.html` | 领队/导游资源 | 人员维护 | 团期执行、成本项 | 排班可反查，费用确认走成本和财务。 |

## 3. 产品中心地图

| 菜单名称 | 页面 | 业务对象 | 上游 | 下游 | 验收关注 |
|---|---|---|---|---|---|
| 产品中心 > 外采产品 > 产品市场 | `merchant/product/product-market.html` | 可外采线路产品 | 供应商、外部供给 | 代理入库、代理产品 | 产品市场只放可外采产品，不放自营产品。 |
| 产品中心 > 外采产品 > 代理产品 | `merchant/product/product-outsource-list.html` | 代理产品、配额 | 产品市场、供应商报价 | 包装、采购价、订单、差额结算 | 代理产品是外采入库后的经营对象。 |
| 产品中心 > 自营产品 > 产品管理 | `merchant/product/products.html` | 参团游、邮轮、专列、自由行、研学、单项服务等自营产品 | 产品创建、AI拆解、资源引用 | 产品线路、团期、渠道授权 | 产品层不维护具体出发日和库存。 |
| 产品中心 > 自营产品 > 单团项目 | `merchant/tour/product-custom-list.html` | 单团需求、报价版本、锁定报价、项目 | 客户需求、销售跟进 | 项目团、项目订单、合同、阶段应收、项目结算 | 单团主链路锚点，不能走普通新建订单作为主入口。 |
| 产品中心 > 销售政策 > 定价策略 | `merchant/product/product-pricing.html` | 定价规则 | 产品、渠道、节假日 | 团期价、订单改价、审批 | 定价本身不触发财务，订单和改价才触发财务。 |
| 产品中心 > 销售政策 > 佣金政策 | `merchant/channel/commission_rules.html` | 佣金规则 | 渠道、产品、订单 | 渠道佣金、分销结算 | 规则配置不替代渠道结算。 |
| 产品中心 > 销售政策 > 退改规则 | `merchant/resource/refund-rules.html` | 退改规则 | 产品、团期、供应商政策 | 售后申请、退款测算 | 规则配置不执行退款。 |

## 4. 履约中心地图

| 菜单名称 | 页面 | 业务对象 | 上游 | 下游 | 验收关注 |
|---|---|---|---|---|---|
| 履约中心 > 团期管控 | `merchant/tour/schedules.html` | 团期、航次、班期、项目团 | 产品、产品线路、单团项目 | 订单、名单、执行、成本、结算 | 项目团不应突出公开渠道余量和 OTA 售卖语义。 |
| 履约中心 > 团期结算 | `merchant/tour/fulfillment-cost.html` | 成本项、成本确认、付款申请发起 | 团期、项目团、资源确认 | 应付、付款审批、结算 | 业务侧确认成本，不做财务付款执行。 |
| 履约中心 > 签证办理 | `merchant/tour/visa-processing.html` | 签证办理单、游客材料状态 | 订单游客、签证国家配置 | 出团校验、签证成本、客户通知 | 办理进度不替代资源配置。 |
| 履约中心 > 交通采购 > 机票切位 | `merchant/tour/resource-procurement-inventory.html?kind=air` | 机票切位库存 | 航司、航线、协议 | 团期分配、成本、应付 | 动态库存放履约中心，不回资源日常操作。 |
| 履约中心 > 交通采购 > 邮轮包舱 | `merchant/tour/resource-procurement-inventory.html?kind=cruise` | 邮轮舱房采购库存 | 船公司、船只、模板 | 邮轮团期舱型库存、成本 | 舱房采购与邮轮资源模板分开。 |
| 履约中心 > 交通采购 > 专列包铺 | `merchant/tour/resource-procurement-inventory.html?kind=train` | 专列铺位采购库存 | 运营商、车次、模板 | 专列班期铺位、成本 | 铺位采购与专列资源模板分开。 |

## 5. 销售中心地图

| 菜单名称 | 页面 | 业务对象 | 上游 | 下游 | 验收关注 |
|---|---|---|---|---|---|
| 销售中心 > 产品预订 | `merchant/sales/sales-product-quote.html` | 产品浏览、报价、预订入口 | 线路、团期、套餐、服务项目 | 报价、订单 | 单团不应把普通产品预订作为主下单入口。 |
| 销售中心 > 意向订单 | `merchant/sales/orders-intent.html` | 意向订单 | 咨询、客户线索 | 报价、订单 | 不触发财务单据。 |
| 销售中心 > 订单管理 | `merchant/sales/orders.html` | 销售订单 | 报价、团期、套餐、服务项目、项目订单 | 应收、合同、名单、售后、结算反查 | 列表快捷动作必须和详情同源抽屉一致。 |
| 销售中心 > 收款认领 | `merchant/sales/payment-claim.html` | 销售侧认款入口 | 银行流水、订单应收 | 财务认款、收款凭证 | 可发起认领，不替代财务最终确认。 |
| 销售中心 > 合同管理 | `merchant/sales/contracts.html` | 合同 | 订单、报价、锁定报价 | 签署、下载、售后、发票依据 | 项目合同和普通旅游合同要区分内容。 |
| 销售中心 > 售后处理 | `merchant/sales/orders-after-sales.html` | 售后申请 | 订单、客户申请 | 审批、应收调整、退款执行、库存释放 | 售后申请和财务退款执行分离。 |

## 6. 财务地图

| 菜单名称 | 页面 | 财务对象 | 上游 | 下游 | 验收关注 |
|---|---|---|---|---|---|
| 财务 > 到账流水 | `merchant/finance/receipts.html` | 收款凭证/流水处理 | 认款、资金池、银行流水 | NC收款凭证、结算 | 管已确认或待处理收款流水。 |
| 财务 > 收款认款 | `merchant/finance/finance-matching.html` | 认款记录 | 应收、银行流水、资金池 | 收款凭证、订单收款状态 | 能识别项目订单、普通订单、渠道订单。 |
| 财务 > 预存账户 | `merchant/finance/finance-predeposit.html` | 预存账户 | 门店、渠道、客户资金 | 资金池流水、订单扣款 | 预存不应被普通收款混淆。 |
| 财务 > 转款核销 | `merchant/finance/finance-transfer-records.html` | 转款/核销记录 | 售后、门店、订单 | 资金调整、审计 | 只做财务记录和核对。 |
| 财务 > 应收管理 | `merchant/finance/finance-receivable.html` | 应收单、阶段应收 | 订单、项目收款计划、补差 | 认款、发票、结算 | 要能筛项目订单和单团项目。 |
| 财务 > 应付管理 | `merchant/finance/finance-payable.html` | 应付单 | 成本确认、供应商账单 | 付款申请、进项发票 | 不维护业务资源本身。 |
| 财务 > 付款执行 | `merchant/finance/finance-payment.html` | 付款单 | 付款申请审批通过 | 回单、NC付款凭证 | 业务侧不能直接付款。 |
| 财务 > 退款执行 | `merchant/finance/finance-refund-execute.html` | 退款单执行 | 售后退款审批通过 | 退款凭证、NC退款凭证 | 与销售售后申请分离。 |
| 财务 > 业务结算 | `merchant/finance/finance-settlement.html` | 结算单 | 团期、订单、项目、服务单、渠道对账 | 确认结算、NC结转 | 项目结算要可反查单团项目、项目团、项目订单。 |
| 财务 > 发票管理 | `merchant/finance/finance-invoice.html` | 发票台账 | 订单、收款、应付、供应商账单 | 税务、NC | 发票并行于收付结算链。 |
| 财务 > 回单核销 | `merchant/finance/finance-remittance.html` | 银行回单 | 付款、银行流水 | 付款核销、审计 | 回单不替代付款审批。 |
| 财务 > 资金池 | `merchant/finance/finance-fund-pool.html` | 资金池余额和流水 | 门店预存、扣款、退回 | 认款、收款凭证、报表 | 资金对象，不只是报表。 |
| 财务 > 汇率币种 | `merchant/finance/finance-currency.html` | 汇率、币种 | 财务参数 | 多币种收付、NC | 配置类。 |
| 财务 > NC推送 | `merchant/finance/finance-nc.html` | NC推送任务和凭证 | 收款、付款、退款、结算、发票 | NC结果、失败处理 | 业务页不直接推 NC。 |
| 财务 > 资金调拨 | `merchant/finance/finance-control.html?view=fund-transfer` | 资金调拨单 | 资金账户、主体公司 | 资金流水、审计 | 只处理资金账户间调拨。 |
| 财务 > 财务报表 | `merchant/finance/finance-reports.html` | 财务统计 | 已生效财务单据 | 管理分析 | 报表需保留数据口径说明。 |

## 7. 门店、渠道、营销、客户、审批、AI、系统地图

| 菜单名称 | 页面 | 业务对象 | 上游 | 下游 | 验收关注 |
|---|---|---|---|---|---|
| 门店中心 > 门店经营 | `merchant/sales/store/operation.html` | 门店经营看板 | 门店订单、资金、顾问 | 门店管理、财务对账 | 看板不替代订单和财务处理。 |
| 门店中心 > 门店管理 | `merchant/sales/store/index.html` | 门店档案 | 组织、合同 | 门店成员、预存、结算 | 门店不是渠道分销商。 |
| 门店中心 > 门店成员 | `merchant/sales/store/members.html` | 门店员工/顾问 | 组织、员工 | 订单归属、业绩 | 角色和数据权限要清晰。 |
| 门店中心 > 预存余额 | `merchant/sales/store/predeposit.html` | 门店预存余额 | 充值、扣款 | 财务资金池、订单扣款 | 与财务资金池口径一致。 |
| 门店中心 > 门店对账 | `merchant/sales/store/reconciliation.html` | 门店对账 | 门店订单、收款 | 财务 > 业务结算 | 门店侧发起/核对，财务确认。 |
| 门店中心 > 呼叫中心 | `merchant/sales/call-center/intents.html` 等 | 电销意向、顾问、业绩 | 电话线索 | 意向订单、销售订单 | 电销线索流向销售中心。 |
| 渠道中心 > 分销合作 | `merchant/channel/distributors.html` 等 | 分销商、佣金、分销台账、分销对账 | 渠道配置、渠道订单 | 订单、佣金结算 | 分销商不是供应商。 |
| 渠道中心 > OTA平台 | `merchant/channel/ota_shops.html` 等 | OTA店铺、商品映射、平台对账、异常日志 | OTA平台 | 订单、售后、渠道结算 | OTA订单/退款作为销售和售后反查，不做渠道主处理。 |
| 营销中心 > 营销工具 | `merchant/marketing/campaigns.html` 等 | 活动、优惠券、发券任务 | 产品、客户、渠道 | 订单优惠、营销分析 | 营销发放不替代订单优惠确认和财务结算。 |
| 营销中心 > 小程序运营 | `merchant/marketing/miniapp-pages.html` 等 | 小程序页面、专题、素材 | 产品素材、活动素材 | C端展示、专题投放 | 页面运营不替代产品管理。 |
| 客户 > 散客会员 | `merchant/customer/list.html` | 散客会员/客户档案 | 销售、注册、导入 | 意向、订单、复购 | 会员经营不替代订单。 |
| 客户 > 企业客户 | `merchant/customer/enterprise-list.html` | 企业客户档案 | 销售、导入 | 单团项目、合同、订单 | 企业客户不等同供应商或分销商。 |
| 客户 > 会员规则 | `merchant/customer/member-rules.html` | 会员规则 | 会员运营配置 | 等级、权益、优惠资格 | 规则不直接生成财务单据。 |
| 审批 | `merchant/approval/approvals.html` | 审批单 | 业务动作发起 | 原业务对象生效或驳回 | 审批不维护原单据明细。 |
| AI | `merchant/ai/route_parser.html` 等 | AI工具任务 | 产品、销售、签证材料 | 建议、识别结果、辅助处理 | AI输出应回到业务对象。 |
| 系统设置 | `merchant/system/my-org.html` 等 | 组织、员工、参数、通知 | 管理配置 | 权限、通知、业务规则 | 不承载交易对象。 |

## 8. 关键二级页归属

| 二级页 | 归属菜单 | 业务对象 | 验收时要确认 |
|---|---|---|---|
| `merchant/product/products-detail.html` | 产品中心 > 自营产品 > 产品管理 | 产品详情 | 独立成团入口如果存在，必须进入客户专属项目逻辑，不误导为公开团期。 |
| `merchant/product/product-self-edit.html`、`product-cruise-edit.html`、`product-train-edit.html` | 产品中心 > 自营产品 > 产品管理 | 不同产品类型编辑 | 字段按产品/线路/团期分层，不把库存写在产品层。 |
| `merchant/product/product-outsource-detail.html`、`product-outsource-package.html`、`product-outsource-quota.html` | 产品中心 > 外采产品 > 代理产品 | 代理产品详情、包装、配额 | 外采只叠加供给来源和采购价，不替代原产品类型。 |
| `merchant/tour/team-create.html` | 履约中心 > 团期管控 | 新建团期/项目团 | `groupMode=independent` 时必须是客户专属项目团，不配置公开渠道。 |
| `merchant/tour/schedules-detail.html` | 履约中心 > 团期管控 | 团期/项目团详情 | 项目团视图不能出现散拼公开售卖语义。 |
| `merchant/tour/schedules-calendar.html` | 履约中心 > 团期管控 | 团期日历 | MICE/项目团在日历中应可识别且跳转正确。 |
| `merchant/tour/product-custom-detail.html` | 产品中心 > 自营产品 > 单团项目 | 单团项目详情 | 报价锁定、确认成团、生成对象和下一步入口必须清楚。 |
| `merchant/tour/projects.html`、`projects-detail.html` | 产品中心 > 自营产品 > 单团项目 | 旧项目执行页/项目详情 | 当前可能是历史入口，验收时确认是否仍需要保留或统一到单团项目/项目团。 |
| `merchant/tour/fulfillment-supplier-fees.html`、`fulfillment-payment-apply.html` | 履约中心 > 团期结算 | 供应商费用、付款申请 | 业务侧发起付款申请，财务侧付款执行。 |
| `merchant/sales/booking.html` | 销售中心 > 订单管理 | 新建订单 | 只作为普通订单录入和二级入口，单团项目订单不从这里主创建。 |
| `merchant/sales/orders-detail.html` | 销售中心 > 订单管理 | 订单详情 | 列表和详情的收款、合同、资料、售后等动作必须打开同源内容。 |
| `merchant/sales/orders-transfer.html`、`orders-cancel.html`、`orders-refund.html`、`orders-payment-transfer.html` | 销售中心 > 售后处理 | 售后申请 | 售后申请与财务退款执行边界清楚。 |
| `merchant/finance/finance-settlement-detail.html` | 财务 > 业务结算 | 结算详情 | 只做财务核对确认，可反查业务对象。 |
| `merchant/channel/ota_orders.html`、`ota_refunds.html` | 销售中心/售后反查 | OTA订单/退款反查 | 渠道页不应成为订单和售后的主处理入口。 |
| `merchant/customer/detail.html`、`customers-detail.html` | 客户 > 散客会员 | 会员详情 | 可反查订单和跟进，不直接处理财务。 |

## 9. 本步发现的验收关注点

| 关注点 | 当前观察 | 后续验收动作 |
|---|---|---|
| 菜单命名差异 | 当前导航使用“销售中心、门店中心、客户、履约中心、营销中心”。 | 后续文档和页面标题按实际菜单名收敛。 |
| 团期入口收敛 | 当前实际菜单下“团期管控、团期结算、签证办理、交通采购”归入履约中心，没有直达“出团执行、回团结算”。 | 第 5、6 步跑链路时判断是否因入口缺失导致执行/回团断点。 |
| 单团项目入口并存 | 当前存在 `product-custom-list/detail` 和 `projects/projects-detail` 两组项目相关页面。 | 单团链路验收时确认主入口、历史入口和项目团入口是否一致。 |
| 普通下单与单团订单边界 | 当前 `sales/booking.html` 归属订单管理二级页，产品预订菜单指向 `sales-product-quote.html`。 | 验收单团时确认项目订单由确认成团生成，不从普通新建订单主入口创建。 |
| 交通采购归属 | 当前交通采购在履约中心，不在资源模块。 | 验收跟团、邮轮、专列时检查采购库存能流向团期和成本。 |
| 财务项目结算能力 | `finance-settlement.html` 已出现项目结算、项目团、项目订单、单团项目筛选和反查字段。 | 业财专项验收时检查项目结算只做财务确认，不回头维护名单资源。 |
| 旧标准提到未落地页 | 旧文档出现 `fulfillment-return.html`、`fulfillment-outbound.html`、证件/签证执行页等，当前文件列表未见这些页面。 | 不按旧文档强行验页面，按当前实际入口检查是否有流程断点。 |

## 10. 第 2 步结论

第 2 步已完成菜单与业务对象地图。后续所有链路验收都按本地图定位入口，避免把资源、产品、销售、执行、财务、NC 的职责混在一个页面里。

下一步进入第 3 步：按产品类型建立主链路矩阵，逐一固定出境游/国内游、邮轮、专列、自由行、单项服务、研学、外采、单团自组从源头到 NC 的菜单路径。
