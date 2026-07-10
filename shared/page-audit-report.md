# 页面内容路由规范审计

审计时间：2026-07-08T03:14:53.425Z

## 汇总

- 审计后台页面：153
- 可直接接入：108
- 阻断问题：21
- 高风险：24
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
| blocker | merchant/channel/commission_rules.html | [blocker]:90 操作单元格必须使用 .table-action 统一结构；[blocker]:101 操作单元格必须使用 .table-action 统一结构；[blocker]:112 操作单元格必须使用 .table-action 统一结构；[blocker]:123 操作单元格必须使用 .table-action 统一结构；[blocker]:134 操作单元格必须使用 .table-action 统一结构 |
| blocker | merchant/finance/finance-settlement.html | [high]:570 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[blocker]:80 操作文案“生成结算单”超过 4 个字，应缩短或放入更多 |
| blocker | merchant/finance/finance-transfer-records.html | [blocker]:45 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:96 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-departure-config.html | [blocker]:82 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:92 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:102 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:112 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:122 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:132 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/product/product-destination-config.html | [blocker]:80 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:89 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:98 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:107 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:116 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:125 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:134 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:143 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:152 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:161 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:170 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:179 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/product/product-free-travel-list.html | [high]:482 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:481 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[blocker]:96 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:113 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/product/product-outsource-quota.html | [blocker]:73 操作文案“已代理记录”超过 4 个字，应缩短或放入更多；[blocker]:84 操作文案“已代理记录”超过 4 个字，应缩短或放入更多；[blocker]:95 操作文案“已代理记录”超过 4 个字，应缩短或放入更多；[blocker]:106 操作文案“已代理记录”超过 4 个字，应缩短或放入更多；[blocker]:117 操作文案“已代理记录”超过 4 个字，应缩短或放入更多 |
| blocker | merchant/product/product-pricing.html | [blocker]:122 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:176 操作文案“修改后提交”超过 4 个字，应缩短或放入更多；[blocker]:231 危险操作“撤回”不能直露，必须放入更多菜单底部 |
| blocker | merchant/product/product-single-orders.html | [blocker]:67 危险操作“暂停”不能直露，必须放入更多菜单底部；[blocker]:78 危险操作“暂停”不能直露，必须放入更多菜单底部；[blocker]:89 危险操作“暂停”不能直露，必须放入更多菜单底部；[blocker]:100 危险操作“暂停”不能直露，必须放入更多菜单底部；[blocker]:111 危险操作“暂停”不能直露，必须放入更多菜单底部 |
| blocker | merchant/sales/booking.html | [high]:1231 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1237 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1242 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1245 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1251 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:1230 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:1236 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:1244 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:1250 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[medium]:1249 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器；[blocker]:55 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:78 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/call-center/consultants.html | [blocker]:111 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:111 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:123 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:123 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:135 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:135 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:147 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:147 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:159 操作列直露动作不能超过 3 个，低频动作必须进入更多 |
| blocker | merchant/sales/call-center/intents.html | [blocker]:128 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:128 操作文案“转意向订单”超过 4 个字，应缩短或放入更多；[blocker]:128 操作文案“转产品预订”超过 4 个字，应缩短或放入更多；[blocker]:139 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:139 操作文案“转意向订单”超过 4 个字，应缩短或放入更多；[blocker]:139 操作文案“转产品预订”超过 4 个字，应缩短或放入更多；[blocker]:150 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:150 操作文案“转意向订单”超过 4 个字，应缩短或放入更多；[blocker]:150 操作文案“转产品预订”超过 4 个字，应缩短或放入更多；[blocker]:161 操作列直露动作不能超过 3 个，低频动作必须进入更多；[blocker]:161 操作文案“转意向订单”超过 4 个字，应缩短或放入更多；[blocker]:161 操作文案“转产品预订”超过 4 个字，应缩短或放入更多 |
| blocker | merchant/sales/call-center/performance.html | [blocker]:103 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:125 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:130 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:141 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:146 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:157 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/contracts.html | [blocker]:126 操作单元格必须使用 .table-action 统一结构；[blocker]:137 操作单元格必须使用 .table-action 统一结构；[blocker]:148 操作单元格必须使用 .table-action 统一结构；[blocker]:159 操作单元格必须使用 .table-action 统一结构；[blocker]:170 操作单元格必须使用 .table-action 统一结构；[blocker]:181 操作单元格必须使用 .table-action 统一结构；[blocker]:192 操作单元格必须使用 .table-action 统一结构；[blocker]:203 操作单元格必须使用 .table-action 统一结构；[blocker]:214 操作单元格必须使用 .table-action 统一结构 |
| blocker | merchant/sales/orders.html | [high]:2849 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2904 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:2901 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[blocker]:164 操作单元格必须使用 .table-action 统一结构；[blocker]:179 操作单元格必须使用 .table-action 统一结构；[blocker]:194 操作单元格必须使用 .table-action 统一结构；[blocker]:209 操作单元格必须使用 .table-action 统一结构；[blocker]:224 操作单元格必须使用 .table-action 统一结构；[blocker]:239 操作单元格必须使用 .table-action 统一结构；[blocker]:254 操作单元格必须使用 .table-action 统一结构；[blocker]:269 操作单元格必须使用 .table-action 统一结构；[blocker]:284 操作单元格必须使用 .table-action 统一结构；[blocker]:299 操作单元格必须使用 .table-action 统一结构；[blocker]:314 操作单元格必须使用 .table-action 统一结构；[blocker]:329 操作单元格必须使用 .table-action 统一结构；[blocker]:344 操作单元格必须使用 .table-action 统一结构 |
| blocker | merchant/sales/payment-claim.html | [blocker]:111 操作单元格必须使用 .table-action 统一结构；[blocker]:121 操作单元格必须使用 .table-action 统一结构；[blocker]:131 操作单元格必须使用 .table-action 统一结构；[blocker]:141 操作单元格必须使用 .table-action 统一结构；[blocker]:151 操作单元格必须使用 .table-action 统一结构；[blocker]:161 操作单元格必须使用 .table-action 统一结构；[blocker]:171 操作单元格必须使用 .table-action 统一结构；[blocker]:181 操作单元格必须使用 .table-action 统一结构；[blocker]:191 操作单元格必须使用 .table-action 统一结构；[blocker]:202 操作单元格必须使用 .table-action 统一结构；[blocker]:212 操作单元格必须使用 .table-action 统一结构；[blocker]:222 操作单元格必须使用 .table-action 统一结构；[blocker]:232 操作单元格必须使用 .table-action 统一结构；[blocker]:242 操作单元格必须使用 .table-action 统一结构；[blocker]:252 操作单元格必须使用 .table-action 统一结构；[blocker]:263 操作单元格必须使用 .table-action 统一结构；[blocker]:273 操作单元格必须使用 .table-action 统一结构；[blocker]:283 操作单元格必须使用 .table-action 统一结构 |
| blocker | merchant/sales/store/detail.html | [blocker]:89 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:99 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:100 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:108 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:130 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:139 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:140 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:148 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:166 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:176 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:177 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:185 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:205 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:214 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:215 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:223 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:249 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:259 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:264 操作单元格必须使用 .table-action 统一结构；[blocker]:265 操作单元格必须使用 .table-action 统一结构；[blocker]:260 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:269 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:270 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:278 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:300 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:301 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:296 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:304 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:305 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:313 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:314 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:322 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:347 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:348 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:349 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:343 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:352 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:353 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:361 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:385 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:394 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:395 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:405 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:406 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:413 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:423 操作单元格必须使用 .table-action 统一结构；[blocker]:424 操作单元格必须使用 .table-action 统一结构；[blocker]:425 操作单元格必须使用 .table-action 统一结构；[blocker]:419 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:428 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/sales/store/index.html | [blocker]:108 操作单元格必须使用 .table-action 统一结构；[blocker]:119 操作单元格必须使用 .table-action 统一结构；[blocker]:130 操作单元格必须使用 .table-action 统一结构；[blocker]:141 操作单元格必须使用 .table-action 统一结构；[blocker]:152 操作单元格必须使用 .table-action 统一结构 |
| blocker | merchant/sales/store/members.html | [blocker]:96 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:107 危险操作“停用”不能直露，必须放入更多菜单底部；[blocker]:118 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:129 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:140 危险操作“撤回”不能直露，必须放入更多菜单底部；[blocker]:151 危险操作“停用”不能直露，必须放入更多菜单底部 |
| blocker | merchant/sales/store/operation.html | [blocker]:125 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:136 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点；[blocker]:141 列表表格必须使用 list-surface-table list-table-with-pagination 标准类；[blocker]:151 列表分页必须紧跟对应 table-wrap，作为表格 footer 同级节点 |
| blocker | merchant/tour/schedules.html | [blocker]:180 操作单元格必须使用 .table-action 统一结构；[blocker]:197 操作单元格必须使用 .table-action 统一结构；[blocker]:214 操作单元格必须使用 .table-action 统一结构；[blocker]:231 操作单元格必须使用 .table-action 统一结构；[blocker]:248 操作单元格必须使用 .table-action 统一结构；[blocker]:265 操作单元格必须使用 .table-action 统一结构；[blocker]:282 操作单元格必须使用 .table-action 统一结构；[blocker]:299 操作单元格必须使用 .table-action 统一结构；[blocker]:316 操作单元格必须使用 .table-action 统一结构 |
| high | admin/org.html | [high]:759 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:757 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/agents.html | [high]:22 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/distribution-orders.html | [high]:225 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:228 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:232 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:237 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:221 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_exceptions.html | [high]:224 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:227 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:224 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_orders.html | [high]:50 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/ota_products.html | [high]:251 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:248 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/channel/ota_refunds.html | [high]:50 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/channel/sync_logs.html | [high]:41 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-payable.html | [high]:545 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-payment.html | [high]:639 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-reports.html | [high]:441 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/finance/finance-settlement-detail.html | [high]:307 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[medium]:304 存在点击事件内硬跳转，表格行/卡片跳转应交给统一路由器 |
| high | merchant/product/products-detail.html | [high]:763 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/product/products.html | [high]:647 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:932 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:646 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由；[high]:931 页面存在 caesarNavigateTo 后备硬跳转，后台页面必须依赖共享导航脚本统一路由 |
| high | merchant/sales/consultant/index.html | [high]:21 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-cancel.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-payment-transfer.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-refund.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/sales/orders-transfer.html | [high]:15 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/system/data-scope.html | [high]:26 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/system/role-assignment.html | [high]:26 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/fulfillment-payment-apply.html | [high]:25 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/fulfillment-supplier-fees.html | [high]:25 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
| high | merchant/tour/schedules-detail.html | [high]:19 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转；[high]:5240 页面存在硬跳转，需要改为 window.caesarNavigateTo 或声明为外部跳转 |
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
| ready | merchant/product/product-self-edit.html | 可直接纳入内容路由 |
| ready | merchant/product/product-study-edit.html | 可直接纳入内容路由 |
| ready | merchant/product/product-study-products.html | 可直接纳入内容路由 |
| ready | merchant/product/product-train-edit.html | 可直接纳入内容路由 |
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
| ready | merchant/resource/suppliers.html | 可直接纳入内容路由 |
| ready | merchant/sales/consultant/detail.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-after-sales.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-detail.html | 可直接纳入内容路由 |
| ready | merchant/sales/orders-intent.html | 可直接纳入内容路由 |
| ready | merchant/sales/sales-product-quote.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/predeposit.html | 可直接纳入内容路由 |
| ready | merchant/sales/store/reconciliation.html | 可直接纳入内容路由 |
| excluded | merchant/select-workspace.html | [excluded] 不纳入后台内容路由审计范围 |
| ready | merchant/system/business-params.html | 可直接纳入内容路由 |
| ready | merchant/system/hr-requests.html | 可直接纳入内容路由 |
| ready | merchant/system/my-org.html | 可直接纳入内容路由 |
| ready | merchant/system/notice-templates.html | 可直接纳入内容路由 |
| ready | merchant/system/staff-management.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-cost.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-notice.html | 可直接纳入内容路由 |
| ready | merchant/tour/fulfillment-roster.html | 可直接纳入内容路由 |
| ready | merchant/tour/product-custom-detail.html | 可直接纳入内容路由 |
| ready | merchant/tour/product-custom-list.html | 可直接纳入内容路由 |
| ready | merchant/tour/projects-detail.html | 可直接纳入内容路由 |
| ready | merchant/tour/projects.html | 可直接纳入内容路由 |
| ready | merchant/tour/resource-procurement-inventory.html | 可直接纳入内容路由 |
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
