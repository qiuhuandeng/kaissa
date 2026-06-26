# 页面内容路由规范审计

审计时间：2026-06-26T07:16:54.477Z

## 汇总

- 审计后台页面：101
- 可直接接入：101
- 阻断问题：0
- 高风险：0
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
| ready | merchant/ai/ai-assistant.html | 可直接纳入内容路由 |
| ready | merchant/ai/competitor.html | 可直接纳入内容路由 |
| ready | merchant/ai/model_routing.html | 可直接纳入内容路由 |
| ready | merchant/ai/prompts.html | 可直接纳入内容路由 |
| ready | merchant/ai/route_parser.html | 可直接纳入内容路由 |
| ready | merchant/ai/travel_assistant.html | 可直接纳入内容路由 |
| ready | merchant/ai/visa_checker.html | 可直接纳入内容路由 |
| ready | merchant/approval/approval-product-review.html | 可直接纳入内容路由 |
| ready | merchant/approval/approvals.html | 可直接纳入内容路由 |
| ready | merchant/channel/channel-commission.html | 可直接纳入内容路由 |
| ready | merchant/channel/channel-config.html | 可直接纳入内容路由 |
| ready | merchant/customer/customers-detail.html | 可直接纳入内容路由 |
| ready | merchant/customer/customers.html | 可直接纳入内容路由 |
| ready | merchant/dashboard-group.html | 可直接纳入内容路由 |
| ready | merchant/dashboard-store.html | 可直接纳入内容路由 |
| ready | merchant/dashboard.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-currency.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-invoice.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-matching.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-nc.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-payable.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-payment.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-receivable.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-refund-execute.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-remittance.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-reports.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-settlement-detail.html | 可直接纳入内容路由 |
| ready | merchant/finance/finance-settlement.html | 可直接纳入内容路由 |
| ready | merchant/finance/receipts.html | 可直接纳入内容路由 |
| excluded | merchant/login.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | merchant/product/product-channel-auth.html | 可直接纳入内容路由 |
| ready | merchant/product/product-competitor-price.html | 可直接纳入内容路由 |
| ready | merchant/product/product-cruise-routes.html | 可直接纳入内容路由 |
| ready | merchant/product/product-free-travel-list.html | 可直接纳入内容路由 |
| ready | merchant/product/product-market.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-list.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-package.html | 可直接纳入内容路由 |
| ready | merchant/product/product-outsource-quota.html | 可直接纳入内容路由 |
| ready | merchant/product/product-pricing.html | 可直接纳入内容路由 |
| ready | merchant/product/product-self-edit.html | 可直接纳入内容路由 |
| ready | merchant/product/product-single-orders.html | 可直接纳入内容路由 |
| ready | merchant/product/product-study-edit.html | 可直接纳入内容路由 |
| ready | merchant/product/product-study-products.html | 可直接纳入内容路由 |
| ready | merchant/product/product-study-tour-routes.html | 可直接纳入内容路由 |
| ready | merchant/product/product-train-routes.html | 可直接纳入内容路由 |
| ready | merchant/product/products-detail.html | 可直接纳入内容路由 |
| ready | merchant/product/products.html | 可直接纳入内容路由 |
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
| ready | merchant/sales/booking.html | 可直接纳入内容路由 |
| ready | merchant/sales/consultant/detail.html | 可直接纳入内容路由 |
| ready | merchant/sales/consultant/index.html | 可直接纳入内容路由 |
| ready | merchant/sales/contracts.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-after-sales.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-detail.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-intent.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-refund.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-transfer.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders.html | 可直接纳入内容路由 |
| ready | merchant/sales/payment-claim.html | 可直接纳入内容路由 |
| ready | merchant/sales/sales-product-quote.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/detail.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/index.html | 可直接纳入内容路由 |
| ready | merchant/sales/stores.html | 可直接纳入内容路由 |
| excluded | merchant/select-workspace.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | merchant/system/design-editor.html | 可直接纳入内容路由 |
| ready | merchant/system/design-pages.html | 可直接纳入内容路由 |
| ready | merchant/system/settings-roles.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-cost.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-documents.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-notice.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-outbound.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-payment-apply.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-return.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-roster.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-supplier-fees.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-visa.html | 可直接纳入内容路由 |
| ready | merchant/tour/product-custom-detail.html | 可直接纳入内容路由 |
| ready | merchant/tour/product-custom-list.html | 可直接纳入内容路由 |
| ready | merchant/tour/projects-detail.html | 可直接纳入内容路由 |
| ready | merchant/tour/projects.html | 可直接纳入内容路由 |
| ready | merchant/tour/schedules-calendar.html | 可直接纳入内容路由 |
| ready | merchant/tour/schedules-detail.html | 可直接纳入内容路由 |
| ready | merchant/tour/schedules.html | 可直接纳入内容路由 |
| excluded | operator/ant_design.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | operator/audit-logs.html | 可直接纳入内容路由 |
| ready | operator/companies.html | 可直接纳入内容路由 |
| ready | operator/components.html | 可直接纳入内容路由 |
| ready | operator/config-dict.html | 可直接纳入内容路由 |
| ready | operator/dashboard.html | 可直接纳入内容路由 |
| excluded | operator/login.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | operator/merchants-detail.html | 可直接纳入内容路由 |
| ready | operator/merchants.html | 可直接纳入内容路由 |
| ready | operator/packages.html | 可直接纳入内容路由 |
| ready | operator/templates.html | 可直接纳入内容路由 |
