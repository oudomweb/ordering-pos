import React, { useEffect, useState } from "react";
import {
    Table,
    Card,
    Typography,
    Tag,
    Row,
    Col,
    Button,
    Modal,
    Form,
    InputNumber,
    Input,
    message,
    Space,
    Badge,
    Divider,
    Select
} from "antd";
import {
    CreditCardOutlined,
    EditOutlined,
    CheckCircleOutlined,
    ShopOutlined,
    UsergroupAddOutlined,
    ShoppingOutlined,
    CrownOutlined,
    TeamOutlined,
    MonitorOutlined,
    SyncOutlined,
    SettingOutlined,
    KeyOutlined,
    BankOutlined,
    PlusOutlined,
    QrcodeOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { Tabs } from "antd";
import { Config } from "../../util/config";
import dayjs from "dayjs";
import { Upload } from "lucide-react";
const { TabPane } = Tabs;

const { Title, Text } = Typography;

const PlanPage = () => {
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [systemForm] = Form.useForm();
    const [editingPlan, setEditingPlan] = useState(null);
    const [activeTab, setActiveTab] = useState("plans");
    const [systemSettings, setSystemSettings] = useState({});
    const [sysLoading, setSysLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        fetchPlans();
        fetchSubscriptions();
        fetchSystemSettings();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        const res = await request("plans", "get");
        if (res && res.success) {
            setPlans(res.plans);
        }
        setLoading(false);
    };

    const fetchSubscriptions = async () => {
        const res = await request("system-subscriptions", "get");
        if (res && res.success) {
            setSubscriptions(res.list);
        }
    };

    const fetchSystemSettings = async () => {
        setSysLoading(true);
        const res = await request("system-settings", "get");
        if (res && res.success) {
            setSystemSettings(res.settings);
            systemForm.setFieldsValue(res.settings);
            if (res.settings.payway_khqr_image) {
                setFileList([{
                    uid: '-1',
                    name: 'khqr.png',
                    status: 'done',
                    url: Config.getFullImagePath(res.settings.payway_khqr_image),
                }]);
            }
        }
        setSysLoading(false);
    };

    const handleSaveSystemSettings = async (values) => {
        setSysLoading(true);
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined) formData.append(key, values[key]);
        });

        if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append("khqr_image", fileList[0].originFileObj);
        } else if (fileList.length === 0 && systemSettings.payway_khqr_image) {
            formData.append("image_remove", "1");
        }

        const res = await request("system-settings", "put", formData);
        if (res && res.success) {
            message.success("Master payment settings updated!");
            fetchSystemSettings();
        }
        setSysLoading(false);
    };

    const handleEdit = (record) => {
        setEditingPlan(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const res = await request("plans", "put", { ...values, id: editingPlan.id });
            if (res && res.success) {
                message.success("Plan updated successfully!");
                setIsModalOpen(false);
                fetchPlans();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const columns = [
        {
            title: "Plan Name",
            dataIndex: "name",
            key: "name",
            render: (text) => (
                <Space>
                    {text.includes("Pro") ? <CrownOutlined style={{ color: '#c0a060' }} /> : null}
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (price, record) => <Text style={{ color: '#1e4a2d', fontWeight: 700 }}>${price}{record.billing_cycle === 'lifetime' ? ' (One-time)' : '/mo'}</Text>
        },
        {
            title: "Limits",
            key: "limits",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Tag icon={<ShopOutlined />} color="blue">
                        {record.max_branches === 999 ? "Unlimited" : record.max_branches} Branches
                    </Tag>
                    <Tag icon={<UsergroupAddOutlined />} color="green" style={{ marginTop: 4 }}>
                        {record.max_staff === 999 ? "Unlimited" : record.max_staff} Staff
                    </Tag>
                    <Tag icon={<ShoppingOutlined />} color="orange" style={{ marginTop: 4 }}>
                        {record.max_products === 9999 ? "Unlimited" : record.max_products} Products
                    </Tag>
                </Space>
            )
        },
        {
            title: "Status",
            dataIndex: "is_active",
            key: "status",
            render: (active) => (
                <Badge
                    status={active ? "success" : "default"}
                    text={active ? "Active" : "Inactive"}
                />
            )
        },
        {
            title: "Action",
            key: "action",
            align: 'center',
            render: (_, record) => (
                <Button
                    type="primary"
                    ghost
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                >
                    Config
                </Button>
            )
        }
    ];

    const subColumns = [
        {
            title: "Business / Owner",
            key: "business",
            render: (_, row) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: '#1e4a2d' }}>{row.business_name}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{row.owner_name}</Text>
                </Space>
            )
        },
        {
            title: "Current Plan",
            dataIndex: "plan_name",
            render: (name) => <Tag color="green">{name}</Tag>
        },
        {
            title: "Expires On",
            dataIndex: "end_date",
            render: (date) => date ? dayjs(date).format("DD MMM YYYY") : "Lifetime"
        },
        {
            title: "Time Remaining",
            render: (_, row) => {
                if (!row.end_date) return <Text type="success">Permanent</Text>;
                const days = row.days_remaining;
                let color = "success";
                if (days < 0) color = "danger";
                else if (days <= 7) color = "warning";

                return (
                    <Text type={color}>
                        {days < 0 ? `Expired (${Math.abs(days)}d ago)` : `${days} days left`}
                    </Text>
                );
            }
        },
        {
            title: "Status",
            dataIndex: "sub_status",
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'error'}>
                    {(status || 'ACTIVE').toUpperCase()}
                </Tag>
            )
        }
    ];

    return (
        <div style={{ padding: "0 20px" }}>
            <Card
                style={{
                    borderRadius: "24px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
                    border: 'none',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fbf9 100%)'
                }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    tabBarExtraContent={
                        <Button type="primary" onClick={activeTab === 'plans' ? fetchPlans : fetchSubscriptions} ghost icon={<SyncOutlined />}>
                            Sync Data
                        </Button>
                    }
                >
                    <TabPane
                        tab={<span><CreditCardOutlined />Plan Definitions</span>}
                        key="plans"
                    >
                        <Table
                            columns={columns}
                            dataSource={plans}
                            rowKey="id"
                            loading={loading}
                            pagination={false}
                            className="premium-table"
                        />
                        <Divider />
                        <div style={{ background: '#f4f1eb', padding: '20px', borderRadius: '16px' }}>
                            <Title level={4}>Plan Features Logic</Title>
                            <ul>
                                <li><Text strong>Free Plan:</Text> Designed for single-shop testers. Hard limit of 1 branch.</li>
                                <li><Text strong>Pro Plan:</Text> For growing businesses. Increases staff and product capacity significantly.</li>
                                <li><Text strong>Enterprise:</Text> Custom pricing, virtually unlimited resources.</li>
                            </ul>
                        </div>
                    </TabPane>

                    <TabPane
                        tab={<span><MonitorOutlined />Client Subscriptions</span>}
                        key="monitoring"
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Title level={4}>SaaS Customer Monitor</Title>
                            <Text type="secondary">Track global business health and upcoming expirations.</Text>
                        </div>
                        <Table
                            columns={subColumns}
                            dataSource={subscriptions}
                            rowKey="business_id"
                            loading={loading}
                        />
                    </TabPane>

                    <TabPane
                        tab={<span><SettingOutlined />Master Payment API</span>}
                        key="payment_api"
                    >
                        <div style={{ padding: '0 10px' }}>
                            <div style={{ marginBottom: 20 }}>
                                <Title level={4}>Platform Master Payment Setup</Title>
                                <Text type="secondary">Configure your bank credentials to receive plan upgrade payments from all clients.</Text>
                            </div>

                            <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0', background: '#fdfdfd' }}>
                                <Form form={systemForm} layout="vertical" onFinish={handleSaveSystemSettings}>
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item name="payway_merchant_id" label="Merchant ID" tooltip="Your ABA PayWay or Bank Merchant ID">
                                                <Input prefix={<BankOutlined />} placeholder="e.g. M123456" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="payway_receiver_name" label="Receiver Name" tooltip="The name displayed to customers in bank apps">
                                                <Input prefix={<TeamOutlined />} placeholder="e.g. COFFEE SaaS PLATFORM" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item name="payway_api_key" label="API Token Key (Master)" tooltip="The secret API key for dynamic transaction generation">
                                                <Input.Password prefix={<KeyOutlined />} placeholder="Your Secret API Key" />
                                            </Form.Item>
                                        </Col>

                                        <Col span={24}>
                                            <Divider orientation="left" style={{ fontSize: 13, color: '#999' }}>Master KHQR Image (Fallback)</Divider>
                                            <Form.Item label="Upload Platform QR">
                                                <Upload
                                                    listType="picture-card"
                                                    fileList={fileList}
                                                    onChange={({ fileList }) => setFileList(fileList)}
                                                    beforeUpload={() => false}
                                                    maxCount={1}
                                                >
                                                    {fileList.length < 1 && (
                                                        <div>
                                                            <PlusOutlined />
                                                            <div style={{ marginTop: 8 }}>Upload QR</div>
                                                        </div>
                                                    )}
                                                </Upload>
                                                <Text type="secondary" style={{ fontSize: 11 }}>This image will be shown if dynamic QR generation is disabled or fails.</Text>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={sysLoading}
                                        icon={<CheckCircleOutlined />}
                                        style={{ height: 40, borderRadius: 8, background: '#1e4a2d' }}
                                    >
                                        Save Master Configuration
                                    </Button>
                                </Form>
                            </Card>

                            <div style={{ marginTop: 24, padding: 16, background: '#e6f7ff', borderRadius: 12, border: '1px solid #91d5ff' }}>
                                <Space align="start">
                                    <QrcodeOutlined style={{ fontSize: 20, color: '#1890ff', marginTop: 4 }} />
                                    <div>
                                        <Text strong>Automatic Amount Detection</Text><br />
                                        <Text size="small" type="secondary">When configured, the system will automatically generate a dynamic KHQR with the exact plan price (e.g. $29.00) when a client clicks upgrade. This prevents manual entry errors and speeds up the checkout process.</Text>
                                    </div>
                                </Space>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            </Card>

            <Modal
                title={`Configure ${editingPlan?.name}`}
                open={isModalOpen}
                onOk={handleSave}
                onCancel={() => setIsModalOpen(false)}
                okText="Save Configuration"
                width={500}
                bodyStyle={{ paddingTop: 20 }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Plan Name" rules={[{ required: true }]}>
                        <Input placeholder="Plan Name" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="max_branches" label="Max Branches" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="max_staff" label="Max Staff" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="max_products" label="Max Products" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="price" label="Price ($)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="billing_cycle" label="Billing Cycle" rules={[{ required: true }]}>
                                <Select>
                                    <Select.Option value="monthly">Monthly</Select.Option>
                                    <Select.Option value="lifetime">Lifetime (One-time)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label="Status" valuePropName="checked">
                                <Badge
                                    status={form.getFieldValue("is_active") ? "success" : "default"}
                                    text={form.getFieldValue("is_active") ? "Active" : "Inactive"}
                                />
                                <Select style={{ width: '100%', marginTop: 8 }}>
                                    <Select.Option value={1}>Active</Select.Option>
                                    <Select.Option value={0}>Inactive</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default PlanPage;
