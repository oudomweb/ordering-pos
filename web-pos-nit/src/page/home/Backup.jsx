import { useEffect, useState, useRef } from "react";
import { request } from "../../util/helper";
import { Button, Card, Row, Col, Statistic, Divider, Select, DatePicker, Empty, Spin, Typography, Space, Badge } from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  FilterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

function HomePage() {
  const [dashboard, setDashboard] = useState([]);
  const [saleByMonth, setSaleByMonth] = useState([]);
  const [expenseByMonth, setExpenseByMonth] = useState([]);
  const [topSales, setTopSales] = useState([]);
  const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
  const [isLoading, setIsLoading] = useState(false);

  const dashboardRef = useRef(null);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') {
      if (value.includes(',')) return value;
      const numericValue = value.replace(/[^\d.-]/g, '');
      if (!isNaN(numericValue) && numericValue !== '') {
        const formattedNum = Number(numericValue).toLocaleString();
        if (value.includes('$')) {
          return formattedNum + ' $';
        }
        return formattedNum;
      }
      return value;
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const processDashboardData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => {
      const processedSummary = {};
      if (item.Summary) {
        Object.entries(item.Summary).forEach(([key, value]) => {
          processedSummary[key] = formatNumber(value);
        });
      }
      return {
        ...item,
        Summary: processedSummary
      };
    });
  };

  const fetchAllData = async () => {
    await Promise.all([getList(), fetchTopSales()]);
  };

  const getList = async () => {
    setIsLoading(true);
    try {
      let apiUrl = 'dashboard';
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        apiUrl += `?from_date=${fromDate.format('YYYY-MM-DD')}&to_date=${toDate.format('YYYY-MM-DD')}`;
      }
      const res = await request(apiUrl, "get");
      if (res && !res.error) {
        setDashboard(processDashboardData(res.dashboard));
        if (res.Sale_Summary_By_Month) {
          setSaleByMonth(res.Sale_Summary_By_Month.map(item => ({ month: item.title, sale: Number(item.total) || 0 })));
        }
        if (res.Expense_Summary_By_Month) {
          setExpenseByMonth(res.Expense_Summary_By_Month.map(item => ({ month: item.title, expense: Number(item.total) || 0 })));
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCardIcon = (index) => {
    const icons = [
      <UserOutlined />,
      <ShoppingCartOutlined />,
      <CreditCardOutlined />,
      <DollarOutlined />
    ];
    return icons[index % icons.length] || <BarChartOutlined />;
  };

  const handlePrint = () => {
    const printContent = document.getElementById("dashboard-content");
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const fetchTopSales = async () => {
    try {
      let apiUrl = 'report/top_sale';
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        apiUrl += `?from_date=${fromDate.format('YYYY-MM-DD')}&to_date=${toDate.format('YYYY-MM-DD')}`;
      }
      const res = await request(apiUrl, "get");
      if (res && res.list) {
        const topProducts = res.list.map(item => ({
          name: item.product_name,
          value: Number(item.total_sale_amount),
          category: item.category_name
        }));
        setTopSales(topProducts);
      }
    } catch (error) {
      console.error("Top sales fetch error:", error);
    }
  };
  const handleDownloadPDF = () => {
    const input = document.getElementById("dashboard-content");
    if (!input) return;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("dashboard.pdf");
    });
  };
  const handleDateRangeChange = (dates) => setDateRange(dates);
  const handleSearch = () => fetchAllData();

  const tooltipFormatter = (value) => [`$${value.toLocaleString()}`, "Amount"];

  const combinedChartData = saleByMonth.map(sale => {
    const expenseEntry = expenseByMonth.find(exp => exp.month === sale.month);
    return {
      month: sale.month,
      sale: sale.sale,
      expense: expenseEntry ? expenseEntry.expense : 0,
      profit: sale.sale - (expenseEntry ? expenseEntry.expense : 0)
    };
  });

  const getTrendIndicator = (value) => {
    if (typeof value === 'string' && value.includes('+')) {
      return <ArrowUpOutlined style={{ color: '#52c41a', marginLeft: 4 }} />;
    }
    if (typeof value === 'string' && value.includes('-')) {
      return <ArrowDownOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />;
    }
    return null;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={1} style={{
              color: 'white',
              margin: 0,
              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}>
              ផ្ទាំងគ្រប់គ្រងអាជីវកម្ម
            </Title>
            <Text style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.1rem',
              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
            }}>
              ទិដ្ឋភាពទូលំទូលាយនៃដំណើរការអាជីវកម្មរបស់អ្នក
            </Text>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
                size="large"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  height: '48px',
                  borderRadius: '12px'
                }}
              >
                <span style={{ fontFamily: "'Khmer OS', sans-serif" }}>
                  ទាញយក PDF
                </span>
              </Button>
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                size="large"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  height: '48px',
                  borderRadius: '12px'
                }}
              >
                <span style={{ fontFamily: "'Khmer OS', sans-serif" }}>
                  បោះពុម្ព
                </span>
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Enhanced Filters */}
      <Card style={{
        marginBottom: '24px',
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <CalendarOutlined style={{ fontSize: '18px', color: '#667eea', marginRight: '8px' }} />
            <Text strong style={{ fontFamily: "'Khmer OS', sans-serif" }}>កាលបរិច្ឆេទ:</Text>
          </Col>
          <Col flex="auto">
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{
                width: "300px",
                borderRadius: '8px',
                border: '2px solid #f0f0f0'
              }}
              format="YYYY-MM-DD"
              allowClear={true}
              size="large"
            />
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={handleSearch}
              icon={<FilterOutlined />}
              loading={isLoading}
              size="large"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                height: '40px'
              }}
            >
              <span style={{ fontFamily: "'Khmer OS', sans-serif" }}>
                ស្វែងរក
              </span>
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Dashboard Content */}
      <div id="dashboard-content" ref={dashboardRef}>
        {/* Enhanced Summary Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          {dashboard.map((item, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                style={{
                  borderRadius: '20px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${COLORS[index]}22, ${COLORS[index]}11)`,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                bodyStyle={{ padding: '24px' }}
                hoverable
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                }}
              >
                {/* Background decoration */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '100px',
                  height: '100px',
                  background: `${COLORS[index]}20`,
                  borderRadius: '50%',
                  zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: '16px' }}>
                    <div style={{
                      background: `linear-gradient(135deg, ${COLORS[index]}, ${COLORS[index]}cc)`,
                      color: 'white',
                      borderRadius: '12px',
                      padding: '12px',
                      marginRight: '12px',
                      fontSize: '20px'
                    }}>
                      {getCardIcon(index)}
                    </div>
                    <Text style={{
                      color: "#1a3353",
                      fontFamily: "'Khmer OS', sans-serif",
                      fontWeight: "600",
                      fontSize: '16px'
                    }}>
                      {item.title}
                    </Text>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: '12px' }}>
                    {Object.entries(item.Summary).map(([key, value], idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{
                          color: "#666",
                          fontFamily: "'Khmer OS', sans-serif",
                          fontSize: '14px'
                        }}>
                          {key}:
                        </Text>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Text style={{
                            fontSize: idx === 0 ? '20px' : '16px',
                            fontWeight: idx === 0 ? "bold" : "600",
                            color: idx === 0 ? COLORS[index] : "#1a3353"
                          }}>
                            {value}
                          </Text>
                          {getTrendIndicator(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Enhanced Charts Section */}
        <Row gutter={[24, 24]}>
          {/* Combined Chart */}
          <Col span={24}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '8px',
                    marginRight: '12px'
                  }}>
                    <BarChartOutlined style={{ fontSize: '16px' }} />
                  </div>
                  <span style={{
                    fontFamily: "'Khmer OS', sans-serif",
                    fontWeight: "600",
                    fontSize: '18px'
                  }}>
                    ទិដ្ឋភាពនៃការលក់និងចំណាយ
                  </span>
                </div>
              }
              style={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              {combinedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={combinedChartData}>
                    <defs>
                      <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f5576c" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f5576c" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#43e97b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#43e97b" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sale"
                      name="ការលក់"
                      stroke="#667eea"
                      fillOpacity={1}
                      fill="url(#colorSale)"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="ចំណាយ"
                      stroke="#f5576c"
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="ប្រាក់ចំណេញ"
                      stroke="#43e97b"
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty
                  description={
                    <span style={{
                      fontFamily: "'Khmer OS', sans-serif"
                    }}>
                      មិនមានទិន្នន័យ
                    </span>
                  }
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          {/* Sales Trend */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '8px',
                    marginRight: '12px'
                  }}>
                    <LineChartOutlined style={{ fontSize: '16px' }} />
                  </div>
                  <span style={{
                    fontFamily: "'Khmer OS', sans-serif",
                    fontWeight: "600",
                    fontSize: '18px'
                  }}>
                    និន្នាការលក់
                  </span>
                </div>
              }
              style={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              {saleByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={saleByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sale"
                      name="ការលក់"
                      stroke="#4facfe"
                      strokeWidth={4}
                      dot={{ fill: '#4facfe', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#4facfe', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="មិនមានទិន្នន័យ" />
              )}
            </Card>
          </Col>

          {/* Top Products Pie Chart */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '8px',
                    marginRight: '12px'
                  }}>
                    <PieChartOutlined style={{ fontSize: '16px' }} />
                  </div>
                  <span style={{
                    fontFamily: "'Khmer OS', sans-serif",
                    fontWeight: "600",
                    fontSize: '18px'
                  }}>
                    ផលិតផលលក់ដាច់បំផុត
                  </span>
                </div>
              }
              style={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              {topSales.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topSales}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topSales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="មិនមានទិន្នន័យ" />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <style jsx>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        @font-face {
          font-family: 'Khmer OS';
          font-weight: normal;
          font-style: normal;
        }
        
        .ant-card:hover {
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
        
        .recharts-tooltip-wrapper {
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
}

export default HomePage;






















import { useEffect, useState, useRef } from "react";
import { request } from "../../util/helper";
import { Button, Card, Row, Col, Statistic, Divider, Select, DatePicker, Empty } from "antd";
import { DownloadOutlined, PrinterOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, UserOutlined, DollarOutlined } from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import moment from "moment";
import { BsSearch } from "react-icons/bs";

const { RangePicker } = DatePicker;
const { Option } = Select;

function HomePage() {
  const [dashboard, setDashboard] = useState([]);
  const [saleByMonth, setSaleByMonth] = useState([]);
  const [expenseByMonth, setExpenseByMonth] = useState([]);
  const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
  const [categoryId, setCategoryId] = useState(null);
  const [expenseTypeId, setExpenseTypeId] = useState(null);
  const [supplierId, setSupplierId] = useState(null);
  const [topSales, setTopSales] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const dashboardRef = useRef(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    // Initial data load
    getList();
  }, []); // Empty dependency array for initial load only

  // Format numbers with commas for thousands separator
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '';

    // If the value already contains a currency symbol or is formatted
    if (typeof value === 'string') {
      // Check if it's already formatted properly
      if (value.includes(',')) return value;

      // Extract number from string that might contain "$" or other characters
      const numericValue = value.replace(/[^\d.-]/g, '');
      if (!isNaN(numericValue) && numericValue !== '') {
        const formattedNum = Number(numericValue).toLocaleString();
        // If original value had dollar sign, keep it
        if (value.includes('$')) {
          return formattedNum + ' $';
        }
        return formattedNum;
      }
      return value;
    }

    // For numeric values
    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return value;
  };

  // Process dashboard data to ensure all numeric values are properly formatted
  const processDashboardData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(item => {
      const processedSummary = {};

      if (item.Summary) {
        Object.entries(item.Summary).forEach(([key, value]) => {
          // Format only if it's a number or contains a number
          processedSummary[key] = formatNumber(value);
        });
      }

      return {
        ...item,
        Summary: processedSummary
      };
    });
  };

  // Fetch all data with date filters
  const fetchAllData = () => {
    getList();
    fetchTopSales();
    fetchReports();
  };

  const getList = async () => {
    setIsLoading(true);
    try {
      let apiUrl = 'dashbaord';

      // Only add date parameters if dateRange is not null
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        const formattedFromDate = fromDate.format('YYYY-MM-DD');
        const formattedToDate = toDate.format('YYYY-MM-DD');
        apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
      }

      // Update API call with or without date parameters
      const res = await request(apiUrl, "get");
      if (res && !res.error) {
        // Process dashboard data to ensure proper formatting
        setDashboard(processDashboardData(res.dashboard));

        if (res.Sale_Summary_By_Month) {
          const saleData = res.Sale_Summary_By_Month.map(item => ({
            month: item.title,
            sale: Number(item.total) || 0
          }));
          setSaleByMonth(saleData);
        }

        if (res.Expense_Summary_By_Month) {
          const expenseData = res.Expense_Summary_By_Month.map(item => ({
            month: item.title,
            expense: Number(item.total) || 0
          }));
          setExpenseByMonth(expenseData);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopSales = async () => {
    try {
      let apiUrl = 'report/top_sale';

      // Only add date parameters if dateRange is not null
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        const formattedFromDate = fromDate.format('YYYY-MM-DD');
        const formattedToDate = toDate.format('YYYY-MM-DD');
        apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
      }

      // Update API call with or without date parameters
      const res = await request(apiUrl, "get");
      if (res && res.list) {
        // Transform for pie chart
        const topProducts = res.list.map(item => ({
          name: item.product_name,
          value: Number(item.total_sale_amount),
          category: item.category_name
        }));
        setTopSales(topProducts);
      }
    } catch (error) {
      console.error("Error fetching top sales data:", error);
    }
  };

  const fetchReports = async () => {
    try {
      let apiUrl = 'report/customer';

      // Only add date parameters if dateRange is not null
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        const formattedFromDate = fromDate.format('YYYY-MM-DD');
        const formattedToDate = toDate.format('YYYY-MM-DD');
        apiUrl += `?from_date=${formattedFromDate}&to_date=${formattedToDate}`;
      }

      // Fetch customer data with or without date filters
      const customerRes = await request(apiUrl, "get");
      if (customerRes && customerRes.list) {
        setCustomerData(customerRes.list.map(item => ({
          date: item.title,
          count: Number(item.total_amount)
        })));
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("dashboard-content");
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDownloadPDF = () => {
    const input = document.getElementById("dashboard-content");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape");
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("dashboard.pdf");
    });
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates); // This can be null when clearing
  };

  // Handler for the search/filter button
  const handleSearch = () => {
    fetchAllData();
  };

  // Custom tooltip formatter for charts
  const tooltipFormatter = (value) => {
    return [`$${value.toLocaleString()}`, "Amount"];
  };

  // Combined chart data
  const combinedChartData = saleByMonth.map(sale => {
    const expenseEntry = expenseByMonth.find(exp => exp.month === sale.month);
    return {
      month: sale.month,
      sale: sale.sale,
      expense: expenseEntry ? expenseEntry.expense : 0,
      profit: sale.sale - (expenseEntry ? expenseEntry.expense : 0)
    };
  });