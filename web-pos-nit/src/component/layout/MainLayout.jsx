import React, { useEffect, useState } from "react";
import { Breadcrumb, Button, Dropdown, Input, Layout, Menu, Tag, theme, Drawer, Divider, Space } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./MainLayout.css";
import logo from "../../assets/coffee.png";
import ImgUser from "../../assets/profile.png";
import { Tooltip } from "antd";
import { MdOutlineMarkEmailUnread, MdRestaurantMenu } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";
import { LockOutlined, MenuOutlined, UnlockOutlined } from "@ant-design/icons";
import {
  getPermission,
  getProfile, // Keep getProfile from profile.store.js for initial load if needed
  setAcccessToken,
  setPermission, // Keep setPermission from profile.store.js
} from "../../store/profile.store";
import { useProfileStore } from "../../store/profileStore"; // Import the new store
import { request } from "../../util/helper";
import { useUIStore } from "../../store/uiStore";
import { configStore } from "../../store/configStore";
import { FaShop } from "react-icons/fa6";
import {
  PieChartOutlined,
  DesktopOutlined,
  FileOutlined,
  ShopOutlined,
  FileProtectOutlined,
  SolutionOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  DollarOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CreditCardOutlined,
  SmileOutlined,
  TeamOutlined,
  GlobalOutlined,
  SettingOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
function cn(...inputs) { return twMerge(clsx(inputs)); }
import { Config } from "../../util/config";
import { FaHistory } from "react-icons/fa";
import { Alert, Select } from "antd";
import dayjs from "dayjs";
import { useLanguage, translations } from "../../store/language.store";
const { Header, Content, Footer, Sider } = Layout;

// Menu keys used for mapping translations
const MENU_STRUCTURE = [
  {
    key: "dashboard",
    labelKey: "dashboard",
    icon: <PieChartOutlined />,
  },
  {
    key: "invoices",
    labelKey: "pos",
    icon: <MdRestaurantMenu />,
  },
  {
    key: "order",
    labelKey: "order_detail",
    icon: <FaHistory />,
  },

  {
    key: "inventory",
    labelKey: "inventory",
    icon: <ShoppingCartOutlined />,
    children: [
      { key: "purchase", labelKey: "purchase", icon: <ShoppingCartOutlined /> },
      { key: "supplier", labelKey: "supplier", icon: <TeamOutlined /> },
      { key: "raw_material", labelKey: "raw_material", icon: <FileProtectOutlined /> },
      { key: "stock", labelKey: "stock", icon: <FileProtectOutlined /> },
    ]
  },

  {
    key: "shop_managment",
    labelKey: "shop_managment",
    icon: <FaShop />,
  },
  {
    key: "table",
    labelKey: "table",
    icon: <DesktopOutlined />,
  },
  {
    key: "product",
    labelKey: "product",
    icon: <ShopOutlined />,
  },
  {
    key: "category",
    labelKey: "category",
    icon: <SolutionOutlined />,
  },

  {
    key: "staff",
    labelKey: "staff_roles",
    icon: <UsergroupAddOutlined />,
    children: [
      { key: "user", labelKey: "user", icon: <UserOutlined /> },
      { key: "role", labelKey: "roles", icon: <SafetyCertificateOutlined /> },
      { key: "permission", labelKey: "permission", icon: <UnlockOutlined /> },
      { key: "plans", labelKey: "plans", icon: <CreditCardOutlined /> },
    ],
  },
  {
    key: "reports",
    labelKey: "reports",
    icon: <FileOutlined />,
    children: [
      { key: "report_Sale_Summary", labelKey: "sales_report", icon: <PieChartOutlined /> },
      { key: "expense", labelKey: "expenses", icon: <DollarOutlined /> },
      { key: "Top_Sale", labelKey: "best_sellers", icon: <TrophyOutlined /> },
    ],
  },
  {
    key: "settings",
    labelKey: "settings",
    icon: <SettingOutlined />,
  },
  {
    key: "business",
    labelKey: "business",
    icon: <GlobalOutlined />,
    style: { background: '#fff9ef', margin: '4px 8px', borderRadius: '8px', color: '#c0a060', fontWeight: 'bold' }
  },
];


const MainLayout = () => {
  const { lang, setLang } = useLanguage();
  const t = translations[lang];
  const [permision, setPermision] = useState([]);
  const [subAlert, setSubAlert] = useState(null);
  const { setConfig } = configStore();
  const { profile, setProfile: setProfileStore } = useProfileStore(); // Use reactive profile from the store
  const { isFullScreen, setFullScreen } = useUIStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  useEffect(() => {
    const list = getPermission();
    setPermision(Array.isArray(list) ? list : []);
    checkSubscriptionStatus();

    // Auto-exit full screen if not on invoices page
    if (isFullScreen && !location.pathname.includes('/invoices')) {
      setFullScreen(false);
    }
  }, [location.pathname]);

  const checkSubscriptionStatus = async () => {
    // Only check if logged in and NOT the system admin (Business ID 1)
    if (!profile || profile.business_id === 1) return;
    const res = await request("my-plan", "get");
    if (res && res.success && res.plan?.subscription) {
      const sub = res.plan.subscription;
      if (sub.is_lifetime) return;

      const expiry = dayjs(sub.end_date);
      const daysLeft = expiry.diff(dayjs(), 'day');

      if (daysLeft < 0) {
        setSubAlert({ type: 'error', msg: `Your subscription expired on ${expiry.format("DD MMM")}. Renew now to restore full access.` });
      } else if (daysLeft <= 7) {
        setSubAlert({ type: 'warning', msg: `Package expiring in ${daysLeft} days. Consider extending your subscription.` });
      } else {
        setSubAlert(null);
      }
    }
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Auto-collapse sidebar on tablet and mobile
      if (width < 1024) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!profile || profile === "" || profile === "null") {
      navigate("/customer");
      return;
    }
    checkISnotPermissionViewPage();
    getMenuByUser();
    getConfig();

    // Set selected menu item based on current path
    const currentPath = location.pathname.replace(/^\/+|\/+$/g, '');
    setSelectedKeys([currentPath || "dashboard"]);

    // Auto-expand parent menus for selected item
    const findParentKey = (menuItems, targetKey) => {
      for (const item of menuItems) {
        if (item.children) {
          const found = item.children.find(child => child.key === targetKey);
          if (found) {
            return item.key;
          }
        }
      }
      return null;
    };

    const items_menu = MENU_STRUCTURE.map(item => ({
      ...item,
      label: t[item.labelKey],
      children: item.children ? item.children.map(child => ({
        ...child,
        label: t[child.labelKey]
      })) : undefined
    }));

    const parentKey = findParentKey(items_menu, currentPath);
    if (parentKey) {
      setOpenKeys([parentKey]);
    }
  }, [location.pathname, lang]);

  const checkISnotPermissionViewPage = () => {
    // Guard: if no profile or permissions loaded yet, don't redirect
    if (!profile || !permision || permision.length === 0) return;

    const currentPath = location.pathname;

    // always allow profile page for everyone (they need to edit their own info)
    if (currentPath === '/profile') return;

    // Special Case: always allow business page for system admin (Business ID 1)
    if (currentPath === '/business' && profile?.business_id === 1) return;

    // Check if the route is allowed for the user
    const findIndex = permision.findIndex((item) => {
      if (!item.web_route_key) return false;
      const p1 = item.web_route_key.toLowerCase().replace(/^\/+|\/+$/g, '');
      const p2 = currentPath.toLowerCase().replace(/^\/+|\/+$/g, '');

      // Check for exact match or prefix match (for sub-routes like /product/edit/1)
      if ((p1 === "" || p1 === "dashboard") && (p2 === "" || p2 === "dashboard")) return true;
      
      return p1 === p2 || p2.startsWith(p1 + "/");
    });

    if (findIndex === -1) {
      // If it's the root/dashboard, allow if they are OWNER/SuperAdmin by default
      if ((currentPath === "/" || currentPath === "/dashboard") && (profile?.business_id === 1 || profile?.is_super_admin === 1)) {
        return;
      }

      // Final fallback for Super Admin (Business ID 1)
      if (profile?.business_id === 1 && (currentPath === "/business" || currentPath === "/plans")) {
        return;
      }

      console.warn(`Unauthorized access attempt to: ${currentPath}. Redirecting...`);
      // Redirect to dashboard or first allowed page
      if (permision[0] && permision[0].web_route_key) {
        navigate(permision[0].web_route_key);
      } else {
        navigate("/dashboard");
      }
    }
  };

  // Reactive menu filtering
  const items = React.useMemo(() => {
    if (!permision || !Array.isArray(permision)) return [];

    const items_menu = MENU_STRUCTURE.map(item => ({
      ...item,
      label: t[item.labelKey],
      children: item.children ? item.children.map(child => ({
        ...child,
        label: t[child.labelKey]
      })) : undefined
    }));

    return items_menu.map(item => {
      const newItem = { ...item };

      // 1. Contextual Visibility Rules
      if (newItem.key === "business" && profile?.business_id !== 1) return null;
      if (newItem.key === "my-plan" && profile?.business_id === 1) return null;

      // Hide Shop Operations for SaaS Owner (Business ID 1)
      const shopOps = ["order", "inventory", "table", "product", "category", "shop_managment", "invoices", "pos", "expense", "report"];
      if (profile?.business_id === 1 && (shopOps.includes(newItem.key) || shopOps.some(op => newItem.key?.includes(op)))) {
        return null;
      }

      // Helper to check permission safely
      const checkPath = (key) => {
        if (!key && key !== "") return false;
        const targetPath = (key === "" || key === "dashboard") ? "/" : "/" + key;
        return permision.some(p => {
          if (!p.web_route_key) return false;
          // Normalize both paths: lowercase and remove trailing/leading slashes for comparison
          const p1 = p.web_route_key.toLowerCase().replace(/^\/+|\/+$/g, '');
          const p2 = targetPath.toLowerCase().replace(/^\/+|\/+$/g, '');

          // Special Case: "" (root) and "dashboard" are often used interchangeably
          if ((p1 === "" || p1 === "dashboard") && (p2 === "" || p2 === "dashboard")) return true;

          return p1 === p2;
        });
      };

      // Case 1: Simple menu item (no children)
      if (newItem.hasOwnProperty('key') && !newItem.children) {
        if (newItem.key === "business") return profile?.business_id === 1 ? newItem : null;

        if (newItem.key === "dashboard") {
          if (profile?.business_id === 1) return newItem;
        }

        return checkPath(newItem.key) ? newItem : null;
      }

      // Case 2: Parent menu with children
      if (newItem.children) {
        const filteredChildren = newItem.children.filter(child => {
          if (child.key === "plans") return profile?.business_id === 1;
          return checkPath(child.key);
        });

        if (filteredChildren.length > 0) {
          return { ...newItem, children: filteredChildren };
        }
      }

      return null;
    }).filter(Boolean);
  }, [permision, profile, lang]);

  const getMenuByUser = () => {
    // This function is now redundant due to useMemo
    // but we keep the signature if called elsewhere
  };

  const getConfig = async () => {
    const res = await request("config", "get");
    if (res) {
      setConfig(res);
    }
  };

  const onClickMenu = (item) => {
    navigate("/" + item.key);
    setSelectedKeys([item.key]);
    // Close mobile drawer after navigation
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  const onLoginOut = () => {
    setProfileStore(null); // Updated: Clear Zustand store (which also clears localStorage)
    setAcccessToken("");
    localStorage.removeItem("permission");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerVisible(!mobileDrawerVisible);
  };

  if (!profile) {
    return null;
  }

  const itemsDropdown = [
    {
      key: "profile",
      label: `${t.profile} / ${translations.kh.profile}`,
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: "logout",
      danger: true,
      label: `${t.logout} / ${translations.kh.logout}`,
      icon: <LockOutlined />,
    },
  ];


  // Calculate responsive margins and dimensions
  const getSiderWidth = () => {
    if (isMobile) return 0;
    return collapsed ? 80 : 280;
  };

  const getContentMargin = () => {
    if (isFullScreen) return 0;
    if (isMobile) return 0;
    return getSiderWidth();
  };

  const getHeaderPadding = () => {
    if (isMobile) return '0 12px';
    if (isTablet) return '0 16px';
    return '0 24px';
  };

  const getContentPadding = () => {
    if (isMobile) return '12px';
    if (isTablet) return '16px';
    return '24px';
  };

  // Sidebar component (reusable for both desktop sidebar and mobile drawer)
  const SidebarContent = () => (
    <>
      <div className="admin-header-g1">
        <img
          src={(profile?.business_logo && typeof profile.business_logo === "string" && profile.business_logo.trim() !== "" && profile.business_logo !== "null" && profile.business_logo !== "undefined") ? Config.getFullImagePath(profile.business_logo) : logo}
          alt="Logo"
          className="admin-logo"
          style={{
            height: isMobile ? "80px" : collapsed ? "60px" : "130px",
            objectFit: "contain",
            transition: "height 0.3s"
          }}
        />
      </div>
      <Menu
        theme="light"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        mode="inline"
        items={items}
        onClick={onClickMenu}
        onOpenChange={onOpenChange}
        style={{
          background: "transparent",
          border: "none",
          height: isMobile ? "calc(100vh - 120px)" : "calc(100vh - 120px)",
          overflowY: "auto",
          fontSize: isMobile ? "14px" : "inherit"
        }}
        inlineCollapsed={!isMobile && collapsed}
      />
    </>
  );

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "#f4f1eb",
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && !isFullScreen && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
          style={{
            background: "#ffffff",
            borderRight: "1px solid #e8e3d8",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
          }}
          width={280}
          collapsedWidth={80}
          breakpoint="lg"
        >
          <SidebarContent />
        </Sider>
      )}


      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title={null}
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          width={280}
          bodyStyle={{
            padding: 0,
            background: "#f8f9fa"
          }}
          headerStyle={{ display: 'none' }}
        >
          <SidebarContent />
        </Drawer>
      )}

      <Layout style={{
        marginLeft: getContentMargin(),
        transition: "margin-left 0.3s",
        background: "#f4f1eb"
      }}>
        {/* Header */}
        {!isFullScreen && (
          <div
            className="admin-header"
            style={{
              background: "#ffffff",
              borderBottom: "1px solid #e8e3d8",
              padding: getHeaderPadding(),
              height: isMobile ? "60px" : "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              zIndex: 999,
              boxShadow: "0 2px 10px rgba(30, 74, 45, 0.05)",
            }}
          >
            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={toggleMobileDrawer}
                style={{
                  fontSize: "18px",
                  width: 40,
                  height: 40,
                }}
              />
            )}

              {/* Header Right Content */}
              <div
                className="admin-header-g2"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "12px" : "24px",
                  marginLeft: "auto",
                }}
              >
                {/* 🚀 Quick Actions Group */}


                {/* 💎 Premium Feature / Branch Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {!isMobile && profile?.business_id !== 1 && (
                    <Button
                      type="primary"
                      size="middle"
                      icon={<CrownOutlined />}
                      onClick={() => navigate('/my-plan')}
                      className={cn(
                        "premium-upgrade-btn",
                        profile?.plan_id >= 3 && "gold-gradient",
                        profile?.plan_id === 2 && "emerald-gradient"
                      )}
                      style={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
                        fontWeight: 700,
                        fontSize: '11px',
                        height: '38px',
                        padding: '0 16px',
                        background: '#1e4a2d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {profile?.plan_id === 1 ? "UPGRADE" : (profile?.plan_id === 2 ? "PRO" : "PREMIUM")}
                    </Button>
                  )}

                  {!isMobile && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      borderLeft: '1px solid #f1f3f5',
                      paddingLeft: '16px',
                      marginLeft: '4px',
                      minWidth: '120px'
                    }}>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: 800, 
                        color: '#1e4a2d',
                        lineHeight: 1.2
                      }}>
                        {profile?.business_name || "Green Grounds"}
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: '#95a5a6', 
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase',
                        marginTop: '2px'
                      }}>
                        {profile?.branch_name || "Main Branch"}
                      </div>
                    </div>
                  )}
                </div>

                {/* 👤 User Profile Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* User Badge - Hidden on small mobile */}
                  {!isMobile && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#2d3436', fontSize: '13px', lineHeight: 1.2 }}>
                        {profile?.name}
                      </div>
                      <Tag
                        color={profile?.business_id === 1 ? "gold" : (profile?.role_code === 'owner' ? "blue" : "#34495e")}
                        style={{
                          fontSize: '9px',
                          borderRadius: '10px',
                          padding: '0 8px',
                          marginTop: '4px',
                          border: 'none',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}
                      >
                        {profile?.business_id === 1 ? (t.executives || "Admin") : (profile?.role_name || "Staff")}
                      </Tag>
                    </div>
                  )}

                  {/* Language Switcher */}
                  <div
                    className="lang-switcher-container"
                    onClick={() => setLang(lang === 'en' ? 'kh' : 'en')}
                    style={{ transform: isMobile ? 'scale(0.85)' : 'none' }}
                  >
                    <div className={`lang-toggle-handle ${lang}`}>
                      <span className="lang-flag-emoji">
                        {lang === 'en' ? '🇺🇸' : '🇰🇭'}
                      </span>
                    </div>
                    <div className="lang-labels">
                      <span className={`lang-label ${lang === 'en' ? 'active' : ''}`}>EN</span>
                      <span className={`lang-label ${lang === 'kh' ? 'active' : ''}`}>KH</span>
                    </div>
                  </div>

                  {/* Profile Dropdown */}
                  <Dropdown
                    menu={{
                      items: itemsDropdown,
                      onClick: (event) => {
                        if (event.key === "logout") onLoginOut();
                        else if (event.key === "profile") navigate('/profile');
                      },
                    }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <div className="profile-wrapper" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          className="img-user-premium"
                          src={(profile?.profile_image && typeof profile.profile_image === "string" && profile.profile_image.trim() !== "" && profile.profile_image !== "null" && profile.profile_image !== "undefined") ? Config.getFullImagePath(profile.profile_image) : ImgUser}
                          alt={profile?.name}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 10,
                          height: 10,
                          background: '#2ecc71',
                          border: '2px solid #fff',
                          borderRadius: '50%'
                        }} />
                      </div>
                      {!isMobile && <span style={{ color: '#b2bec3', fontSize: 10, marginLeft: 8 }}>▼</span>}
                    </div>
                  </Dropdown>
                </div>
              </div>
          </div>
        )}

        {/* Content */}
        <Content
          style={{
            margin: getContentPadding(),
            background: "transparent",
            minHeight: `calc(100vh - ${isMobile ? '120px' : '140px'})`,
          }}
        >
          <div
            className="admin-body"
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e8e3d8",
              padding: getContentPadding(),
              boxShadow: isMobile ? "0 2px 8px rgba(30, 74, 45, 0.03)" : "0 4px 12px rgba(30, 74, 45, 0.05)",
              minHeight: `calc(100vh - ${isMobile ? '160px' : '180px'})`,
            }}
          >
            {subAlert && (
              <Alert
                type={subAlert.type}
                message={subAlert.msg}
                banner
                closable
                onClose={() => setSubAlert(null)}
                style={{ marginBottom: 20, borderRadius: '8px' }}
                action={
                  <Button size="small" type="primary" ghost onClick={() => navigate('/my-plan')}>
                    Subscription Details
                  </Button>
                }
              />
            )}
            <Outlet />
          </div>
        </Content>

        <Footer
          style={{
            textAlign: 'center',
            background: "transparent",
            color: "#6b7c6b",
            padding: isMobile ? "12px" : "16px 24px",
            fontSize: isMobile ? "12px" : "13px",
          }}
        >
          ©{new Date().getFullYear()}
          <span className="khmer-text"> Created by Team IT ស្រុកស្រែ</span>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;