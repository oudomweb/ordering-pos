import React, { useState } from "react";
import { Form, Button, Input, message, ConfigProvider } from "antd";
import { request } from "../../util/helper";
import { useNavigate, Link } from "react-router-dom";
import {
  ShopOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const COLORS = {
  primary: "#1e4a2d", // Dark Coffee Green
  accent: "#f7c06a",  // Soft Gold
  bg: "#f4f1eb",      // Warm Cream
  white: "#ffffff",
  text: "#1a2e1a"
};

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await request("auth/register", "post", values);
      if (res && res.success) {
        message.success("Business Registered Successfully! Please Login.");
        navigate("/login");
      } else {
        message.error(res.message || "Registration failed. Try again.");
      }
    } catch (err) {
      message.error("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: COLORS.primary,
          borderRadius: 12,
        },
      }}
    >
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0a1f12 100%)`,
        padding: "20px"
      }}>
        {/* Decorative elements */}
        <div style={{
          position: "fixed",
          top: "-10%",
          right: "-5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(247,192,106,0.1) 0%, transparent 70%)",
        }} />

        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          borderRadius: "32px",
          padding: "50px 40px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
              background: COLORS.accent,
              WebkitBackgroundClip: "text",
              display: "inline-block"
            }}>☕</div>
            <h1 style={{
              color: "#fff",
              fontSize: "32px",
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Crimson Text', serif"
            }}>Start Your Coffee Business</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "8px" }}>
              Join the SaaS POS ecosystem today
            </p>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            requiredMark={false}
          >
            <Form.Item
              name="business_name"
              rules={[{ required: true, message: 'Please enter your business name' }]}
            >
              <Input
                prefix={<ShopOutlined style={{ color: COLORS.accent }} />}
                placeholder="Business Name (e.g. Green Grounds)"
                style={{ height: "50px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: COLORS.accent }} />}
                placeholder="Owner Representative Name"
                style={{ height: "50px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: COLORS.accent }} />}
                placeholder="Business Email Address"
                style={{ height: "50px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Password required' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: COLORS.accent }} />}
                placeholder="Secure Password"
                style={{ height: "50px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: "100%",
                height: "55px",
                marginTop: "10px",
                fontSize: "16px",
                fontWeight: 600,
                background: COLORS.accent,
                borderColor: COLORS.accent,
                color: COLORS.primary,
                borderRadius: "15px"
              }}
              icon={<ArrowRightOutlined />}
            >
              Establish Business
            </Button>
          </Form>

          <p style={{ textAlign: "center", marginTop: "30px", color: "rgba(255,255,255,0.6)" }}>
            Already have a branch? <Link to="/login" style={{ color: COLORS.accent, fontWeight: 600 }}>Sign In</Link>
          </p>
        </div>

        <style>{`
          .custom-input input::placeholder {
            color: rgba(255,255,255,0.4) !important;
          }
          .ant-input-affix-wrapper input {
            color: white !important;
          }
          .ant-form-item-explain-error {
            color: #ff7875 !important;
            font-size: 12px;
            margin-top: 4px;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}

export default RegisterPage;