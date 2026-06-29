# 页面改造任务卡

更新时间：2026-06-29

关联文档：

- [产品域与业财流程总模型基线](product-domain-finance-flow.md)
- [产品域对象字典](product-domain-object-dictionary.md)
- [产品类型矩阵](product-type-matrix.md)
- [产品字段分层标准](route-plan-schedule-field-standard.md)
- [产品域状态机标准](product-state-machine.md)
- [业财事件表标准](business-finance-event-table.md)
- [菜单和页面归属校准清单](menu-page-ownership-standard.md)

本文是第八步“逐页建立改造任务卡”的验收物。后续第九步开始改页面时，不再按“哪个页面好改”推进，而是按本文的批次和任务卡逐页闭环。

## 1. 任务卡规则

每个页面改造前必须固定以下字段：

| 字段 | 要求 |
|---|---|
| 页面名称 | 使用真实文件路径和页面标题 |
| 所属菜单 | 必须与 `shared/nav-merchant.js` 和第七步归属一致 |
| 维护对象 | 页面主对象，不能混多个对象不拆区 |
| 上游对象 | 该页面对象从哪里来 |
| 下游对象 | 该页面对象流向哪里 |
| 核心字段 | 当前页面必须表达的关键字段 |
| 状态字段 | 页面展示和按钮判断依赖的状态 |
| 触发财务事件 | 对应第六步事件编码，无则写“无” |
| NC/发票影响 | 是否进入 NC、税务台账或发票链路 |
| 跳转页面 | 查看、新建、编辑、审批、财务联动等跳转 |
| 验收标准 | 页面改完后必须满足的业务闭环 |

## 2. 改造批次

第九步按业务数据链路推进，不按页面文件夹推进。

| 批次 | 范围 | 目标 | 验收 |
|---|---|---|---|
| P0 标准线路闭环 | 资源、旅游线路、团期、订单、收款、成本、结算、NC | 先打通跟团/邮轮/专列/研学主链路 | 从团期详情能看到方案、库存、订单、收款、执行、成本、结算、应付、付款、NC |
| P1 三条旁路 | 自由行、单项服务、MICE | 不强行套团期，但进入统一财务链路 | 自由行能到采购批次，单项服务能拆服务费和代垫，MICE 能按锁定报价结算 |
| P2 外采和渠道 | 线路市场、外采产品、OTA、分销商、代理商、佣金 | 外采作为供给来源叠加，不替代产品类型 | 全额收款、采购价付款、差额收入结转可追踪 |
| P3 财务深化 | 应收、认款、收款、应付、付款、退款、结算、发票、NC、报表 | 财务单据都能回到业务事件 | 每笔财务单据可追溯来源对象和事件编号 |
| P4 支撑模块 | 工作台、客户、审批、AI、系统 | 补齐支撑和配置能力 | 不破坏业务主链路，审批和 AI 回写原业务对象 |

## 3. P0 标准线路闭环任务卡

| 页面 | 所属菜单 | 维护对象 | 上游对象 | 下游对象 | 核心字段 | 状态字段 | 触发财务事件 | NC/发票影响 | 跳转页面 | 验收标准 |
|---|---|---|---|---|---|---|---|---|---|---|
| resource/resource-masterdata.html | 资源 / 基础资源 | POI/酒店/餐厅/车型/别名 | 人工维护、供应商资料、AI 解析 | 方案资源节点、自由行套餐 | 资源名称、类型、目的地、别名、供应商、状态 | 启用/停用 | 无 | 无 | 线路编辑、供应商详情 | 可被方案引用，不反向覆盖主数据 |
| resource/resource-flight-routes.html | 资源 / 航空资源 / 航线库 | 航线 | 航司协议、人工维护 | 方案交通、团期执行、机票成本 | 航司、起降地、航班号、舱位、币种 | 启用/停用 | 无 | 机票成本确认后进入 NC | 线路编辑、团期详情 | 航线只做资源，不写团期价格库存 |
| resource/resource-flight-block.html | 资源 / 航空资源 / 锁位管理 | 锁位资源 | 航司锁位协议 | 团期库存、订单占位、成本项 | 航线、锁位数、释放日、定金、供应商 | 有效/告急/已释放 | BF-PAY-001 | 预付款可生成付款和 NC | 团期详情、成本付款 | 锁位可追踪到团期和订单占用 |
| resource/resource-cruise-companies.html | 资源 / 邮轮资源 / 船公司 | 船公司 | 船司资料 | 船只档案、邮轮方案、供应商成本 | 船公司、结算币种、联系人、规则 | 合作中/暂停 | 无 | 船方账单确认后影响 NC | 船只档案、供应商详情 | 船公司不是可售邮轮方案 |
| resource/resource-cruise-ships.html | 资源 / 邮轮资源 / 船只档案 | 船只档案 | 船公司 | 邮轮方案、舱型模板 | 船名、吨位、舱型模板、设施、甲板图 | 启用/停用 | 无 | 无 | 邮轮线路编辑 | 舱型模板不等于团期舱型库存 |
| resource/resource-cruise-routes.html | 资源 / 邮轮资源 / 邮轮航线 | 邮轮航线 | 船公司、港口 | 邮轮方案、团期航次 | 母港、停靠港、航次天数、港务费规则 | 启用/停用 | 无 | 港务费成本确认后影响 NC | 邮轮线路编辑 | 只维护航线资源，不维护销售价 |
| resource/resource-train-operators.html | 资源 / 专列资源 / 运营商 | 专列运营商 | 运营商协议 | 专列线路、团期铺位成本 | 运营商、车体、结算规则、联系人 | 合作中/暂停 | 无 | 运营方账单确认后影响 NC | 专列线路、供应商详情 | 运营商不是渠道代理商 |
| resource/resource-train-routes.html | 资源 / 专列资源 / 专列线路 | 专列基础线路 | 运营商、车站 | 专列方案、团期铺位 | 起终点、经停站、铺位模板、车厢结构 | 启用/停用 | 无 | 包列成本确认后影响 NC | 专列线路编辑 | 铺位模板不等于团期铺位库存 |
| resource/suppliers.html | 资源 / 供应商 | 供应商 | 人工维护、合同 | 成本项、应付单、进项发票 | 名称、类型、结算方式、账户、科目、资质 | 合作中/暂停/终止 | BF-COST-009 | 应付、付款、进项发票、NC | supplier-detail.html | 供应商不与分销商、代理商混用 |
| resource/supplier-detail.html | 资源 / 供应商 | 供应商详情 | 供应商列表 | 成本、应付、付款、发票 | 基本资料、账户、合同、资质、账期 | 合作状态、资质状态 | BF-COST-009 | 进项发票和付款 NC | suppliers.html、finance-payable.html | 供应商字段变更可审计 |
| resource/resource-tour-leaders.html | 资源 / 领队资源 | 领队/导师资源 | 人工维护、排班 | 团期执行、成本项 | 姓名、证件、语种、资质、档期 | 可用/占用/停用 | 无 | 领队费用确认后影响 NC | resource-leader-schedule.html | 领队是资源，不是员工账号 |
| resource/resource-leader-schedule.html | 资源 / 领队资源 | 领队排班 | 领队资源、团期 | 团队执行、领队成本 | 领队、团期、日期、目的地、费用 | 待确认/已确认/冲突 | BF-COST-002 | 领队费用进入成本和应付 | resource-tour-leaders.html、schedules-detail.html | 排班冲突可识别 |
| product/products.html | 产品中心 / 自营产品 / 旅游线路 | 旅游线路列表 | 线路创建、AI 解析、外采包装 | 方案、团期、渠道授权 | 产品名称、线路类型、目的地、素材、费用政策 | 草稿/审核中/已上架/已下架 | 无 | 无 | product-self-edit.html、products-detail.html | 跟团/邮轮/专列/自由行统一筛选 |
| product/product-self-edit.html | 产品中心 / 自营产品 / 旅游线路 | 跟团线路编辑 | 旅游线路列表、资源 | 跟团方案、团期 | 线路信息、费用政策、分日行程、酒店、交通、POI | 草稿/审核中/已发布 | 无 | 无 | products.html、team-create.html | 线路层不维护具体日期价格库存 |
| product/product-cruise-edit.html | 产品中心 / 自营产品 / 旅游线路 | 邮轮线路编辑 | 旅游线路列表、邮轮资源 | 邮轮方案、舱型结构、团期 | 船公司、船名、航线、舱型、岸上游、费用政策 | 草稿/审核中/已发布 | 无 | 港务费、船方成本后续影响 NC | products.html、team-create.html | 舱型结构在方案层，库存在团期层 |
| product/product-cruise-routes.html | 产品中心 / 自营产品 / 旅游线路 | 邮轮方案配置 | 邮轮线路、邮轮资源 | 邮轮团期、舱型库存 | 航次、船只、舱型结构、靠港行程、岸上游 | 草稿/已发布 | 无 | 港务费和船方成本后续进 NC | product-cruise-edit.html、team-create.html | 邮轮方案维护售卖结构，不维护当期库存 |
| product/product-train-edit.html | 产品中心 / 自营产品 / 旅游线路 | 专列线路编辑 | 旅游线路列表、专列资源 | 专列方案、铺位结构、团期 | 运营商、线路、车厢、铺位、经停站、接驳 | 草稿/审核中/已发布 | 无 | 包列成本后续影响 NC | products.html、team-create.html | 铺位结构在方案层，库存在团期层 |
| product/product-train-routes.html | 产品中心 / 自营产品 / 旅游线路 | 专列方案配置 | 专列线路、专列资源 | 专列团期、铺位库存 | 车厢、席别、铺位结构、经停站、下车游览 | 草稿/已发布 | 无 | 包列和铺位成本后续进 NC | product-train-edit.html、team-create.html | 专列方案维护铺位结构，不维护当期库存 |
| product/products-detail.html | 产品中心 / 自营产品 / 旅游线路 | 线路详情 | 旅游线路 | 方案、团期、渠道授权、订单 | 线路摘要、方案列表、团期、素材、政策 | 上架状态、审核状态 | 无 | 无 | products.html、schedules-detail.html | 详情能进入团期和订单链路 |
| product/product-study-products.html | 产品中心 / 自营产品 / 研学线路 | 研学线路列表 | 研学创建、教育资源 | 研学方案、团期 | 主题、年级、基地、机构、安全材料 | 草稿/审核中/已上架 | 无 | 无 | product-study-edit.html | 研学独立入口，不与普通线路混表单 |
| product/product-study-edit.html | 产品中心 / 自营产品 / 研学线路 | 研学线路编辑 | 研学列表、资源 | 课程、导师、团期 | 教育目标、课程体系、基地、导师、安全预案 | 草稿/审核中/已发布 | 无 | 学校直签收款后影响 NC | product-study-products.html、team-create.html | 教育字段完整且可生成研学团期 |
| tour/team-create.html | 产品中心 / 团期团控 / 团期列表 | 新建团期 | 线路、方案 | 团期库存、价格、渠道 | 团号、日期、容量、价格、库存矩阵、截止日 | 筹备中/开放报名 | 无 | 无 | schedules.html、schedules-detail.html | 团期层不重复完整行程 |
| tour/schedules.html | 产品中心 / 团期团控 / 团期列表 | 团期 | 线路、方案 | 订单、执行、成本、结算 | 团号、出发日、库存、价格、渠道、领队 | 销售状态、执行状态、结算状态 | 无 | 无 | schedules-detail.html、team-create.html | 标准团期三组状态可筛选 |
| tour/schedules-calendar.html | 产品中心 / 团期团控 / 团期列表 | 团期日历 | 团期 | 批量开排、团期详情 | 日期、线路、余位、状态、截止节点 | 销售状态 | 无 | 无 | schedules-detail.html、schedules-batch.html | 日历是视图，不另建对象 |
| tour/schedules-batch.html | 产品中心 / 团期团控 / 团期列表 | 批量开排 | 方案、价格模板 | 多个团期 | 方案、日期规则、价格、库存、渠道 | 筹备中 | 无 | 无 | schedules.html | 批量生成团期不生成订单或财务单据 |
| tour/schedules-detail.html | 产品中心 / 团期团控 / 团期列表 | 团期详情 | 团期 | 订单、名单、收款、执行、成本、结算 | 方案、库存矩阵、名单、收款、执行、成本、结算 | 销售/执行/结算状态 | BF-SALE-001、BF-COST-002、BF-SETTLE-001 | 收款、成本、结算进入 NC | orders.html、fulfillment-cost.html、finance-settlement-detail.html | 从团期能看完整业财链路 |
| tour/fulfillment-outbound.html | 产品中心 / 团期团控 / 团队执行 | 团队执行总览 | 团期、订单名单 | 名单、证件、签证、通知、回团 | 团号、名单、资料、负责人、风险 | 未出团/操作中/已出发/已回团 | 无 | 无 | fulfillment-roster.html、fulfillment-return.html | 执行状态不替代销售状态 |
| tour/fulfillment-roster.html | 产品中心 / 团期团控 / 团队执行 | 名单管理 | 订单、游客 | 出团通知、保险、成本人数 | 游客、证件、房型、特殊需求、收款风险 | 名单待确认/已锁定 | 无 | 无 | orders-detail.html、fulfillment-documents.html | 名单锁定和订单人数一致 |
| tour/fulfillment-documents.html | 产品中心 / 团期团控 / 团队执行 | 证件资料 | 游客名单 | 签证、保险、出团校验 | 护照、证件有效期、附件、材料状态 | 待补/已齐/异常 | 无 | 无 | fulfillment-visa.html | 资料风险能回写订单详情 |
| tour/fulfillment-visa.html | 产品中心 / 团期团控 / 团队执行 | 签证进度 | 证件资料、签证供应商 | 出团校验、签证成本 | 签证国家、材料、送签日、出签日、费用 | 待送签/送签中/已出签/拒签 | BF-COST-002 | 签证成本确认后进入 NC | fulfillment-documents.html、finance-payable.html | 签证异常触发订单风险 |
| tour/fulfillment-notice.html | 产品中心 / 团期团控 / 团队执行 | 出团通知 | 团期、名单、集合信息 | 客户通知、执行记录 | 集合点、领队、行前说明、发送渠道 | 待发送/已发送/失败 | 无 | 无 | orders-detail.html | 通知记录可追溯到游客 |
| tour/fulfillment-return.html | 产品中心 / 团期团控 / 回团处理 | 回团记录 | 团队执行 | 实际成本、异常关闭、结算草稿 | 回团日期、满意度、异常、归档资料、实际成本入口 | 已回团/已归档 | BF-COST-002、BF-SETTLE-001 | 成本确认和结算进入 NC | fulfillment-cost.html、finance-settlement.html | 回团后才开启实际成本确认 |
| tour/fulfillment-cost.html | 产品中心 / 团期团控 / 成本付款 | 团期成本 | 团期、回团记录、成本项 | 成本确认单、应付草稿 | 预估成本、实际成本、供应商、科目、毛利 | 未维护/预估/实际确认 | BF-COST-001、BF-COST-002 | 成本确认后进入 NC | fulfillment-supplier-fees.html、finance-payable.html | 预估成本不生成应付 |
| tour/fulfillment-supplier-fees.html | 产品中心 / 团期团控 / 成本付款 | 供应商费用 | 成本项、供应商账单 | 应付单、差异记录 | 供应商、费用项、数量、金额、发票要求 | 待对账/有差异/已确认 | BF-COST-009、BF-COST-010、BF-COST-011 | 应付和进项发票影响 NC | finance-payable.html | 无业务对象账单不得生成应付 |
| tour/fulfillment-payment-apply.html | 产品中心 / 团期团控 / 成本付款 | 付款申请 | 应付草稿、预付款申请 | 审批、财务付款执行 | 供应商、应付单、金额、账户、用途 | 草稿/审批中/通过/拒绝 | BF-PAY-001、BF-PAY-002 | 审批通过后不推 NC，付款后推 | approval/approvals.html、finance-payment.html | 付款申请不等于已付款 |
| sales/sales-product-quote.html | 订单中心 / 线路浏览与报价 | 线路浏览和报价单 | 线路、团期、套餐、需求 | 报价单、订单 | 产品、团期、价格、客户、报价有效期 | 草稿/已发送/已确认 | 无，报价确认后生成订单应收 | 无 | booking.html、orders.html | 报价不直接生成财务单据 |
| sales/orders-intent.html | 订单中心 / 意向订单 | 意向订单 | 客户线索、咨询、AI 建议 | 报价单、销售订单、跟进记录 | 客户、需求、预算、日期、产品偏好、跟进人 | 新建/跟进中/已转订单/已关闭 | 无 | 无 | sales-product-quote.html、booking.html | 意向不触发财务，转订单后才生成应收 |
| sales/booking.html | 订单中心 / 订单管理 | 新建订单 | 报价、团期、套餐、服务项目 | 应收、库存占用、合同 | 客户、出行人、产品、库存、价格、收款计划 | 待提交/待收款 | BF-SALE-001、BF-SALE-002、BF-SALE-003 | 认款后推 NC，可开票 | orders-detail.html、payment-claim.html | 下单生成应收且占用正确库存 |
| sales/orders.html | 订单中心 / 订单管理 | 销售订单列表 | 报价、下单 | 应收、合同、售后、执行 | 订单号、客户、产品、团期、金额、收款 | 待收款/部分收款/已收清/售后中 | BF-SALE-001、BF-CASH-002 | 收款后进入 NC | orders-detail.html、orders-transfer.html、orders-refund.html | 订单状态和财务状态分开展示 |
| sales/orders-detail.html | 订单中心 / 订单管理 | 订单详情 | 销售订单 | 收款、合同、游客、售后、结算 | 订单、游客、收款、合同、发票、售后、风险 | 订单状态、收款状态、售后状态 | BF-CASH-002、BF-AFTER-001、BF-SALE-006 | 收款、退款、开票进入 NC/税务 | payment-claim.html、contracts.html、orders-after-sales.html | 订单详情能看到财务联动区块 |
| sales/payment-claim.html | 订单中心 / 收款认领 | 收款认领 | 应收、银行流水 | 认款记录、收款凭证 | 流水、应收单、订单、客户、金额 | 待认领/已认领/异常 | BF-CASH-002、BF-CASH-003 | 生成收款凭证和 NC 任务 | finance-matching.html、orders-detail.html | 认款完成回写订单收款状态 |
| sales/contracts.html | 订单中心 / 合同管理 | 合同 | 订单、报价 | 收款、售后、发票、审计 | 合同号、客户、产品、金额、签署、附件 | 草稿/已发送/已签署/作废 | 无，作废可能触发 BF-AFTER | 开票校验 | orders-detail.html、orders-after-sales.html | 合同金额作为应收校验依据 |
| sales/orders-after-sales.html | 订单中心 / 售后处理 / 售后总览 | 售后申请 | 订单、客户申请 | 审批、应收调整、退款执行、库存释放 | 售后单、类型、资源、金额、审批、财务联动 | 待审批/处理中/待财务执行/完成 | BF-AFTER-001、BF-AFTER-002、BF-SALE-006、BF-SALE-007 | 退款执行和红冲进入 NC | orders-transfer.html、orders-refund.html、finance-refund-execute.html | 售后申请不直接等于财务已执行 |
| sales/orders-transfer.html | 订单中心 / 售后处理 / 转团/改期 | 变更申请 | 订单、原团期、新团期/资源 | 应收调整、库存释放/重占、审批 | 原安排、新安排、差额、资源确认、凭证 | 草稿/审批中/已生效 | BF-AFTER-005、BF-AFTER-006、BF-AFTER-007、BF-AFTER-008 | 补差/退差生成 NC 任务 | orders-after-sales.html、approval/approvals.html | 新资源未锁定不得生效 |
| sales/orders-refund.html | 订单中心 / 售后处理 / 退款申请 | 退款申请 | 订单、售后规则、供应商扣损 | 审批、退款单、财务退款执行 | 可退金额、扣损、退款账户、库存释放 | 草稿/待审批/待执行/已完成 | BF-AFTER-001、BF-AFTER-002 | 执行后生成退款 NC | orders-after-sales.html、finance-refund-execute.html | 退款申请和退款执行分离 |
| finance/finance-matching.html | 财务 / 认款管理 | 认款记录 | 银行流水、应收 | 收款凭证、订单回写 | 流水、应收单、匹配规则、金额、差异 | 待认款/已认款/异常 | BF-CASH-001、BF-CASH-002、BF-CASH-003 | 收款凭证生成 NC 任务 | receipts.html、orders-detail.html | 认错款只能冲正不能删除 |
| finance/receipts.html | 财务 / 收款管理 | 收款凭证 | 认款记录、资金池扣款 | NC 收款凭证、结算单 | 凭证号、订单、客户、金额、账户、NC状态 | 待推送/已推送/失败 | BF-CASH-002、BF-CASH-004、BF-CASH-005 | 生成 NC 收款凭证 | finance-nc.html、orders-detail.html | 收款凭证必须有来源应收 |
| finance/finance-receivable.html | 财务 / 应收管理 | 应收单 | 订单、补差、应收计划 | 认款、收款、发票、结算 | 应收单、来源、客户、金额、余额、账龄 | 待收/部分/已收清/已冲减 | BF-SALE-001、BF-SALE-005、BF-SALE-006、BF-SALE-007 | 收款和红冲进 NC，可开票 | finance-matching.html、finance-invoice.html | 应收余额按调整事件计算 |
| finance/finance-settlement.html | 财务 / 对账结算 | 结算单列表 | 团期、订单、服务单、项目、成本确认 | 应付、付款、报表、NC | 收入、退款、成本、应付、已付、毛利 | 待生成/待确认/待审批/已结算 | BF-SETTLE-001、BF-SETTLE-002、BF-SETTLE-003 | 结转凭证进入 NC | finance-settlement-detail.html、finance-nc.html | 结算完成后金额只走调整 |
| finance/finance-settlement-detail.html | 财务 / 对账结算 | 结算详情 | 结算单 | 应付、付款、NC、报表 | 结算快照、收入、成本、差异、付款、NC | 待确认/待审批/已结算 | BF-SETTLE-003、BF-SETTLE-008 | 结转和调整进入 NC | finance-payable.html、finance-nc.html | 结算详情能追溯来源订单和成本 |
| finance/finance-payable.html | 财务 / 应付管理 | 应付单 | 成本确认、供应商账单 | 付款申请、进项发票、NC | 应付单、供应商、费用项、金额、账期、发票 | 待对账/已确认/已申请/已付款 | BF-COST-010、BF-COST-012 | 应付和付款影响 NC，进项发票影响税务 | finance-payment.html、finance-invoice.html | 应付确认不等于已付款 |
| finance/finance-payment.html | 财务 / 付款执行 | 付款单 | 付款申请审批通过 | 回单、应付核销、NC | 付款申请、供应商、账户、金额、银行流水 | 待执行/已付款/失败/回单待核销 | BF-PAY-003、BF-PAY-004、BF-PAY-007 | 付款完成生成 NC 付款凭证 | finance-remittance.html、finance-nc.html | 银行失败不覆盖原申请 |
| finance/finance-refund-execute.html | 财务 / 退款执行 | 退款执行 | 退款申请审批通过 | 退款凭证、订单回写、NC | 退款单、客户账户、金额、扣损、执行人 | 待执行/已退款/失败 | BF-AFTER-003 | 退款凭证进入 NC 红冲 | orders-refund.html、finance-nc.html | 退款执行完成才释放财务状态 |
| finance/finance-remittance.html | 财务 / 回单管理 | 回单 | 付款单、银行流水 | 付款核销、审计、NC校验 | 回单号、付款单、金额、附件、流水号 | 待核销/已核销/异常 | BF-PAY-005、BF-PAY-006 | 校验 NC 付款凭证 | finance-payment.html | 回单金额不一致进入异常 |
| finance/finance-invoice.html | 财务 / 发票管理 | 发票台账 | 订单、收款、应付、供应商账单 | 税务台账、NC | 抬头、税号、金额、税率、发票号、来源单据 | 申请中/已开票/红冲/已认证 | BF-TAX-001 至 BF-TAX-006 | 销项/进项进入税务和 NC | finance-receivable.html、finance-payable.html | 发票可追溯业务来源 |
| finance/finance-nc.html | 财务 / NC推送 | NC 凭证和推送任务 | 收款、退款、成本、付款、结算、发票 | NC 侧凭证号、失败重推 | 凭证类型、来源单据、科目、辅助核算、状态 | 待推送/推送中/成功/失败 | BF-NC-001 至 BF-NC-010 | 核心 NC 队列 | 来源单据详情 | 推送失败不回滚业务 |

## 4. P1 三条旁路任务卡

| 页面 | 所属菜单 | 维护对象 | 上游对象 | 下游对象 | 核心字段 | 状态字段 | 触发财务事件 | NC/发票影响 | 跳转页面 | 验收标准 |
|---|---|---|---|---|---|---|---|---|---|---|
| product/product-free-travel-list.html | 产品中心 / 自营产品 / 旅游线路 | 自由行套餐 | 酒店、航班、车型、POI、供应商 | 出行日期价格库存、订单、采购批次 | 套餐、日期库存、房量、价格、采购规则 | 草稿/在售/停售 | BF-SALE-002 | 订单收款和批次成本进入 NC | booking.html、finance-settlement.html | 自由行不出现在团期列表 |
| product/product-single-orders.html | 产品中心 / 自营产品 / 单项服务 | 服务项目和服务单入口 | 服务项目规则、客户 | 服务单、服务费、代垫、结算 | 服务项目、材料、服务费、代垫、办理节点 | 启用/停用/待处理/执行中 | BF-SALE-003、BF-COST-007、BF-SETTLE-005 | 服务费和代垫科目分离 | sales/booking.html、finance-settlement.html | 单项服务不进入新建线路 |
| tour/product-custom-list.html | 产品中心 / 单团自组 | MICE/定制需求列表 | 客户需求、销售线索 | 报价版本、锁定报价、项目 | 客户、人数、预算、日期、需求、负责人 | 需求确认/报价中/已确认/取消 | BF-SALE-004 | 阶段应收后进入 NC | product-custom-detail.html、projects.html | MICE 不进入标准线路库 |
| tour/product-custom-detail.html | 产品中心 / 单团自组 | 单团需求/报价详情 | 需求单 | 报价版本、合同、项目执行 | 报价版本、行程、费用、资源、客户反馈 | 草稿/已发送/已确认/已作废 | BF-SALE-004 | 锁定报价后阶段收款进入 NC | projects-detail.html、contracts.html | 锁定报价不得覆盖 |
| tour/projects.html | 产品中心 / 单团自组 | 项目执行列表 | 锁定报价、合同 | 项目成本、阶段应收、项目结算 | 项目、客户、阶段、应收、成本、负责人 | 筹备中/操作中/执行中/已完成 | BF-SALE-005、BF-COST-008 | 阶段收款、项目成本进 NC | projects-detail.html | 项目按锁定报价核算 |
| tour/projects-detail.html | 产品中心 / 单团自组 | 项目执行详情 | 项目执行单 | 成本确认、项目结算、NC | 锁定报价、变更单、阶段收款、实际成本 | 项目执行状态、项目结算状态 | BF-COST-008、BF-SETTLE-006 | 项目结算生成 NC 结转 | finance-settlement-detail.html、finance-nc.html | 项目变更生成变更单 |

## 5. P2 外采和渠道任务卡

| 页面 | 所属菜单 | 维护对象 | 上游对象 | 下游对象 | 核心字段 | 状态字段 | 触发财务事件 | NC/发票影响 | 跳转页面 | 验收标准 |
|---|---|---|---|---|---|---|---|---|---|---|
| product/product-market.html | 产品中心 / 线路市场 | 线路市场商品 | 自营、甄选、纯代理、供应商供给 | 外采引入、包装、渠道销售 | 商品来源、产品类型、供给模式、可售状态 | 待引入/已引入/已放弃 | 无 | 订单后影响 NC | product-outsource-list.html、products-detail.html | 线路市场不是外采入口替代物 |
| product/product-outsource-list.html | 产品中心 / 外采产品 / 产品列表 | 外采原始产品/包装产品 | 线路市场、供应商报价 | 采购价、配额、按原类型销售 | 来源、原类型、采购价、包装价、供应商 | 待引入/已引入/销售中/下架 | 无，订单后 BF-SALE | 差额结算后进 NC | product-outsource-package.html、product-outsource-quota.html | 外采跟随原产品类型 |
| product/product-outsource-package.html | 产品中心 / 外采产品 / 产品列表 | 外采方案包装 | 外采原始产品 | 包装产品、渠道价、上架 | 名称、亮点、费用政策、渠道价、采购价 | 待包装/待上架/销售中 | 无 | 订单后按差额进入 NC | product-outsource-list.html | 包装不改变原产品结构 |
| product/product-outsource-quota.html | 产品中心 / 外采产品 / 产品列表 | 外采配额 | 外采产品、供应商确认 | 销售占用、配额预警 | 配额对象、数量、有效期、供应商确认 | 待申请/已确认/告急/售罄 | BF-SALE-001/002 | 订单成交后影响 NC | product-outsource-list.html、orders.html | 配额不是独立左侧菜单 |
| product/product-channel-auth.html | 产品中心 / 渠道授权 | 渠道授权 | 线路、团期、定价策略 | 渠道可售、佣金计算 | 授权对象、渠道、价格、库存、有效期 | 待生效/生效中/停用 | BF-SALE-008 | 佣金结算影响 NC | channel/commission_rules.html | 授权按产品对象生效 |
| product/product-pricing.html | 产品中心 / 定价策略 | 定价策略 | 产品、渠道、节假日、库存 | 团期价格、订单价格、补退差 | 策略、适用范围、价格模型、触发条件 | 启用/停用 | BF-SALE-006、BF-SALE-007 | 调整收款后进 NC | product-competitor-price.html、orders-transfer.html | 改价不直接覆盖已生效订单 |
| product/product-competitor-price.html | 产品中心 / 定价策略 | 竞品价格监控 | OTA 公开价、AI 竞品分析 | 定价建议、价格调整审批 | 平台、竞品线路、我方线路、价差、趋势 | 已读/未读/已处理 | BF-SALE-006/007 | 仅调价生效后影响 NC | product-pricing.html | 竞品价格服务定价策略 |
| channel/ota_products.html | 渠道中心 / OTA运营 / OTA线路 | OTA 线路 | 渠道授权、线路市场 | OTA 上架、同步日志、OTA 订单 | OTA 平台、线路、价格、库存、同步状态 | 待同步/成功/失败 | 无 | OTA 订单回款后影响 NC | ota_orders.html、ota_reconcile.html | OTA 线路不替代产品主数据 |
| channel/ota_orders.html | 渠道中心 / OTA运营 / OTA订单 | OTA 订单 | OTA 平台订单 | 系统订单、认款、售后 | 平台单号、系统订单、金额、游客、状态 | 待确认/已确认/退款中 | BF-CASH-006 | OTA 回款和佣金影响 NC | sales/orders.html、ota_reconcile.html | OTA 订单必须映射系统订单 |
| channel/ota_refunds.html | 渠道中心 / OTA运营 / OTA退款 | OTA 退款 | OTA 订单、售后申请 | 退款申请、退款执行、平台回写 | 平台退款单、系统订单、金额、原因 | 待处理/处理中/完成 | BF-AFTER-001、BF-AFTER-003 | 退款执行后进入 NC | orders-refund.html、finance-refund-execute.html | OTA 退款不绕过订单售后 |
| channel/ota_reconcile.html | 渠道中心 / OTA运营 / OTA对账 | OTA 对账单 | OTA 订单、平台账单 | 认款、佣金、差异 | 平台、账期、订单金额、佣金、回款 | 待对账/有差异/已确认 | BF-CASH-006、BF-SALE-008 | 收款和佣金进入 NC | finance-matching.html | 对账差异可追踪 |
| channel/distributors.html | 渠道中心 / 分销商管理 | 分销商 | 渠道配置 | 渠道授权、佣金规则、订单 | 名称、等级、结算方式、账户、授权范围 | 合作中/暂停/终止 | BF-SALE-008 | 佣金结算进 NC | commission_rules.html | 分销商不是供应商 |
| channel/agents.html | 渠道中心 / 代理商管理 | 代理商 | 渠道配置 | 代理订单、佣金结算 | 名称、代理类型、结算方式、额度、授权 | 合作中/暂停/终止 | BF-SALE-008 | 佣金结算进 NC | commission_rules.html | 代理商不进入资源供应商 |
| channel/commission_rules.html | 渠道中心 / 佣金规则 | 佣金规则 | 渠道、产品、订单 | 渠道佣金单、应收/应付 | 渠道、产品范围、比例、结算周期 | 启用/停用 | BF-SALE-008 | 佣金应收/应付进 NC | distributors.html、agents.html | 佣金规则能回到渠道对象 |

## 6. P3 财务深化和报表任务卡

| 页面 | 所属菜单 | 维护对象 | 上游对象 | 下游对象 | 核心字段 | 状态字段 | 触发财务事件 | NC/发票影响 | 跳转页面 | 验收标准 |
|---|---|---|---|---|---|---|---|---|---|---|
| finance/finance-currency.html | 财务 / 汇率币种 | 汇率币种 | 财务参数 | 应收、应付、NC | 币种、汇率、有效期、来源、精度 | 启用/停用/过期 | 无 | 多币种凭证换算 | finance-receivable.html、finance-payable.html | 汇率变更留痕并影响新单 |
| finance/finance-reports.html | 财务 / 财务报表 | 财务报表 | 已生效事件和单据 | 经营分析、导出 | 报表类型、期间、组织、产品、金额 | 统计口径、更新时间 | 无 | 展示 NC 状态，不直接推送 | finance-settlement-detail.html、finance-nc.html | 底部必须有数据口径说明 |
| finance/finance-reports.html?report=fund&view=pool | 财务 / 资金池 | 资金池账户和流水 | 门店充值、订单扣款、退款退回 | 收款凭证、内部结算、报表 | 门店、余额、流水、冻结、预警 | 正常/预警/冻结 | BF-CASH-004、BF-CASH-005 | 资金池收款或内部结算进 NC | receipts.html、sales/store/index.html | 资金池是资金对象，不只是报表 |

## 7. P4 支撑模块任务卡

| 页面 | 所属菜单 | 维护对象 | 上游对象 | 下游对象 | 核心字段 | 状态字段 | 触发财务事件 | NC/发票影响 | 跳转页面 | 验收标准 |
|---|---|---|---|---|---|---|---|---|---|---|
| dashboard.html | 工作 / 首页工作台 | 工作台 | 待办、订单、财务、AI | 待办处理、页面跳转 | 待办、预警、业务摘要、AI入口 | 待处理/风险/已完成 | 无 | 展示财务预警 | 订单、团期、财务页面 | 工作台不承载业务主对象 |
| dashboard-group.html | 工作 / 首页工作台 | 集团管理层工作台 | 汇总报表、经营指标 | 报表、审批、风险处理 | GMV、收款、毛利、风险、组织 | 指标状态 | 无 | 展示 NC 和财务异常 | finance-reports.html、approvals.html | 管理层看汇总不改业务单据 |
| dashboard-store.html | 工作 / 首页工作台 | 门店店长工作台 | 门店订单、顾问、资金池 | 门店订单、顾问目标、资金池 | 门店业绩、顾问排行、资金池、待办 | 达成/预警 | BF-CASH-004、BF-CASH-005 | 资金池影响 NC | sales/store/index.html、finance-reports.html?report=fund&view=pool | 门店资金节点可追踪 |
| sales/store/index.html | 门店中心 / 门店管理 | 门店 | 组织架构、门店配置 | 门店订单、顾问、资金池、对账 | 门店、组织、账户、负责人、数据范围 | 启用/停用 | BF-CASH-004、BF-CASH-005 | 资金池收支进入 NC | sales/store/detail.html、finance-reports.html?report=fund&view=pool | 门店不等于渠道代理商 |
| sales/store/detail.html | 门店中心 / 门店管理 | 门店详情 | 门店列表 | 门店订单、顾问、资金池 | 门店信息、订单、顾问、资金、对账 | 启用/停用/预警 | BF-CASH-004、BF-CASH-005 | 资金池和收款进 NC | sales/store/index.html、orders.html | 门店详情可追踪订单和资金 |
| sales/consultant/index.html | 门店中心 / 顾问管理 | 顾问 | 员工账号、门店 | 意向、订单、业绩目标 | 顾问、门店、目标、订单、客户 | 在岗/停用 | 无 | 无 | sales/consultant/detail.html | 顾问是销售责任人，不是资源领队 |
| sales/consultant/detail.html | 门店中心 / 顾问管理 | 顾问详情 | 顾问列表 | 客户、意向、订单 | 业绩、客户、跟进、订单、目标 | 在岗/停用 | 无 | 无 | orders.html、customers-detail.html | 顾问业绩可回到订单 |
| customer/list.html | 客户 / 客户列表 | 客户 | 咨询、订单、导入 | 意向订单、订单、跟进 | 姓名、联系方式、标签、来源、最近互动 | 有效/沉睡/风险 | 无 | 发票抬头可关联 | customers-detail.html、orders-intent.html | 客户不直接触发财务 |
| customer/detail.html | 客户 / 客户列表 | 客户详情 | 客户列表 | 跟进、订单、会员 | 客户、联系人、历史订单、标签、AI建议 | 活跃/沉睡/风险 | 无 | 发票抬头关联 | orders.html、orders-intent.html | 客户详情展示 AI 复购建议 |
| customer/customers-detail.html | 客户 / 客户列表 | 客户详情 | 客户列表 | 跟进、订单、会员 | 客户、联系人、历史订单、标签、AI建议 | 活跃/沉睡/风险 | 无 | 发票抬头关联 | orders.html、orders-intent.html | 与 customer/detail.html 口径一致 |
| approval/approvals.html | 审批 | 审批单列表 | 业务动作、审批配置 | 业务生效、财务执行、日志 | 审批事项、来源对象、金额、节点、意见 | 待我审批/已通过/已拒绝 | 审批通过触发对应事件 | 付款、退款、结算、红冲可进 NC | approval-product-review.html、来源页面 | 审批不替代业务单据 |
| approval/approval-product-review.html | 审批 | 审批详情 | 审批单 | 业务回写、财务事件 | 来源对象、变更前后、审批意见、附件 | 待审批/通过/拒绝 | 取决于来源事件 | 取决于来源单据 | approvals.html、来源页面 | 审批通过必须回写原对象 |
| ai/route_parser.html | AI / 线路拆解 | 线路拆解任务 | 上传文件、外部行程 | 线路草稿、方案草稿 | 文件、解析结果、线路字段、行程节点 | 待解析/成功/失败 | 无 | 无 | product-self-edit.html | AI 生成草稿不直接发布 |
| ai/competitor.html | AI / 竞品分析 | 竞品分析任务 | OTA 公开数据、线路 | 竞品价格、定价建议 | 平台、竞品、价差、趋势、建议 | 采集中/完成/失败 | 无 | 无 | product-competitor-price.html、product-pricing.html | AI 建议不直接改价 |
| ai/visa_checker.html | AI / 签证审查 | 签证审查任务 | 证件资料、游客 | 风险提示、补材料任务 | 游客、国家、材料、有效期、风险 | 待审/通过/风险 | 无 | 无 | fulfillment-documents.html、orders-detail.html | 风险回写执行和订单 |
| ai/travel_assistant.html | AI / 出行助理 | 出行助理会话 | 订单、团期、客户问题 | 通知、客服跟进 | 会话、订单、问题、建议、满意度 | 进行中/已转人工/完成 | 无 | 无 | orders-detail.html | 助理不能替代售后审批 |
| ai/ai-assistant.html | 工作 / 首页工作台 | 工作台助手 | 工作台上下文 | 页面跳转、建议动作 | 用户角色、指令、模块、建议 | 可用/异常 | 无 | 只展示财务异常 | dashboard.html、finance-nc.html | 助手动作必须进入真实页面 |
| system/my-org.html | 系统设置 / 组织架构 | 组织架构 | 企业配置 | 员工、门店、数据权限 | 集团、子公司、中心、门店、部门 | 启用/停用 | 无 | 组织影响 NC 辅助核算 | role-assignment.html、staff-management.html | 组织层级不在单页重复顶部切换 |
| system/role-assignment.html | 系统设置 / 角色权限 | 角色权限 | 组织、员工 | 页面权限、按钮权限、数据权限 | 角色、菜单、按钮、数据范围 | 启用/停用 | 无 | 权限控制财务操作 | data-scope.html | 财务动作必须受按钮权限控制 |
| system/data-scope.html | 系统设置 / 角色权限 | 数据范围 | 角色权限、组织 | 页面数据过滤 | 角色、组织、门店、部门、范围 | 启用/停用 | 无 | 财务数据范围受控 | role-assignment.html | 数据范围不影响业务归属 |
| system/staff-management.html | 系统设置 / 员工账号 | 员工账号 | 组织、角色 | 顾问、审批人、操作日志 | 员工、账号、角色、部门、状态 | 在职/停用/离职 | 无 | 操作人进入财务日志 | role-assignment.html | 员工不是领队资源 |
| system/business-params.html | 系统设置 / 基础参数 | 基础参数 | 系统配置 | 字段枚举、审批规则、财务科目 | 参数类型、枚举、默认值、适用范围 | 启用/停用 | 无 | 科目参数影响 NC | finance-nc.html | 参数变更有审计 |
| system/notice-templates.html | 系统设置 / 通知模板 | 通知模板 | 系统配置 | 出团通知、催收、审批通知 | 模板、变量、渠道、适用场景 | 启用/停用 | 无 | 催收和付款通知展示单据 | fulfillment-notice.html | 模板变量必须来自业务对象 |
| system/hr-requests.html | 审批 / 我发起的 | 人事审批入口 | 员工/组织动作 | 审批中心 | 申请人、事项、组织、附件 | 待审批/通过/拒绝 | 无 | 无 | approvals.html | 归审批中心，不单独做人事模块 |
| login.html | 不引用导航 | 登录页 | 用户账号 | 工作空间选择、工作台 | 账号、密码、租户、验证码 | 待登录/失败/成功 | 无 | 无 | select-workspace.html、dashboard.html | 不引用后台导航脚本 |
| select-workspace.html | 不引用导航 | 工作空间选择 | 登录态、组织权限 | 工作台 | 组织、角色、最近空间 | 可选/不可用 | 无 | 无 | dashboard.html | 不引用后台导航脚本 |

## 8. 待补页面任务卡

以下页面尚未落地 HTML，第九步主链路改造时不优先新建，除非它们阻断当前链路。

| 待补页面 | 所属菜单 | 维护对象 | 上游对象 | 下游对象 | 核心字段 | 状态字段 | 触发财务事件 | NC/发票影响 | 建议优先级 | 验收标准 |
|---|---|---|---|---|---|---|---|---|---|---|
| 我的待办 | 工作 / 我的待办 | 待办任务 | 审批、订单、财务异常 | 来源页面 | 来源对象、节点、超时、负责人 | 待办/已办/逾期 | 取决于来源 | 取决于来源 | P4 | 待办能跳回来源对象 |
| 消息中心 | 工作 / 消息中心 | 消息通知 | 系统事件、审批、财务异常 | 用户提醒 | 消息类型、来源、阅读状态 | 未读/已读 | 无 | 无 | P4 | 消息不替代审批 |
| 报价单列表 | 订单中心 / 报价单 | 报价单 | 线路、团期、套餐、需求 | 订单、合同 | 报价单号、客户、产品、金额、有效期 | 草稿/已发送/已确认/失效 | 无 | 无 | P0 | 报价确认后才能转订单 |
| 门店订单 | 门店中心 / 门店管理 / 门店订单 | 门店订单视图 | 订单 | 门店业绩、收款、对账 | 门店、顾问、订单、收款、售后 | 待收/已收/售后中 | BF-CASH-005 | 资金池扣款进 NC | P4 | 只是门店视图，不新建订单对象 |
| 业绩目标 | 门店中心 / 门店管理 / 业绩目标 | 门店/顾问目标 | 组织、员工 | 工作台、报表 | 目标、周期、对象、完成值 | 进行中/达成/预警 | 无 | 无 | P4 | 业绩来自订单和收款 |
| 预充值账户 | 门店中心 / 门店管理 / 预充值账户 | 资金池账户 | 门店、财务入账 | 资金池流水、订单扣款 | 账户、余额、冻结、阈值 | 正常/预警/冻结 | BF-CASH-004、BF-CASH-005 | 资金池凭证进 NC | P3 | 与财务资金池口径一致 |
| 门店对账 | 门店中心 / 门店管理 / 门店对账 | 门店结算 | 门店订单、收款、退款 | 财务结算、报表 | 账期、订单、收款、退款、差异 | 待对账/有差异/已确认 | BF-SETTLE | 结算后进 NC | P4 | 门店对账不替代财务结算 |
| 渠道来源 | 渠道中心 / 渠道来源 | 渠道来源字典 | 系统配置 | 订单来源、佣金规则 | 来源、渠道、归属、有效期 | 启用/停用 | 无 | 无 | P2 | 渠道来源不等于供应商 |
| 同步日志 | 渠道中心 / 同步日志 | 渠道同步任务 | OTA、接口 | 失败重试、审计 | 任务、对象、状态、错误、重试 | 成功/失败/重试中 | 无 | 无 | P2 | 不删除失败日志 |
| 跟进记录 | 客户 / 跟进记录 | 客户跟进 | 客户、意向 | 意向订单、订单 | 客户、方式、内容、下一步、负责人 | 待跟进/已跟进 | 无 | 无 | P4 | 跟进可转意向 |
| 会员管理 | 客户 / 会员管理 | 会员账户 | 客户 | 积分、权益、订单优惠 | 会员号、等级、积分、权益 | 有效/冻结 | 无 | 发票无直接影响 | P4 | 会员抵扣进入订单金额 |
| 客户标签 | 客户 / 客户标签 | 标签字典 | 客户、AI 建议 | 客户分群、营销 | 标签、规则、来源、适用范围 | 启用/停用 | 无 | 无 | P4 | 标签不做状态色滥用 |
| 客户分群 | 客户 / 客户分群 | 客户分群 | 标签、订单、跟进 | 营销、AI 推荐 | 分群规则、人数、更新时间 | 启用/停用 | 无 | 无 | P4 | 分群口径可解释 |
| Prompt模板 | AI / Prompt模板 | Prompt 模板 | AI 配置 | AI 任务 | 模板、变量、场景、版本 | 启用/停用 | 无 | 无 | P4 | 模板变量来自业务对象 |
| 使用统计 | AI / 使用统计 | AI 使用统计 | AI 调用日志 | 成本分析、权限调整 | 用户、模块、调用量、耗时 | 正常/异常 | 无 | 无 | P4 | 统计底部有数据口径 |
| 模型路由 | AI / 模型路由 | 模型路由 | AI 配置 | AI 任务 | 模型、场景、优先级、降级策略 | 启用/停用 | 无 | 无 | P4 | 路由失败可降级 |
| 接口配置 | 系统设置 / 接口配置 | 接口配置 | 系统配置 | OTA、NC、税控、银企 | 接口、地址、密钥、状态、日志 | 启用/停用/异常 | 无 | NC、税控、银行接口 | P3 | 敏感字段不可明文展示 |
| 操作审计 | 系统设置 / 操作审计 | 操作日志 | 所有业务动作 | 审计查询、追责 | 操作人、对象、动作、前后值、时间 | 成功/失败 | 无 | 可追踪财务动作 | P4 | 日志不可删除 |

## 9. 第八阶段验收标准

第八步验收标准：

1. 已落地商户端业务页面均已建立任务卡。
2. 每张任务卡都包含页面、菜单、维护对象、上游、下游、核心字段、状态字段、财务事件、NC/发票、跳转和验收标准。
3. 第九步改造批次已按数据链路排序，不按文件夹或页面难度排序。
4. 标准线路闭环 P0 已覆盖资源、线路、团期、订单、收款、执行、成本、结算、应付、付款、NC。
5. 自由行、单项服务、MICE、外采、渠道已作为独立或叠加链路纳入任务卡。
6. 待补页面已列入清单，但不会在第九步前强行挂菜单制造 404。

下一步进入第九步“按链路顺序改页面”。优先从 P0 标准线路闭环开始，第一批建议改造范围是：

```text
product/products.html
product/product-self-edit.html
tour/team-create.html
tour/schedules.html
tour/schedules-detail.html
sales/booking.html
sales/orders.html
sales/orders-detail.html
tour/fulfillment-cost.html
finance/finance-settlement.html
finance/finance-nc.html
```
