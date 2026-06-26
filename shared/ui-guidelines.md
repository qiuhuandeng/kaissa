# 凯撒后台 UI 规范补充

## 列表页 List Surface

一级列表页统一使用 `list-surface` 规范。目标是让筛选、状态 Tab、表格和分页成为一个整体，减少页面标题卡片和列表主体分离造成的割裂感。

新页面优先直接使用：

```html
<section class="list-surface" data-list-surface>
  <h1 class="sr-only">页面名称</h1>
  <section class="filter-card filter-card-compact list-surface-filter">
    <div class="list-surface-filter-layout">
      <div class="list-surface-filter-fields">
        <div class="filter-actions list-surface-filter-actions">
          <!-- 搜索、重置、导出、新建、批量操作 -->
        </div>
        <!-- filter-item / filter-item-sm / filter-item-wide -->
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
- 搜索、重置、导出、新建、批量操作在同一个筛选工具条内；主操作按钮不加分隔线。
- 筛选项使用固定业务宽度，不拉伸铺满；长搜索用 `filter-item-search` 或 `filter-item-long`。
- 多条件筛选默认不折叠。操作按钮组固定在第一行右侧，筛选项从左到右按固定业务宽度自然排列；第一行可容纳多少筛选项就展示多少，放不下的条件从第二行开始换行，第二行及后续行使用完整内容宽度，不为了第一行按钮长期预留右侧空白。宽屏只增加可容纳的筛选项数量，不拉伸单个控件。筛选区上内边距和底部视觉留白统一为 14px，换行后的行间距统一为 12px，筛选项横向间距统一为 10px；不能插入空白占位造成行间断层。旧页面未手动添加 `filter-item-search` 时，共享脚本会自动把第一个搜索/关键词输入框识别为主搜索框。
- 列表顶部如需展示待处理提醒、超期预警、同步失败等信息，使用 `alert alert-orange`，放在筛选区之前；共享脚本会在运行时补充 `list-surface-alert` 和提醒内容的排版类。提醒条保持一行或轻量换行，不使用大卡片、大字号或厚重边框。
- Tab 数量用 `list-tab-count` 徽标；active 只改变颜色和下划线，不改变高度。
- Tab 分两类：带 `data-filter-tabs` 的 `.tab-bar` 是状态筛选 Tab，使用下划线筛选样式；不带 `data-filter-tabs` 的 `.tab-bar` 是功能切换 Tab，使用 Ant Design 风格的文字页签和底部活动线，不做按钮或胶囊。功能切换用于“价格预警/竞品数据库”“委托服务产品/服务履约规则”这类不同功能区；状态筛选用于“全部/待处理/已完成/异常”这类同一列表过滤。
- 表格、空状态、分页必须在同一个 `list-surface` 内。
- 行可点击时使用 `data-href` / `data-nav-href` / `data-row-link`，共享脚本会补充 `list-clickable-row`。

## 表格标签 Tag 规范

颜色标签只用于表达状态、风险和流程结果，不能把分类信息都做成彩色状态。

- `tag-blue`：进行中、已确认、待复核等正常推进状态。
- `tag-green`：成功、完成、已签署、已确认收款等完成态。
- `tag-orange`：待处理、部分完成、需确认、催办类状态。
- `tag-red`：异常、失败、退回、逾期、退款中等风险态。
- `tag-gray`：草稿、未生成、取消、无效等低活跃状态。
- `tag-meta` / 运行时 `tag-meta-runtime`：产品类型、付款来源、履约方式、认款方式、渠道来源、模板类型等“分类/属性”信息。它们使用中性灰底且不显示圆点，不参与状态色体系。

表格中应优先让订单状态、合同状态、财务状态、审批状态、异常风险标签获得颜色；产品类型、银行流水、普通团期、门店 POS、OTA 结算、资源标签、渠道标签等属性信息使用 `tag-meta` 或普通文本。旧页面不需要逐页修改标签类名，共享脚本会根据表头和常见文案在运行时补充 `tag-meta-runtime`。表格内 `.tag-group` 默认按属性标签处理，使用中性样式。

## 非列表页同步方向

详情页：继续使用 `page-workbar` 作为唯一页面级标题和操作区；摘要、状态、财务联动、AI 提示放在内容卡片内，不能重复放全局主操作。

新建/编辑页：标题区只保留返回入口、当前标题、主操作；复杂表单用分组卡片和 `form-row` / `form-row-3`，离开前保留未保存确认。

审批/流程页：审批操作用右抽屉或紧凑操作区，业务摘要、流转记录、审批意见分区展示；不要把审批动作分散到多个卡片右上角。

看板/报表页：可以使用 KPI 和图表卡，但必须保留数据口径说明；不套用 `list-surface` 作为主体布局。

AI 工具页：保留命令区、结果区、历史区等工具型布局，按钮使用 `btn-ai`，不要强行改成表格列表页。

移动端 client 页面：继续使用 `.mobile-frame`，不使用后台 `list-surface`。
