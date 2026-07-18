# 抽屉内表格布局审计与改造方案

## 统计口径

- 本次扫描静态 HTML 中 `drawer-overlay / drawer-modal` 内直接包含 `<table>` 的抽屉，共 95 个。
- 另补充识别 `merchant/tour/product-custom-list.html` 中通过 JS 动态注入到 `listQuickActionModal` 的抽屉表格，共 12 类动作。
- 不纳入：页面主列表表格、普通居中确认弹窗、二级详情页主体表格。
- 全局规则已写入 `AGENTS.md` 的“抽屉内表格”规则：普通 2-5 列短表默认在原抽屉宽度内铺满，固定列宽，不横向滚动，不留大空白；6 列以上先删列/合并列，确有必要才宽抽屉或表格内横向滚动。

## 改造类型

- A 短表铺满：2-5 列、以展示/记录/核对为主。保留原抽屉宽度，`.table-wrap` 和 `table` 都 `width:100%`，补 `colgroup` 或语义列 class；金额、状态、操作列固定短宽，业务名称列吸收剩余宽度。
- B 短编辑表：2-5 列但含 input/select/button。保留原抽屉宽度或现有 drawer-md/lg，补列宽；控件宽度必须小于所在列内容宽度，设置 `max-width:100%`、`min-width:0`、`box-sizing:border-box`。
- C 中表压缩：6-7 列。先合并低频列或主辅两行展示；仍需表格时使用 drawer-lg/xl 但表格必须铺满正文，补固定列宽。只有确实放不下才允许表格容器内横向滚动。
- D 宽明细重组：8 列以上或一个抽屉内多张复杂表。不要硬塞普通抽屉；改成“摘要 + Tab/分区 + 明细表”，宽抽屉或详情页承载，宽明细表只在表格容器内横向滚动，关键短值和操作列完整可见。
- E 已改/轻复核：已有 colgroup 或刚按规则处理过，只做视觉复核与小修。
- F 动态注入表：JS 拼接出来的抽屉表格，统一加专属 class 和列宽模板，不能因为不是静态 HTML 就跳过。

## 优先级

- P0：有输入控件、6 列以上、或用户正在频繁操作的业务处理抽屉，最容易出现截断、留白、控件撑列。
- P1：详情/核对抽屉，列数中等或多表，影响扫读和业务判断。
- P2：日志/记录类短表，风险低，但仍需补统一列宽避免后续变形。

## 本次执行口径

- 已建立统一类：`drawer-table-fit`、`drawer-table-compact`、`drawer-table-scroll` 与 `drawer-table-cols-N`。静态抽屉表格先进入统一类，再由 CSS 决定铺满、压缩或内部滚动。
- 已批量处理静态抽屉表格容器：短表默认铺满抽屉宽度，8 列以上复杂表默认只在表格容器内滚动。
- 已补动态抽屉表格兜底：`quote-cost-table`、`custom-quote-version-table` 这类 JS 注入表格使用专属语义样式，不靠静态扫描遗漏。
- 已对高风险 P0 做第一批结构处理：代理入库从 7 列合并为 5 列，渠道发布从 6 列合并为 5 列，专列铺位规则从 7 列合并为 5 列。
- 已对第二批 P0/P1 做语义收敛：供应商最低利润率从重复 4 列改为标准 2 列；退改规则、供应商准入材料、签证档案表、认款核销明细取消旧 `min-width` 冲突并补业务列宽。
- 已对销售与履约核对表补语义覆盖：订单阶段收款、收款记录、批量应收、OTA认款、履约成本短表取消旧最小宽度；宽明细表保留表格内部滚动。
- 已完成旧样式冲突扫描：已套统一类的抽屉表格中，仍存在旧 `min-width` 且未被统一尾部覆盖的语义类为 0。
- 已复核 6-7 列且带按钮/控件的紧凑表：签证档案、佣金政策、团期成本类表已全部落到专属语义类覆盖，不再依赖默认列宽。
- 复杂配置类抽屉不强行硬压：佣金政策、手工认款、付款申请、团期订单、履约成本等保留业务必要列宽，通过语义类设置内部滚动和关键短值宽度。
- 后续同类问题按“先合并低频列，再套统一类，最后只对明确业务表格补语义宽度”的顺序改，不再逐截图、逐按钮硬改。

## 逐抽屉方案

### 渠道中心

- `merchant/channel/commission_rules.html:151` 新增佣金政策 `ruleDrawer`：P0，C/B。7 列且 18 个控件，先把“是否参与计算/结算前置”压成开关短列，“平台留存方式/销售方应得”保留固定宽，必要时拆成“款项口径”和“结算设置”两张短编辑表。
- `merchant/channel/commission_rules.html:419` 适用对象 `objectDrawer`：P1，A/B。两个 5 列选择表，表格铺满，首列复选框固定 40px，当前政策列固定 120px，其余列按对象名吸收。
- `merchant/channel/commission_rules.html:512` 佣金政策详情 `ruleDetailDrawer`：P1，C。4 张表，保留 drawer-xl；每张表补 colgroup，第三张 6 列“款项明细”如超宽允许表内横滚，其他表按 A 处理。
- `merchant/channel/distribution-orders.html:136` 分销台账详情 `orderDetailDrawer`：P2，A。4 列节点表，按 22/34/28/16 分配，状态列固定短宽。
- `merchant/channel/distribution-reconciliation.html:124` 分销对账详情 `reconcileDetailDrawer`：P1，A。5 列核对表，差异列固定 90-110px，两个口径列等宽，项目列吸收。
- `merchant/channel/distributors.html:126` 分销渠道详情 `distributorDetailDrawer`：P1，D。6 张表不应全按同一宽表样式；保持详情抽屉，按授权、佣金、账户、人员、订单、对账分区/Tab，每张表补 colgroup，订单/对账表可表内滚动。
- `merchant/channel/distributors.html:462` 佣金规则 `commissionApplyDrawer`：P1，A。5 列规则表，规则名称列吸收，状态列固定 90px。
- `merchant/channel/ota_reconcile.html:97` 平台对账详情 `reconcileDrawer`：P1，A。5 列核对表，同分销对账规则，差异列固定短宽。

### 客户与会员

- `merchant/customer/member-rules.html:114` 发布记录 `releaseRecordDrawer`：P2，A。4 列日志表，时间 150px、结果 90px，其余铺满。

### 财务中心

- `merchant/finance/finance-advance-receipts.html:269` 预收详情 `advanceDetailDrawer`：P1，A。3 张 5 列承接表，保持宽抽屉但表格铺满；“处理入口”固定 96px，业务信息列吸收。
- `merchant/finance/finance-channel-settlement.html:201` 渠道结算详情 `channelDrawer`：P1，D。5 张表，第一张 6 列订单表按 C，其他 4-5 列按 A；用分区/Tab 降低同屏堆叠。
- `merchant/finance/finance-control.html:41` 财务处理 `detailDrawer`：P2，A。4 列日志表，补固定列宽。
- `merchant/finance/finance-fund-pool.html:148` 资金明细 `fundDrawer`：P1，A。两张 4-5 列表，金额列固定 120px，状态/下一步列固定 90-110px。
- `merchant/finance/finance-fund-pool.html:183` 同步账户余额 `syncDrawer`：P2，A。4 列结果表，差异列固定，后续处理列固定 120px。
- `merchant/finance/finance-invoice.html:279` 发票详情 `invoiceDetailDrawer`：P1，A。两张 4 列表，入口列固定 96px，来源/凭证列吸收。
- `merchant/finance/finance-matching.html:69` 复核认款 `reviewDrawer`：P0，C。7 列金额核对表，保留 drawer-xl；订单/项目列吸收，金额列统一 110-120px，差额列固定 100px，禁止裁切金额。
- `merchant/finance/finance-matching.html:91` 认款详情 `detailDrawer`：P0，C。第一张同复核认款；日志表按 A。
- `merchant/finance/finance-payable.html:348` 应付详情 `payableDetailDrawer`：P1，D。6 张表，保持宽抽屉/Tab；费用明细 6 列按 C，其他承接/日志表按 A。
- `merchant/finance/finance-payable.html:464` 应付处理 `payableWorkDrawer`：P2，A。3 列核对表，项目列 30%，当前值/结果均分。
- `merchant/finance/finance-payment-apply.html:325` 付款申请详情 `applyDetailDrawer`：P1，A。4 张 4-5 列表，入口列固定 96px，单据号列完整显示。
- `merchant/finance/finance-payment-apply.html:416` 付款申请处理 `applyWorkDrawer`：P2，A。3 列处理表，补 colgroup。
- `merchant/finance/finance-payment-return.html:300` 退回详情 `paymentReturnDetailDrawer`：P1，A。3 张 5 列表，入口列固定 96px，金额列 110px。
- `merchant/finance/finance-payment.html:334` 付款详情 `paymentDetailDrawer`：P1，D。5 张表，校验项表按 A，其余单据/异常/凭证表按 A/C；保持宽抽屉并按分区控制间距。
- `merchant/finance/finance-payment.html:435` 执行付款 `paymentWorkDrawer`：P2，A。3 列依据表，补固定列宽。
- `merchant/finance/finance-period-close.html:228` 关账详情 `periodDetailDrawer`：P1，D。5 张检查表，全部 4-5 列，建议统一成检查项组件表，入口/状态列固定。
- `merchant/finance/finance-predeposit.html:171` 账户详情 `accountDrawer`：P1，D。4 张 6 列表，保持宽抽屉，金额/状态/操作列固定，流水表可表内横滚。
- `merchant/finance/finance-prepayment-offset.html:310` 预付详情 `prepaymentDetailDrawer`：P1，A。5 张 4-5 列表，入口/状态/金额列固定。
- `merchant/finance/finance-receivable.html:92` 应收详情 `detailDrawer`：P2，A。两张 4-5 列表，认款金额列固定，日志表固定时间列。
- `merchant/finance/finance-refund-execute.html:219` 退款详情 `refundDetailDrawer`：P1，D。5 张表，第一/三/四张 6 列按 C，校验和日志按 A；状态/NC 列不可裁切。
- `merchant/finance/finance-refund-execute.html:344` 执行退款 `refundExecuteDrawer`：P2，A。3 列表，补 colgroup。
- `merchant/finance/finance-remittance.html:346` 回单详情 `remittanceDetailDrawer`：P1，D。6 张表，保持宽抽屉，核对表金额列等宽，文件/日志表按 A。
- `merchant/finance/finance-remittance.html:457` 回单处理 `remittanceWorkDrawer`：P2，A。4 列核对表，系统/回单口径等宽。
- `merchant/finance/finance-settlement-adjustment.html:263` 调整详情 `adjustmentDetailDrawer`：P1，A。3 张 4 列表，金额影响列固定 120px，入口列固定。
- `merchant/finance/finance-settlement.html:285` 结算详情 `settlementDetailDrawer`：P1，D。4 张表，成本项 7 列按 C，差异表按 C，环节表按 A；建议分收入/成本/差异/凭证 Tab。
- `merchant/finance/finance-store-reconciliation.html:257` 对账详情 `reconDetailDrawer`：P1，A。4 张 4-5 列表，入口列固定，金额列统一。
- `merchant/finance/finance-supplier-bills.html:344` 账单详情 `billDetailDrawer`：P1，D。6 张表，保持宽抽屉；账单挂接、核对、应付表补 colgroup，日志表按 A。
- `merchant/finance/finance-supplier-bills.html:455` 账单处理 `billWorkDrawer`：P2，A。4 列差异表，供应商/系统成本等宽，差异列固定。
- `merchant/finance/finance-transfer-records.html:280` 转款详情 `transferDetailDrawer`：P1，A。4 张 4-5 列表，单据号/金额/入口列固定。
- `merchant/finance/receipts.html:103` 导入流水 `importDrawer`：P1，A。5 列预览表，流水号/付款方可省略，到账金额和重复校验固定。
- `merchant/finance/receipts.html:141` 到账流水详情 `detailDrawer`：P2，A。4 列日志表，补 colgroup。

### 营销中心

- `merchant/marketing/miniapp-pages.html:91` 版本记录 `systemVersionDrawer`：P2，A。4 列版本表，版本/状态/维护人短列固定，更新时间 150px。

### 产品中心

- `merchant/product/product-market.html:406` 代理入库 `agencyConfirmModal`：P0，C。7 列选择表应压成 5 列：选择、供应安排、出发/回团、结算价/库存、报名截止/本次代理；表格铺满原抽屉或 drawer-lg，不横向滚动。
- `merchant/product/product-market.html:476` 下线管理 `stopSaleManagerModal`：P1，A。5 列表，操作列固定 88-96px，产品列吸收。
- `merchant/product/product-outsource-detail.html:154` 代理团期详情 `scheduleDetailDrawer`：P2，A。4 列订单表，订单号列固定，客户/渠道吸收。
- `merchant/product/product-outsource-schedules.html:127` 设置定价 `schedulePriceDrawer`：P0，E。已按新规则修正；保留 640px 原抽屉、表格 100%、四列固定、控件随列压缩，后续仅做视觉复核。
- `merchant/product/product-outsource-schedules.html:169` 代理团期详情 `scheduleDetailDrawer`：P2，A。同代理产品详情订单表。
- `merchant/product/products.html:508` AI智能建品 `aiUploadDrawer`：P2，A。3 列识别结果表，写入位置列吸收，状态列固定。
- `merchant/product/products.html:561` 渠道发布 `channelPublishDrawer`：P0，B/C。6 列且 6 个控件，先合并“授权/开售”为状态短列，“价格口径/名额口径”保留输入列；控件宽度压缩并补 colgroup。

### 资源中心

- `merchant/resource/refund-rules.html:144` 退改规则详情 `ruleDrawer`：P0，B。两张编辑表且 31 个控件，拆成“扣损规则”和“费用科目”两个短表；每张补 colgroup，操作列固定 64-80px。
- `merchant/resource/resource-cruise-routes.html:83` 邮轮模板 `routeDrawer`：P0，B。5 列 16 个控件，舱型列吸收，入住/儿童列固定短宽，select/input 不得撑列。
- `merchant/resource/resource-cruise-ships.html:72` 船只维护 `shipDrawer`：P0，B。5 列 20 个控件，同邮轮模板；第三/第四人列合并为“加床规则”可进一步降列。
- `merchant/resource/resource-train-routes.html:73` 专列模板 `trainDrawer`：P0，C/B。7 列 28 个控件，建议拆成“车厢铺位”和“售卖规则”两张表；若保留 7 列必须 drawer-xl + 表格内滚动。
- `merchant/resource/suppliers.html:165` 供应商准入申请 `supplierDrawer`：P0，B。5 列 12 个控件，材料类型/备注列吸收，文件/有效期列固定，上传控件压缩。
- `merchant/resource/suppliers.html:499` 供应商设置 `supplierSettingsDrawer`：P0，B。两张 5 列配置表，第一张存在重复“产品线”表头，应先修正字段，再补列宽。
- `merchant/resource/visa-library.html:404` 签证档案详情 `visaDetailDrawer`：P0，C/B。3 张表，第一/二/三张均含操作和控件，保持 drawer-xl；操作列固定，材料要求列允许换行，不横向撑破。

### 销售中心

- `merchant/sales/booking.html:97` 新建订单 `bookingDrawer`：P2，A。4 列团期选择表，操作列固定，团号/日期列完整。
- `merchant/sales/call-center/intents.html:197` 电销意向跟进 `followDrawer`：P2，A。4 列跟进记录表，时间列固定。
- `merchant/sales/orders-detail.html:334` 项目结算承接 `projectSettlementDrawer`：P2，A。4 列承接表，操作列固定。
- `merchant/sales/orders.html:602` 选择目标对象 `orderAfterSalesSelectorDrawer`：P1，A。4 列选择表，目标对象列吸收，操作列固定。
- `merchant/sales/orders.html:630` 订单详情 `orderChainDrawer`：P1，D。3 张 5 列链路表，保持宽抽屉；下游动作/NC影响列固定，长说明进详情或换行。
- `merchant/sales/orders.html:732` 成本确认 `purchaseBatchDrawer`：P1，A。5 列成本表，金额/状态列固定，确认号列完整。
- `merchant/sales/orders.html:781` 登记阶段收款 `orderCollectionDrawer`：P1，C。两张 6 列表，收款节点/金额列等宽，流水/支付单号可合并主辅两行。
- `merchant/sales/orders.html:1000` 订单应收 `orderReceivableDrawer`：P1，C。6 列应收表，金额三列等宽，财务状态固定。
- `merchant/sales/orders.html:1125` 批量添加应收 `batchReceivableDrawer`：P0，C。7 列批量表，订单/客户合并，已收/收款状态合并，保留 5-6 列后铺满。
- `merchant/sales/payment-claim.html:317` OTA认款 `otaClaimDrawer`：P1，C。6 列匹配表，金额/佣金/退款列固定，订单列吸收。
- `merchant/sales/payment-claim.html:403` 添加认款 `manualClaimDrawer`：P0，D/B。两张 9 列选择/认款表，不能放普通抽屉内硬塞；改为宽抽屉 + 表格内滚动，首列复选固定，金额列统一宽度，认款金额输入列固定。
- `merchant/sales/store/predeposit.html:114` 预存余额详情 `accountDrawer`：P1，D。4 张 6 列表，保持宽抽屉，金额/状态列固定，操作列固定。
- `merchant/sales/store/predeposit.html:170` 余额明细 `balanceDrawer`：P1，C。两张 6-7 列表，建议按流水/扣款 Tab 分表；操作列固定。
- `merchant/sales/store/reconciliation.html:121` 门店对账详情 `reconcileDrawer`：P1，C。3 张 5-6 列表，金额/状态列固定，单据列吸收。

### 系统设置

- `merchant/system/staff-management.html:295` 员工任职详情 `data-staff-view-modal`：P1，A。两张 5 列表，日期列固定 120px，状态/规则列固定。

### 履约中心

- `merchant/tour/fulfillment-cost.html:185` 批量成本维护 `batchCostDrawer`：P1，A。5 列结果表，处理结果/预计变化列固定。
- `merchant/tour/fulfillment-cost.html:240` 成本明细维护 `scheduleCostDrawer`：P0，E/C。已有 colgroup 但 8 列含控件，需复核控件宽度；建议拆“数量/金额/汇率”与“说明”或允许表内滚动。
- `merchant/tour/fulfillment-cost.html:311` 单据详情 `settlementBasisDrawer`：P0，D。9 张表、最高 14 列，应改为摘要 + Tab；收入/成本等 8-14 列明细只允许表格容器内横滚，操作列固定。
- `merchant/tour/fulfillment-cost.html:475` 批量申请付款 `batchPaymentDrawer`：P1，C。6 列表，付款对象/成本项可主辅合并，拆单原因列允许换行。
- `merchant/tour/fulfillment-cost.html:514` 申请付款 `paymentApplyDrawer`：P0，C。8 列选择表，保留宽抽屉，首列选择固定，金额列统一，线路/项目和费用项目合并。
- `merchant/tour/fulfillment-cost.html:579` 付款申请详情 `paymentViewDrawer`：P1，C。7 列表，金额列统一，线路/项目列吸收或主辅。
- `merchant/tour/resource-procurement-inventory.html:206` 交通采购合同详情 `detailDrawer`：P0，D。8 张表、最高 10 列，必须改为摘要 + Tab；舱位、分配、名单等宽表表内滚动，付款/损耗等短表按 A。
- `merchant/tour/resource-procurement-inventory.html:453` 分配到团期 `allocationDrawer`：P0，C。6 列选择表，资源/规格合并，分配数字列固定，校验结果列固定。
- `merchant/tour/resource-procurement-inventory.html:769` 名单出票/确认 `ticketDrawer`：P1，A。5 列名单表，PNR/票号列吸收，状态列固定。
- `merchant/tour/schedules-detail.html:790` 成本结算摘要 `costModal`：P1，C。两张 6-7 列表，保持 drawer-lg，金额列统一，状态列固定。
- `merchant/tour/schedules-detail.html:1082` 订单占用记录 `trafficOrderDrawer`：P1，C。6 列表，操作列固定，状态列固定，游客/订单主辅合并。
- `merchant/tour/schedules-detail.html:1117` 出票/确认处理 `trafficTicketDrawer`：P1，A。5 列表，PNR/票号列吸收。
- `merchant/tour/schedules-detail.html:1338` 业财单据详情 `financeDocDrawer`：P2，A。5 列节点表，时间列固定，结果列吸收。
- `merchant/tour/schedules.html:720` 成本摘要 `costModal`：P1，C。6 列成本表，备注列可换行，金额列固定。
- `merchant/tour/schedules.html:800` 团期订单概览 `scheduleOrderDrawer`：P0，D。9 列订单表不应硬塞；改为订单主信息 + 收款/名单/资源状态合并，降到 6 列或宽抽屉表内滚动。
- `merchant/tour/schedules.html:857` 新建团期 `batchScheduleDrawer`：P1，A。5 列批量预览表，操作列固定，输入列后续若增加控件按 B。
- `merchant/tour/schedules.html:1453` 团期定价 `schedulePriceDrawer`：P1，A。两张 4 列表，模块/渠道列吸收，操作列固定。
- `merchant/tour/schedules.html:1567` 资源确认 `scheduleResourceDrawer`：P0，C。7 列表，线路资源/本次确认可主辅合并，成本/应付和操作列固定。
- `merchant/tour/schedules.html:1609` 名单管理 `executionRosterDrawer`：P0，D。8 列名单表，改为宽抽屉或名单详情入口；短值列固定，操作列固定。
- `merchant/tour/schedules.html:1632` 证件/签证 `executionDocumentsDrawer`：P0，C。7 列表，资料状态/缺失项/操作固定，游客订单主辅合并。
- `merchant/tour/visa-processing.html:106` 签证办理 `visaProcessDrawer`：P2，A。4 列材料表，材料列固定，要求列吸收，审核结果列固定。

### 管理端与供应商端

- `admin/ai/prompts.html:128` 新增模板 `promptDrawer`：P2，A。4 列变量表，必填开关列固定 90px。
- `supplier/schedule-detail.html:719` 成本维护 `costModal`：P0，B/C。7 列且 8 个控件，数量/单价/小计固定，备注列可换行，操作列固定；必要时 drawer-lg 表内滚动。
- `supplier/schedule-detail.html:1107` 业财单据详情 `financeDocDrawer`：P2，A。5 列节点表，同商户端。
- `supplier/settlements.html:95` 确认供应商账单 `settlementDrawer`：P1，A。5 列订单表，结算价/状态列固定，客人列吸收。

## 动态注入抽屉表格

- `merchant/tour/product-custom-list.html:listQuickActionModal` 报价工作台 `quote-workbench`：P1，A。报价版本表 5 列，操作列固定，报价/成本列可主辅。
- `demand-confirm` 生成需求确认单：P2，A。2 列确认项表，左列 120px，右列吸收。
- `sales-confirm` 确认报价：P2，A。2 列确认项表，套同一 `quote-cost-table-compact`。
- `lock-quote` 锁定报价：P2，A/B。2 列确认表 + 表单，表格铺满，表单不与表格挤压。
- `quote-approval` 发起报价审批：P2，A。2 列审批项表。
- `download-quote` 下载报价单：P2，A。2 列文件表。
- `order-contract` 订单合同：P1，A。4 列对象表，入口列固定 96px，编号列固定 150px。
- `execution-workbench` 执行处理：P1，A。3 列执行域表，入口列固定 110px。
- `travel-notice` 生成出团通知：P2，A。2 列通知内容表。
- `confirm-cost` 成本确认：P2，A。3 列成本域表。
- `return-settlement` 回团结算：P1，A。3 列检查项表，入口列固定 110px。
- `view-settlement` 查看结算：P1，A。3 列对象结果表，入口列固定。

## 批量落地顺序

1. 先改 P0：产品市场代理入库、渠道发布、资源模板/供应商配置、手工认款、团期/成本/交通采购等有输入或 7 列以上的抽屉。
2. 再改 P1：财务详情、渠道详情、销售订单链路、履约详情等中复杂核对抽屉。
3. 最后改 P2：日志、版本、节点记录等短表，统一补 colgroup 和固定列宽即可。

## 验收标准

- 表格右边界与抽屉正文右边界对齐，不出现大片空白。
- 不裁切表头、状态、金额、按钮、select 箭头和输入框内容。
- 普通短表没有横向滚动；复杂宽表的滚动只发生在表格容器内。
- 输入框和选择器不会把列撑破。
- 多张表之间保持标准分区间距，不用分隔线堆层级。
