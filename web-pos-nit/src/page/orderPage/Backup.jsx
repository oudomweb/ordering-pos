import React, { useEffect, useState } from "react";
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
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Badge,
  Tooltip,
  Dropdown
} from "antd";
import dayjs from "dayjs";
import { 
  FilterOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  MoreOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
   ArrowUpOutlined,
  ArrowDownOutlined
} from "@ant-design/icons";

import { request, formatDateClient, formatDateServer, isPermission } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { getProfile } from "../../store/profile.store";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

function OrderPage() {
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [summary, setSummary] = useState({ 
    total_amount: 0, 
    total_order: 0,
    fulfilled_orders: 0,
    pending_orders: 0,
    return_orders: 0,
    order_items: 0
  });
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    visibleModal: false,
    txtSearch: "",
    activeTab: "all"
  });

  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(30, 'day'),
    to_date: dayjs(),
    user_id: ""
  });

  // Calculate metrics from data
  const calculateMetrics = (orders) => {
    const fulfilled = orders.filter(order => order.status === 'fulfilled' || order.status === 'success').length;
    const pending = orders.filter(order => order.status === 'pending').length;
    const returns = orders.filter(order => order.status === 'returned').length;
    const totalItems = orders.reduce((sum, order) => sum + (order.total_items || 0), 0);
    
    return {
      total_order: orders.length,
      total_amount: orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      fulfilled_orders: fulfilled,
      pending_orders: pending,
      return_orders: returns,
      order_items: totalItems
    };
  };

  const getList = async () => {
    setLoading(true);
    try {
      const param = {
        txtSearch: state.txtSearch,
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        user_id: filter.user_id || getProfile().id
      };
      const res = await request(`order/${param.user_id}`, "get", param);
      if (res) {
        const orders = res.list || [];
        setList(orders);
        const calculatedSummary = calculateMetrics(orders);
        setSummary({ ...calculatedSummary, ...(res.summary || {}) });
      }
    } catch (error) {
      message.error("Failed to fetch order data");
    } finally {
      setLoading(false);
    }
  };

  const getOrderDetail = async (data) => {
    setLoading(true);
    try {
      const res = await request("order_detail/" + data.id, "get");
      if (res) {
        setOrderDetail(res.list || []);
        setState((prev) => ({ ...prev, visibleModal: true }));
      }
    } catch (error) {
      message.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
  }, [filter.user_id, filter.from_date, filter.to_date]);

  const handleSearch = () => getList();
  
  const onCloseModal = () => {
    formRef.resetFields();
    setState((prev) => ({ ...prev, visibleModal: false }));
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'orange',
      'success': 'green',
      'fulfilled': 'green',
      'cancelled': 'red',
      'returned': 'red'
    };
    return statusColors[status?.toLowerCase()] || 'blue';
  };

  const getPaymentColor = (method) => {
    const paymentColors = {
      'cash': 'green',
      'card': 'blue',
      'online': 'purple',
      'bank': 'cyan'
    };
    return paymentColors[method?.toLowerCase()] || 'green';
  };

  const filteredList = state.activeTab === 'all' ? list : list.filter(item => {
    switch(state.activeTab) {
      case 'unfulfilled': return item.status === 'pending';
      case 'unpaid': return item.payment_status === 'unpaid';
      case 'open': return item.status === 'open';
      case 'closed': return item.status === 'fulfilled' || item.status === 'success';
      default: return true;
    }
  });

  const actionMenu = (record) => ({
    items: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => getOrderDetail(record)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit Order',
        disabled: !isPermission('order.edit')
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete Order',
        danger: true,
        disabled: !isPermission('order.delete')
      }
    ]
  });

  return (
    <div style={{ padding: '24px', background: '#f5f5f5' }}>
      {/* Date Range Picker */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <RangePicker
          value={[filter.from_date, filter.to_date]}
          format="MMM D, YYYY"
          onChange={(dates) => {
            if (dates && dates.length === 2) {
              setFilter(prev => ({
                ...prev,
                from_date: dates[0],
                to_date: dates[1]
              }));
            }
          }}
          style={{ marginBottom: 0 }}
        />
        <Button type="primary">Export</Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={summary.total_order}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              suffix={
                <div style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> 25.2% last week
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Order Items over time"
              value={summary.order_items || 15}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <div style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowDownOutlined /> 18.2% last week
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Returns Orders"
              value={summary.return_orders}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              suffix={
                <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
                  <ArrowDownOutlined /> -1.2% last week
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Fulfilled orders over time"
              value={summary.fulfilled_orders || 12}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <div style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowDownOutlined /> 12.2% last week
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card>
        {/* Tabs and Search */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Tabs 
              activeKey={state.activeTab} 
              onChange={(key) => setState(prev => ({ ...prev, activeTab: key }))}
              items={[
                { key: 'all', label: `All`, children: null },
                { key: 'unfulfilled', label: `Unfulfilled`, children: null },
                { key: 'unpaid', label: `Unpaid`, children: null },
                { key: 'open', label: `Open`, children: null },
                { key: 'closed', label: `Closed`, children: null }
              ]}
            />
            <Button>Add</Button>
          </div>
          
          <Space wrap>
            <Input.Search
              placeholder="Search by order, customer, etc."
              allowClear
              value={state.txtSearch}
              onChange={(e) => setState(prev => ({ ...prev, txtSearch: e.target.value }))}
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              allowClear
              style={{ width: 200 }}
              placeholder="Select User"
              value={filter.user_id}
              options={config?.user || []}
              onChange={(value) => setFilter(prev => ({ ...prev, user_id: value }))}
            />
            <Button icon={<FilterOutlined />}>Filter</Button>
            <Button>Sort</Button>
          </Space>
        </div>

        {/* Orders Table */}
        <Table
          loading={loading}
          rowKey="id"
          dataSource={filteredList}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          columns={[
            {
              title: "Order",
              dataIndex: "order_no",
              width: 120,
              render: (value) => <Tag color="blue">{value}</Tag>
            },
            {
              title: "Date",
              dataIndex: "create_at",
              width: 120,
              render: (v) => formatDateClient(v, "MMM D, YYYY"),
              sorter: (a, b) => dayjs(a.create_at).unix() - dayjs(b.create_at).unix()
            },
            {
              title: "Customer",
              dataIndex: "customer_name",
              render: (v, record) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{v || record.create_by}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {record.customer_phone || record.customer_email}
                  </div>
                </div>
              )
            },
            {
              title: "Payment",
              dataIndex: "payment_method",
              width: 100,
              render: (v, record) => (
                <div>
                  <Tag color={getPaymentColor(v)}>{v}</Tag>
                  {record.payment_status === 'pending' && (
                    <div><Badge status="warning" text="Pending" /></div>
                  )}
                  {record.payment_status === 'success' && (
                    <div><Badge status="success" text="Success" /></div>
                  )}
                </div>
              )
            },
            {
              title: "Total",
              dataIndex: "total_amount",
              width: 100,
              align: 'right',
              render: (v) => <strong>${Number(v).toFixed(2)}</strong>,
              sorter: (a, b) => Number(a.total_amount) - Number(b.total_amount)
            },
            {
              title: "Delivery",
              dataIndex: "delivery_status",
              width: 100,
              render: (v) => v || "N/A"
            },
            {
              title: "Items",
              dataIndex: "total_items",
              width: 80,
              align: 'center',
              render: (v, record) => {
                const itemCount = v || (orderDetail.length > 0 ? orderDetail.length : 1);
                return `${itemCount} item${itemCount > 1 ? 's' : ''}`;
              }
            },
            {
              title: "Fulfillment",
              dataIndex: "status",
              width: 120,
              render: (status) => {
                const isFulfilled = status === 'fulfilled' || status === 'success';
                const isUnfulfilled = status === 'pending' || status === 'processing';
                
                if (isFulfilled) {
                  return <Badge status="success" text="Fulfilled" />;
                } else if (isUnfulfilled) {
                  return <Badge status="error" text="Unfulfilled" />;
                }
                return <Badge status="default" text={status || 'Unknown'} />;
              }
            },
            {
              title: "Action",
              width: 80,
              align: "center",
              render: (_, record) => (
                <Space>
                  <Tooltip title="View Details">
                    <Button 
                      size="small" 
                      icon={<EyeOutlined />} 
                      onClick={() => getOrderDetail(record)} 
                    />
                  </Tooltip>
                  <Dropdown menu={actionMenu(record)} trigger={['click']}>
                    <Button size="small" icon={<MoreOutlined />} />
                  </Dropdown>
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* Order Detail Modal */}
      <Modal
        open={state.visibleModal}
        title="Order Detail"
        onCancel={onCloseModal}
        footer={null}
        width={900}
      >
        <Table
          dataSource={orderDetail}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: "Product",
              dataIndex: "product_name",
              render: (_, data) => (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {data.product_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {data.category_name}
                  </div>
                </div>
              )
            },
            {
              title: "Qty",
              dataIndex: "total_quantity",
              width: 80,
              align: "center",
              render: (t) => <Tag color="blue">{t}</Tag>
            },
            {
              title: "Price",
              dataIndex: "unit_price",
              width: 100,
              align: "right",
              render: (t) => `$${Number(t).toFixed(2)}`
            },
            {
              title: "Total",
              dataIndex: "grand_total",
              width: 120,
              align: "right",
              render: (t) => <strong>${Number(t).toFixed(2)}</strong>
            }
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                <strong>Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <strong>
                  ${orderDetail.reduce((sum, item) => sum + Number(item.grand_total || 0), 0).toFixed(2)}
                </strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Modal>
    </div>
  );
}

export default OrderPage