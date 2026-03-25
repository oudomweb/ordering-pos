import {
    Card, Col, Row, Progress, Statistic, Tag, Button, Typography,
    Space, Divider, Alert, Empty, Modal, List, Radio, message,
    Table, Tabs, Spin, Result
} from "antd";
import {
    CrownOutlined, CheckCircleOutlined, InfoCircleOutlined,
    WarningOutlined, RocketOutlined, HistoryOutlined,
    CalendarOutlined, SafetyCertificateOutlined, ThunderboltOutlined,
    LoginOutlined, CloseCircleOutlined, FilePdfOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../../util/helper";
import { Config } from "../../util/config";
import { useLanguage, translations } from "../../store/language.store";
import QRCode from 'react-qr-code';
import { Image as AntImage } from 'antd'; // Rename to avoid conflict with potential other Image components

const CRC16 = (data) => {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
        x ^= x >> 4;
        crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

const generateKHQR = (merchantId, name, amount, currency = "USD") => {
    const f = (id, val) => id + val.length.toString().padStart(2, '0') + val;
    const merchantInfo = f("00", merchantId);
    let payload =
        f("00", "01") +
        f("01", "12") +
        f("29", merchantInfo) +
        f("52", "5999") +
        f("53", currency === "USD" ? "840" : "116") +
        f("54", parseFloat(amount).toFixed(2)) +
        f("58", "KH") +
        f("59", name.substring(0, 25)) +
        f("60", "PHNOM PENH");
    payload += "6304";
    return payload + CRC16(payload);
};

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// ─────────────────────────────────────────────
//  Small helper: coloured status tag
// ─────────────────────────────────────────────
const StatusTag = ({ status }) => {
    const map = {
        active: { color: "success", label: "Active" },
        expired: { color: "error", label: "Expired" },
        cancelled: { color: "default", label: "Cancelled" },
    };
    const s = map[status] || { color: "default", label: status };
    return <Tag color={s.color}>{s.label.toUpperCase()}</Tag>;
};

function MyPlanPage() {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [billingHistory, setBillingHistory] = useState([]);
    const [billingLoading, setBillingLoading] = useState(false);

    const navigate = useNavigate();

    // Modal states
    const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);

    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [upgradeResult, setUpgradeResult] = useState(null); // { plan_name, end_date }
    const [paymentSession, setPaymentSession] = useState(null); // { tran_id, amount, plan_name }

    useEffect(() => {
        fetchPlan();
        fetchAvailablePlans();
    }, []);

    const fetchPlan = async () => {
        setLoading(true);
        const res = await request("my-plan", "get");
        if (res && res.success) {
            setData(res.plan);
            setSelectedPlanId(res.plan.plan_id);
        }
        setLoading(false);
    };

    const fetchAvailablePlans = async () => {
        const res = await request("plans", "get");
        if (res && res.success) setPlans(res.plans);
    };

    const fetchBillingHistory = async () => {
        setBillingLoading(true);
        const res = await request("my-plan/billing-history", "get");
        if (res && res.success) setBillingHistory(res.history || []);
        setBillingLoading(false);
    };

    // ── Step 4: open confirmation modal ──────────────────────────
    const handleOpenConfirm = () => {
        if (!selectedPlanId || selectedPlanId === data?.plan_id) {
            message.warning("Please select a different plan to upgrade.");
            return;
        }
        setIsUpgradeModalVisible(false);
        setIsConfirmModalVisible(true);
    };

    // ── Payment: create payment session ──────────────────────────
    const handleConfirmUpgrade = async () => {
        setIsUpgrading(true);
        const res = await request("payment/create", "post", {
            plan_id: selectedPlanId,
            duration_days: 30,
        });
        setIsUpgrading(false);

        if (!res || !res.success) {
            message.error(res?.message || "Failed to initiate payment.");
            return;
        }

        // FREE plan — upgrade immediately
        if (res.is_free) {
            const plan = plans.find((p) => p.id === selectedPlanId);
            setUpgradeResult({ plan_name: plan?.name || "Free Plan", end_date: null });
            setIsConfirmModalVisible(false);
            setIsSuccessModalVisible(true);
            fetchPlan();
            return;
        }

        // PAID plan — show payment modal
        setPaymentSession(res); // { tran_id, amount, plan_name }
        setIsConfirmModalVisible(false);
        setIsPaymentModalVisible(true);
    };

    // ── Payment: go to PayWay (real) ─────────────────────────────
    const handleProceedToPayWay = () => {
        navigate(`/payment/result?tran_id=${paymentSession.tran_id}`);
    };

    // ── Payment: simulate success (DEV only) ─────────────────────
    const handleSimulatePayment = async () => {
        if (!paymentSession) return;
        const res = await request("payment/simulate-success", "post", { tran_id: paymentSession.tran_id });
        if (res && res.success) {
            const plan = plans.find((p) => p.id === selectedPlanId);
            setUpgradeResult({ plan_name: plan?.name || "Plan", end_date: null });
            setIsPaymentModalVisible(false);
            setIsSuccessModalVisible(true);
            fetchPlan();
        } else {
            message.error(res?.message || "Simulation failed.");
        }
    };
const handleDownloadInvoice = async (tranId) => {
    try {
        const token = localStorage.getItem("token"); // ឬ key ដែលអ្នកប្រើក្នុង auth
        const response = await fetch(
            `${Config.base_url}payment/invoice/${tranId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) {
            message.error("Failed to download invoice.");
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${tranId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        message.error("Invoice error.");
    }
};

    const handleSuccessDone = () => {
        setIsSuccessModalVisible(false);
        message.info("Please logout and login again to activate your new permissions.");
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <Spin size="large" tip="Loading your subscription..." />
            </div>
        );
    }
    if (!data) return <Empty description="Could not load plan details" />;

    const {
        usage = { staff: 0, branches: 0, products: 0 },
        subscription = { end_date: null, start_date: null, status: "active" },
        name,
        max_branches,
        max_staff,
        max_products,
    } = data;

    const today = dayjs();
    const expiry = subscription.end_date ? dayjs(subscription.end_date) : null;
    const daysLeft = expiry ? expiry.diff(today, "day") : null;
    const isExpired = daysLeft !== null && daysLeft < 0;

    const getProgressStatus = (current, max) => {
        if (!max) return "normal";
        const pct = (current / max) * 100;
        if (pct >= 90) return "exception";
        if (pct >= 70) return "active";
        return "normal";
    };

    // The plan the user currently has selected in the upgrade modal
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);

    // Billing History Table columns
    const billingColumns = [
        {
            title: t.plans,
            dataIndex: "plan_name",
            key: "plan_name",
            render: (name) => (
                <Space>
                    <CrownOutlined style={{ color: "#c0a060" }} />
                    <Text strong>{name}</Text>
                </Space>
            ),
        },
        {
            title: t.price,
            dataIndex: "plan_price",
            key: "plan_price",
            render: (p, record) => <Text style={{ color: "#1e4a2d", fontWeight: 700 }}>${p}{record.billing_cycle === 'lifetime' ? ` (${t.one_time})` : '/mo'}</Text>,
        },
        {
            title: t.started,
            dataIndex: "start_date",
            key: "start_date",
            render: (d) => dayjs(d).format("DD MMM YYYY"),
        },
        {
            title: t.expires_on,
            dataIndex: "end_date",
            key: "end_date",
            render: (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—"),
        },
        {
            title: t.duration,
            dataIndex: "duration_days",
            key: "duration_days",
            render: (d) => `${d} days`,
        },
        {
            title: t.status,
            dataIndex: "status",
            key: "status",
            render: (s) => <StatusTag status={s} />,
        },
        {
    title: "Action",
    key: "action",
    render: (_, record) => (
       <Button
    type="link"
    icon={<FilePdfOutlined />}
    disabled={record.status !== "paid" && record.status !== "active"}
    onClick={() => handleDownloadInvoice(record.tran_id)}
>
    Invoice
</Button>
    ),
},
    ];

    // ─────────────────────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: "0 20px" }}>
            <Title level={2} style={{ color: "#1e4a2d" }}>
                {t.subscription_limits}
            </Title>

            {/* ── Expiration Alert ── */}
            {daysLeft !== null && daysLeft <= 7 && (
                <Alert
                    message={isExpired ? "Subscription Expired" : "Subscription Expiring Soon"}
                    description={
                        isExpired
                            ? `Your subscription ended on ${dayjs(subscription.end_date).format("DD MMM YYYY")}. Renew immediately to avoid service interruption.`
                            : `Your plan will expire in ${daysLeft} day(s). Renew now to avoid being downgraded to Free Plan.`
                    }
                    type={isExpired ? "error" : "warning"}
                    showIcon
                    icon={isExpired ? <WarningOutlined /> : <InfoCircleOutlined />}
                    action={
                        <Button type="primary" danger={isExpired} ghost onClick={() => setIsUpgradeModalVisible(true)}>
                            {isExpired ? "Renew Now" : "Extend Plan"}
                        </Button>
                    }
                    style={{ marginBottom: 24, borderRadius: "12px" }}
                />
            )}

            <Tabs
                defaultActiveKey="overview"
                onChange={(key) => {
                    if (key === "billing" && billingHistory.length === 0) fetchBillingHistory();
                }}
            >
                {/* ══════════════════════════════════════════════
                    TAB 1 — Overview
                ══════════════════════════════════════════════ */}
                <TabPane tab={<span><SafetyCertificateOutlined /> {t.overview}</span>} key="overview">
                    <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
                        {/* Plan Card */}
                        <Col xs={24} lg={10}>
                            <Card
                                style={{
                                    borderRadius: "24px",
                                    background: "linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%)",
                                    color: "white",
                                    border: "none",
                                    boxShadow: "0 10px 30px rgba(30,74,45,0.2)",
                                    height: "100%",
                                }}
                            >
                                <Space direction="vertical" style={{ width: "100%" }} size="large">
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <CrownOutlined style={{ fontSize: "40px", color: "#c0a060" }} />
                                        <Tag color="gold" style={{ borderRadius: "12px", border: "none", padding: "2px 12px" }}>
                                            {subscription.is_lifetime ? (t.lifetime?.toUpperCase() || "LIFETIME") : subscription.status?.toUpperCase()}
                                        </Tag>
                                    </div>

                                    <div>
                                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>
                                            {name === "Free Plan" ? t.current_trial : t.current_package}
                                        </Text>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Title level={1} style={{ color: "white", margin: 0 }}>{name}</Title>
                                            {name === "Free Plan" && <Tag color="orange" style={{ border: "none" }}>{t.package_30_day_trial}</Tag>}
                                        </div>
                                    </div>

                                    <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "0" }} />

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Text style={{ color: "rgba(255,255,255,0.7)", display: "block" }}>{t.started}</Text>
                                            <Text strong style={{ color: "white" }}>
                                                {dayjs(subscription.start_date).format("DD MMM YYYY")}
                                            </Text>
                                        </Col>
                                        <Col span={12}>
                                            <Text style={{ color: "rgba(255,255,255,0.7)", display: "block" }}>{t.expires_on}</Text>
                                            <Text strong style={{ color: daysLeft !== null && daysLeft <= 7 ? "#ffcc00" : "white" }}>
                                                {subscription.end_date ? dayjs(subscription.end_date).format("DD MMM YYYY") : t.no_expiry}
                                            </Text>
                                        </Col>
                                    </Row>

                                    {daysLeft !== null && (
                                        <div style={{
                                            background: "rgba(255,255,255,0.1)",
                                            borderRadius: "12px",
                                            padding: "10px 16px",
                                            textAlign: "center",
                                        }}>
                                            <Text style={{ color: isExpired ? "#ff6b6b" : "#c0a060", fontWeight: 700 }}>
                                                {isExpired ? `${t.expired_label} ${Math.abs(daysLeft)} ${t.days_ago}` : `${daysLeft} ${t.days_remaining}`}
                                            </Text>
                                        </div>
                                    )}

                                    <Button
                                        block size="large"
                                        icon={<RocketOutlined />}
                                        style={{ borderRadius: "12px", fontWeight: 600, color: "#1e4a2d", border: "none" }}
                                        onClick={() => setIsUpgradeModalVisible(true)}
                                    >
                                        {t.upgrade_plan}
                                    </Button>
                                </Space>
                            </Card>
                        </Col>

                        {/* Usage Stats */}
                        <Col xs={24} lg={14}>
                            <Card title={t.resource_utilization} style={{ borderRadius: "24px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                <Space direction="vertical" style={{ width: "100%" }} size="large">

                                    {[
                                        { label: t.staff_seats, current: usage.staff, max: max_staff },
                                        { label: t.store_branches, current: usage.branches, max: max_branches },
                                        { label: t.sku_capacity, current: usage.products, max: max_products },
                                    ].map(({ label, current, max }) => (
                                        <div key={label}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                                <Text strong>{label}</Text>
                                                <Text type="secondary">{current} / {max || t.unlimited}</Text>
                                            </div>
                                            <Progress
                                                percent={max ? Math.min((current / max) * 100, 100) : 100}
                                                status={getProgressStatus(current, max)}
                                                showInfo={false}
                                                strokeColor={{ "0%": "#1e4a2d", "100%": "#c0a060" }}
                                            />
                                        </div>
                                    ))}
                                </Space>
                            </Card>

                            <Card style={{ marginTop: 20, borderRadius: "16px", border: "none", background: "#f8fdf9" }}>
                                <Space>
                                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                                    <Text type="secondary">{t.need_more_capacity}</Text>
                                    <Button type="link" onClick={() => setIsUpgradeModalVisible(true)}>{t.compare_plans}</Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </TabPane>

                {/* ══════════════════════════════════════════════
                    TAB 2 — Step 6: Billing History
                ══════════════════════════════════════════════ */}
                <TabPane tab={<span><HistoryOutlined /> {t.billing_history}</span>} key="billing">
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <div>
                                <Title level={4} style={{ margin: 0, color: "#1e4a2d" }}>{t.subscription_history}</Title>
                                <Text type="secondary">{t.history_desc}</Text>
                            </div>
                            <Button
                                icon={<HistoryOutlined />}
                                onClick={fetchBillingHistory}
                                loading={billingLoading}
                            >
                                {t.refresh}
                            </Button>
                        </div>

                        <Table
                            columns={billingColumns}
                            dataSource={billingHistory}
                            rowKey="id"
                            loading={billingLoading}
                            pagination={{ pageSize: 10 }}
                            style={{ borderRadius: "16px", overflow: "hidden" }}
                            rowClassName={(record) =>
                                record.status === "active" ? "billing-row-active" : ""
                            }
                            locale={{ emptyText: <Empty description="No billing records found." /> }}
                        />
                    </div>
                </TabPane>
            </Tabs>

            {/* ══════════════════════════════════════════════════════════
                MODAL 1 — Select Plan (Upgrade Picker)
            ══════════════════════════════════════════════════════════ */}
            <Modal
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <RocketOutlined style={{ color: "#c0a060" }} />
                        <span>{t.business}</span>
                    </div>
                }
                open={isUpgradeModalVisible}
                onCancel={() => setIsUpgradeModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsUpgradeModalVisible(false)}>
                        {t.maybe_later}
                    </Button>,
                    <Button
                        key="next"
                        type="primary"
                        icon={<RocketOutlined />}
                        onClick={handleOpenConfirm}
                        style={{ background: "#1e4a2d", border: "none" }}
                        disabled={!selectedPlanId || selectedPlanId === data.plan_id}
                    >
                        {selectedPlanId === data.plan_id ? t.currently_active : t.next_confirm}
                    </Button>,
                ]}
                width={700}
                centered
            >
                <div style={{ marginBottom: 20 }}>
                    <Text type="secondary">
                        {t.upgrade_picker_desc}
                    </Text>
                </div>

                <Radio.Group style={{ width: "100%" }} value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                    <Row gutter={[16, 16]}>
                        {plans.map((plan) => {
                            const isCurrent = plan.id === data.plan_id;
                            const isSelected = selectedPlanId === plan.id;
                            const isLower = plan.id < data.plan_id;
                            return (
                                <Col span={24} key={plan.id}>
                                    <div
                                        onClick={() => !isLower && setSelectedPlanId(plan.id)}
                                        style={{
                                            padding: "16px",
                                            borderRadius: "12px",
                                            border: `2px solid ${isSelected ? "#1e4a2d" : "#f0f0f0"}`,
                                            background: isSelected ? "#f0f7f2" : isLower ? "#fafafa" : "white",
                                            cursor: isLower ? "not-allowed" : "pointer",
                                            opacity: isLower ? 0.5 : 1,
                                            transition: "all 0.3s",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Space direction="vertical" size={0}>
                                                <Title level={4} style={{ margin: 0, color: isSelected ? "#1e4a2d" : "inherit" }}>
                                                    {plan.name}
                                                    {isCurrent && <Tag color="blue" style={{ marginLeft: 8 }}>{t.current}</Tag>}
                                                    {isLower && <Tag color="default" style={{ marginLeft: 8 }}>{t.not_available}</Tag>}
                                                </Title>
                                                <Text type="secondary">
                                                    {plan.price === "0.00" ? "Free Forever" : `$${plan.price} ${plan.billing_cycle === 'lifetime' ? '(' + t.one_time + ')' : '/ ' + t.month}`}
                                                </Text>
                                            </Space>
                                            <Radio value={plan.id} disabled={isLower} />
                                        </div>

                                        <Divider style={{ margin: "12px 0" }} />

                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Statistic title={<span style={{ fontSize: "12px" }}>{t.store_branches}</span>} value={plan.max_branches || "∞"} valueStyle={{ fontSize: "16px" }} />
                                            </Col>
                                            <Col span={8}>
                                                <Statistic title={<span style={{ fontSize: "12px" }}>{t.staff_seats}</span>} value={plan.max_staff || "∞"} valueStyle={{ fontSize: "16px" }} />
                                            </Col>
                                            <Col span={8}>
                                                <Statistic title={<span style={{ fontSize: "12px" }}>{t.sku_capacity}</span>} value={plan.max_products || "∞"} valueStyle={{ fontSize: "16px" }} />
                                            </Col>
                                        </Row>

                                        {plan.id === 2 && (
                                            <div style={{ marginTop: 12 }}>
                                                <Tag color="gold" icon={<CheckCircleOutlined />}>Includes Reports &amp; Inventory</Tag>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Radio.Group>
            </Modal>

            {/* ══════════════════════════════════════════════════════════
                MODAL 2 — Step 4: Confirm Upgrade
            ══════════════════════════════════════════════════════════ */}
            <Modal
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <SafetyCertificateOutlined style={{ color: "#1e4a2d" }} />
                        <span>{t.next_confirm}</span>
                    </div>
                }
                open={isConfirmModalVisible}
                onCancel={() => {
                    if (!isUpgrading) {
                        setIsConfirmModalVisible(false);
                        setIsUpgradeModalVisible(true);
                    }
                }}
                footer={[
                    <Button
                        key="back"
                        onClick={() => {
                            setIsConfirmModalVisible(false);
                            setIsUpgradeModalVisible(true);
                        }}
                        disabled={isUpgrading}
                        icon={<CloseCircleOutlined />}
                    >
                        {t.maybe_later}
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        loading={isUpgrading}
                        onClick={handleConfirmUpgrade}
                        icon={<ThunderboltOutlined />}
                        style={{ background: "#1e4a2d", border: "none" }}
                    >
                        {t.upgrade_plan}
                    </Button>,
                ]}
                width={480}
                centered
            >
                {selectedPlan && (
                    <div>
                        {/* Plan Summary Box */}
                        <div style={{
                            background: "linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%)",
                            borderRadius: "16px",
                            padding: "20px",
                            color: "white",
                            marginBottom: "20px",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{t.upgrading_to}</Text>
                                    <Title level={3} style={{ color: "white", margin: "0" }}>{selectedPlan.name}</Title>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <Text style={{ color: "#c0a060", fontSize: "24px", fontWeight: 700 }}>
                                        ${selectedPlan.price}
                                    </Text>
                                    <br />
                                    {selectedPlan.billing_cycle !== 'lifetime' && <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>/ {t.month}</Text>}
                                    {selectedPlan.billing_cycle === 'lifetime' && <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}> ({t.one_time})</Text>}
                                </div>
                            </div>

                            <Divider style={{ borderColor: "rgba(255,255,255,0.15)", margin: "16px 0" }} />

                            <Row gutter={16} style={{ textAlign: "center" }}>
                                <Col span={8}>
                                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", display: "block" }}>{t.store_branches}</Text>
                                    <Text style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>{selectedPlan.max_branches}</Text>
                                </Col>
                                <Col span={8}>
                                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", display: "block" }}>{t.staff_seats}</Text>
                                    <Text style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>{selectedPlan.max_staff}</Text>
                                </Col>
                                <Col span={8}>
                                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", display: "block" }}>{t.sku_capacity}</Text>
                                    <Text style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>{selectedPlan.max_products}</Text>
                                </Col>
                            </Row>
                        </div>

                        {/* Subscription Period */}
                        <List
                            size="small"
                            style={{ background: "#f8fdf9", borderRadius: "12px", padding: "8px" }}
                        >
                            <List.Item>
                                <Space><CalendarOutlined style={{ color: "#1e4a2d" }} /><Text>Start Date</Text></Space>
                                <Text strong>{dayjs().format("DD MMM YYYY")}</Text>
                            </List.Item>
                            <List.Item>
                                <Space><CalendarOutlined style={{ color: "#c0a060" }} /><Text>{t.expires_on}</Text></Space>
                                <Text strong>{selectedPlan.billing_cycle === 'lifetime' ? t.no_expiry : dayjs().add(30, "day").format("DD MMM YYYY")}</Text>
                            </List.Item>
                            <List.Item>
                                <Space><CheckCircleOutlined style={{ color: "#52c41a" }} /><Text>{t.duration}</Text></Space>
                                <Text strong>{selectedPlan.billing_cycle === 'lifetime' ? t.permanent_access : `30 ${t.days}`}</Text>
                            </List.Item>
                        </List>

                        <Alert
                            style={{ marginTop: 16, borderRadius: "10px" }}
                            type="info"
                            showIcon
                            icon={<InfoCircleOutlined />}
                            message={t.relogin_desc}
                        />
                    </div>
                )}
            </Modal>

            {/* ══════════════════════════════════════════════════════════
                MODAL 3 — Step 5: Success Animation
            ══════════════════════════════════════════════════════════ */}
            <Modal
                open={isSuccessModalVisible}
                footer={null}
                closable={false}
                centered
                width={440}
            >
                {upgradeResult && (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                        {/* Animated checkmark */}
                        <div style={{
                            width: 100, height: 100,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #1e4a2d, #2d6a3e)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 24px",
                            boxShadow: "0 8px 32px rgba(30,74,45,0.35)",
                            animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        }}>
                            <CheckCircleOutlined style={{ fontSize: 48, color: "#fff" }} />
                        </div>

                        <Title level={2} style={{ color: "#1e4a2d", margin: "0 0 8px" }}>
                            {t.upgrade_success}
                        </Title>
                        <Text type="secondary" style={{ fontSize: "15px" }}>
                            {t.full_access_to}
                        </Text>
                        <div style={{ margin: "16px 0" }}>
                            <Tag
                                color="green"
                                icon={<CrownOutlined />}
                                style={{ fontSize: "16px", padding: "6px 16px", borderRadius: "20px" }}
                            >
                                {upgradeResult.plan_name}
                            </Tag>
                        </div>

                        <div style={{
                            background: "#f8fdf9",
                            borderRadius: "12px",
                            padding: "12px 20px",
                            marginBottom: "24px",
                            border: "1px solid #d9f7be",
                        }}>
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <Text type="secondary">{t.active_until}</Text>
                                    <Text strong style={{ color: "#1e4a2d" }}>
                                        {selectedPlan?.billing_cycle === 'lifetime' ? t.no_expiry : (upgradeResult.end_date ? dayjs(upgradeResult.end_date).format("DD MMM YYYY") : dayjs().add(30, "day").format("DD MMM YYYY"))}
                                    </Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <Text type="secondary">{t.duration}</Text>
                                    <Text strong>{selectedPlan?.billing_cycle === 'lifetime' ? t.lifetime : `30 ${t.days}`}</Text>
                                </div>
                            </Space>
                        </div>

                        <Alert
                            type="warning"
                            showIcon
                            icon={<LoginOutlined />}
                            message={<Text strong>{t.relogin_required}</Text>}
                            description={t.relogin_desc}
                            style={{ marginBottom: 20, borderRadius: "10px", textAlign: "left" }}
                        />

                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<CheckCircleOutlined />}
                            style={{
                                background: "linear-gradient(135deg, #1e4a2d, #2d6a3e)",
                                border: "none",
                                borderRadius: "12px",
                                height: "48px",
                                fontWeight: 700,
                                fontSize: "16px",
                            }}
                            onClick={handleSuccessDone}
                        >
                            {t.got_it}
                        </Button>
                    </div>
                )}
            </Modal>

            {/* ══ MODAL 4 — PayWay Payment ══════════════════════════ */}
            <Modal
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: 20 }}>💳</span>
                        <span>Complete Your Payment</span>
                    </div>
                }
                open={isPaymentModalVisible}
                onCancel={() => setIsPaymentModalVisible(false)}
                footer={null}
                width={440}
                centered
            >
                {paymentSession && (() => {
                    const sys = paymentSession.system_settings || {};
                    const merchantId = sys.payway_merchant_id;
                    const receiverName = sys.payway_receiver_name || "Platform Subscription";
                    const staticQR = sys.payway_khqr_image;

                    let dynamicKHQR = null;
                    if (merchantId && paymentSession.amount > 0) {
                        dynamicKHQR = generateKHQR(merchantId, receiverName, paymentSession.amount);
                    }

                    return (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                            <div style={{
                                background: "linear-gradient(135deg, #1e4a2d, #2d6a3e)",
                                borderRadius: 16, padding: "20px",
                                color: "white", marginBottom: 20,
                            }}>
                                <Title level={4} style={{ color: "white", margin: "0 0 4px" }}>
                                    {paymentSession.plan_name}
                                </Title>
                                <div style={{ fontSize: 32, fontWeight: 800, color: "#c0a060" }}>
                                    ${paymentSession.amount}
                                </div>
                                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>30-Day Subscription Upgrade</Text>
                            </div>

                            {dynamicKHQR ? (
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{
                                        background: '#fff',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        display: 'inline-block',
                                        border: '1px solid #f0f0f0'
                                    }}>
                                        <QRCode value={dynamicKHQR} size={220} />
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        <Text strong style={{ display: 'block', color: '#1e4a2d' }}>Scan to Pay ${paymentSession.amount}</Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{receiverName}</Text>
                                    </div>
                                </div>
                            ) : staticQR ? (
                                <div style={{ marginBottom: 24 }}>
                                    <AntImage
                                        src={Config.getFullImagePath(staticQR)}
                                        style={{ width: '100%', maxWidth: 220, borderRadius: 12, border: '1px solid #eee' }}
                                    />
                                    <div style={{ marginTop: 12 }}>
                                        <Text strong style={{ display: 'block', color: '#1e4a2d' }}>Scan to Pay</Text>
                                    </div>
                                </div>
                            ) : null}

                            <Button
                                type="primary" size="large" block
                                style={{ background: "#c0392b", border: "none", borderRadius: 12, height: 52, fontWeight: 700, fontSize: 16, marginBottom: 12 }}
                                onClick={handleProceedToPayWay}
                            >
                                🏦 Checkout with ABA PayWay
                            </Button>

                            <div style={{ background: "#f8fdf9", borderRadius: 10, padding: "8px 16px", marginBottom: 16, fontSize: 11 }}>
                                <Text type="secondary">Trans ID: </Text>
                                <Text code style={{ fontSize: 10 }}>{paymentSession.tran_id}</Text>
                            </div>

                            <Divider plain style={{ color: "#999", fontSize: 12 }}>Developer Testing</Divider>

                            <Button
                                block type="dashed"
                                style={{ borderRadius: 12, height: 40, marginBottom: 16 }}
                                onClick={handleSimulatePayment}
                            >
                                🧪 Simulate Success
                            </Button>

                            <Button type="link" block
                                onClick={() => { setIsPaymentModalVisible(false); setIsConfirmModalVisible(true); }}>
                                ← Back to Selection
                            </Button>
                        </div>
                    )
                })()}
            </Modal>

            {/* Pop-in animation */}
            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .billing-row-active td { background: #f6ffed !important; }
            `}</style>
        </div>
    );
}

export default MyPlanPage;

