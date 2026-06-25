import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  Megaphone, 
  BarChart3, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  User,
  HelpCircle,
  Menu,
  Plus,
  RefreshCw,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
  ShoppingCart,
  Layers,
  CheckCircle,
  Sliders,
  ShieldAlert,
  SlidersHorizontal,
  FolderTree,
  ExternalLink,
  Package,
  Truck,
  Filter,
  Download
} from 'lucide-react';

// 完整的菜单配置：一级菜单(64px) -> 二级菜单(160px 分组) -> 三级菜单(具体页面项)
const MENU_DATA = [
  {
    id: 'dashboard',
    label: '仪表',
    icon: LayoutDashboard,
    groups: [
      {
        id: 'data-analysis',
        label: '数据分析',
        items: [
          { id: 'realtime-monitor', label: '实时监控', desc: '实时系统流量及并发数据指标' },
          { id: 'user-retention', label: '用户留存', desc: '新老用户次周/月度留存漏斗' },
          { id: 'behavior-analysis', label: '行为轨迹', desc: '全链路行为路径监测与归因' }
        ]
      },
      {
        id: 'business-board',
        label: '业务大盘',
        items: [
          { id: 'sales-stats', label: '销售统计', desc: '各品类及渠道销售数据汇总' },
          { id: 'cost-control', label: '成本核算', desc: '研发、运营与营销费用边际曲线' }
        ]
      }
    ]
  },
  {
    id: 'orders',
    label: '订单',
    icon: ShoppingCart,
    groups: [
      {
        id: 'order-management',
        label: '订单管理',
        items: [
          { id: 'all-orders', label: '全部订单', desc: '查询及处理系统所有全渠道订单数据' },
          { id: 'after-sales', label: '售后退款', desc: '处理用户退货、换货及退款申请' }
        ]
      },
      {
        id: 'logistics',
        label: '物流履约',
        items: [
          { id: 'pending-deliver', label: '待发货列表', desc: '待同步仓储与分配物流单号的订单' },
          { id: 'logistic-tracking', label: '物流轨迹', desc: '全网快递实时路由节点状态跟踪' }
        ]
      }
    ]
  },
  {
    id: 'develop',
    label: '研发',
    icon: Code2,
    groups: [
      {
        id: 'project-management',
        label: '项目管理',
        items: [
          { id: 'sprint-plan', label: '迭代计划', desc: '双周敏捷迭代看板与里程碑' },
          { id: 'task-board', label: '任务看板', desc: '协同任务拖拽及状态跟踪流' },
          { id: 'bug-tracking', label: '缺陷跟踪', desc: '线上故障与研发工单快速流转' }
        ]
      },
      {
        id: 'ci-cd',
        label: '持续集成',
        items: [
          { id: 'pipelines', label: '流水线', desc: '云原生自动化构建与部署流' },
          { id: 'container-service', label: '容器服务', desc: 'K8s集群资源监视与Pod调度' }
        ]
      }
    ]
  },
  {
    id: 'marketing',
    label: '营销',
    icon: Megaphone,
    groups: [
      {
        id: 'channels',
        label: '渠道推广',
        items: [
          { id: 'ad-delivery', label: '广告投放', desc: '多源广告平台投资回报率ROI分析' },
          { id: 'sms-marketing', label: '短信通知', desc: '个性化场景营销短信批量群发' }
        ]
      },
      {
        id: 'benefits',
        label: '权益管理',
        items: [
          { id: 'coupons', label: '优惠券发放', desc: '立减券、折扣券生命周期策略' },
          { id: 'points-mall', label: '积分商城', desc: '用户成长激励与实体/虚拟兑换' }
        ]
      }
    ]
  },
  {
    id: 'system',
    label: '系统',
    icon: Settings,
    groups: [
      {
        id: 'security',
        label: '安全与权限',
        items: [
          { id: 'role-acl', label: '权限控制', desc: 'RBAC精细化菜单与按钮级授权' },
          { id: 'user-roles', label: '分配角色', desc: '企业组织架构及员工职位分配' }
        ]
      }
    ]
  }
];

// 模拟订单数据
const MOCK_ORDERS = [
  { id: 'ORD-20260625-8831', time: '2026-06-25 15:30:22', price: '￥1,280.00', user: '陈先生', phone: '139****1223', channel: '淘宝旗舰店', status: '待发货', statusColor: 'amber' },
  { id: 'ORD-20260625-7729', time: '2026-06-25 14:15:00', price: '￥328.50', user: '林女士', phone: '186****9928', channel: '京东自营', status: '已发货', statusColor: 'blue' },
  { id: 'ORD-20260625-4412', time: '2026-06-25 11:02:45', price: '￥5,999.00', user: '高先生', phone: '155****3301', channel: '抖音直播', status: '已完成', statusColor: 'green' },
  { id: 'ORD-20260625-1029', time: '2026-06-25 09:44:12', price: '￥88.00', user: '周女士', phone: '130****7762', channel: '微信小程序', status: '待付款', statusColor: 'neutral' },
  { id: 'ORD-20260624-9981', time: '2026-06-24 18:22:10', price: '￥450.00', user: '马先生', phone: '189****0012', channel: '线下收银', status: '已完成', statusColor: 'green' },
  { id: 'ORD-20260624-8842', time: '2026-06-24 16:05:33', price: '￥2,100.00', user: '王先生', phone: '173****5541', channel: '官网商城', status: '退款中', statusColor: 'red' },
];

export default function App() {
  // 选中的一级菜单 ID
  const [activePrimary, setActivePrimary] = useState('dashboard');
  
  // 展开/折叠的二级菜单内部分组折叠状态
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // 选中的三级菜单项 (默认初始化为第一个项)
  const [activeTertiary, setActiveTertiary] = useState('realtime-monitor');

  // 二级侧边栏整体折叠状态 (默认展开 false)
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(false);

  // 全局搜索词 (支持快速过滤二三级菜单)
  const [searchQuery, setSearchQuery] = useState('');

  // 移动端菜单开关
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 模拟操作日志 / 通知流
  const [logs, setLogs] = useState([
    { id: 1, type: 'info', text: '安全提示：系统刚刚切换了订单数据库备用节点', time: '5分钟前' },
    { id: 2, type: 'success', text: '订单同步服务：成功抓取最新多渠道销售对账单', time: '12分钟前' },
    { id: 3, type: 'warning', text: '物流履约：当前受华东暴雨影响，部分发货存在微弱延迟', time: '35分钟前' }
  ]);

  // 订单过滤器状态
  const [orderFilterStatus, setOrderFilterStatus] = useState('全部');
  const [orderSearchText, setOrderSearchText] = useState('');

  // 当前处于选中状态的一级菜单详情
  const currentPrimaryMenu = useMemo(() => {
    return MENU_DATA.find(item => item.id === activePrimary) || MENU_DATA[0];
  }, [activePrimary]);

  // 根据搜索条件过滤出的二级分组及三级菜单
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return currentPrimaryMenu.groups;
    
    const query = searchQuery.toLowerCase();
    return currentPrimaryMenu.groups.map(group => {
      const filteredItems = group.items.filter(item => 
        item.label.toLowerCase().includes(query) || 
        item.desc.toLowerCase().includes(query)
      );
      if (filteredItems.length > 0 || group.label.toLowerCase().includes(query)) {
        return { ...group, items: filteredItems };
      }
      return null;
    }).filter(Boolean);
  }, [currentPrimaryMenu, searchQuery]);

  // 当前激活的三级菜单项详情
  const currentActiveItem = useMemo(() => {
    for (const p of MENU_DATA) {
      for (const g of p.groups) {
        const item = g.items.find(i => i.id === activeTertiary);
        if (item) {
          return {
            primary: p,
            group: g,
            item: item
          };
        }
      }
    }
    // 降级兜底
    return {
      primary: MENU_DATA[0],
      group: MENU_DATA[0].groups[0],
      item: MENU_DATA[0].groups[0].items[0]
    };
  }, [activeTertiary]);

  // 内部小分组折叠切换函数
  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // 一级菜单点击逻辑：切换后，默认选中该一级菜单下的第一个三级菜单
  const handlePrimaryClick = (id) => {
    setActivePrimary(id);
    setSearchQuery(''); // 切换大模块时清空搜索
    const newPrimary = MENU_DATA.find(item => item.id === id);
    if (newPrimary && newPrimary.groups.length > 0 && newPrimary.groups[0].items.length > 0) {
      setActiveTertiary(newPrimary.groups[0].items[0].id);
    }
    // 当切换一级菜单时，自动保持二级菜单展开，方便用户直观挑选
    setIsSecondaryCollapsed(false);
  };

  // 过滤后的订单数据
  const displayOrders = useMemo(() => {
    return MOCK_ORDERS.filter(order => {
      const matchStatus = orderFilterStatus === '全部' || order.status === orderFilterStatus;
      const matchText = orderSearchText.trim() === '' || 
        order.id.toLowerCase().includes(orderSearchText.toLowerCase()) ||
        order.user.toLowerCase().includes(orderSearchText.toLowerCase()) ||
        order.phone.includes(orderSearchText);
      return matchStatus && matchText;
    });
  }, [orderFilterStatus, orderSearchText]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f7fa] font-sans text-neutral-800 antialiased select-none">
      
      {/* 1. 最左侧：极窄暗色一级菜单 (宽度: 严格 64px) */}
      <aside className="hidden md:flex flex-col items-center w-16 bg-[#001529] text-white shrink-0 z-30 shadow-lg">
        {/* Ant Design 经典 LOGO 缩影 */}
        <div className="flex items-center justify-center h-16 w-full border-b border-white/10 bg-[#002140]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <span className="font-bold text-white text-base">A</span>
          </div>
        </div>

        {/* 一级菜单项容器 */}
        <nav className="flex-1 w-full py-4 space-y-1">
          {MENU_DATA.map((menu) => {
            const IconComponent = menu.icon;
            const isActive = menu.id === activePrimary;
            return (
              <button
                key={menu.id}
                onClick={() => handlePrimaryClick(menu.id)}
                className={`relative flex flex-col items-center justify-center w-full py-3 group transition-all duration-200 ${
                  isActive 
                    ? 'text-white bg-blue-600/95' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* 选中时的左侧标志条 */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-400 rounded-r-sm animate-pulse" />
                )}
                
                {/* 图标 */}
                <IconComponent className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'scale-105' : ''}`} />
                
                {/* 二字小标题 */}
                <span className="text-[11px] mt-1 font-medium tracking-wider scale-90">
                  {menu.label}
                </span>

                {/* 悬浮气泡提示 */}
                <div className="absolute left-16 px-2.5 py-1.5 bg-neutral-900 text-neutral-100 text-xs rounded shadow-md opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50">
                  {menu.label}中心
                </div>
              </button>
            );
          })}
        </nav>

        {/* 底部系统应用区 */}
        <div className="w-full border-t border-white/10 p-3 space-y-3 flex flex-col items-center">
          <button className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="relative group cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-xs text-blue-300 font-bold overflow-hidden">
              <User className="w-4 h-4 text-blue-200" />
            </div>
          </div>
        </div>
      </aside>

      {/* 2. 次级侧边栏：白色长条 (宽度: 严格 160px) + 整体折叠控制 */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-neutral-200/80 shrink-0 z-20 transition-all duration-300 ease-in-out relative ${
          isSecondaryCollapsed ? 'w-0 opacity-0 pointer-events-none border-r-0' : 'w-[160px] opacity-100'
        }`}
      >
        {/* 二级菜单模块头部 */}
        <div className="h-16 flex flex-col justify-center px-4 border-b border-neutral-100 overflow-hidden whitespace-nowrap">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-800 tracking-wider">
              {currentPrimaryMenu.label}服务
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium scale-90">
              {currentPrimaryMenu.groups.length}大类
            </span>
          </div>
        </div>

        {/* 搜索框：快速检索二三级菜单 */}
        <div className="p-2 border-b border-neutral-100/50 overflow-hidden">
          <div className="relative flex items-center">
            <Search className="absolute left-2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="过滤当前功能..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[11px] pl-6 pr-2 py-1 bg-neutral-50 border border-neutral-200 rounded focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* 二级菜单列表 (默认展开，内含三级菜单项) */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3 px-1.5 no-scrollbar">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[11px] text-neutral-400">无匹配结果</p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isCollapsed = collapsedGroups[group.id];
              return (
                <div key={group.id} className="space-y-1">
                  
                  {/* 二级分组名 (点击可局部折叠/展开) */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center justify-between w-full px-2 py-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 transition-all text-[10px] font-bold tracking-wider uppercase"
                  >
                    <span className="truncate">{group.label}</span>
                    <span>
                      {isCollapsed ? (
                        <ChevronRight className="w-2.5 h-2.5" />
                      ) : (
                        <ChevronDown className="w-2.5 h-2.5" />
                      )}
                    </span>
                  </button>

                  {/* 三级菜单项 (列表面板) */}
                  {!isCollapsed && (
                    <div className="space-y-[1px] transition-all">
                      {group.items.map((item) => {
                        const isActive = item.id === activeTertiary;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTertiary(item.id)}
                            className={`group/item flex items-center justify-between w-full text-left px-2 py-1.5 rounded transition-all duration-100 text-[12px] ${
                              isActive
                                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                            
                            {/* 右侧极其精致的微型状态点 */}
                            <span className={`w-1 h-1 rounded-full shrink-0 ml-1 transition-all ${
                              isActive 
                                ? 'bg-blue-500 scale-100' 
                                : 'bg-neutral-300 opacity-0 scale-50 group-hover/item:opacity-60 group-hover/item:scale-100'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* 侧边栏底部版本标识 */}
        <div className="p-2 border-t border-neutral-100 text-center overflow-hidden whitespace-nowrap">
          <p className="text-[9px] text-neutral-400 font-mono tracking-tight scale-90">Ant Menu v4.5</p>
        </div>
      </aside>

      {/* 🌟 核心：二级整栏收纳折叠按钮 (Ant Design 风格完美边缘悬浮钮) */}
      <div 
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-in-out"
        style={{ left: isSecondaryCollapsed ? '58px' : '218px' }} // 一级64px + 二级160px = 224px (减去按钮自身宽度的一半)
      >
        <button
          onClick={() => setIsSecondaryCollapsed(!isSecondaryCollapsed)}
          className="w-5 h-8 bg-white border border-neutral-200/80 rounded-r-md shadow-md flex items-center justify-center hover:bg-neutral-50 hover:text-blue-600 active:scale-95 transition-all focus:outline-none"
          title={isSecondaryCollapsed ? "展开二级导航" : "折叠二级导航"}
        >
          {isSecondaryCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 3. 移动端自适应抽屉导航 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 md:hidden transition-opacity" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-[260px] h-full bg-white flex" onClick={e => e.stopPropagation()}>
            {/* 移动端一级 */}
            <div className="w-14 bg-[#001529] text-white flex flex-col items-center py-4 space-y-3">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold mb-4 text-xs">A</div>
              {MENU_DATA.map(menu => {
                const Icon = menu.icon;
                return (
                  <button 
                    key={menu.id}
                    onClick={() => handlePrimaryClick(menu.id)}
                    className={`p-2.5 rounded-lg transition-colors ${menu.id === activePrimary ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
            {/* 移动端二级 */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-800">{currentPrimaryMenu.label}中心</span>
                <button className="text-[11px] text-neutral-400" onClick={() => setMobileMenuOpen(false)}>关闭</button>
              </div>
              <div className="p-2 overflow-y-auto flex-1 space-y-3">
                {currentPrimaryMenu.groups.map(g => (
                  <div key={g.id} className="space-y-1">
                    <div className="text-[10px] font-bold text-neutral-400 px-2 uppercase">{g.label}</div>
                    {g.items.map(i => (
                      <button
                        key={i.id}
                        onClick={() => {
                          setActiveTertiary(i.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${i.id === activeTertiary ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-neutral-600'}`}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 右侧内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 顶部全局导航栏 */}
        <header className="h-16 bg-white border-b border-neutral-200/80 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden p-1.5 rounded-lg border border-neutral-200 text-neutral-600"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* 精准面包屑 Breadcrumbs */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-neutral-400 select-none">
              <span className="hover:text-neutral-600 cursor-pointer">控制台</span>
              <span>/</span>
              <span className="hover:text-neutral-600 cursor-pointer">{currentActiveItem.primary.label}中心</span>
              <span>/</span>
              <span className="text-neutral-500 font-medium">{currentActiveItem.group.label}</span>
              <span>/</span>
              <span className="text-blue-600 font-medium">{currentActiveItem.item.label}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 极简折叠状态说明提示 */}
            <div className="hidden lg:flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200/60">
              <span className="font-semibold">极简双栏：</span>
              <span>一级宽度约 64px，二级 160px。点击边界浮动按钮，可以折叠整栏。</span>
            </div>

            {/* 模拟环境 */}
            <div className="hidden sm:flex items-center text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1.5 rounded border border-neutral-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              <span>华东中心-生产集群</span>
            </div>

            <hr className="h-4 w-[1px] bg-neutral-200" />

            {/* 用户头像 */}
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                李
              </div>
              <span className="text-xs text-neutral-600 font-medium group-hover:text-blue-600 transition-colors">李经理</span>
            </div>
          </div>
        </header>

        {/* 动态主画布 */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 🌟 优化后的标题区域 (根据用户要求移除了面包屑小字路径、英文ID名、以及副标题描述) */}
          <div className="bg-white p-5 rounded-lg border border-neutral-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
                {currentActiveItem.item.label}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              <button className="flex items-center text-xs bg-white text-neutral-600 px-3 py-1.5 border border-neutral-200 rounded hover:bg-neutral-50 active:scale-95 transition-all">
                <RefreshCw className="w-3 h-3 mr-1.5" />
                刷新视图
              </button>
            </div>
          </div>

          {/* 🌟 核心分流：如果是"订单"大类，展示专业的【订单管理】工作区 */}
          {activePrimary === 'orders' ? (
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
              {/* 订单搜索控制面板 */}
              <div className="p-5 border-b border-neutral-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-1 h-3.5 bg-blue-600 rounded" />
                    <h3 className="text-sm font-bold text-neutral-800">全网订单动态追踪</h3>
                  </div>
                  
                  {/* 按钮操作组 */}
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center text-xs text-neutral-600 bg-white border border-neutral-200 px-3 py-1.5 rounded hover:bg-neutral-50">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      导出对账单
                    </button>
                    <button className="flex items-center text-xs text-white bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700 font-semibold shadow-sm shadow-blue-500/10">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      创建新订单
                    </button>
                  </div>
                </div>

                {/* 筛选输入网格 */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400" />
                    <input 
                      type="text" 
                      placeholder="搜索单号/买家/手机" 
                      value={orderSearchText}
                      onChange={(e) => setOrderSearchText(e.target.value)}
                      className="w-full text-xs pl-8 pr-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700"
                    />
                  </div>
                  <div>
                    <select className="w-full text-xs p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-600 focus:outline-none focus:border-blue-500">
                      <option>所有下单渠道</option>
                      <option>淘宝旗舰店</option>
                      <option>京东自营</option>
                      <option>抖音直播</option>
                      <option>官网商城</option>
                    </select>
                  </div>
                  <div>
                    <input type="date" className="w-full text-xs p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-500 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex items-center justify-end">
                    <button 
                      onClick={() => { setOrderSearchText(''); setOrderFilterStatus('全部'); }}
                      className="text-xs text-neutral-400 hover:text-blue-600 transition-colors"
                    >
                      清空筛选条件
                    </button>
                  </div>
                </div>
              </div>

              {/* 订单状态分层选卡 (Tab 页签) */}
              <div className="flex space-x-6 px-5 border-b border-neutral-100 text-xs">
                {['全部', '待付款', '待发货', '已发货', '已完成', '退款中'].map((status) => {
                  const isActive = orderFilterStatus === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setOrderFilterStatus(status)}
                      className={`py-3 relative font-medium transition-all ${
                        isActive ? 'text-blue-600 font-semibold' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      {status}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 订单核心表格明细 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-600 border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold select-none">
                      <th className="py-3 px-5">订单编号</th>
                      <th className="py-3 px-4">下单时间</th>
                      <th className="py-3 px-4">买家主体信息</th>
                      <th className="py-3 px-4">交易源渠道</th>
                      <th className="py-3 px-4">实付总金额</th>
                      <th className="py-3 px-4">当前履约状态</th>
                      <th className="py-3 px-5 text-right">行为操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {displayOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-neutral-400">
                          暂无符合当前过滤状态的订单数据
                        </td>
                      </tr>
                    ) : (
                      displayOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-50/40 transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-neutral-800 font-mono">
                            {order.id}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                            {order.time}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-neutral-800">{order.user}</div>
                            <div className="text-[10px] text-neutral-400">{order.phone}</div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-500 font-medium">
                            {order.channel}
                          </td>
                          <td className="py-3.5 px-4 font-semibold font-mono text-neutral-900 text-[13px]">
                            {order.price}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              order.statusColor === 'green' ? 'bg-green-50 text-green-700 border-green-100' :
                              order.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              order.statusColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              order.statusColor === 'red' ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}>
                              <span className={`w-1 h-1 rounded-full mr-1.5 ${
                                order.statusColor === 'green' ? 'bg-green-500' :
                                order.statusColor === 'amber' ? 'bg-amber-500' :
                                order.statusColor === 'blue' ? 'bg-blue-500' :
                                order.statusColor === 'red' ? 'bg-red-500' :
                                'bg-neutral-500'
                              }`} />
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right text-blue-600 font-medium space-x-3">
                            <button className="hover:underline hover:text-blue-700">处理</button>
                            <button className="hover:underline text-neutral-400">日志</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 分页控制 */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-neutral-500 text-[11px]">
                <span>共显示 {displayOrders.length} 个订单项</span>
                <div className="flex space-x-1">
                  <button className="px-2 py-0.5 border border-neutral-200 rounded bg-white text-neutral-400 cursor-not-allowed">上页</button>
                  <button className="px-2 py-0.5 border border-neutral-200 rounded bg-blue-600 text-white font-medium">1</button>
                  <button className="px-2 py-0.5 border border-neutral-200 rounded bg-white hover:bg-neutral-50 text-neutral-700">下页</button>
                </div>
              </div>
            </div>
          ) : (
            /* 5. 否则默认渲染：常规【仪表盘和运维观测】工作区 */
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* 左侧大栏看板 */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* 关键基础数据卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-neutral-200/80 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400 font-medium">总日活跃用户 (UV)</p>
                      <p className="text-xl font-bold font-mono text-neutral-900 mt-1">142,830</p>
                      <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium mt-1 inline-flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.5% 周环比
                      </span>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-neutral-200/80 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400 font-medium">服务并发吞吐量 (QPS)</p>
                      <p className="text-xl font-bold font-mono text-neutral-900 mt-1">1,248 /s</p>
                      <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium mt-1 inline-flex items-center">
                        <ArrowDownRight className="w-3 h-3 mr-0.5" /> -3.2% 异常波动
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-neutral-200/80 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400 font-medium">核心营销转化率</p>
                      <p className="text-xl font-bold font-mono text-neutral-900 mt-1">14.82%</p>
                      <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium mt-1 inline-flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" /> +2.1% 运营提升
                      </span>
                    </div>
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 当前联动路由承载物理链路表 */}
                <div className="bg-white rounded-lg border border-neutral-200/80 shadow-sm overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-1 h-3.5 bg-blue-600 rounded" />
                      <h3 className="text-xs font-bold text-neutral-800">当前联动业务项观测表</h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-600 border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-150 text-neutral-500 font-semibold select-none">
                          <th className="py-2.5 px-4">关联对象</th>
                          <th className="py-2.5 px-4">模块物理路径</th>
                          <th className="py-2.5 px-4">实时运行状态</th>
                          <th className="py-2.5 px-4">上次操作时间</th>
                          <th className="py-2.5 px-4 text-right">操作行为</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        <tr className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-neutral-800 flex items-center space-x-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <span>核心主数据网格_v1</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-500">{currentActiveItem.primary.id} / {currentActiveItem.item.id}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium text-[10px]">Healthy 运行中</span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400">10分钟前</td>
                          <td className="py-3 px-4 text-right text-blue-600 space-x-3">
                            <button className="hover:underline">配置</button>
                            <button className="hover:underline text-neutral-400">日志</button>
                          </td>
                        </tr>
                        <tr className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-neutral-800 flex items-center space-x-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <span>异步计算流通道_7</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-500">{currentActiveItem.primary.id} / {currentActiveItem.group.id}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium text-[10px]">Healthy 运行中</span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400">1小时前</td>
                          <td className="py-3 px-4 text-right text-blue-600 space-x-3">
                            <button className="hover:underline">配置</button>
                            <button className="hover:underline text-neutral-400">日志</button>
                          </td>
                        </tr>
                        <tr className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-neutral-800 flex items-center space-x-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>多可用区部署负载均衡</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-500">infrastructure / k8s</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium text-[10px]">Warning 延迟偏高</span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400">3小时前</td>
                          <td className="py-3 px-4 text-right text-blue-600 space-x-3">
                            <button className="hover:underline">调配</button>
                            <button className="hover:underline text-neutral-400">分析</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* 右侧设计详解 */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-lg border border-neutral-200/80 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <FolderTree className="w-4 h-4" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Ant Style 尺寸规范</h3>
                  </div>
                  
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    为了在有限的高信息负荷工作区中提供更沉浸的使用体验，我们严格限制了双栏的占用尺寸：
                  </p>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 bg-[#001529] text-white text-[9px] font-bold rounded flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-800">一级窄暗栏 (64px)</h4>
                        <p className="text-[11px] text-neutral-400">微缩的宽度搭配二字小标题，极大节省横向视网膜扫视距离。</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 bg-neutral-100 text-neutral-600 text-[9px] font-bold rounded flex items-center justify-center shrink-0 mt-0.5 border border-neutral-200">2</div>
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-800">二级柔白长条 (160px)</h4>
                        <p className="text-[11px] text-neutral-400">紧凑干练，支持局部小类折叠展开和整栏收纳。</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 bg-blue-50 text-blue-600 text-[9px] font-bold rounded flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">3</div>
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-800">一键整栏折叠 (收放自如)</h4>
                        <p className="text-[11px] text-neutral-400">通过边缘悬浮的 Chevron 钮将二级整体折叠为 0，释放宽广的表格画布。</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="bg-neutral-50 p-2.5 rounded border border-neutral-100 text-[10px] text-neutral-500 font-mono space-y-0.5">
                      <div className="flex justify-between">
                        <span>二级菜单宽度:</span>
                        <span className="font-semibold text-neutral-700">160 px (精简)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>当前整栏折叠:</span>
                        <span className="font-semibold text-blue-600">{isSecondaryCollapsed ? '已折叠 (w-0)' : '展开中 (w-[160px])'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#001529] to-[#002140] p-5 rounded-lg text-white shadow-md relative overflow-hidden">
                  <h3 className="text-xs font-bold mb-2 flex items-center uppercase tracking-wide">
                    <Sliders className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                    高保真交互模拟
                  </h3>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    您可以放心使用本组件进行线上汇报或直接嵌入前端项目中。支持完整的二级折叠逻辑、实时多条件订单检索分流、一键过滤，已排除所有高负载视觉杂音。
                  </p>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}