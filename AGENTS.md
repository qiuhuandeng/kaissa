# 凯撒旅游SaaS系统 · Codex全局规则

## ⚠️ 最高优先级：每个HTML文件必须自动遵守，不需要在页面描述里重复提醒

### 样式引用
所有HTML页面的head标签内必须包含且只包含一行样式引用：
<link rel="stylesheet" href="../shared/style.css">
不允许在页面内写任何内联style标签。

### 导航JS引用
merchant/ 文件夹下的所有页面：body标签第一个子元素必须是 <script src="../shared/nav-merchant.js"></script>
operator/ 文件夹下的所有页面：body标签第一个子元素必须是 <script src="../shared/nav-operator.js"></script>
client/ 文件夹下的页面：不引用任何导航JS，自己写手机端顶部导航。
login.html 和 select-workspace.html 不引用导航JS。

### 页面结构规则
merchant/ 和 operator/ 的页面：导航JS会自动注入左侧边栏和顶部导航栏，页面只需要写内容区HTML，不需要写layout/sidebar/topbar等外层结构。
client/ 的页面：整体用 .mobile-frame 包裹，最大宽度390px水平居中。

## 项目背景
凯撒旅游集团旅游业务SaaS系统，三端：运营平台、商户端、C端（手机）。
公司业务：出境游（欧洲线为主）、邮轮（理想号）、MICE会展、国内游、自由行。

## 三大核心原则（每个页面设计必须体现）

### 原则一：业财一体
凡涉及收款、退款、付款、改价操作完成后，页面显示绿色"财务联动"区块，内容是自动生成的财务单据编号和状态。例如：✅ 已自动生成应收单 SK20240618001，状态：待审核。

### 原则二：AI原生
以下页面必须有AI功能入口：
- 产品创建页：AI一键生成行程内容按钮
- 订单详情页：AI风险提示（如证件即将过期、出发日临近未收款等）
- 意向单页：AI跟进话术建议
- 团期成本页：AI毛利预测
- 客户详情页：AI复购预测和标签建议
AI入口用紫色渐变按钮标识，标注"🤖 AI"字样。

### 原则三：数据驱动
所有报表统计类页面底部必须有"数据口径说明"灰色区块，注明：统计口径、数据更新频率、数据范围。

## CSS组件使用规范
状态标签：.tag .tag-blue(蓝) .tag-green(绿) .tag-orange(橙) .tag-red(红) .tag-gray(灰) .tag-purple(紫)
按钮：.btn .btn-primary(蓝) .btn-secondary(白边框) .btn-danger(红) .btn-warning(橙) .btn-success(绿)
KPI卡片：.kpi-card .blue/.green/.orange/.red/.purple（左侧彩色竖线）
弹窗：.modal-overlay > .modal .modal-sm(400px) .modal-md(600px) .modal-lg(720px)
搜索区：.filter-card 包裹
表格：.table-wrap > table

## Mock数据规范
订单号格式：KS2024XXXXXXXX
金额千分位格式：¥25,600
产品名称用真实旅游产品：欧洲十国经典游、日本关西深度游、理想号地中海邮轮、三亚亲子5日游、泰国曼谷清迈8日、马来西亚自由行、北京故宫定制游等
客户姓名：张建国、李梅、王强、刘洋、陈红、赵明、孙丽、周伟、吴芳、郑华
供应商名称：欧洲地接ABC、日本地接XYZ、泰国地接DEF、三亚亚特兰蒂斯酒店、国际航空CA

## 页面跳转规范
同文件夹内跳转直接用文件名，如 orders-detail.html
跨文件夹不跳转
所有列表页的行点击或查看按钮跳转到对应详情页
