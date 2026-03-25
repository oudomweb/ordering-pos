import React, { useState } from "react";
import { Form, Button, Input, message, ConfigProvider, Typography } from "antd";
import { request } from "../../util/helper";
import { setAcccessToken, setPermission } from "../../store/profile.store";
import { useProfileStore } from "../../store/profileStore";
import { useNavigate, Link } from "react-router-dom";
import {
  LockOutlined,
  UserOutlined,
  ArrowRightOutlined,
  CoffeeOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const COLORS = {
  deepEmerald: "#003b28", // Very dark, luxury green
  emerald: "#006241",
  gold: "#c0a060",        // Premium gold/brass
  white: "#ffffff",
  glass: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.15)"
};

const COFFEE_ASSET = "/luxury_matcha_v2.png";

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setProfile } = useProfileStore();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await request("auth/login", "post", {
        email: values.username,
        password: values.password
      });
      if (res && res.access_token) {
        setAcccessToken(res.access_token);
        setProfile(res.profile || {}); // Now using Zustand setProfile
        setPermission(res.permission || []);
        message.success("Logged in successfully!");
        navigate("/dashboard");
      } else {
        message.error(res.message || "Login failed.");
      }
    } catch (err) {
      message.error("Service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: COLORS.gold,
          borderRadius: 14,
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at top right, #004d35, ${COLORS.deepEmerald})`,
        overflow: "hidden",
        position: "relative",
        padding: "20px"
      }}>
        {/* EXTERNAL FONTS */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600;700&display=swap');
          
          .premium-card {
            background: rgba(255, 255, 255, 0.03) !important;
            backdrop-filter: blur(25px) !important;
            -webkit-backdrop-filter: blur(25px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 40px 80px rgba(0,0,0,0.4) !important;
            border-radius: 40px !important;
          }
          .premium-input {
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 255, 255, 0.16) !important;
            color: white !important;
            transition: all 0.3s ease !important;
          }
          .premium-input input {
             color: white !important;
          }
          .premium-input input::placeholder {
             color: rgba(255,255,255,0.3) !important;
          }
          .premium-input:focus, .premium-input-focused {
            background: rgba(255, 255, 255, 0.08) !important;
            border-color: ${COLORS.gold} !important;
            box-shadow: 0 0 0 4px rgba(192, 160, 96, 0.1) !important;
          }
          .premium-btn {
            background: ${COLORS.gold} !important;
            border: none !important;
            height: 60px !important;
            border-radius: 20px !important;
            color: ${COLORS.deepEmerald} !important;
            font-weight: 700 !important;
            letter-spacing: 0.5px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .premium-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 15px 30px rgba(192, 160, 96, 0.3) !important;
            filter: brightness(1.1) !important;
          }
          .floating-asset {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(2deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @media (max-width: 900px) {
            .hero-section {
              display: none !important;
            }
          }
        `}</style>

        {/* BACKGROUND DECORATIONS */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192, 160, 96, 0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
          zIndex: 0
        }} />

        {/* CONTENT CONTAINER */}
        <div style={{
          zIndex: 1,
          display: "flex",
          width: "100%",
          maxWidth: "1100px",
          alignItems: "center",
          gap: "80px",
          justifyContent: "center"
        }}>

          {/* LEFT: THE LUXURY HERO SECTION */}
          <div className="hero-section" style={{ flex: "1", textAlign: "left", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
              <div style={{ background: COLORS.gold, padding: 10, borderRadius: 12 }}>
                <CoffeeOutlined style={{ fontSize: 24, color: COLORS.deepEmerald }} />
              </div>
              <Text style={{ fontSize: 18, color: COLORS.gold, fontWeight: 800, letterSpacing: 2 }}>POS SYSTEM</Text>
            </div>

            <Title style={{
              color: "white",
              fontSize: "64px",
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.1,
              margin: "20px 0"
            }}>
              Mastering the Art <br />
              <span style={{ color: COLORS.gold, fontStyle: "italic" }}>of POS Luxury.</span>
            </Title>

            <div style={{ maxWidth: "450px", marginBottom: 60 }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, lineHeight: 1.6 }}>
                The world's most sophisticated management ecosystem, tailored for visionary coffee merchants.
              </Text>
            </div>

            <div className="floating-asset" style={{ display: "flex", justifyContent: "flex-start", position: "relative" }}>
              <div style={{
                position: "absolute",
                bottom: -20,
                left: "10%",
                width: "60%",
                height: "30px",
                background: "rgba(0,0,0,0.5)",
                filter: "blur(20px)",
                borderRadius: "50%",
                zIndex: -1
              }} />
              <div style={{
                width: "100%",
                maxWidth: "420px",
                aspectRatio: "1/1",
                overflow: "hidden",
                borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%", // Organic blob shape instead of box
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}>
                <img src={COFFEE_ASSET} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Premium Drink" />
              </div>
            </div>
          </div>

          {/* RIGHT: THE LOGIN CARD */}
          <div style={{ flex: "0 0 450px", width: "100%" }}>
            <div className="premium-card" style={{ padding: "60px 45px" }}>
              <div style={{ marginBottom: 45 }}>
                <Title level={2} style={{ color: "white", fontWeight: 700, margin: 0, fontSize: 32 }}>Sign In</Title>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>Welcome back to your elite dashboard</Text>
              </div>

              <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
                <Form.Item
                  label={<span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>WORKPLACE IDENTITY</span>}
                  name="username"
                  rules={[{ required: true, message: 'Identity required' }]}
                >
                  <Input
                    className="premium-input"
                    prefix={<UserOutlined style={{ color: COLORS.gold, marginRight: 10 }} />}
                    placeholder="Username or your email"
                    style={{ height: 60, borderRadius: 18 }}
                  />
                </Form.Item>

                <Form.Item
                  label={<span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>ACCESS KEY</span>}
                  name="password"
                  rules={[{ required: true, message: 'Key required' }]}
                >
                  <Input.Password
                    className="premium-input"
                    prefix={<LockOutlined style={{ color: COLORS.gold, marginRight: 10 }} />}
                    placeholder="••••••••••••"
                    style={{ height: 60, borderRadius: 18 }}
                  />
                </Form.Item>

                <div style={{ textAlign: "right", marginBottom: 35 }}>
                  <Link to="/forgot" style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: 14 }}>
                    Forgotten Credentials?
                  </Link>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="premium-btn"
                  icon={<ArrowRightOutlined />}
                  style={{ fontSize: 17 }}
                >
                  SECURE AUTHORIZATION
                </Button>
              </Form>

              <div style={{ marginTop: 50, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 35 }}>
                <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, display: 'block' }}>
                  Access restricted to authorized branches.
                </Text>
                <a
                  href="https://t.me/pongchiva"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: COLORS.gold, fontWeight: 700, marginTop: 8, display: "inline-block", fontSize: 15 }}
                >
                  Contact Administrator for Access
                </a>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 30 }}>
              <Text style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, letterSpacing: 1 }}>
                <GlobalOutlined style={{ marginRight: 6 }} /> PO-NIT ENTERPRISE v2.5.0
              </Text>
            </div>
          </div>

        </div>
      </div>
    </ConfigProvider>
  );
}

export default LoginPage;
