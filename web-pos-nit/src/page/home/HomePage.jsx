import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Select, Table, Badge, Spin, Button, Tabs, Dropdown, Menu } from "antd";
import {
  MoreOutlined,
  SearchOutlined,
  BellOutlined,
  WarningFilled,
  StarFilled,
  SyncOutlined,
  CheckSquareFilled,
  BarChartOutlined
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import moment from "moment";
import { useLanguage, translations } from "../../store/language.store";
import { useProfileStore } from "../../store/profileStore";
import { MdOutlineTableChart } from "react-icons/md";
import { DollarSign, Activity, ShoppingBag, Loader, AlertTriangle, TrendingUp } from "lucide-react";

const { Title, Text } = Typography;
const { Option } = Select;

function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [isLoading, setIsLoading] = useState(false);
  const [dbStats, setDbStats] = useState({ revenue: 0, orders: 0, customers: 0, performance: 'Good 2/24', netProfit: 0 });

  const [salesData, setSalesData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);

  const userId = useProfileStore(s => s.profile?.id || s.profile?.user_id);
  useEffect(() => {
    if (userId) fetchAllData();
  }, [userId]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const res = await request('dashboard', "get");
      if (res && res.success) {
        let totalRev = 0;
        let totalOrders = 0;
        let totalCustomers = 0;
        let netProfit = 0;

        if (res.dashboard && res.dashboard.length >= 3) {
          totalCustomers = parseInt(res.dashboard[0].Summary["Total"] || 0);
          totalRev = parseFloat(String(res.dashboard[1].Summary["Total Sales"]).replace(/[$,]/g, '') || 0);
          netProfit = parseFloat(String(res.dashboard[1].Summary["Net Profit"]).replace(/[$,]/g, '') || 0);
          totalOrders = parseInt(res.dashboard[2].Summary["Order Count"] || 0);
        }

        setDbStats({ revenue: totalRev, orders: totalOrders, customers: totalCustomers, performance: 'Good', netProfit });

        if (res.Top_Sale) {
          const maxVal = Math.max(...res.Top_Sale.map(i => Number(i.total_sale_amount)), 100);
          const radarData = res.Top_Sale.map(item => ({
            subject: item.product_name?.substring(0, 10),
            A: Number(item.total_sale_amount),
            fullMark: maxVal * 1.2
          }));
          setPerformanceData(radarData);
        }

        if (res.recentOrders) {
          const tableData = res.recentOrders.slice(0, 5).map((item, idx) => ({
            key: idx.toString(),
            customer: `Order #${item.id}`,
            email: item.branch_name || '-',
            phone: moment(item.created_at).format('YYYY-MM-DD HH:mm'),
            items: 'View Details',
            value: `$${Number(item.total_amount).toFixed(2)}`,
            avatar: `https://ui-avatars.com/api/?name=${item.id}&background=1e4a2d&color=fff`
          }));
          setTransactionData(tableData);
        }

        if (res.Sale_Summary_By_Month) {
          const lineData = res.Sale_Summary_By_Month.map((item) => {
            const expenseItem = res.Expense_Summary_By_Month?.find(e => e.title === item.title);
            const expenseAmt = Number(expenseItem?.total || 0);
            const saleAmt = Number(item.total);
            return {
              name: item.title,
              coffee: saleAmt,
              tea: expenseAmt,
              snack: saleAmt - expenseAmt > 0 ? saleAmt - expenseAmt : 0,
            };
          });
          setSalesData(lineData);
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      title: 'Customer Name',
      dataIndex: 'customer',
      key: 'customer',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={record.avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <span style={{ fontWeight: 600, color: '#1e4a2d' }}>{text}</span>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: text => <span style={{ color: '#6b7c6b', fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: text => <span style={{ color: '#6b7c6b', fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: text => <span style={{ color: '#6b7c6b', fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: text => <span style={{ fontWeight: 700, color: '#1e4a2d' }}>{text}</span>
    },
    {
      title: '',
      key: 'action',
      render: () => <MoreOutlined style={{ color: '#c0a060', cursor: 'pointer', fontSize: 18 }} />
    }
  ];

  return (
    <div style={{ padding: '24px 0', background: 'transparent' }}>

      {/* Top Cards Row */}
      <Spin spinning={isLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Total Revenue */}
          <Col xs={24} sm={12} lg={4}>
            <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={16} color="#1e4a2d" />
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#1e4a2d' }}>Total Revenue</span>
                </div>
                <span style={{ fontSize: 10, color: '#c0a060', fontWeight: 700 }}>Details</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>${dbStats.revenue.toLocaleString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', color: '#00c257', fontSize: 12, fontWeight: 700, background: '#e6f8ed', padding: '2px 6px', borderRadius: 4 }}>
                  <TrendingUp size={12} style={{ marginRight: 2 }} /> 2%
                </span>
              </div>
            </div>
          </Col>

          {/* On Progress 1 */}
          <Col xs={24} sm={12} lg={5}>
            <div className="dash-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Loader size={16} color="#1e4a2d" />
                <span style={{ fontWeight: 700, fontSize: 12, color: '#1e4a2d' }}>On Progress</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>10</span>
                <span style={{ color: '#6b7c6b', fontSize: 12, fontWeight: 600 }}>Orders</span>
              </div>
            </div>
          </Col>

          {/* Performance */}
          <Col xs={24} sm={12} lg={5}>
            <div className="dash-card" style={{ borderTop: '4px solid #00c257' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <CheckSquareFilled style={{ color: '#00c257', fontSize: 16 }} />
                <span style={{ fontWeight: 700, fontSize: 12, color: '#1e4a2d' }}>Performance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>Good</span>
                <span style={{ color: '#6b7c6b', fontSize: 12, fontWeight: 600 }}>2/24</span>
              </div>
            </div>
          </Col>

          {/* Today Sales */}
          <Col xs={24} sm={12} lg={5}>
            <div className="dash-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Activity size={16} color="#1e4a2d" />
                <span style={{ fontWeight: 700, fontSize: 12, color: '#1e4a2d' }}>Today Sales</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>{dbStats.orders}</span>
                <span style={{ display: 'flex', alignItems: 'center', color: '#00c257', fontSize: 12, fontWeight: 700, background: '#e6f8ed', padding: '2px 6px', borderRadius: 4 }}>
                  <TrendingUp size={12} style={{ marginRight: 2 }} /> 2%
                </span>
              </div>
            </div>
          </Col>

          {/* On Progress 2 (Duplicate per mock) */}
          <Col xs={24} sm={12} lg={5}>
            <div className="dash-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <MdOutlineTableChart size={16} color="#1e4a2d" />
                <span style={{ fontWeight: 700, fontSize: 12, color: '#1e4a2d' }}>Tables Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>14</span>
                <span style={{ color: '#6b7c6b', fontSize: 12, fontWeight: 600 }}>/ 20</span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Middle Row: Sales Statistic & Score */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          {/* Sales Statistic Line Chart */}
          <Col xs={24} lg={16}>
            <div className="dash-card" style={{ height: '400px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChartOutlined style={{ color: '#1e4a2d', fontSize: 18 }} />
                    <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Sales Statistic</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Badge color="#fadb14" /> Tea</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Badge color="#1e4a2d" /> Coffee</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Badge color="#f5222d" /> Snack</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <MoreOutlined style={{ fontSize: 20, color: '#6b7c6b' }} />
                  <SyncOutlined style={{ fontSize: 16, color: '#6b7c6b' }} />
                  <div style={{ background: '#f4f1eb', padding: '4px', borderRadius: 20, display: 'flex' }}>
                    <div className="filter-pill active">Day</div>
                    <div className="filter-pill">Month</div>
                    <div className="filter-pill">Year</div>
                    <div className="filter-pill">All</div>
                    <div className="filter-pill">Custom</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <span style={{ color: '#c0a060', fontWeight: 800, fontSize: 18 }}>${dbStats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fill: '#c0c0c0', fontSize: 10 }} stroke="#e0e0e0" />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 700 }}
                    />
                    <Line type="monotone" dataKey="coffee" stroke="#1e4a2d" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="tea" stroke="#fadb14" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="snack" stroke="#f5222d" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Col>

          {/* Score Widget */}
          <Col xs={24} lg={8}>
            <div className="dash-card" style={{ height: '400px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StarFilled style={{ color: '#1e4a2d', fontSize: 18 }} />
                  <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Score</span>
                </div>
                <MoreOutlined style={{ fontSize: 20, color: '#6b7c6b' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                {/* SVG for Dashed Capsule Progress */}
                <div style={{ position: 'relative', width: '260px', height: '100px' }}>
                  <svg width="260" height="100" viewBox="0 0 260 100">
                    <rect x="5" y="5" width="250" height="90" rx="45" fill="none" stroke="#e6f2eb" strokeWidth="8" strokeDasharray="4 6" />
                    <rect x="5" y="5" width="250" height="90" rx="45" fill="none" stroke="#a0d911" strokeWidth="8" strokeDasharray="4 6" strokeDashoffset="0" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 48, fontWeight: 900, color: '#1e4a2d', lineHeight: 1 }}>98</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#6b7c6b' }}>2/98 order</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1e4a2d' }}>Complains</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complains List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#ffccc7', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={18} color="#f5222d" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, color: '#1e4a2d', fontSize: 13 }}>Wrong Menu</span>
                      <span style={{ color: '#a0a0a0', fontSize: 11, fontWeight: 600 }}>Andrew Tate</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button shape="round" size="small" style={{ fontWeight: 700, fontSize: 11, padding: '0 16px' }}>Solve</Button>
                    <Button type="text" style={{ padding: 0 }} icon={<div style={{ display: 'flex', gap: 2 }}><span className="dotr"></span><span className="dotr"></span><span className="dotr"></span></div>} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#d9f7be', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StarFilled style={{ color: '#52c41a', fontSize: 18 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, color: '#1e4a2d', fontSize: 13 }}>Bad Rating</span>
                      <span style={{ color: '#a0a0a0', fontSize: 11, fontWeight: 600 }}>Don Ozwald</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button shape="round" size="small" style={{ fontWeight: 700, fontSize: 11, padding: '0 16px' }}>Solve</Button>
                    <Button type="text" style={{ padding: 0 }} icon={<div style={{ display: 'flex', gap: 2 }}><span className="dotr active"></span><span className="dotr active"></span><span className="dotr active"></span><span className="dotr active"></span></div>} />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Bottom Row: Radar & Table */}
        <Row gutter={[24, 24]}>
          {/* Items Performance Custom Radar */}
          <Col xs={24} lg={8}>
            <div className="dash-card" style={{ height: '100%', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingBag size={18} color="#1e4a2d" />
                  <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Items Performance</span>
                </div>
                <MoreOutlined style={{ fontSize: 20, color: '#6b7c6b' }} />
              </div>
              <div style={{ width: '100%', height: '280px', position: 'relative' }}>
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceData}>
                      <PolarGrid stroke="#e0e0e0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#1e4a2d', fontSize: 11, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Performance" dataKey="A" stroke="#a0d911" strokeWidth={2} fill="#ecfdd8" fillOpacity={0.8} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a0a0a0', fontWeight: 'bold' }}>No Data Available</div>
                )}
                {/* Dots on radar intersections to match the mock */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                  {/* Pseudo elements for points handled by Recharts mostly, but customized styles */}
                </div>
              </div>
            </div>
          </Col>

          {/* Recent Transaction Table */}
          <Col xs={24} lg={16}>
            <div className="dash-card" style={{ height: '100%', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e4a2d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Recent Transaction</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <SyncOutlined style={{ fontSize: 16, color: '#888' }} />
                  <div style={{ background: '#f4f1eb', padding: '4px', borderRadius: 20, display: 'flex' }}>
                    <div className="filter-pill active">All</div>
                    <div className="filter-pill">Tea</div>
                    <div className="filter-pill">Coffee</div>
                    <div className="filter-pill">Snack</div>
                  </div>
                </div>
              </div>

              <Table
                columns={columns}
                dataSource={transactionData}
                pagination={false}
                rowSelection={{
                  type: 'checkbox',
                }}
                className="custom-table"
              />

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <Button onClick={() => navigate('/order')} type="link" size="small" style={{ color: '#c0a060', fontWeight: 700, fontSize: 13 }}>
                  View All Transactions
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Spin>

      <style jsx>{`
        .dash-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.03);
          box-shadow: 0 4px 15px rgba(30, 74, 45, 0.03);
          padding: 16px 20px;
          height: 100%;
          transition: all 0.3s ease;
        }
        .dash-card:hover {
          box-shadow: 0 10px 25px rgba(30, 74, 45, 0.08);
          transform: translateY(-2px);
        }
        .filter-pill {
          padding: 4px 16px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 700;
          color: #a0a0a0;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-pill:hover {
          color: #1e4a2d;
        }
        .filter-pill.active {
          background: #ffffff;
          color: #1e4a2d;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .dotr {
          display: inline-block;
          width: 4px;
          height: 12px;
          background: #ffccc7;
          border-radius: 4px;
        }
        .dotr.active {
          background: #ff4d4f;
        }
        .custom-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 2px solid #f0f0f0;
          color: #000;
          font-weight: 800;
          font-size: 13px;
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8f8f8;
          padding: 16px 16px;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #fdfdfd !important;
        }
      `}</style>
    </div>
  );
}

export default HomePage;