import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Divider, Badge, Tooltip, Statistic,
    Select
} from "antd";
import {
    PlusOutlined,
    ShopOutlined,
    SearchOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
    GlobalOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    StopOutlined,
    CrownOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";

const { Title, Text } = Typography;

const BusinessPage = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [isRenewal, setIsRenewal] = useState(false);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("business", "get");
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error("Failed to fetch businesses");
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            const res = await request("business", "post", values);
            if (res) {
                message.success("New Business and Owner registered successfully!");
                setVisible(false);
                form.resetFields();
                getList();
            }
        } catch (error) {
            message.error(error.message || "Registration failed");
        }
    };

    const toggleStatus = async (record) => {
        const newStatus = record.status === 'active' ? 'suspended' : 'active';
        try {
            const res = await request("business/status", "put", { id: record.id, status: newStatus });
            if (res) {
                message.success(`Business ${newStatus} successfully`);
                getList();
            }
        } catch (error) {
            message.error("Status update failed");
        }
    };

    const handleUpdatePlan = async (values) => {
        try {
            const res = await request("business/plan", "put", {
                business_id: values.business_id,
                plan_id: values.plan_id,
                duration_days: values.duration_days
            });
            if (res) {
                message.success("Subscription updated successfully");
                setVisible(false);
                getList();
            }
        } catch (error) {
            message.error("Failed to update plan");
        }
    };

    const columns = [
        {
            title: "Business / Enterprise",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Space size="middle">
                    <div style={{
                        width: 45, height: 45, borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <ShopOutlined style={{ fontSize: '20px' }} />
                    </div>
                    <div>
                        <Text strong style={{ fontSize: '15px', color: '#1e4a2d' }}>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>ID: BIZ-{record.id.toString().padStart(4, '0')}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: "Owner Identity",
            dataIndex: "owner_name",
            key: "owner_name",
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: '13px' }}><UserOutlined /> {text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}><MailOutlined /> {record.email}</Text>
                </Space>
            )
        },
        {
            title: "Operations",
            key: "ops",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: '12px' }}>Branches: <Tag color="blue">{record.total_branches}</Tag></Text>
                    <Text style={{ fontSize: '12px' }}>Staff Capacity: <Tag color="green">{record.total_users}</Tag></Text>
                </Space>
            )
        },
        {
            title: "Plan Type",
            dataIndex: "plan_name",
            key: "plan_name",
            render: (plan) => (
                <Tag color="gold" style={{ borderRadius: '8px', border: 'none', padding: '2px 10px', fontWeight: 600 }}>
                    <SafetyCertificateOutlined /> {plan?.toUpperCase()}
                </Tag>
            )
        },
        {
            title: "Expiry / Period",
            dataIndex: "expiry_date",
            key: "expiry_date",
            render: (date) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: '13px' }}>
                        <CalendarOutlined /> {date ? new Date(date).toLocaleDateString() : "Life-time"}
                    </Text>
                    {date && new Date(date) < new Date() ? (
                        <Tag color="error" style={{ fontSize: '10px' }}>EXPIRED</Tag>
                    ) : date && (
                        <Tag color="processing" style={{ fontSize: '10px' }}>ACTIVE</Tag>
                    )}
                </Space>
            )
        },
        {
            title: "Health Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Badge
                    status={status === 'active' ? 'success' : 'error'}
                    text={status === 'active' ? "Operational" : "Suspended"}
                    style={{ fontWeight: 500 }}
                />
            )
        },
        {
            title: "Management",
            key: "actions",
            align: 'right',
            render: (record) => (
                <Space>
                    <Tooltip title="Manage Subscription">
                        <Button
                            icon={<CrownOutlined />}
                            onClick={() => {
                                setVisible(true);
                                setIsRenewal(true);
                                form.setFieldsValue({
                                    business_id: record.id,
                                    plan_id: record.plan_id,
                                    is_renewal: true
                                });
                            }}
                            style={{ color: '#c0a060' }}
                        >
                            Renew
                        </Button>
                    </Tooltip>
                    <Button
                        type={record.status === 'active' ? 'text' : 'primary'}
                        danger={record.status === 'active'}
                        icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                        onClick={() => toggleStatus(record)}
                    >
                        {record.status === 'active' ? "Suspend" : "Activate"}
                    </Button>
                </Space>
            )
        }
    ];

    const filteredList = list.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.owner_name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.email.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: '20px' }}>
            {/* Platform Overview */}
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ color: '#1e4a2d', margin: 0, fontWeight: 700 }}>
                    <GlobalOutlined /> Platform Ecosystem
                </Title>
                <Text type="secondary">System Administration: Managing business tenants and owner provisioning.</Text>
            </div>

            <Row gutter={16} style={{ marginBottom: 32 }}>
                <Col span={8}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Total Businesses" value={list.length} prefix={<ShopOutlined />} valueStyle={{ color: '#1e4a2d' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Active Subscriptions" value={list.filter(b => b.status === 'active').length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Revenue Engines" value={list.filter(b => b.plan_name === 'pro').length} prefix={<SafetyCertificateOutlined />} valueStyle={{ color: '#c0a060' }} />
                    </Card>
                </Col>
            </Row>

            <Card
                className="premium-table-card"
                style={{ borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: 'none' }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Text strong style={{ fontSize: '18px' }}>Business Registry</Text>
                        <Space>
                            <Input
                                placeholder="Search by Business, Owner or Email..."
                                prefix={<SearchOutlined />}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 300, borderRadius: '12px' }}
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setIsRenewal(false);
                                    setVisible(true);
                                }}
                                style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: '12px', height: '40px' }}
                            >
                                Onboard New Business
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Modal
                title={<Title level={3} style={{ margin: 0, color: '#1e4a2d' }}>
                    {isRenewal ? "Subscription Lifecycle Control" : "Business Onboarding"}
                </Title>}
                open={visible}
                onCancel={() => {
                    setVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={700}
                centered
            >
                <Divider style={{ margin: '12px 0 24px 0' }} />
                <Form form={form} layout="vertical" onFinish={isRenewal ? handleUpdatePlan : onFinish}>
                    <Form.Item name="business_id" hidden><Input /></Form.Item>
                    <Form.Item name="is_renewal" hidden><Input /></Form.Item>

                    <Row gutter={24}>
                        {!isRenewal && (
                            <>
                                <Col span={24}>
                                    <Text strong style={{ color: '#c0a060', fontSize: '12px' }}>ENTERPRISE DETAILS</Text>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="business_name" label="Business Name" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. Amazon Coffee" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="phone" label="Business Contact">
                                        <Input prefix={<PhoneOutlined />} placeholder="012 345 678" size="large" />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        <Col span={24} style={{ marginTop: 12 }}>
                            <Text strong style={{ color: '#c0a060', fontSize: '12px' }}>
                                {isRenewal ? "PLAN CONFIGURATION" : "OWNER CREDENTIALS"}
                            </Text>
                        </Col>

                        {!isRenewal ? (
                            <>
                                <Col span={12}>
                                    <Form.Item name="owner_name" label="Owner Full Name" rules={[{ required: true }]}>
                                        <Input prefix={<UserOutlined />} placeholder="Owner Name" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="email" label="Owner Email (Login)" rules={[{ required: true, type: 'email' }]}>
                                        <Input prefix={<MailOutlined />} placeholder="owner@gmail.com" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="password" label="Temporary Password" rules={[{ required: true, min: 6 }]}>
                                        <Input.Password placeholder="******" size="large" />
                                    </Form.Item>
                                </Col>
                            </>
                        ) : (
                            <Col span={12}>
                                <Form.Item name="duration_days" label="Subscription Duration" initialValue={30} rules={[{ required: true }]}>
                                    <Select size="large">
                                        <Select.Option value={30}>1 Month (30 Days)</Select.Option>
                                        <Select.Option value={90}>3 Months</Select.Option>
                                        <Select.Option value={180}>6 Months</Select.Option>
                                        <Select.Option value={365}>1 Year (Normal)</Select.Option>
                                        <Select.Option value={730}>2 Years (Bonus)</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        )}

                        <Col span={12}>
                            <Form.Item name="plan_id" label="Selected Tier" initialValue={1}>
                                <Select size="large">
                                    <Select.Option value={1}>Free Entry Tier</Select.Option>
                                    <Select.Option value={2}>Pro Enterprise Plan</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ textAlign: 'right', marginTop: 32 }}>
                        <Space size="large">
                            <Button size="large" onClick={() => {
                                setVisible(false);
                                form.resetFields();
                            }}>Cancel</Button>
                            <Button size="large" type="primary" htmlType="submit" style={{ background: '#1e4a2d', borderColor: '#1e4a2d', minWidth: 200 }}>
                                {isRenewal ? "Update & Issue Subscription" : "Provision Enterprise"}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default BusinessPage;
