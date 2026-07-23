# 页面内容路由规范审计

审计时间：2026-07-23T09:45:44.597Z

## 汇总

- 审计后台页面：186
- 可直接接入：96
- 阻断问题：54
- 高风险：28
- 中风险：8
- 排除页面：4

## 判定标准

- blocker：不满足后台内容页基本结构，必须先修正。
- high：能加载但无刷新路由后很可能触发整页跳转或初始化失败。
- medium：需要人工确认或做轻量改造，不一定阻断首批接入。
- ready：当前规则下可直接接入内容路由。

## 页面明细

| 状态 | 页面 | 问题 |
| --- | --- | --- |
| blocker | merchant/approval/approvals.html | [blocker]:83 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:114 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/customer/enterprise-list.html | [high]:234 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:139 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/customer/member-rule-config.html | [high]:193 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:74 操作单元格必须使用 .table-action 统一结构；[blocker]:75 操作单元格必须使用 .table-action 统一结构；[blocker]:76 操作单元格必须使用 .table-action 统一结构；[blocker]:77 操作单元格必须使用 .table-action 统一结构；[blocker]:78 操作单元格必须使用 .table-action 统一结构；[blocker]:74 操作单元格必须使用 .table-action 统一结构；[blocker]:75 操作单元格必须使用 .table-action 统一结构；[blocker]:76 操作单元格必须使用 .table-action 统一结构；[blocker]:77 操作单元格必须使用 .table-action 统一结构；[blocker]:78 操作单元格必须使用 .table-action 统一结构；[blocker]:37 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:43 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:74 操作单元格必须使用 .table-action 统一结构；[blocker]:75 操作单元格必须使用 .table-action 统一结构；[blocker]:76 操作单元格必须使用 .table-action 统一结构；[blocker]:77 操作单元格必须使用 .table-action 统一结构；[blocker]:78 操作单元格必须使用 .table-action 统一结构；[blocker]:74 操作单元格必须使用 .table-action 统一结构；[blocker]:75 操作单元格必须使用 .table-action 统一结构；[blocker]:76 操作单元格必须使用 .table-action 统一结构；[blocker]:77 操作单元格必须使用 .table-action 统一结构；[blocker]:78 操作单元格必须使用 .table-action 统一结构；[blocker]:47 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:52 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:74 操作单元格必须使用 .table-action 统一结构；[blocker]:75 操作单元格必须使用 .table-action 统一结构；[blocker]:76 操作单元格必须使用 .table-action 统一结构；[blocker]:77 操作单元格必须使用 .table-action 统一结构；[blocker]:78 操作单元格必须使用 .table-action 统一结构；[blocker]:59 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:66 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:73 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:79 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:86 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:93 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/customer/member-rules.html | [high]:187 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:62 更多菜单中的危险项必须放在菜单底部；[blocker]:117 操作单元格必须使用 .table-action 统一结构；[blocker]:117 操作单元格必须使用 .table-action 统一结构；[blocker]:117 操作单元格必须使用 .table-action 统一结构；[blocker]:117 操作单元格必须使用 .table-action 统一结构；[blocker]:41 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:82 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-advance-receipts.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:203 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-control.html | [high]:573 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:112 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-invoice.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[high]:741 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:218 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-payable.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:246 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-payment-apply.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:226 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-payment-management.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:149 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-payment-return.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:222 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-payment.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[high]:805 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:237 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-period-close.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:175 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-pre-receipts.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:140 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-predeposit.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css |
| blocker | merchant/finance/finance-prepayment-offset.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[high]:802 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:236 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-refund-execute.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:204 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-refund-transfer.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:128 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-remittance.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:238 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-reports.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[high]:499 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| blocker | merchant/finance/finance-settlement-adjustment.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[high]:707 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:211 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-settlement.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[high]:825 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:829 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:212 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-store-reconciliation.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[high]:669 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:673 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:189 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-supplier-bills.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:248 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/finance/finance-transfer-records.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:209 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/marketing/campaigns.html | [high]:297 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:142 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/marketing/coupons.html | [high]:169 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:66 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/marketing/issue-center.html | [high]:109 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:65 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/marketing/issue-detail.html | [blocker]:31 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:31 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:41 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:41 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-departure-config.html | [blocker]:81 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:91 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:101 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:111 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:121 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:131 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/product/product-destination-config.html | [blocker]:79 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:88 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:97 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:106 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:115 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:124 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:133 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:142 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:151 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:160 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:169 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:178 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/product/product-free-travel-list.html | [high]:482 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:481 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[blocker]:96 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:113 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-market.html | [blocker]:233 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-outsource-schedules.html | [blocker]:120 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-pricing.html | [blocker]:82 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:855 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:855 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:874 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:874 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:888 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:888 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:904 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:904 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:921 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:921 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:942 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:942 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-schedules.html | [medium]:11 引用页面额外脚本 ../../shared/schedule-route-catalog.js，需要确认可重复初始化；[blocker]:118 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/products.html | [high]:999 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1439 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:998 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:1438 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[blocker]:369 操作单元格必须使用 .table-action 统一结构；[blocker]:380 操作单元格必须使用 .table-action 统一结构；[blocker]:391 操作单元格必须使用 .table-action 统一结构；[blocker]:402 操作单元格必须使用 .table-action 统一结构；[blocker]:413 操作单元格必须使用 .table-action 统一结构；[blocker]:369 操作单元格必须使用 .table-action 统一结构；[blocker]:380 操作单元格必须使用 .table-action 统一结构；[blocker]:391 操作单元格必须使用 .table-action 统一结构；[blocker]:402 操作单元格必须使用 .table-action 统一结构；[blocker]:413 操作单元格必须使用 .table-action 统一结构；[blocker]:578 操作单元格必须使用 .table-action 统一结构；[blocker]:579 操作单元格必须使用 .table-action 统一结构；[blocker]:580 操作单元格必须使用 .table-action 统一结构；[blocker]:581 操作单元格必须使用 .table-action 统一结构；[blocker]:259 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:369 操作单元格必须使用 .table-action 统一结构；[blocker]:380 操作单元格必须使用 .table-action 统一结构；[blocker]:391 操作单元格必须使用 .table-action 统一结构；[blocker]:402 操作单元格必须使用 .table-action 统一结构；[blocker]:413 操作单元格必须使用 .table-action 统一结构；[blocker]:578 操作单元格必须使用 .table-action 统一结构；[blocker]:579 操作单元格必须使用 .table-action 统一结构；[blocker]:580 操作单元格必须使用 .table-action 统一结构；[blocker]:581 操作单元格必须使用 .table-action 统一结构；[blocker]:333 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/resource/refund-rules.html | [blocker]:200 操作单元格必须使用 .table-action 统一结构；[blocker]:201 操作单元格必须使用 .table-action 统一结构；[blocker]:202 操作单元格必须使用 .table-action 统一结构；[blocker]:203 操作单元格必须使用 .table-action 统一结构；[blocker]:218 操作单元格必须使用 .table-action 统一结构；[blocker]:219 操作单元格必须使用 .table-action 统一结构；[blocker]:220 操作单元格必须使用 .table-action 统一结构；[blocker]:137 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/resource/suppliers.html | [blocker]:159 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/resource/visa-library.html | [blocker]:397 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/booking.html | [high]:2521 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2527 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2532 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2535 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2541 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2520 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:2526 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:2534 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:2540 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[medium]:2539 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器；[blocker]:63 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:94 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/call-center/consultants.html | [blocker]:99 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:99 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:108 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:108 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:117 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:117 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:126 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:126 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:135 操作列直露动作不能超过 3 个，低频动作必须进入更多 |
| blocker | merchant/sales/call-center/performance.html | [blocker]:103 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:125 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:130 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:141 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:146 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:157 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/contract-templates.html | [blocker]:138 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/contracts.html | [blocker]:163 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/orders-after-sales.html | [blocker]:65 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:113 危险操作“撤回”不能直露，必须放入更多菜单底部 |
| blocker | merchant/sales/orders.html | [high]:2074 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:4548 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:4604 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:4630 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2073 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:4627 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[blocker]:169 操作单元格必须使用 .table-action 统一结构；[blocker]:181 操作单元格必须使用 .table-action 统一结构；[blocker]:196 操作单元格必须使用 .table-action 统一结构；[blocker]:211 操作单元格必须使用 .table-action 统一结构；[blocker]:226 操作单元格必须使用 .table-action 统一结构；[blocker]:241 操作单元格必须使用 .table-action 统一结构；[blocker]:256 操作单元格必须使用 .table-action 统一结构；[blocker]:271 操作单元格必须使用 .table-action 统一结构；[blocker]:286 操作单元格必须使用 .table-action 统一结构；[blocker]:301 操作单元格必须使用 .table-action 统一结构；[blocker]:316 操作单元格必须使用 .table-action 统一结构；[blocker]:331 操作单元格必须使用 .table-action 统一结构；[blocker]:346 操作单元格必须使用 .table-action 统一结构；[blocker]:361 操作单元格必须使用 .table-action 统一结构；[blocker]:376 操作单元格必须使用 .table-action 统一结构；[blocker]:2793 操作单元格必须使用 .table-action 统一结构；[blocker]:385 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:2776 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:2797 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:4030 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:4034 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/store/detail.html | [blocker]:91 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:101 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:102 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:111 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:132 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:141 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:142 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:150 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:170 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:180 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:181 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:190 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:191 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:199 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:230 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:231 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:226 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:234 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:235 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:244 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:245 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:253 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:254 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:262 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:287 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:288 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:289 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:283 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:292 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:293 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:301 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:307 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:317 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/store/members.html | [blocker]:81 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:89 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:97 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:105 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:113 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:121 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/tour/fulfillment-cost.html | [blocker]:8 页面存在内联 style，必须迁移到 shared/style.css；[blocker]:94 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:146 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/tour/product-custom-list.html | [high]:1141 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1173 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1210 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1215 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1219 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:173 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/tour/resource-procurement-inventory.html | [blocker]:113 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/tour/schedules.html | [blocker]:10 body 第一个子元素必须是 shared/nav-merchant.js；[medium]:18 引用页面额外脚本 ../../shared/schedule-route-catalog.js，需要确认可重复初始化；[blocker]:148 操作单元格必须使用 .table-action 统一结构；[blocker]:165 操作单元格必须使用 .table-action 统一结构；[blocker]:182 操作单元格必须使用 .table-action 统一结构；[blocker]:199 操作单元格必须使用 .table-action 统一结构；[blocker]:216 操作单元格必须使用 .table-action 统一结构；[blocker]:233 操作单元格必须使用 .table-action 统一结构；[blocker]:250 操作单元格必须使用 .table-action 统一结构；[blocker]:267 操作单元格必须使用 .table-action 统一结构；[blocker]:284 操作单元格必须使用 .table-action 统一结构；[blocker]:294 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/tour/visa-processing.html | [blocker]:101 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| high | admin/org.html | [high]:764 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:762 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/agents.html | [high]:22 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/distribution-orders.html | [high]:339 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:342 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:346 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:351 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:335 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_exceptions.html | [high]:240 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:243 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:240 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_orders.html | [high]:50 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/ota_products.html | [high]:264 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:261 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_refunds.html | [high]:50 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/sync_logs.html | [high]:41 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-settlement-detail.html | [high]:307 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:304 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/marketing/campaign-edit.html | [high]:451 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/marketing/coupon-edit.html | [high]:276 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/marketing/issue-create.html | [high]:223 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/marketing/miniapp-pages.html | [high]:128 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/marketing/miniapp-templates.html | [high]:62 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:66 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/product/products-detail.html | [medium]:430 引用页面额外脚本 ../../shared/custom-inquiry-drawer.js，需要确认可重复初始化；[high]:1656 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/consultant/index.html | [high]:21 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-cancel.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-detail.html | [medium]:1859 引用页面额外脚本 ../../shared/order-visa-detail.js，需要确认可重复初始化；[high]:1796 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1804 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1795 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:1803 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由 |
| high | merchant/sales/orders-intent.html | [medium]:932 引用页面额外脚本 ../../shared/custom-inquiry-drawer.js，需要确认可重复初始化；[high]:1134 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1133 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由 |
| high | merchant/sales/orders-payment-transfer.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-refund.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-transfer.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/system/data-scope.html | [high]:26 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/system/role-assignment.html | [high]:26 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/fulfillment-payment-apply.html | [high]:26 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/fulfillment-supplier-fees.html | [high]:25 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/product-custom-inquiry-create.html | [high]:222 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/schedules-detail.html | [medium]:5702 引用页面额外脚本 ../../shared/schedule-visa-detail.js，需要确认可重复初始化；[high]:19 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:5174 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:5378 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| medium | merchant/customer/enterprise-detail.html | [medium]:95 引用页面额外脚本 ../../shared/custom-inquiry-drawer.js，需要确认可重复初始化 |
| medium | merchant/product/product-cruise-edit.html | [medium]:553 引用页面额外脚本 ../../shared/product-visa-config.js，需要确认可重复初始化 |
| medium | merchant/product/product-self-edit.html | [medium]:1589 引用页面额外脚本 ../../shared/product-visa-config.js，需要确认可重复初始化 |
| medium | merchant/product/product-study-edit.html | [medium]:819 引用页面额外脚本 ../../shared/product-visa-config.js，需要确认可重复初始化 |
| medium | merchant/product/product-train-edit.html | [medium]:562 引用页面额外脚本 ../../shared/product-visa-config.js，需要确认可重复初始化 |
| medium | merchant/sales/sales-product-quote.html | [medium]:344 引用页面额外脚本 ../../shared/custom-inquiry-drawer.js，需要确认可重复初始化 |
| medium | merchant/tour/product-custom-detail.html | [medium]:234 引用页面额外脚本 ../../shared/custom-quote-edit-drawer.js，需要确认可重复初始化 |
| medium | merchant/tour/team-create.html | [medium]:406 引用页面额外脚本 ../../shared/schedule-visa-config.js，需要确认可重复初始化 |
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
| ready | merchant/channel/commission_rules.html | 可直接纳入内容路由 |
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
| ready | merchant/finance/finance-channel-settlement.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-currency.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-fund-pool.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-matching.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-nc.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-receivable.html | 可直接纳入内容路由 |
| ready | merchant/finance/receipts.html | 可直接纳入内容路由 |
| excluded | merchant/login.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | merchant/marketing/marketing-analysis.html | 可直接纳入内容路由 |
| ready | merchant/marketing/miniapp-assets.html | 可直接纳入内容路由 |
| ready | merchant/marketing/miniapp-editor.html | 可直接纳入内容路由 |
| ready | merchant/product/product-channel-auth.html | 可直接纳入内容路由 |
| ready | merchant/product/product-competitor-price.html | 可直接纳入内容路由 |
| ready | merchant/product/product-cruise-routes.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-detail.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-list.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-package.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-quota.html | 可直接纳入内容路由 |
| ready | merchant/product/product-train-routes.html | 可直接纳入内容路由 |
| ready | merchant/resource/resource-airlines.html | 可直接纳入内容路由 |
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
| ready | merchant/resource/resource-train-trips.html | 可直接纳入内容路由 |
| ready | merchant/sales/call-center/intents.html | 可直接纳入内容路由 |
| ready | merchant/sales/consultant/detail.html | 可直接纳入内容路由 |
| ready | merchant/sales/contract-template-edit.html | 可直接纳入内容路由 |
| ready | merchant/sales/payment-claim.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/index.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/predeposit.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/reconciliation.html | 可直接纳入内容路由 |
| excluded | merchant/select-workspace.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | merchant/system/business-params.html | 可直接纳入内容路由 |
| ready | merchant/system/hr-requests.html | 可直接纳入内容路由 |
| ready | merchant/system/my-org.html | 可直接纳入内容路由 |
| ready | merchant/system/notice-templates.html | 可直接纳入内容路由 |
| ready | merchant/system/staff-management.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-notice.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-roster.html | 可直接纳入内容路由 |
| ready | merchant/tour/projects-detail.html | 可直接纳入内容路由 |
| ready | merchant/tour/projects.html | 可直接纳入内容路由 |
| ready | merchant/tour/schedules-calendar.html | 可直接纳入内容路由 |
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
