import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
  message,
  Spin,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  PlusOutlined,
  SendOutlined,
  ReloadOutlined,
  ArrowDownOutlined,
  ArrowRightOutlined,
  DollarOutlined,
  EuroOutlined,
  BankOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { request } from "../../util/helper";

const { Title, Text } = Typography;



function ExchangeRateDashboard() {
  const [activeTab, setActiveTab] = useState("1D");
  const [loading, setLoading] = useState(false);
  const [exchangeData, setExchangeData] = useState([]);
  const [liveRate, setLiveRate] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [conversionRates, setConversionRates] = useState([]);
  const [balanceData, setBalanceData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [rateChange, setRateChange] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);


  useEffect(() => {
    fetchExchangeRates();
    fetchBalanceData();
    fetchTransactions();
  }, []);

  useEffect(() => {
    fetchTransactions(); // ✅ call real backend
  }, []);


  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      const res = await request("exchange_rate", "get");
      if (res && !res.error) {
        setExchangeData(res.list || []);
        setLiveRate(res.live_rate);

        // Calculate rate change
        if (res.list && res.list.length >= 2) {
          const currentRate = res.list[0].rate;
          const previousRate = res.list[1].rate;
          const change = ((currentRate - previousRate) / previousRate) * 100;
          setRateChange(change);
        }

        // Process data for chart using updated_at field
        const chartData = (res.list || []).slice(-10).reverse().map((item, index) => ({
          date: new Date(item.updated_at).toLocaleDateString('en-US', {
            timeZone: 'Asia/Phnom_Penh',
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
          }),
          rate: parseFloat(item.rate),
          currency: item.currency
        }));
        setChartData(chartData);

        // Process conversion rates with real data
        const rates = [
          {
            currency: "Cambodian Riel",
            flag: "🇰🇭",
            buyRate: `₦${(parseFloat(res.live_rate) * 0.998).toFixed(2)}`,
            sellRate: `₫${parseFloat(res.live_rate).toFixed(2)}`,
            code: "KHR",
            trend: rateChange >= 0 ? "up" : "down"
          },
          {
            currency: "US Dollar",
            flag: "🇺🇸",
            buyRate: `₦${(1 * 0.998).toFixed(3)}`,
            sellRate: `$${(1).toFixed(3)}`,
            code: "USD",
            trend: "up"
          },
          {
            currency: "Euro",
            flag: "🇪🇺",
            buyRate: `₦${(1.08 * 0.998).toFixed(3)}`,
            sellRate: `€${(1.08).toFixed(3)}`,
            code: "EUR",
            trend: "down"
          }
        ];
        setConversionRates(rates);
      }
    } catch (error) {
      message.error("Failed to fetch exchange rates");
      console.error("Exchange rate fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceData = async () => {
    try {
      const res = await request("balance_data", "get");
      if (res && !res.error) {
        setBalanceData(res.data || []);
      }
    } catch (error) {
      console.error("Balance fetch error:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await request("transactions", "get");
      if (res && !res.error) {
        setTransactions(res.list || []);
      }
    } catch (error) {
      console.error("Transactions fetch error:", error);
    }
  };

  const generateReference = () => {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  };

  const onRefreshData = () => {
    message.info("Refreshing exchange rates...");
    fetchExchangeRates();
    fetchBalanceData();
    fetchTransactions();
  };

  const calculateTotalBalance = () => {
    if (!liveRate) return "$45,680.00";

    const usdAmount = 25840;
    const eurAmount = 12530 * 1.08; // EUR to USD
    const khrAmount = (liveRate * 25000) / liveRate; // KHR to USD equivalent

    return `$${(usdAmount + eurAmount + khrAmount).toLocaleString()}`;
  };

  const tabItems = [
    { key: "1H", label: "1H" },
    { key: "1D", label: "1D" },
    { key: "1W", label: "1W" },
    { key: "1M", label: "1M" },
  ];

  const transactionColumns = [
    {
      title: "Date & Time",
      dataIndex: "date",
      key: "date",
      render: (date) => (
        <div>
          <Text strong>{date}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </div>
      )
    },
    {
      title: "Transaction",
      dataIndex: "type",
      key: "type",
      render: (type, record) => (
        <div>
          <Tag
            color={
              type === "Receive" ? "#52c41a" :
                type === "Send" ? "#fa8c16" :
                  "#1890ff"
            }
            style={{ borderRadius: "12px", fontWeight: "500" }}
          >
            {type}
          </Tag>
          {record.fromCurrency && record.toCurrency && (
            <div style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "4px" }}>
              {record.fromCurrency} → {record.toCurrency}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) => (
        <div>
          <Text strong style={{ fontSize: "16px" }}>{amount}</Text>
          {record.type === "Exchange" && (
            <div style={{ fontSize: "12px", color: "#52c41a" }}>
              +៛{(parseFloat(amount.replace('$', '')) * liveRate).toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Reference",
      dataIndex: "reference",
      key: "reference",
      render: (ref) => (
        <Text
          copyable={{ text: ref }}
          style={{ fontFamily: "monospace", fontSize: "12px" }}
        >
          {ref}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "Completed" ? "success" : status === "Pending" ? "warning" : "error"}
          style={{
            borderRadius: "16px",
            fontWeight: "500",
            border: "none",
            fontSize: "12px"
          }}
        >
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{
      padding: "24px",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      minHeight: "100vh"
    }}>
      {/* Header Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col span={12}>
          <Card
            style={{
              borderRadius: "20px",
              border: "none",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              boxShadow: "0 20px 40px rgba(102, 126, 234, 0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>
                  Total Portfolio Value
                </Text>
                <Title level={1} style={{ margin: "12px 0", color: "white", fontSize: "42px" }}>
                  {calculateTotalBalance()}
                </Title>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    background: rateChange >= 0 ? "rgba(82, 196, 26, 0.2)" : "rgba(255, 77, 79, 0.2)",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    marginRight: "12px"
                  }}>
                    {rateChange >= 0 ?
                      <ArrowUpOutlined style={{ color: "#52c41a", marginRight: "4px" }} /> :
                      <ArrowDownOutlined style={{ color: "#ff4d4f", marginRight: "4px" }} />
                    }
                    <Text style={{
                      color: rateChange >= 0 ? "#52c41a" : "#ff4d4f",
                      fontWeight: "600"
                    }}>
                      {Math.abs(rateChange).toFixed(2)}%
                    </Text>
                  </div>
                  <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                    vs yesterday
                  </Text>
                </div>
                <Space size="middle">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setIsAddModalOpen(true)} // <<<<< បន្ថែមនេះ
                    style={{
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      backdropFilter: "blur(10px)"
                    }}
                  >
                    Add Money
                  </Button>
                  <Button
                    icon={<SendOutlined />}
                    size="large"
                    style={{
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "white"
                    }}
                    onClick={() => setIsSendModalOpen(true)}
                  >
                    Send Money
                  </Button>
                </Space>
              </div>
              <Tooltip title="Refresh Data">
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={onRefreshData}
                  loading={loading}
                  style={{ color: "rgba(255,255,255,0.8)" }}
                />
              </Tooltip>
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Row gutter={[16, 16]}>
            {balanceData.map((balance, index) => (
              <Col span={8} key={index}>
                <Card style={{
                  borderRadius: "16px",
                  border: "none",
                  height: "160px",
                  background: balance.gradient,
                  color: "white",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <Space align="center" style={{ marginBottom: "16px" }}>
                      <span style={{ fontSize: "28px" }}>{balance.flag}</span>
                      <div>
                        <Text style={{ color: "white", fontSize: "16px", fontWeight: "600" }}>
                          {balance.currency}
                        </Text>
                      </div>
                    </Space>
                    <div style={{ flex: 1 }}>
                      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
                        Available Balance
                      </Text>
                      <div style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "white",
                        marginTop: "4px"
                      }}>
                        {balance.availableBalance}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Exchange Rate Chart */}
        <Col span={14}>
          <Card
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Title level={4} style={{ margin: 0, color: "#1a1a1a" }}>
                    Exchange Rate Trend
                  </Title>
                  <Text type="secondary">USD to KHR</Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a" }}>
                    {liveRate ? liveRate.toFixed(2) : '4,008.50'}
                  </Text>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {rateChange >= 0 ?
                      <ArrowUpOutlined style={{ color: "#52c41a", marginRight: "4px" }} /> :
                      <ArrowDownOutlined style={{ color: "#ff4d4f", marginRight: "4px" }} />
                    }
                    <Text style={{
                      color: rateChange >= 0 ? "#52c41a" : "#ff4d4f",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      {rateChange >= 0 ? '+' : ''}{rateChange.toFixed(2)}%
                    </Text>
                  </div>
                </div>
              </div>
            }
            style={{
              borderRadius: "16px",
              border: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
            }}
          >
            <Modal
              title="Send Money"
              open={isSendModalOpen}
              onCancel={() => setIsSendModalOpen(false)}
              onOk={() => {
                // API call to send
                message.success("Money sent!");
                setIsSendModalOpen(false);
              }}
            >
              <Form layout="vertical">
                <Form.Item label="Recipient">
                  <Input placeholder="e.g. john@example.com" />
                </Form.Item>
                <Form.Item label="Amount">
                  <Input type="number" />
                </Form.Item>
                <Form.Item label="Currency">
                  <Select defaultValue="USD">
                    <Select.Option value="USD">USD</Select.Option>
                    <Select.Option value="KHR">KHR</Select.Option>
                  </Select>
                </Form.Item>
              </Form>
            </Modal>

            <Modal
              title="Add Money"
              open={isAddModalOpen}
              onCancel={() => setIsAddModalOpen(false)}
              onOk={() => {
                // អាចសរសេរ API call ទីនេះ
                message.success("Money added successfully!");
                setIsAddModalOpen(false);
              }}
            >
              <Form layout="vertical">
                <Form.Item label="Amount">
                  <Input type="number" />
                </Form.Item>
                <Form.Item label="Currency">
                  <Select defaultValue="USD">
                    <Select.Option value="USD">USD</Select.Option>
                    <Select.Option value="KHR">KHR</Select.Option>
                  </Select>
                </Form.Item>
              </Form>
            </Modal>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              size="small"
              style={{ marginBottom: "24px" }}
            />

            <Spin spinning={loading}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData.length > 0 ? chartData : [
                  { date: "10:20", rate: 4015 },
                  { date: "10:25", rate: 4012 },
                  { date: "10:30", rate: 4018 },
                  { date: "10:35", rate: 4010 },
                  { date: "10:40", rate: liveRate || 4008.5 },
                ]}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#8c8c8c" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#8c8c8c" }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#667eea"
                    strokeWidth={3}
                    fill="url(#colorUv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Spin>
          </Card>
        </Col>

        {/* Currency Conversion Rates */}
        <Col span={10}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                Live Exchange Rates
              </Title>
            }
            style={{
              borderRadius: "16px",
              border: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <Row style={{ fontSize: "12px", color: "#8c8c8c", fontWeight: "600" }}>
                <Col span={10}>CURRENCY</Col>
                <Col span={7} style={{ textAlign: "center" }}>BUY</Col>
                <Col span={7} style={{ textAlign: "center" }}>SELL</Col>
              </Row>
            </div>

            {conversionRates.map((rate, index) => (
              <div
                key={index}
                style={{
                  padding: "16px 0",
                  borderBottom: index < conversionRates.length - 1 ? "1px solid #f0f0f0" : "none",
                  transition: "all 0.3s ease"
                }}
              >
                <Row align="middle">
                  <Col span={10}>
                    <Space>
                      <span style={{ fontSize: "24px" }}>{rate.flag}</span>
                      <div>
                        <Text strong style={{ fontSize: "14px" }}>{rate.code}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {rate.currency}
                        </Text>
                      </div>
                    </Space>
                  </Col>
                  <Col span={7} style={{ textAlign: "center" }}>
                    <Text strong style={{ color: "#52c41a", fontSize: "14px" }}>
                      {rate.buyRate}
                    </Text>
                  </Col>
                  <Col span={7} style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Text strong style={{ fontSize: "14px", marginRight: "4px" }}>
                        {rate.sellRate}
                      </Text>
                      {rate.trend === "up" ?
                        <ArrowUpOutlined style={{ color: "#52c41a", fontSize: "12px" }} /> :
                        <ArrowDownOutlined style={{ color: "#ff4d4f", fontSize: "12px" }} />
                      }
                    </div>
                  </Col>
                </Row>
              </div>
            ))}

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <Button
                type="primary"
                ghost
                onClick={fetchExchangeRates}
                style={{ borderRadius: "12px", fontWeight: "500" }}
              >
                View All Rates
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>
              Recent Transactions
            </Title>
            <Button type="primary" ghost style={{ borderRadius: "12px" }}>
              View All
            </Button>
          </div>
        }
        style={{
          marginTop: "24px",
          borderRadius: "16px",
          border: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
        }}
      >
        <Table
          dataSource={transactions}
          columns={transactionColumns}
          pagination={false}
          showHeader={true}
          style={{ backgroundColor: "transparent" }}
          size="middle"
          loading={loading}
          rowClassName={() => "hover:bg-gray-50 transition-colors duration-200"}
        />
      </Card>
    </div>
  );
}

export default ExchangeRateDashboard;