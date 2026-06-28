# 凯撒后台 UI 规范补充

## 内容路由 Navigation

后台 merchant/operator 页面必须由共享导航脚本统一注入外壳和接管跳转。页面本身只写内容区 HTML，不写 `layout/sidebar/topbar/main-area/content` 外壳。

页面跳转规范：
- 普通链接直接写相对 `.html` 地址，例如 `<a href="orders-detail.html">查看</a>`；共享导航会自动拦截。
- 表格行、卡片行跳转使用 `data-href` / `data-nav-href` / `data-row-link`，不手写整页跳转。
- JS 主动跳转只允许调用 `window.caesarNavigateTo(href)`。
- 后台内容页禁止写 `window.location.href`、`location.assign()`、`location.replace()`、`document.createElement('a') + click()` 作为跳转或兜底。
- 不需要为 `caesarNavigateTo` 写 fallback。merchant/operator 页面如果没有共享导航脚本，本身就是页面结构错误，应由 `shared/audit-pages.js` 报出，而不是在页面内降级整页刷新。
- HTTP/HTTPS 预览和正式服务器环境必须走无刷新内容路由；点击左侧菜单、顶部标签、表格行、按钮跳转时，只允许右侧内容区变化，后台外壳不能重建。
- 本地 `file://` 直接打开 HTML 只作为静态可用性预览。由于浏览器限制本地文件读取，`file://` 下共享路由内部允许使用浏览器原生整页跳转，不使用 iframe 降级，避免弹窗遮罩、抽屉、fixed 定位和全局交互被限制在内容区域。

新增或调整后台页面后必须运行：

```bash
node shared/audit-pages.js
```

审计结果必须保持阻断/高风险/中风险为 0，才能认为页面符合共享路由和共享 UI 规范。

## 列表页 List Surface

一级列表页统一使用 `list-surface` 规范。目标是让筛选、状态 Tab、表格和分页成为一个整体，减少页面标题卡片和列表主体分离造成的割裂感。

后台视觉 token 必须保持克制统一：正文默认 14px / 22px，表格和辅助信息使用 13px / 22px 或 12px / 20px，不使用 12.5px、13.5px、17px 等半档字号；普通正文和操作使用 400-500 字重，表头、卡片标题、主信息最高 600，只有工作台 KPI、详情核心金额等需要强强调的数字才允许 700 以上。

新页面优先直接使用：

```html
<section class="list-surface" data-list-surface>
  <h1 class="sr-only">页面名称</h1>
  <section class="filter-card filter-card-compact list-surface-filter">
    <div class="list-surface-filter-layout">
      <div class="list-surface-filter-fields">
        <!-- filter-item / filter-item-sm / filter-item-wide -->
        <div class="filter-actions">
          <!-- 搜索、重置 -->
        </div>
      </div>
      <div class="filter-actions list-surface-filter-actions">
        <!-- 导出、新建、批量操作等页面主操作 -->
      </div>
    </div>
  </section>
  <nav class="tab-bar list-surface-tabs" data-filter-tabs data-filter-target="#rows"></nav>
  <section class="table-wrap list-surface-table"></section>
  <div class="list-empty-state" data-list-empty hidden>暂无符合条件的数据</div>
  <div class="pagination list-surface-pagination"></div>
</section>
```

旧页面如果仍是 `list-page-panel + filter-card + tab-bar + table-wrap + pagination` 的结构，或是 `tab-bar + 多个业务 panel + filter-card/table-wrap`、`业务 panel 内 filter-card + table-wrap` 的结构，会由 `shared/nav-merchant.js` 和 `shared/nav-operator.js` 自动增强为同一套视觉结构。没有筛选区但存在 `list-page-panel + list-page-head + tab-bar/table-wrap` 的页面，会隐藏标题并把右侧按钮转为轻量顶部操作行。卡片列表、市场页、日历页等没有表格但存在 `list-page-panel + filter-card` 的页面，会自动套用同一套筛选工具条规则，不需要逐页补 class。

列表页规范：
- 内容区不显示大标题，页面名称保留为 `sr-only`，位置提示由顶部导航和标签栏承载。
- 搜索、查询、重置属于筛选动作，必须跟随全部筛选条件之后；导出、新建、同步、批量操作属于页面主操作，固定在筛选工具条右侧或标题右侧。
- 筛选项使用固定业务宽度，不拉伸铺满；普通输入约 220px，短下拉约 136px，日期范围约 318px，长搜索用 `filter-item-search` 或 `filter-item-long`。
- 多条件筛选默认不折叠。操作按钮组固定在第一行右侧，筛选项从左到右按固定业务宽度自然排列；第一行可容纳多少筛选项就展示多少，放不下的条件从第二行开始换行，第二行及后续行使用完整内容宽度，不为了第一行按钮长期预留右侧空白。宽屏只增加可容纳的筛选项数量，不拉伸单个控件。筛选区上内边距和底部视觉留白统一为 14px，换行后的行间距统一为 12px，筛选项横向间距统一为 10px；不能插入空白占位造成行间断层。旧页面未手动添加 `filter-item-search` 时，共享脚本会自动把第一个搜索/关键词输入框识别为主搜索框。
- 列表顶部如需展示待处理提醒、超期预警、同步失败等信息，使用 `alert alert-orange`，放在筛选区之前；共享脚本会在运行时补充 `list-surface-alert` 和提醒内容的排版类。提醒条保持一行或轻量换行，不使用大卡片、大字号或厚重边框。
- Tab 数量用 `list-tab-count` 徽标；active 只改变颜色和下划线，不改变高度。
- Tab 分两类：带 `data-filter-tabs` 的 `.tab-bar` 是状态筛选 Tab，使用下划线筛选样式；不带 `data-filter-tabs` 的 `.tab-bar` 是功能切换 Tab，使用 Ant Design 风格的文字页签和底部活动线，不做按钮或胶囊。功能切换用于“价格预警/竞品数据库”“委托服务产品/服务履约规则”这类不同功能区；状态筛选用于“全部/待处理/已完成/异常”这类同一列表过滤。
- 表格、空状态、分页必须在同一个 `list-surface` 内。
- 列表表格列宽由共享脚本根据表头自动归类，不在单页硬写列宽。编号/日期/金额/数字/状态/操作列必须单行展示；产品/线路、产品名称/编号、客户/联系人等主信息列只保留显式的 2-3 行信息结构，不允许被窄屏压成 4 行以上；备注、风险提示、失败原因、特殊需求等说明列才允许受控换行。小屏通过 `.table-wrap` 横向滚动承接，不通过强行压缩列宽来塞满视口。
- 表格操作列统一使用 `.table-action`。操作文字为 13px / 22px，普通动作字重 400、主业务动作字重 500、横向间距 10px，必须不换行、不撑高行高；操作列宽由按钮数量和“更多”自动撑开，小屏由表格横向滚动承接。普通动作用克制灰色，蓝色只用于当前行最重要的业务动作，并显式添加 `.table-action-primary`，不能依赖第一个按钮自动变蓝；hover 必须有轻量颜色变化或浅底反馈，不能做成无响应的死文字。详情/查看只有在没有更强业务动作时才作为主动作。直露操作原则上最多 2 个，流程密集列表最多 3 个，其余低频动作进入“更多”。
- 表格主信息不直接依赖 `<strong>` 做粗体堆叠。产品/客户/公司/订单等主字段使用 13-14px、600 字重，编号、线路、手机号等辅助信息使用 `text-muted` 或 `table-subtext`，保持 12-13px、400 字重。普通金额、价格、库存和数量使用正文色加 `font-variant-numeric: tabular-nums`；只有亏损、逾期、异常、负数和风险提示才使用红色。
- 操作文案控制在 2-4 个字，长文案必须缩短或放入更多菜单：`查看详情` 统一为 `详情`，`查看版本历史` / `历史版本` 统一为 `历史`，`查看价格趋势图` 统一为 `趋势`，`查看AI判断详情` 统一为 `AI详情`，`查看错误日志` 统一为 `日志`，`OTA详情配置` 统一为 `配置`，`修改价格` 统一为 `改价`，`更新库存` 统一为 `库存`，`供应商费用` 统一为 `费用`，`发起调价申请` 统一为 `调价`，`生成初始化任务` 统一为 `初始化`。
- 更多菜单统一结构为 `.dropdown.table-action-more > .table-more-toggle + .dropdown-menu.action-dropdown-menu`。按钮文案必须显示“更多”并带下拉箭头，不能只有箭头；低频动作、长文案动作、危险动作放入菜单，危险项使用 `.dropdown-item.danger` 并放在菜单底部。
- 分页是表格 footer，不是独立卡片。表格有分页时，页面源码必须采用 `.table-wrap.list-surface-table.list-table-with-pagination + .pagination.list-surface-pagination.list-pagination-attached` 的紧邻同级结构；横向滚动只发生在 `.table-wrap` 内，分页固定在表格外层底部。表格底部取消圆角，分页贴住表格并保留底部圆角，中间只保留一条分隔线；缺分页的列表页必须补源码结构，不通过运行时兼容自动生成。
- 有功能 Tab、状态 Tab 或多 panel 的列表页，分页必须放在对应表格所在的同一个 panel 内，并且紧跟该表格；不能把分页放在 panel 外层、父级 surface 底部或 `.table-wrap` 内部。active panel 不允许用 `gap` 把 `.list-table-with-pagination` 和 `.list-surface-pagination` 分开；筛选区、统计区、工具条的间距由各自 margin 控制，表格与分页始终按 footer 连接。
- 列表状态统一由共享脚本注入：`window.caesarUI.setListLoading(surface, true, message)` 显示骨架 loading；`window.caesarUI.setListError(surface, message)` 显示错误状态；`window.caesarUI.clearListState(surface)` 恢复正常列表和空状态。
- 行可点击时使用 `data-href` / `data-nav-href` / `data-row-link`，共享脚本会补充 `list-clickable-row`。

## 弹窗 / 抽屉 / 反馈

后台弹层统一遵循“业务操作用右抽屉、打断确认用居中小弹窗”。

- 新建、编辑、配置、批量维护、选择类型等承载表单或复杂内容的操作，使用 `.modal-overlay.drawer-overlay > .modal.drawer-modal`。
- 删除确认、上下架确认、复制确认、未选择提示、简单状态切换等轻量打断操作，使用 `.modal.modal-sm.modal-confirm`。
- 弹层标题使用 16px / 24px、600 字重，不使用 700/800 的重标题；关闭按钮必须有 28px 左右的命中区和浅灰 hover 背景，不能只是一个无反馈的 `×` 字符。
- 共享脚本会为 `.modal-overlay` 补齐 `aria-hidden`、`role="dialog"`、`aria-modal="true"` 和 `data-layer-type`。
- 打开/关闭统一调用 `window.caesarUI.openDrawer(target)`、`window.caesarUI.closeDrawer(target)`、`window.caesarUI.openModal(target)`、`window.caesarUI.closeModal(target)`，避免每个页面硬写 display 切换导致抽屉没有滑入滑出。
- 操作成功、失败、提醒统一调用 `window.caesarUI.toast(message, { type: "success|warning|error|info" })`，不在单页内自建提示条。

## 表格标签 Tag 规范

颜色标签只用于表达状态、风险和流程结果，不能把分类信息都做成彩色状态。

- `tag-blue`：进行中、已确认、待复核等正常推进状态。
- `tag-green`：成功、完成、已签署、已确认收款等完成态。
- `tag-orange`：待处理、部分完成、需确认、催办类状态。
- `tag-red`：异常、失败、退回、逾期、退款中等风险态。
- `tag-gray`：草稿、未生成、取消、无效等低活跃状态。
- `tag-meta` / 运行时 `tag-meta-runtime`：产品类型、付款来源、履约方式、认款方式、渠道来源、模板类型等“分类/属性”信息。它们使用中性灰底且不显示圆点，不参与状态色体系。
- 运行时 `tag-plain-runtime`：金额、库存、舱位、余位、数量等本质是数值的内容。旧页面如果已经包成 `.tag`，共享脚本会在运行时把它退回普通文本视觉。

表格中应优先让订单状态、合同状态、财务状态、审批状态、异常风险标签获得颜色；产品类型、银行流水、普通团期、门店 POS、OTA 结算、资源标签、渠道标签等属性信息使用 `tag-meta` 或普通文本。旧页面不需要逐页修改标签类名，共享脚本会根据表头和常见文案在运行时补充 `tag-meta-runtime`。表格内 `.tag-group` 默认按属性标签处理，使用中性样式。

列表表格中的 `.tag`、`.tag-row`、`.tag-group` 必须单行展示，禁止在窄屏单元格内换行。小屏由 `.table-wrap` 承接横向滚动，不能通过标签自动换行来压缩表格。

标签文字默认 12px、500 字重；`tag-meta` / `tag-meta-runtime` 使用 400 字重和中性灰底，不显示圆点。不要为了强调普通分类信息使用蓝、绿、橙、红色标签。

## 非列表页同步方向

详情页：继续使用 `page-workbar` 作为唯一页面级标题和操作区；摘要、状态、财务联动、AI 提示放在内容卡片内，不能重复放全局主操作。

新建/编辑页：标题区只保留返回入口、当前标题、主操作；复杂表单用分组卡片和 `form-row` / `form-row-3`，离开前保留未保存确认。

审批/流程页：审批操作用右抽屉或紧凑操作区，业务摘要、流转记录、审批意见分区展示；不要把审批动作分散到多个卡片右上角。

看板/报表页：可以使用 KPI 和图表卡，但必须保留数据口径说明；不套用 `list-surface` 作为主体布局。

AI 工具页：保留命令区、结果区、历史区等工具型布局，按钮使用 `btn-ai`，不要强行改成表格列表页。

移动端 client 页面：继续使用 `.mobile-frame`，不使用后台 `list-surface`。
