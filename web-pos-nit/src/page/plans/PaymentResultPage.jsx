import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Typography, Spin, Alert, Result } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    LoginOutlined,
    CrownOutlined,
} from "@ant-design/icons";
import { request } from "../../util/helper";

const { Title, Text } = Typography;

function PaymentResultPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tran_id = searchParams.get("tran_id");

    const [status, setStatus] = useState("checking"); // 'checking' | 'paid' | 'pending' | 'failed'
    const [planName, setPlanName] = useState("");
    const [pollCount, setPollCount] = useState(0);
    const MAX_POLLS = 10;

    useEffect(() => {
        if (!tran_id) {
            setStatus("failed");
            return;
        }
        pollStatus();
    }, [tran_id]);

    const pollStatus = async () => {
        if (pollCount >= MAX_POLLS) {
            setStatus("pending"); // show manual instruction
            return;
        }

        const res = await request(`payment/status/${tran_id}`, "get");
        if (res && res.success) {
            if (res.is_paid) {
                setPlanName(res.plan_name);
                setStatus("paid");
                return;
            }
            if (res.status === "failed") {
                setStatus("failed");
                return;
            }
        }

        // Still pending: poll again in 3 seconds
        setPollCount((c) => c + 1);
        setTimeout(pollStatus, 3000);
    };

    // DEV: simulate success button
    const handleSimulate = async () => {
        setStatus("checking");
        const res = await request("payment/simulate-success", "post", { tran_id });
        if (res && res.success) {
            pollStatus();
        }
    };

    // ─── Render ────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f4f1eb 0%, #e8f5e9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
        }}>
            <div style={{
                background: "white",
                borderRadius: "24px",
                padding: "48px 40px",
                maxWidth: 480,
                width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
                textAlign: "center",
            }}>

                {/* ── CHECKING ── */}
                {status === "checking" && (
                    <>
                        <Spin
                            indicator={<LoadingOutlined style={{ fontSize: 64, color: "#1e4a2d" }} spin />}
                        />
                        <Title level={3} style={{ marginTop: 24, color: "#1e4a2d" }}>
                            Verifying your payment...
                        </Title>
                        <Text type="secondary">
                            Please wait while we confirm your transaction with PayWay.
                        </Text>
                        {/* DEV simulate button */}
                        {tran_id && (
                            <div style={{ marginTop: 32 }}>
                                <Alert
                                    type="warning"
                                    message="Developer Mode"
                                    description={`tran_id: ${tran_id}`}
                                    style={{ borderRadius: 10, marginBottom: 12, textAlign: "left" }}
                                />
                                <Button
                                    block
                                    type="dashed"
                                    onClick={handleSimulate}
                                    style={{ borderRadius: 10 }}
                                >
                                    🧪 Simulate Payment Success (Dev Only)
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* ── PAID / SUCCESS ── */}
                {status === "paid" && (
                    <>
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

                        <Title level={2} style={{ color: "#1e4a2d" }}>Payment Successful! 🎉</Title>
                        <Text type="secondary" style={{ fontSize: 15 }}>
                            Your payment has been verified.
                        </Text>

                        <div style={{
                            background: "#f6ffed",
                            border: "1px solid #b7eb8f",
                            borderRadius: 12,
                            padding: "16px 20px",
                            margin: "20px 0",
                        }}>
                            <CrownOutlined style={{ color: "#c0a060", fontSize: 20, marginRight: 8 }} />
                            <Text strong style={{ fontSize: 16, color: "#1e4a2d" }}>
                                {planName} — Activated
                            </Text>
                        </div>

                        <Alert
                            type="warning"
                            showIcon
                            icon={<LoginOutlined />}
                            message="Re-login Required"
                            description="Please logout and login again to activate your full permissions."
                            style={{ borderRadius: 10, marginBottom: 20, textAlign: "left" }}
                        />

                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{
                                background: "linear-gradient(135deg, #1e4a2d, #2d6a3e)",
                                border: "none",
                                borderRadius: 12,
                                height: 50,
                                fontWeight: 700,
                                fontSize: 15,
                            }}
                            onClick={() => navigate("/my-plan")}
                        >
                            Go to My Subscription →
                        </Button>
                    </>
                )}

                {/* ── FAILED ── */}
                {status === "failed" && (
                    <>
                        <div style={{
                            width: 100, height: 100,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #c0392b, #e74c3c)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 24px",
                            boxShadow: "0 8px 32px rgba(192,57,43,0.3)",
                        }}>
                            <CloseCircleOutlined style={{ fontSize: 48, color: "#fff" }} />
                        </div>

                        <Title level={2} style={{ color: "#c0392b" }}>Payment Failed</Title>
                        <Text type="secondary">
                            Your payment could not be completed. No charges were made.
                        </Text>

                        <div style={{ marginTop: 32 }}>
                            <Button type="primary" danger block size="large"
                                style={{ borderRadius: 12, height: 50, marginBottom: 12 }}
                                onClick={() => navigate("/my-plan")}
                            >
                                Try Again
                            </Button>
                            <Button block style={{ borderRadius: 12 }} onClick={() => navigate("/")}>
                                Back to Dashboard
                            </Button>
                        </div>
                    </>
                )}

                {/* ── STILL PENDING / TIMEOUT ── */}
                {status === "pending" && (
                    <>
                        <Alert
                            type="info"
                            showIcon
                            message="Payment Pending"
                            description="We are still waiting for payment confirmation. This can take a few minutes."
                            style={{ borderRadius: 10, marginBottom: 20 }}
                        />
                        <Button block onClick={() => { setStatus("checking"); setPollCount(0); pollStatus(); }}
                            style={{ borderRadius: 10, marginBottom: 10 }}>
                            Check Again
                        </Button>
                        <Button block type="link" onClick={() => navigate("/my-plan")}>
                            Back to My Subscription
                        </Button>
                    </>
                )}
            </div>

            <style>{`
                @keyframes popIn {
                    0%   { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default PaymentResultPage;
