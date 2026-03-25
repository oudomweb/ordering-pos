import React, { useEffect, useState } from "react";
import {
    Form,
    Input,
    Button,
    Upload,
    message,
    Card,
    Row,
    Col,
    Typography,
    Divider,
    Space,
    InputNumber,
    Select,
    Avatar
} from "antd";
import {
    SettingOutlined,
    ShopOutlined,
    GlobalOutlined,
    SaveOutlined,
    CameraOutlined,
    PercentageOutlined,
    DollarOutlined,
    PhoneOutlined,
    MailOutlined,
    FacebookOutlined,
    SendOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { Config } from "../../util/config";
import { getProfile } from "../../store/profile.store";
import { useProfileStore } from "../../store/profileStore";
import { useExchangeRate } from "../../component/pos/ExchangeRateContext";

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [settings, setSettings] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { setProfile } = useProfileStore();
    const { refreshRate } = useExchangeRate();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setFetching(true);
        try {
            const res = await request("settings", "get");
            if (res && res.settings) {
                setSettings(res.settings);
                form.setFieldsValue(res.settings);
                if (res.settings.logo && res.settings.logo !== "null" && res.settings.logo !== "undefined") {
                    setPreviewUrl(Config.getFullImagePath(res.settings.logo));
                } else {
                    setPreviewUrl(null);
                }
            }
        } catch (error) {
            console.error("Fetch settings error:", error);
            message.error("Failed to load business settings");
        } finally {
            setFetching(false);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.keys(values).forEach(key => {
                if (values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            });

            if (imageFile) {
                formData.append("upload_logo", imageFile);
            }

            const res = await request("settings", "put", formData);
            if (res && res.success) {
                message.success("Settings updated successfully!");

                // Update Local Profile for real-time logo change in sidebar
                const currentProfile = getProfile();
                if (currentProfile) {
                    const updatedProfile = {
                        ...currentProfile,
                        business_name: values.name,
                        business_logo: res.logo || currentProfile.business_logo // Assume API returns new filename
                    };
                    setProfile(updatedProfile);
                }

                fetchSettings(); // Refresh UI
                refreshRate(); // Refresh the global exchange rate context
            }
        } catch (error) {
            console.error("Update settings error:", error);
            message.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    if (fetching) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
                <Card loading={true} style={{ width: 400 }} />
            </div>
        );
    }

    return (
        <div style={{ padding: "32px", background: "#f4f1eb", minHeight: "100vh" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ marginBottom: "24px" }}>
                    <Title level={2} style={{ color: "#1e4a2d", display: "flex", alignItems: "center", gap: "12px" }}>
                        <SettingOutlined /> General Settings / ការកំណត់ទូទៅ
                    </Title>
                    <Text type="secondary">Manage your business information and Point of Sale configurations</Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                >
                    <Row gutter={24}>
                        {/* Left Column: Business Info */}
                        <Col xs={24} lg={16}>
                            <Card
                                title={<Space><ShopOutlined /> Business Information</Space>}
                                style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                            >
                                <Row gutter={16}>
                                    <Col xs={24} md={6}>
                                        <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                            <Text strong style={{ display: "block", marginBottom: "12px" }}>Business Logo</Text>
                                            <div style={{ position: "relative", display: "inline-block" }}>
                                                <Avatar
                                                    size={120}
                                                    shape="square"
                                                    src={previewUrl}
                                                    icon={<ShopOutlined />}
                                                    style={{
                                                        borderRadius: "12px",
                                                        border: "1px solid #e8e3d8",
                                                        background: "#fff",
                                                        color: "#1e4a2d"
                                                    }}
                                                />
                                                <Upload
                                                    showUploadList={false}
                                                    beforeUpload={() => false}
                                                    onChange={handleLogoChange}
                                                >
                                                    <Button
                                                        size="small"
                                                        shape="circle"
                                                        icon={<CameraOutlined />}
                                                        style={{ position: "absolute", bottom: -10, right: -10, background: "#c0a060", color: "#fff", border: "none" }}
                                                    />
                                                </Upload>
                                            </div>
                                        </div>
                                    </Col>

                                    <Col xs={24} md={18}>
                                        <Row gutter={16}>
                                            <Col xs={24} md={12}>
                                                <Form.Item label="Business Name" name="name" rules={[{ required: true }]}>
                                                    <Input placeholder="e.g. Green Grounds Coffee" size="large" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item label="Owner Name" name="owner_name">
                                                    <Input placeholder="System Owner Name" size="large" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item label="Phone Number" name="phone">
                                                    <Input prefix={<PhoneOutlined />} placeholder="012 345 678" size="large" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item label="Email Address" name="email">
                                                    <Input prefix={<MailOutlined />} placeholder="business@example.com" size="large" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item label="Address" name="address">
                                            <Input.TextArea rows={2} placeholder="No. 123, St 456, Phnom Penh" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Website / URL" name="website">
                                            <Input prefix={<GlobalOutlined />} placeholder="https://www.example.com" size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card
                                title={<Space><GlobalOutlined /> Social & Online Connectivity</Space>}
                                style={{ borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                            >
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Telegram Channel/Bot Link" name="telegram_link">
                                            <Input prefix={<SendOutlined style={{ color: '#0088cc' }} />} placeholder="https://t.me/yourcoffee" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Facebook Page" name="facebook_link">
                                            <Input prefix={<FacebookOutlined style={{ color: '#1877f2' }} />} placeholder="https://fb.com/yourpage" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        {/* Right Column: POS Configuration */}
                        <Col xs={24} lg={8}>
                            <Card
                                title={<Space><DollarOutlined /> POS & Financial Config</Space>}
                                style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                            >
                                <Form.Item label="Currency Symbol" name="currency_symbol">
                                    <Select size="large">
                                        <Option value="$">$ (USD)</Option>
                                        <Option value="៛">៛ (KHR)</Option>
                                        <Option value="฿">฿ (THB)</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    label="Exchange Rate (1 USD = ? KHR)"
                                    name="kh_exchange_rate"
                                >
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        size="large"
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    />
                                </Form.Item>

                                <Divider />

                                <Form.Item label="VAT / Tax (%)" name="tax_percent">
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        size="large"
                                        min={0}
                                        max={100}
                                        prefix={<PercentageOutlined />}
                                    />
                                </Form.Item>

                                <Form.Item label="Service Charge (%)" name="service_charge">
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        size="large"
                                        min={0}
                                        max={100}
                                        prefix={<PercentageOutlined />}
                                    />
                                </Form.Item>
                            </Card>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<SaveOutlined />}
                                size="large"
                                style={{
                                    width: "100%",
                                    height: "56px",
                                    borderRadius: "12px",
                                    background: "#1e4a2d",
                                    borderColor: "#1e4a2d",
                                    boxShadow: "0 8px 20px rgba(30,74,45,0.2)"
                                }}
                            >
                                Save All Changes
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    );
};

export default SettingsPage;
