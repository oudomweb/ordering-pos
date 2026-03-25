// pages/OrderPage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Row,
  Col,
  Card,
  Statistic,
  Tabs,
  Badge,
  Tooltip,
  Typography,
  Avatar,
  Divider,
  Empty,
  Image,
  notification,
  InputNumber,
} from "antd";
import { useReactToPrint } from "react-to-print";
import PrintShiftReport from "../../component/pos/PrintShiftReport";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MoreOutlined,
  ExportOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShopOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDateClient, formatDateServer, isPermission, request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import { useProfileStore } from "../../store/profileStore";
import { useLanguage, translations } from "../../store/language.store";
import { useExchangeRate } from "../../component/pos/ExchangeRateContext";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

function OrderPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [summary, setSummary] = useState({
    total_order: 0,
    total_amount: 0,
    total_cash: 0,
    total_aba: 0,
    total_wing: 0,
    total_qty: 0,
    total_expense: 0,
    total_cash_expense: 0,
    top_products: []
  });
  const [loading, setLoading] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [openingCashKHR, setOpeningCashKHR] = useState(0);
  const [actualCash, setActualCash] = useState(0);
  const [actualCashKHR, setActualCashKHR] = useState(0);
  const [remark, setRemark] = useState("");
  const [currentShift, setCurrentShift] = useState(null); // 🏁 Track current open shift
  const [visibleOpenShiftModal, setVisibleOpenShiftModal] = useState(false);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const refShiftReport = useRef(null);
  const { profile } = useProfileStore();
  const isOwner = profile?.role_name?.toUpperCase() === "OWNER" || profile?.role_code === "owner";
  const isAdmin = profile?.role_name?.toUpperCase().includes("ADMIN") || profile?.role_code === "admin";
  const canSeeAllReports = isOwner || isAdmin; 
  const { exchangeRate } = useExchangeRate();

  const handlePrintShift = useReactToPrint({
    contentRef: refShiftReport,
  });

  const getCurrentShift = async () => {
    try {
      const res = await request("shift/current", "get");
      if (res && res.success && res.data) {
        setCurrentShift(res.data);
        setOpeningCash(Number(res.data.opening_cash_usd || 0).toFixed(2));
        setOpeningCashKHR(Number(res.data.opening_cash_khr || 0).toFixed(0));
      } else {
        setCurrentShift(null);
        // If no shift is open, we might want to prompt the user to open one
        setVisibleOpenShiftModal(true);
      }
    } catch (error) {
      console.error("Error getting current shift:", error);
    }
  };

  const onOpenShift = async (values) => {
    try {
      const data = {
        opening_cash_usd: values.opening_cash_usd || 0,
        opening_cash_khr: values.opening_cash_khr || 0,
      };
      const res = await request("shift/open", "post", data);
      if (res && res.success) {
        message.success(res.message);
        setVisibleOpenShiftModal(false);
        getCurrentShift(); // Refresh to get the shift ID
      } else {
        message.warning(res.message);
      }
    } catch (error) {
       console.error(error);
       message.error("Failed to open shift");
    }
  };

  const onSaveShift = async () => {
    try {
      const expected_cash_usd = Number(openingCash) + (Number(openingCashKHR) / exchangeRate) + Number(summary.total_cash || 0) - Number(summary.total_cash_expense || 0);
      const actual_total_usd = Number(actualCash) + (Number(actualCashKHR) / exchangeRate);
      const diff_usd = actual_total_usd - expected_cash_usd;

      const data = {
        id: currentShift?.id, // Use existing shift ID for closing
        opening_cash_usd: openingCash,
        opening_cash_khr: openingCashKHR,
        actual_cash_usd: actualCash,
        actual_cash_khr: actualCashKHR,
        expected_cash_usd: expected_cash_usd,
        total_sales_usd: summary.total_amount,
        total_cash_usd: summary.total_cash,
        total_aba_usd: summary.total_aba,
        total_wing_usd: summary.total_wing,
        total_expense_usd: summary.total_expense,
        diff_usd: diff_usd,
        remark: remark
      };

      const res = await request("shift", "post", data);
      if (res && res.success) {
        message.success(res.message);
        handlePrintShift();
        getCurrentShift(); // Check for next shift
        getShiftHistory(); // Refresh history
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to save shift");
    }
  };

  const [state, setState] = useState({
    visibleModal: false,
    visibleExpenseModal: false,
    txtSearch: "",
    activeTab: "all",
  });

  // Determine default user filter: Owners/Admins see "All", Staff sees themselves
  const defaultUserId = canSeeAllReports ? "" : (profile?.id || profile?.user_id || "");

  const [filter, setFilter] = useState({
    from_date: dayjs(), // Default to Today
    to_date: dayjs(),
    user_id: defaultUserId, 
  });

  // 🧠 Fetch Orders - Fixed to match backend response
  const getList = async () => {
    setLoading(true);
    try {
      const user_id = filter.user_id;
      const params = {
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        txtSearch: state.txtSearch,
        user_id: user_id
      };

      // Standardized API endpoint to match backend route
      const res = await request(`order`, "get", params);
      if (res && res.list) {
        setList(res.list || []);
        setSummary(res.summary || { total_order: 0, total_amount: 0 });
      } else {
        console.warn("Unexpected response format:", res);
        setList([]);
        setSummary({ total_order: 0, total_amount: 0 });
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      message.error(t.no_data);
      setList([]);
      setSummary({ total_order: 0, total_amount: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fixed getOrderDetail function to match backend response
  const getOrderDetail = async (data) => {
    setLoading(true);
    try {
      const res = await request(`order/${data.id}`, "get");

      if (res) {
        const orderItems = res.list || res.items || res.details || [];
        const orderInfo = res.order || res.data || data;

        if (orderItems.length > 0 || orderInfo) {
          setOrderDetail(orderItems);
          setCurrentOrder(orderInfo);
          setState(prev => ({ ...prev, visibleModal: true }));
        } else {
          message.warning(t.no_data);
        }
      } else {
        message.warning(t.no_data);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      message.error(t.failed);
    } finally {
      setLoading(false);
    }
  };

  const onSaveExpense = async (values) => {
    try {
      const data = {
        ...values,
        expense_date: formatDateServer(dayjs()), // Today
      };
      const res = await request("expense", "post", data);
      if (res && res.success) {
        message.success(res.message);
        setState(prev => ({ ...prev, visibleExpenseModal: false }));
        getList(); // Refresh summary
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to save expense");
    }
  };

  const onCloseModal = () => {
    formRef.resetFields();
    setOrderDetail([]);
    setCurrentOrder(null);
    setState(prev => ({ ...prev, visibleModal: false }));
  };

  const getShiftHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = {
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        user_id: filter.user_id,
      };
      const res = await request("shift", "get", params);
      if (res && res.list) {
        setShiftHistory(res.list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const profileUserId = profile?.id || profile?.user_id;

  // Sync filter.user_id with profile when profile loads
  useEffect(() => {
    if (profileUserId && !filter.user_id && !canSeeAllReports) {
      setFilter(prev => ({ ...prev, user_id: profileUserId }));
    }
  }, [profileUserId, canSeeAllReports]);

  useEffect(() => {
    if (profileUserId) {
      getList();
      getCurrentShift(); 
      getShiftHistory(); 
    }
  }, [profileUserId, filter.user_id, filter.from_date, filter.to_date]);

  const handleSearch = () => {
    getList();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      completed: 'green',
      cancelled: 'red',
      processing: 'blue',
      paid: 'green',
      unpaid: 'red'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  const getStatusText = (status) => {
    if (!status) return t.unknown;
    const statusMap = {
      pending: t.pending,
      paid: t.paid,
      cancelled: t.cancelled,
      completed: t.paid,
      processing: t.pending
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <div style={{
      padding: '24px',
      background: '#f4f6f8',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: '#2d3748', margin: 0 }}>
          <ShopOutlined style={{ marginRight: 12 }} />
          {t.daily_closing_title}
        </Title>
        <Text style={{ color: '#6b7280', fontSize: 16 }}>
          {t.daily_closing_desc}
        </Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card className="summary-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: '#6b7280' }}>{t.total_orders_label}</span>}
              value={summary.total_order}
              prefix={<ShoppingCartOutlined style={{ color: '#1e4a2d' }} />}
              valueStyle={{ color: '#1e4a2d', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <Card className="summary-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: '#6b7280' }}>{t.dash_cash}</span>}
              value={summary.total_cash}
              prefix={<DollarOutlined style={{ color: '#059669' }} />}
              precision={2}
              valueStyle={{ color: '#059669', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <Card className="summary-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: '#6b7280' }}>{t.dash_aba}</span>}
              value={summary.total_aba}
              prefix={<CheckCircleOutlined style={{ color: '#2563eb' }} />}
              precision={2}
              valueStyle={{ color: '#2563eb', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <Card className="summary-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: '#6b7280' }}>{t.dash_wing}</span>}
              value={Number(summary.total_wing) + Number(summary.total_other || 0)}
              prefix={<div style={{ 
                background: '#ca8a04', 
                color: '#fff', 
                width: 28, 
                height: 28, 
                borderRadius: 8, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 900
              }}>W</div>}
              precision={2}
              valueStyle={{ color: '#ca8a04', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <Card className="summary-card" style={{ background: '#ef4444' }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>{t.expenses}</span>}
              value={summary.total_expense}
              prefix={<ArrowDownOutlined style={{ color: '#fff' }} />}
              precision={2}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <Card className="summary-card" style={{ background: '#1e4a2d' }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: '#ffffffcc' }}>{t.net_profit}</span>}
              value={Number(summary.total_amount) - Number(summary.total_expense)}
              prefix={<DollarOutlined style={{ color: '#fff' }} />}
              precision={2}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
            <Card bodyStyle={{ padding: '8px 16px' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{t.top_selling_label}</div>
                {summary.top_products?.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span>{item.name}</span>
                        <Text strong>{item.total_qty} {t.items}</Text>
                    </div>
                ))}
                {(!summary.top_products || summary.top_products.length === 0) && <Text type="secondary" style={{fontSize: 10}}>No data</Text>}
            </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: 32 }}
      >
        {/* Tabs Control */}
        <Tabs defaultActiveKey="1" style={{ marginBottom: 24 }}>
          <TabPane 
            tab={<span><ClockCircleOutlined /> {t.tab_today}</span>} 
            key="1"
          >
            {/* Filter Header & Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <CalendarOutlined style={{ color: '#667eea', fontSize: 20 }} />
                <RangePicker
                  value={[filter.from_date, filter.to_date]}
                  onChange={(dates) => {
                    if (dates?.length === 2) {
                      setFilter(prev => ({
                        ...prev,
                        from_date: dates[0],
                        to_date: dates[1]
                      }));
                    }
                  }}
                  style={{ borderRadius: 8 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  icon={<ArrowDownOutlined />}
                  onClick={() => setState(prev => ({ ...prev, visibleExpenseModal: true }))}
                  style={{
                    borderRadius: 8,
                    height: 40,
                    color: '#ef4444',
                    borderColor: '#ef4444'
                  }}
                >
                  {t.add_expense_btn}
                </Button>
                
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  style={{
                    borderRadius: 8,
                    height: 40,
                  }}
                >
                  {t.export}
                </Button>
              </div>

              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  if (!currentShift) {
                    setVisibleOpenShiftModal(true);
                  } else {
                    onSaveShift();
                  }
                }}
                style={{
                  borderRadius: 8,
                  height: 40,
                  background: '#1e4a2d',
                  borderColor: '#1e4a2d'
                }}
              >
                {currentShift ? t.save_print_report : t.open_shift_btn}
              </Button>
            </div>

            <Divider style={{ margin: '32px 0' }} />

            {/* Filter Controls (Search Orders) */}
            <div style={{
              background: '#f8fafc',
              padding: 24,
              borderRadius: 16,
              marginBottom: 24
            }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12} md={8}>
                  <Input.Search
                    size="large"
                    allowClear
                    placeholder={t.search}
                    value={state.txtSearch}
                    onChange={(e) => setState(prev => ({ ...prev, txtSearch: e.target.value }))}
                    onSearch={handleSearch}
                    style={{ borderRadius: 8 }}
                    prefix={<SearchOutlined style={{ color: '#667eea' }} />}
                  />
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Select
                    size="large"
                    allowClear
                    style={{ width: '100%', borderRadius: 8 }}
                    placeholder={t.user}
                    value={filter.user_id}
                    options={config?.user || []}
                    onChange={(val) => setFilter(prev => ({ ...prev, user_id: val }))}
                    prefix={<UserOutlined />}
                  />
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<FilterOutlined />}
                    onClick={handleSearch}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                    }}
                  >
                    {t.apply_filters}
                  </Button>
                </Col>
              </Row>

                    {/* 💰 Shift Reconciliation Section */}
                    <div style={{
                      marginTop: 20,
                      padding: '24px',
                      background: '#fff',
                      borderRadius: 16,
                      border: '2px solid #eef2f7',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                      <Row gutter={[24, 24]}>
                        <Col xs={24} lg={18}>
                          <Row gutter={[16, 16]}>
                            {/* 1. Opening Cash */}
                            <Col xs={24} md={12}>
                              <Card size="small" title={<span style={{fontSize: 12}}>1. {t.opening_cash_label}</span>}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <InputNumber
                                    style={{ width: '100%', background: '#f8fafc' }}
                                    prefix="$"
                                    value={openingCash}
                                    readOnly
                                    disabled
                                    placeholder="USD"
                                  />
                                  <InputNumber
                                    style={{ width: '100%', background: '#f8fafc' }}
                                    prefix="៛"
                                    value={openingCashKHR}
                                    readOnly
                                    disabled
                                    placeholder="KHR"
                                  />
                                </Space>
                              </Card>
                            </Col>

                            {/* 2. Actual Cash In Hand */}
                            <Col xs={24} md={12}>
                              <Card size="small" title={<span style={{fontSize: 12}}>2. {t.actual_cash_label}</span>}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    prefix="$"
                                    value={actualCash}
                                    onChange={v => setActualCash(v || 0)}
                                    placeholder="USD"
                                  />
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    prefix="៛"
                                    value={actualCashKHR}
                                    onChange={v => setActualCashKHR(v || 0)}
                                    placeholder="KHR"
                                    step={100}
                                  />
                                </Space>
                              </Card>
                            </Col>
                            
                            {/* Summary Info */}
                            <Col span={24}>
                              <div style={{ display: 'flex', gap: 24, padding: '10px 0', flexWrap: 'wrap' }}>
                                 <div>
                                   <Text type="secondary" style={{fontSize: 11}}>{t.cash_sales_label}:</Text>
                                   <div style={{fontSize: 16, fontWeight: 'bold', color: '#059669'}}>${Number(summary.total_cash || 0).toFixed(2)}</div>
                                 </div>
                                 <Divider type="vertical" style={{height: 40}} />
                                 <div>
                                   <Text type="secondary" style={{fontSize: 11}}>{t.cash_expenses_label}:</Text>
                                   <div style={{fontSize: 16, fontWeight: 'bold', color: '#ef4444'}}>-${Number(summary.total_cash_expense || 0).toFixed(2)}</div>
                                 </div>
                                 <Divider type="vertical" style={{height: 40}} />
                                 <div>
                                   <Text type="secondary" style={{fontSize: 11}}>{t.exchange_rate_label}:</Text>
                                   <div style={{fontSize: 16, fontWeight: 'bold'}}>1$ = {exchangeRate}៛</div>
                                 </div>
                              </div>
                            </Col>

                            <Col span={24}>
                               <Input.TextArea 
                                  placeholder={t.remark_placeholder}
                                  value={remark}
                                  onChange={e => setRemark(e.target.value)}
                                  rows={2}
                                  style={{borderRadius: 8}}
                               />
                            </Col>
                          </Row>
                        </Col>

                        <Col xs={24} lg={6}>
                          {(() => {
                            const opening_usd = Number(openingCash) + (Number(openingCashKHR) / exchangeRate);
                            const actual_usd = Number(actualCash) + (Number(actualCashKHR) / exchangeRate);
                            const expected_usd = opening_usd + Number(summary.total_cash || 0) - Number(summary.total_cash_expense || 0);
                            const diff = actual_usd - expected_usd;
                            const isNeutral = actual_usd === 0;
                            const isExact = Math.abs(diff) < 0.01;
                            const isPositive = diff > 0;

                            return (
                              <div style={{
                                height: '100%',
                                padding: '20px',
                                borderRadius: 12,
                                background: isNeutral ? '#f8fafc' : isExact ? '#f0fdf4' : isPositive ? '#eff6ff' : '#fef2f2',
                                border: '1px solid',
                                borderColor: isNeutral ? '#e2e8f0' : isExact ? '#bbf7d0' : isPositive ? '#bfdbfe' : '#fecaca',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                textAlign: 'center',
                                transition: 'all 0.3s ease'
                              }}>
                                <div style={{ fontSize: 13, color: isNeutral ? '#94a3b8' : '#64748b', marginBottom: 4, fontWeight: 600 }}>
                                  {t.difference_label}
                                </div>
                                <div style={{
                                  fontSize: 28,
                                  fontWeight: 900,
                                  color: isNeutral ? '#64748b' : isExact ? '#166534' : isPositive ? '#1e40af' : '#991b1b'
                                }}>
                                  ${diff.toFixed(2)}
                                </div>
                                <Text style={{fontSize: 11, opacity: 0.7}}>
                                  ({t.expected_label}: ${expected_usd.toFixed(2)})
                                </Text>
                              </div>
                            );
                          })()}
                        </Col>
                      </Row>
                    </div>
            </div>
            
            <Divider style={{ margin: '32px 0' }} />
            <Text strong>{t.orders_this_shift}</Text>

            {/* Orders Table */}
            <Table
              loading={loading}
              rowKey="id"
              dataSource={list}
              pagination={false}
              style={{
                background: '#fff',
                borderRadius: 12,
                marginTop: 16
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t.no_orders}
                    style={{ padding: 40 }}
                  />
                )
              }}
              columns={[
                {
                  title: t.order_details,
                  dataIndex: "order_no",
                  width: 200,
                  render: (val, record) => (
                    <div>
                      <Tag
                        color="blue"
                        style={{
                          borderRadius: 6,
                          fontWeight: 'bold',
                          marginBottom: 4
                        }}
                      >
                        {val || `#${record.id}`}
                      </Tag>
                      <div style={{ fontSize: 12, color: '#8b5cf6' }}>
                        {formatDateClient(record.created_at, "MMM DD, YYYY")}
                      </div>
                    </div>
                  )
                },
                {
                  title: t.product,
                  dataIndex: "product_names",
                  width: 300,
                  render: (val, record) => (
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {val?.length > 50 ? `${val.substring(0, 50)}...` : val}
                      </div>
                      <Badge
                        count={`${record.total_quantity || 0} ${t.items}`}
                        style={{ backgroundColor: '#f0f9ff', color: '#0369a1', marginTop: 4 }}
                      />
                    </div>
                  )
                },
                {
                  title: t.amount,
                  dataIndex: "total_amount",
                  align: "right",
                  width: 120,
                  render: val => (
                    <Text strong style={{ fontSize: 16, color: '#2d3748' }}>
                      ${Number(val || 0).toFixed(2)}
                    </Text>
                  )
                },
                {
                  title: t.payment_method,
                  dataIndex: "payment_method",
                  width: 120,
                  render: val => (
                    <Tag color="success" style={{ borderRadius: 6, fontWeight: 'bold' }}>{val || t.paid}</Tag>
                  )
                },
                {
                  title: t.action,
                  width: 80,
                  align: 'center',
                  render: (_, rec) => (
                    <Button type="link" icon={<EyeOutlined />} onClick={() => getOrderDetail(rec)} />
                  )
                }
              ]}
            />
          </TabPane>

          <TabPane 
            tab={<span><FileTextOutlined style={{marginRight: 8}} /> {t.tab_history}</span>} 
            key="2"
          >
            <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
               <Row gutter={16} style={{marginBottom: 20}}>
                  <Col span={12}>
                     <RangePicker 
                       value={[filter.from_date, filter.to_date]}
                       onChange={d => setFilter(p => ({...p, from_date: d[0], to_date: d[1]}))}
                     />
                  </Col>
                  <Col span={8}>
                     <Select 
                        allowClear placeholder="Filter by user" style={{width: '100%'}}
                        options={config?.user || []}
                        onChange={v => setFilter(p => ({...p, user_id: v}))}
                        value={filter.user_id}
                     />
                  </Col>
                  <Col span={4}>
                     <Button type="primary" block onClick={getShiftHistory}>Refresh</Button>
                  </Col>
               </Row>

               <Table 
                 loading={loadingHistory}
                 dataSource={shiftHistory}
                 rowKey="id"
                 columns={[
                   { 
                     title: t.close_date, 
                     dataIndex: 'closed_at', 
                     render: v => v ? formatDateClient(v, "DD MMM HH:mm") : '-'
                   },
                   { title: t.staff, dataIndex: 'staff_name' },
                   { 
                     title: t.opening_cash_label, 
                     render: r => `$${Number(r.opening_cash_usd).toFixed(2)}`
                   },
                   { 
                     title: t.expected_label, 
                     render: r => `$${Number(r.expected_cash_usd).toFixed(2)}`
                   },
                   { 
                     title: t.actual_in_drawer, 
                     render: r => (
                       <div style={{fontWeight: 'bold'}}>
                         ${Number(r.actual_cash_usd).toFixed(2)}
                       </div>
                     )
                   },
                   { 
                     title: t.difference_label, 
                     dataIndex: 'diff_usd',
                     render: v => (
                       <Tag color={Math.abs(v) < 0.1 ? 'green' : v > 0 ? 'blue' : 'red'}>
                         ${Number(v).toFixed(2)}
                       </Tag>
                     )
                   },
                   { 
                     title: t.total_sales_all, 
                     dataIndex: 'total_sales_usd',
                     render: v => `$${Number(v).toFixed(2)}`
                   },
                   { 
                    title: t.note, 
                    dataIndex: 'remark',
                    width: 150,
                    render: v => <Text type="secondary" style={{fontSize: 11}}>{v || '-'}</Text>
                  }
                ]}
               />
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Enhanced Order Detail Modal */}
      <Modal
        open={state.visibleModal}
        onCancel={onCloseModal}
        footer={null}
        title={
          <div style={{ padding: '8px 0' }}>
            <Title level={3} style={{ margin: 0, color: '#2d3748' }}>
              <ShoppingCartOutlined style={{ marginRight: 8, color: '#667eea' }} />
              {t.order_details}
              {currentOrder?.order_no && (
                <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>
                  ({currentOrder.order_no})
                </Text>
              )}
            </Title>
          </div>
        }
        width={900}
        style={{ top: 20 }}
        bodyStyle={{
          padding: 0,
          background: '#f8fafc'
        }}
      >
        <div style={{ padding: 24 }}>
          {/* Order Summary */}
          {currentOrder && (
            <Card style={{ marginBottom: 16, borderRadius: 8 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text strong>{t.order_no}:</Text>
                  <br />
                  <Text>{currentOrder.order_no || `#${currentOrder.id}`}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>{t.date}:</Text>
                  <br />
                  <Text>{formatDateClient(currentOrder.created_at, "MMM DD, YYYY h:mm A")}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>{t.status}:</Text>
                  <br />
                  <Tag color={getStatusColor(currentOrder.status)}>
                    {getStatusText(currentOrder.status)}
                  </Tag>
                </Col>
                <Col span={6}>
                  <Text strong>{t.payment_method}:</Text>
                  <br />
                  <Text>{currentOrder.payment_method || t.paid}</Text>
                </Col>
              </Row>
            </Card>
          )}

          <Table
            dataSource={orderDetail}
            rowKey={(record) => `${record.product_id}-${record.id}`}
            pagination={false}
            loading={loading}
            style={{
              background: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
            columns={[
              {
                key: "image",
                title: t.image,
                dataIndex: "image",
                width: 80,
                render: (value) => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #e0e0e0",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s, box-shadow 0.3s",
                    }}
                  >
                    {value ? (
                      <Image
                        src={Config.getFullImagePath(value)}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        preview={{
                          mask: (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "#fff",
                                fontSize: 16,
                              }}
                            >
                              {t.view_details}
                            </div>
                          ),
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#EEE",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: 10,
                          color: "#999",
                          textAlign: "center"
                        }}
                      >
                        {t.no_data}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: t.product_name,
                dataIndex: "product_name",
                render: (name, record) => (
                  <div>
                    <Text strong style={{ color: '#2d3748' }}>{name}</Text>
                    {record.note && (
                      <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                        {record.note}
                      </div>
                    )}
                    {record.category_name && (
                      <div>
                        <Tag size="small" color="blue" style={{ marginTop: 4 }}>
                          {record.category_name}
                        </Tag>
                      </div>
                    )}
                  </div>
                )
              },
              {
                title: t.quantity,
                dataIndex: "qty",
                align: "center",
                width: 100,
                render: val => (
                  <Badge
                    count={val || 0}
                    style={{
                      backgroundColor: '#667eea',
                      fontSize: 14,
                      fontWeight: 'bold'
                    }}
                  />
                )
              },
              {
                title: t.discount,
                dataIndex: "discount_percent",
                align: "center",
                width: 100,
                render: (val) => {
                  const value = Number(val) || 0;

                  return value > 0 ? (
                    <Badge
                      count={`${value}% OFF`}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 'bold',
                        padding: '0 10px',
                        borderRadius: '12px',
                        boxShadow: '0 0 0 1px #fff inset'
                      }}
                    />
                  ) : (
                    <Tag
                      color="default"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: '10px',
                      }}
                    >
                      {t.no_discount}
                    </Tag>
                  );
                }
              }
              ,
              {
                title: t.price,
                dataIndex: "price",
                align: "right",
                width: 120,
                render: val => (
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>
                    ${Number(val || 0).toFixed(2)}
                  </Text>
                )
              },
              {
                title: t.total,
                dataIndex: "total",
                align: "right",
                width: 140,
                render: (val, record) => {
                  const totalAmount = record.grand_total || record.line_total || record.total || (record.qty * record.price) || 0;
                  return (
                    <Text strong style={{ fontSize: 16, color: '#10b981' }}>
                      ${Number(totalAmount).toFixed(2)}
                    </Text>
                  );
                }
              }
            ]}
            summary={(pageData) => {
              const total = pageData.reduce((sum, item) => {
                const itemTotal = item.grand_total || item.line_total || item.total || (item.qty * item.price) || 0;
                return sum + Number(itemTotal);
              }, 0);

              return (
                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                  <Table.Summary.Cell colSpan={4}>
                    <Text strong style={{ fontSize: 16 }}>{t.total_amount}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <Text strong style={{ fontSize: 18, color: '#667eea' }}>
                      ${total.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      </Modal>

      {/* Hidden component for printing */}
      <div style={{ display: "none" }}>
        <PrintShiftReport
          ref={refShiftReport}
          summary={summary}
          profile={profile}
          filter={filter}
          actual_cash={actualCash}
          actual_cash_khr={actualCashKHR}
          opening_cash={openingCash}
          opening_cash_khr={openingCashKHR}
          exchange_rate={exchangeRate}
          staff_name={filter.user_id ? (config?.user?.find(u => u.value === filter.user_id)?.label) : 'All Business (សរុបទាំងអស់)'}
        />
      </div>

      {/* Quick Expense Modal */}
      <Modal
        title={t.quick_expense_title}
        open={state.visibleExpenseModal}
        onCancel={() => setState(prev => ({ ...prev, visibleExpenseModal: false }))}
        footer={null}
        width={400}
      >
        <Form 
          layout="vertical" 
          onFinish={onSaveExpense}
          initialValues={{ payment_method: 'Cash' }}
        >
          <Form.Item 
            name="expense_type_id" 
            label={t.category} 
            rules={[{ required: true }]}
          >
            <Select 
              options={config?.expense_type || []} 
              placeholder="Select category"
            />
          </Form.Item>
          <Form.Item 
            name="amount" 
            label={t.expense_amount} 
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} prefix="$" min={0.01} step={0.1} />
          </Form.Item>
          <Form.Item 
            name="payment_method" 
            label={t.payment_type}
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="Cash">{t.dash_cash} (ដកពីថត)</Select.Option>
              <Select.Option value="Bank">Bank / QR / ធនាគារ (មិនប៉ះសាច់ប្រាក់)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="description" 
            label={t.description}
            rules={[{ required: true }]}
          >
            <Input.TextArea placeholder={t.describe_expense} rows={3} />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
             <Space>
                <Button onClick={() => setState(prev => ({ ...prev, visibleExpenseModal: false }))}>
                  {t.cancel}
                </Button>
                <Button type="primary" htmlType="submit">
                  {t.save}
                </Button>
             </Space>
          </div>
        </Form>
      </Modal>

      {/* 🚀 Open Shift Modal */}
      <Modal
        title={
          <div style={{textAlign: 'center', padding: '10px 0'}}>
            <Title level={4} style={{margin: 0}}><ShopOutlined /> {t.open_new_shift}</Title>
            <Text type="secondary">{t.enter_opening_cash}</Text>
          </div>
        }
        open={visibleOpenShiftModal}
        onCancel={() => setVisibleOpenShiftModal(false)}
        footer={null}
        width={400}
        maskClosable={false}
      >
        <Form layout="vertical" onFinish={onOpenShift}>
          <div style={{background: '#f8fafc', padding: 20, borderRadius: 12, marginBottom: 20}}>
            <Form.Item 
              name="opening_cash_usd" 
              label={t.opening_cash_usd} 
              initialValue={0}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                size="large"
                prefix="$" 
                min={0} 
              />
            </Form.Item>
            <Form.Item 
              name="opening_cash_khr" 
              label={t.opening_cash_khr} 
              initialValue={0}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                size="large"
                prefix="៛" 
                min={0} 
                step={100}
              />
            </Form.Item>
          </div>

          <div style={{textAlign: 'center', marginBottom: 10}}>
            <Text type="secondary" style={{fontSize: 12}}>
              {t.authorized_by}: <Text strong>{profile?.name}</Text> {profile?.role_name && <Tag size="small" style={{marginLeft: 4, transform: 'scale(0.8)'}}>{profile.role_name}</Tag>}
            </Text>
          </div>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            size="large" 
            style={{height: 50, borderRadius: 8, background: '#1e4a2d'}}
          >
            {t.open_shift_now}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderPage;