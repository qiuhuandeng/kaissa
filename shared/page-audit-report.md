# 页面内容路由规范审计

审计时间：2026-07-05T02:38:34.429Z

## 汇总

- 审计后台页面：150
- 可直接接入：116
- 阻断问题：14
- 高风险：20
- 中风险：0
- 排除页面：4

## 判定标准

- blocker：不满足后台内容页基本结构，必须先修正。
- high：能加载但无刷新路由后很可能触发整页跳转或初始化失败。
- medium：需要人工确认或做轻量改造，不一定阻断首批接入。
- ready：当前规则下可直接接入内容路由。

## 页面明细

| 状态 | 页面 | 问题 |
| --- | --- | --- |
| blocker | merchant/channel/commission_rules.html | [blocker]:92 操作文案“指定分销商”超过 4 个字，应缩短或放入更多；[blocker]:103 操作文案“指定分销商”超过 4 个字，应缩短或放入更多；[blocker]:114 操作文案“指定分销商”超过 4 个字，应缩短或放入更多；[blocker]:125 操作文案“指定分销商”超过 4 个字，应缩短或放入更多；[blocker]:136 操作文案“指定分销商”超过 4 个字，应缩短或放入更多 |
| blocker | merchant/finance/finance-settlement.html | [high]:433 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:68 操作文案“生成结算单”超过 4 个字，应缩短或放入更多 |
| blocker | merchant/finance/finance-transfer-records.html | [blocker]:45 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:96 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-departure-config.html | [blocker]:81 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:91 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:101 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:111 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:121 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:131 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/product/product-destination-config.html | [blocker]:76 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:85 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:94 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:103 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:112 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:121 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:130 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:139 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:148 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:157 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:166 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:175 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/product/product-free-travel-list.html | [high]:482 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:481 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[blocker]:96 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:113 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-pricing.html | [blocker]:135 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:195 操作文案“修改后提交”超过 4 个字，应缩短或放入更多；[blocker]:256 危险操作“撤回”不能直露，必须放入更多菜单底部 |
| blocker | merchant/product/product-single-orders.html | [blocker]:67 危险操作“暂停”不能直露，必须放入更多菜单底部；[blocker]:78 危险操作“暂停”不能直露，必须放入更多菜单底部；[blocker]:89 危险操作“暂停”不能直露，必须放入更多菜单底部；[blocker]:100 危险操作“暂停”不能直露，必须放入更多菜单底部；[blocker]:111 危险操作“暂停”不能直露，必须放入更多菜单底部 |
| blocker | merchant/sales/booking.html | [high]:949 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:952 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:958 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:948 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:957 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[medium]:956 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器；[blocker]:55 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:78 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/consultant/index.html | [blocker]:96 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:107 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:118 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:129 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:140 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:151 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/sales/orders.html | [high]:2826 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2881 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2878 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[blocker]:152 操作单元格必须使用 .table-action 统一结构；[blocker]:167 操作单元格必须使用 .table-action 统一结构；[blocker]:182 操作单元格必须使用 .table-action 统一结构；[blocker]:197 操作单元格必须使用 .table-action 统一结构；[blocker]:212 操作单元格必须使用 .table-action 统一结构；[blocker]:227 操作单元格必须使用 .table-action 统一结构；[blocker]:242 操作单元格必须使用 .table-action 统一结构；[blocker]:257 操作单元格必须使用 .table-action 统一结构；[blocker]:272 操作单元格必须使用 .table-action 统一结构；[blocker]:287 操作单元格必须使用 .table-action 统一结构；[blocker]:302 操作单元格必须使用 .table-action 统一结构；[blocker]:317 操作单元格必须使用 .table-action 统一结构；[blocker]:332 操作单元格必须使用 .table-action 统一结构 |
| blocker | merchant/sales/store/detail.html | [blocker]:66 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:74 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:90 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:100 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:101 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:109 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:127 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:136 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:137 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:145 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:169 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:179 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:184 操作单元格必须使用 .table-action 统一结构；[blocker]:185 操作单元格必须使用 .table-action 统一结构；[blocker]:180 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:189 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:190 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:198 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:218 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:219 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:214 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:222 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:223 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:231 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:232 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:240 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:260 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:261 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:262 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:256 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:265 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:266 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:274 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:296 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:305 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:306 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:316 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:317 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:324 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:332 操作单元格必须使用 .table-action 统一结构；[blocker]:333 操作单元格必须使用 .table-action 统一结构；[blocker]:334 操作单元格必须使用 .table-action 统一结构；[blocker]:328 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:337 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/tour/fulfillment-return.html | [blocker]:29 操作文案“查看结算单”超过 4 个字，应缩短或放入更多；[blocker]:30 操作文案“查看结算单”超过 4 个字，应缩短或放入更多 |
| blocker | merchant/tour/schedules.html | [blocker]:154 操作单元格必须使用 .table-action 统一结构；[blocker]:171 操作单元格必须使用 .table-action 统一结构；[blocker]:188 操作单元格必须使用 .table-action 统一结构；[blocker]:205 操作单元格必须使用 .table-action 统一结构；[blocker]:222 操作单元格必须使用 .table-action 统一结构；[blocker]:239 操作单元格必须使用 .table-action 统一结构；[blocker]:256 操作单元格必须使用 .table-action 统一结构；[blocker]:273 操作单元格必须使用 .table-action 统一结构；[blocker]:290 操作单元格必须使用 .table-action 统一结构 |
| high | admin/org.html | [high]:759 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:757 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/agents.html | [high]:22 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/distribution-orders.html | [high]:225 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:228 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:232 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:237 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:221 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_exceptions.html | [high]:224 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:227 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:224 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_orders.html | [high]:50 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/ota_products.html | [high]:251 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:248 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_refunds.html | [high]:50 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/sync_logs.html | [high]:41 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-payable.html | [high]:469 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-payment.html | [high]:534 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-reports.html | [high]:441 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-settlement-detail.html | [high]:307 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:304 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/product/products.html | [high]:643 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:918 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:642 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:917 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由 |
| high | merchant/sales/orders-cancel.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-payment-transfer.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-refund.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-transfer.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/fulfillment-payment-apply.html | [high]:25 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/fulfillment-supplier-fees.html | [high]:25 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/schedules-detail.html | [high]:19 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:3639 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:3660 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| ready | admin/ai/audit-log.html | 可直接纳入内容路由 |
| ready | admin/ai/cost-quota.html | 可直接纳入内容路由 |
| ready | admin/ai/model_routing.html | 可直接纳入内容路由 |
| ready | admin/ai/permission-policy.html | 可直接纳入内容路由 |
| ready | admin/ai/prompts.html | 可直接纳入内容路由 |
| ready | admin/ai/usage-stats.html | 可直接纳入内容路由 |
| ready | admin/audit.html | 可直接纳入内容路由 |
| ready | admin/dashboard.html | 可直接纳入内容路由 |
| ready | admin/employees.html | 可直接纳入内容路由 |
| ready | admin/interface.html | 可直接纳入内容路由 |
| ready | admin/merchant-roles.html | 可直接纳入内容路由 |
| ready | admin/org_company_modal.html | 可直接纳入内容路由 |
| ready | admin/params.html | 可直接纳入内容路由 |
| ready | admin/positions.html | 可直接纳入内容路由 |
| ready | admin/roles.html | 可直接纳入内容路由 |
| ready | admin/theme.html | 可直接纳入内容路由 |
| ready | merchant/ai/ai-assistant.html | 可直接纳入内容路由 |
| ready | merchant/ai/competitor.html | 可直接纳入内容路由 |
| ready | merchant/ai/route_parser.html | 可直接纳入内容路由 |
| ready | merchant/ai/travel_assistant.html | 可直接纳入内容路由 |
| ready | merchant/ai/visa_checker.html | 可直接纳入内容路由 |
| ready | merchant/approval/approval-product-review.html | 可直接纳入内容路由 |
| ready | merchant/approval/approvals.html | 可直接纳入内容路由 |
| ready | merchant/channel/distribution-reconciliation.html | 可直接纳入内容路由 |
| ready | merchant/channel/distributors.html | 可直接纳入内容路由 |
| ready | merchant/channel/ota_reconcile.html | 可直接纳入内容路由 |
| ready | merchant/channel/ota_shops.html | 可直接纳入内容路由 |
| ready | merchant/channel/sources.html | 可直接纳入内容路由 |
| ready | merchant/customer/customers-detail.html | 可直接纳入内容路由 |
| ready | merchant/customer/detail.html | 可直接纳入内容路由 |
| ready | merchant/customer/list.html | 可直接纳入内容路由 |
| ready | merchant/dashboard-group.html | 可直接纳入内容路由 |
| ready | merchant/dashboard-store.html | 可直接纳入内容路由 |
| ready | merchant/dashboard.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-currency.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-fund-pool.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-invoice.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-matching.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-nc.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-predeposit.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-receivable.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-refund-execute.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-remittance.html | 可直接纳入内容路由 |
| ready | merchant/finance/receipts.html | 可直接纳入内容路由 |
| excluded | merchant/login.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | merchant/product/product-channel-auth.html | 可直接纳入内容路由 |
| ready | merchant/product/product-competitor-price.html | 可直接纳入内容路由 |
| ready | merchant/product/product-cruise-edit.html | 可直接纳入内容路由 |
| ready | merchant/product/product-cruise-routes.html | 可直接纳入内容路由 |
| ready | merchant/product/product-market.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-detail.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-list.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-package.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-quota.html | 可直接纳入内容路由 |
| ready | merchant/product/product-self-edit.html | 可直接纳入内容路由 |
| ready | merchant/product/product-study-edit.html | 可直接纳入内容路由 |
| ready | merchant/product/product-study-products.html | 可直接纳入内容路由 |
| ready | merchant/product/product-train-edit.html | 可直接纳入内容路由 |
| ready | merchant/product/product-train-routes.html | 可直接纳入内容路由 |
| ready | merchant/product/products-detail.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-cruise-companies.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-cruise-routes.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-cruise-ships.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-flight-block.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-flight-routes.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-leader-schedule.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-masterdata.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-tour-leaders.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-train-operators.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-train-routes.html | 可直接纳入内容路由 |
| ready | merchant/resource/supplier-detail.html | 可直接纳入内容路由 |
| ready | merchant/resource/suppliers.html | 可直接纳入内容路由 |
| ready | merchant/sales/consultant/detail.html | 可直接纳入内容路由 |
| ready | merchant/sales/contracts.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-after-sales.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-detail.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-intent.html | 可直接纳入内容路由 |
| ready | merchant/sales/payment-claim.html | 可直接纳入内容路由 |
| ready | merchant/sales/sales-product-quote.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/index.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/predeposit.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/reconciliation.html | 可直接纳入内容路由 |
| excluded | merchant/select-workspace.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | merchant/system/business-params.html | 可直接纳入内容路由 |
| ready | merchant/system/data-scope.html | 可直接纳入内容路由 |
| ready | merchant/system/hr-requests.html | 可直接纳入内容路由 |
| ready | merchant/system/my-org.html | 可直接纳入内容路由 |
| ready | merchant/system/notice-templates.html | 可直接纳入内容路由 |
| ready | merchant/system/role-assignment.html | 可直接纳入内容路由 |
| ready | merchant/system/staff-management.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-cost.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-documents.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-notice.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-outbound.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-roster.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-visa.html | 可直接纳入内容路由 |
| ready | merchant/tour/product-custom-detail.html | 可直接纳入内容路由 |
| ready | merchant/tour/product-custom-list.html | 可直接纳入内容路由 |
| ready | merchant/tour/projects-detail.html | 可直接纳入内容路由 |
| ready | merchant/tour/projects.html | 可直接纳入内容路由 |
| ready | merchant/tour/schedules-batch.html | 可直接纳入内容路由 |
| ready | merchant/tour/schedules-calendar.html | 可直接纳入内容路由 |
| ready | merchant/tour/team-create.html | 可直接纳入内容路由 |
| excluded | merchant/workspace.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | operator/audit-logs.html | 可直接纳入内容路由 |
| ready | operator/companies.html | 可直接纳入内容路由 |
| ready | operator/components.html | 可直接纳入内容路由 |
| ready | operator/config-dict.html | 可直接纳入内容路由 |
| ready | operator/dashboard.html | 可直接纳入内容路由 |
| ready | operator/initialization.html | 可直接纳入内容路由 |
| excluded | operator/login.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | operator/merchants-detail.html | 可直接纳入内容路由 |
| ready | operator/merchants.html | 可直接纳入内容路由 |
| ready | operator/monitor.html | 可直接纳入内容路由 |
| ready | operator/packages.html | 可直接纳入内容路由 |
| ready | operator/reports-drill.html | 可直接纳入内容路由 |
| ready | operator/reports-finance.html | 可直接纳入内容路由 |
| ready | operator/reports-overview.html | 可直接纳入内容路由 |
| ready | operator/reports-sales.html | 可直接纳入内容路由 |
| ready | operator/templates.html | 可直接纳入内容路由 |
