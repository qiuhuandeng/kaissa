# HTML 标准片段模板

本文件配合 `docs/AI_PAGE_RULES.md` 使用。后续 AI 新增或改造页面时，优先复制这些结构，再替换业务字段、状态、按钮和数据。

## 1. 后台业务列表页

适用：订单、团期、应付、收款、售后、资源履约、渠道订单等后台业务对象列表。

```html
<section class="list-surface page-prefix-list-surface" data-list-surface>
  <section class="filter-card filter-card-compact page-prefix-filter list-surface-filter" aria-label="业务对象筛选">
    <div class="list-surface-filter-layout">
      <div class="list-surface-filter-fields">
        <label class="filter-item filter-item-search">
          <span>关键词</span>
          <input type="search" class="form-control" placeholder="线路名 / 订单号 / 客户名">
        </label>
        <label class="filter-item-sm">
          <span>主状态</span>
          <select class="form-control">
            <option>全部</option>
            <option>待提交</option>
            <option>审批中</option>
            <option>已完成</option>
          </select>
        </label>
        <label class="filter-item">
          <span>出发日期</span>
          <span class="date-range">
            <input type="date" class="form-control">
            <input type="date" class="form-control">
          </span>
        </label>
      </div>
      <div class="list-surface-filter-actions list-filter-pinned-actions">
        <button type="button" class="btn btn-secondary">重置</button>
        <button type="button" class="btn btn-primary">查询</button>
      </div>
    </div>
  </section>

  <nav class="tab-bar list-surface-tabs" aria-label="主状态筛选" data-filter-tabs>
    <button type="button" class="tab-item active">
      <span class="tab-label">全部</span>
      <span class="list-tab-count">128</span>
    </button>
    <button type="button" class="tab-item">
      <span class="tab-label">待处理</span>
      <span class="list-tab-count">18</span>
    </button>
    <button type="button" class="tab-item">
      <span class="tab-label">已完成</span>
      <span class="list-tab-count">96</span>
    </button>
  </nav>

  <section class="table-wrap list-surface-table business-optimized-table page-prefix-table" aria-label="业务对象列表">
    <table>
      <colgroup>
        <col style="width: 260px;">
        <col style="width: 160px;">
        <col style="width: 150px;">
        <col style="width: 150px;">
        <col style="width: 130px;">
        <col style="width: var(--business-action-width);">
      </colgroup>
      <thead>
        <tr>
          <th>业务对象</th>
          <th>日期/批次</th>
          <th>关键数量</th>
          <th>关键金额</th>
          <th>主状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <span class="cell-main">丝路专列深度游</span>
            <span class="cell-sub">北京-乌鲁木齐 / 专列 / 计调：张敏</span>
          </td>
          <td>
            <span class="cell-main">2026-08-15</span>
            <span class="cell-sub">7天6晚</span>
          </td>
          <td>
            <span class="cell-main">42/60人</span>
            <span class="cell-sub">
              <button type="button" class="table-number-link">12</button>单待确认
            </span>
          </td>
          <td>
            <span class="cell-main">¥386,000</span>
            <span class="cell-sub">待收 ¥42,000</span>
          </td>
          <td>
            <span class="tag tag-warning">待确认</span>
          </td>
          <td>
            <div class="table-action">
              <button type="button" class="link-primary">处理</button>
              <a class="link-primary" href="target-page.html">详情</a>
              <button type="button" class="link-muted">更多</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <div class="pagination list-surface-pagination list-pagination-attached">
    <span>共 128 条</span>
    <button type="button" class="btn btn-secondary">上一页</button>
    <button type="button" class="btn btn-secondary">下一页</button>
  </div>
</section>
```

列表页替换要点：

- `.page-prefix-*` 必须换成页面前缀。
- Tab 表达主状态，不能把待办当主状态。
- 操作列按钮保持稳定，不因每行待办不同大幅变化。
- 数量跳转只包数字，不包单位。
- 多行内容用 `.cell-main`、`.cell-sub`，不用 `<br>`。

## 2. 业务处理/状态推进抽屉

适用：确认资源、提交付款申请、调整名额、发送通知、安排领队、发起售后等会改变业务状态的动作。

```html
<section class="modal-overlay" id="businessActionDrawer" hidden>
  <aside class="modal drawer-modal drawer-action drawer-lg page-prefix-action-drawer" role="dialog" aria-modal="true" aria-labelledby="businessActionTitle">
    <header class="modal-header">
      <h2 class="modal-title" id="businessActionTitle">确认资源</h2>
      <button type="button" class="modal-close" data-close-drawer aria-label="关闭">×</button>
    </header>

    <div class="modal-body">
      <section class="drawer-object-summary" aria-label="当前处理对象">
        <div class="drawer-object-summary-main">
          <div>
            <h3 class="drawer-object-title">丝路专列深度游</h3>
            <p class="drawer-object-subtitle">2026-08-15 出发 / 北京-乌鲁木齐 / TR-SILK-20260815-001</p>
          </div>
          <span class="tag tag-warning">待资源确认</span>
        </div>
        <div class="drawer-summary-grid">
          <div class="drawer-summary-item">
            <span class="drawer-summary-label">占用名额</span>
            <strong class="drawer-summary-value">42/60人</strong>
          </div>
          <div class="drawer-summary-item">
            <span class="drawer-summary-label">待确认资源</span>
            <strong class="drawer-summary-value">专列铺位 18个</strong>
          </div>
          <div class="drawer-summary-item">
            <span class="drawer-summary-label">供应商</span>
            <strong class="drawer-summary-value">丝路专列运营商</strong>
          </div>
          <div class="drawer-summary-item">
            <span class="drawer-summary-label">确认截止</span>
            <strong class="drawer-summary-value">2026-07-20 18:00</strong>
          </div>
        </div>
      </section>

      <section class="drawer-section">
        <div class="drawer-section-head">
          <h3 class="drawer-section-title">判断依据</h3>
        </div>
        <div class="readonly-summary">
          <div>
            <span>已售人数</span>
            <strong>42人</strong>
          </div>
          <div>
            <span>已确认铺位</span>
            <strong>24个</strong>
          </div>
          <div>
            <span>缺口</span>
            <strong class="amount-red">18个</strong>
          </div>
        </div>
      </section>

      <section class="drawer-section">
        <div class="drawer-section-head">
          <h3 class="drawer-section-title">本次处理</h3>
        </div>
        <div class="form-grid">
          <label class="form-item">
            <span>确认数量</span>
            <input type="number" class="form-control" value="18">
          </label>
          <label class="form-item">
            <span>确认结果</span>
            <select class="form-control">
              <option>全部确认</option>
              <option>部分确认</option>
              <option>无法确认</option>
            </select>
          </label>
          <label class="form-item form-item-wide">
            <span>供应商确认号</span>
            <input type="text" class="form-control" value="SUP-20260713-018">
          </label>
          <label class="form-item form-item-wide">
            <span>处理备注</span>
            <textarea class="form-control" rows="3"></textarea>
          </label>
        </div>
      </section>
    </div>

    <footer class="modal-footer">
      <button type="button" class="btn btn-secondary" data-close-drawer>取消</button>
      <button type="button" class="btn btn-primary">确认资源</button>
    </footer>
  </aside>
</section>
```

处理抽屉替换要点：

- 标题只写动作，不写对象说明。
- 对象、状态、金额、数量、缺口放摘要卡。
- 正文第一块放判断依据，第二块放本次处理。
- 底部主按钮使用明确业务动作词。

## 3. 详情/速览/记录抽屉

适用：订单速览、团期订单概览、付款详情、日志、版本记录、对账详情、主数据档案速览。

```html
<section class="modal-overlay" id="businessPreviewDrawer" hidden>
  <aside class="modal drawer-modal drawer-preview drawer-xl page-prefix-preview-drawer" role="dialog" aria-modal="true" aria-labelledby="businessPreviewTitle">
    <header class="modal-header">
      <h2 class="modal-title" id="businessPreviewTitle">团期订单概览</h2>
      <button type="button" class="modal-close" data-close-drawer aria-label="关闭">×</button>
    </header>

    <div class="modal-body">
      <section class="drawer-object-summary" aria-label="当前查看对象">
        <div class="drawer-object-summary-main">
          <div>
            <h3 class="drawer-object-title">丝路专列深度游</h3>
            <p class="drawer-object-subtitle">2026-08-15 出发 / 北京-乌鲁木齐 / 计调：张敏</p>
          </div>
          <span class="tag tag-success">销售中</span>
        </div>
        <div class="drawer-summary-grid">
          <div class="drawer-summary-item">
            <span class="drawer-summary-label">订单数</span>
            <strong class="drawer-summary-value">42单</strong>
          </div>
          <div class="drawer-summary-item">
            <span class="drawer-summary-label">出行人数</span>
            <strong class="drawer-summary-value">42/60人</strong>
          </div>
          <div class="drawer-summary-item">
            <span class="drawer-summary-label">应收金额</span>
            <strong class="drawer-summary-value">¥386,000</strong>
          </div>
          <div class="drawer-summary-item">
            <span class="drawer-summary-label">待收金额</span>
            <strong class="drawer-summary-value">¥42,000</strong>
          </div>
        </div>
      </section>

      <section class="drawer-section">
        <div class="drawer-section-head">
          <h3 class="drawer-section-title">重点订单</h3>
        </div>
        <section class="table-wrap drawer-table-wrap" aria-label="重点订单">
          <table>
            <thead>
              <tr>
                <th>订单</th>
                <th>客户</th>
                <th>人数</th>
                <th>应收/已收</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span class="cell-main">SO20260713018</span>
                  <span class="cell-sub">门店销售 / 王琳</span>
                </td>
                <td>李女士</td>
                <td>4人</td>
                <td>
                  <span class="cell-main">¥36,800</span>
                  <span class="cell-sub">已收 ¥30,000</span>
                </td>
                <td><span class="tag tag-warning">尾款待收</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>

      <section class="drawer-section">
        <div class="drawer-section-head">
          <h3 class="drawer-section-title">流转记录</h3>
        </div>
        <ol class="timeline-list">
          <li>
            <strong>资源确认</strong>
            <span>2026-07-13 10:24 / 张敏 / 专列铺位确认 18个</span>
          </li>
          <li>
            <strong>订单更新</strong>
            <span>2026-07-13 09:48 / 王琳 / 新增订单 SO20260713018</span>
          </li>
        </ol>
      </section>
    </div>

    <footer class="modal-footer">
      <button type="button" class="btn btn-secondary" data-close-drawer>关闭</button>
      <a class="btn btn-primary" href="business-detail.html">进入详情页</a>
    </footer>
  </aside>
</section>
```

详情抽屉替换要点：

- 速览只做查看、反查、进入详情页，不承载复杂编辑。
- 摘要卡只放判断重点，不把正文完整字段重复一遍。
- 明细表仍遵守列表多行规则，不使用 `<br>`。
- 主数据档案类如果摘要与 Tab 高度重复，可改用轻量对象识别条。

## 4. 轻量对象识别条

适用：主数据档案、选择/分配抽屉、授权范围配置等不需要完整摘要卡的场景。

```html
<section class="drawer-object-strip" aria-label="当前对象">
  <div>
    <strong>华东分销中心</strong>
    <span>分销商 / 上海 / 负责人：陈晨 / 启用中</span>
  </div>
  <span class="tag tag-success">启用中</span>
</section>
```

使用要点：

- 第一行放对象名称和必要状态。
- 第二行放类型、区域、负责人、电话等少量识别字段。
- 不提前展示尚未形成的授权结果、结算结果或处理结果。

