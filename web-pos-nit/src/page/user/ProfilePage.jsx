
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
  Avatar,
  Divider,
  Space,
  Tag
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  CameraOutlined,
  SaveOutlined,
  MailOutlined,
  ShopOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { Config } from "../../util/config";
import { getProfile } from "../../store/profile.store";
import { useProfileStore } from "../../store/profileStore";
import { useLanguage, translations } from "../../store/language.store";

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { profile: currentUser, setProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setFetching(true);
    try {
      const res = await request("auth/profile", "get");
      if (res && res.profile) {
        setProfileData(res.profile);
        form.setFieldsValue({
          name: res.profile.name,
        });
        if (res.profile.image && res.profile.image !== "null" && res.profile.image !== "undefined") {
          setPreviewUrl(Config.getFullImagePath(res.profile.image));
        } else {
          setPreviewUrl(null);
        }
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      message.error("Failed to load profile data");
    } finally {
      setFetching(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.password) {
        formData.append("password", values.password);
      }
      if (imageFile) {
        formData.append("upload_image", imageFile);
      }

      const res = await request("auth/profile", "put", formData);
      if (res && res.success) {
        message.success("Profile updated successfully!");

        // Update local storage
        const updatedProfile = {
          ...currentUser,
          name: res.profile.name,
          profile_image: res.profile.profile_image
        };
        setProfile(updatedProfile);

        // Update local state
        setProfileData(prev => ({
          ...prev,
          name: res.profile.name,
          image: res.profile.profile_image
        }));

        form.setFieldValue("password", "");
        form.setFieldValue("confirm_password", "");
        setImageFile(null);
      }
    } catch (error) {
      console.error("Update profile error:", error);
      message.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (info) => {
    if (info.file.status === 'removed') {
      setImageFile(null);
      setPreviewUrl((profileData?.image && profileData.image !== "null" && profileData.image !== "undefined") ? Config.getFullImagePath(profileData.image) : null);
      return;
    }

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Card loading={true} style={{ width: 400 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 20px", background: "#f4f1eb", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <Row gutter={[32, 32]}>
          {/* Left Column: Summary Card */}
          <Col xs={24} lg={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: "24px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                overflow: "hidden"
              }}
              bodyStyle={{ padding: "40px 24px" }}
            >
              <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
                <Avatar
                  size={140}
                  icon={<UserOutlined />}
                  src={previewUrl}
                  style={{
                    border: "4px solid #fff",
                    boxShadow: "0 8px 20px rgba(30,74,45,0.15)",
                    backgroundColor: "#1e4a2d"
                  }}
                />
                <Upload
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleImageChange}
                  accept="image/*"
                >
                  <Button
                    shape="circle"
                    icon={<CameraOutlined />}
                    style={{
                      position: "absolute",
                      bottom: 5,
                      right: 5,
                      background: "#c0a060",
                      borderColor: "#c0a060",
                      color: "#fff",
                      boxShadow: "0 4px 10px rgba(192, 160, 96, 0.4)"
                    }}
                  />
                </Upload>
              </div>

              <Title level={3} style={{ margin: "0 0 8px", color: "#1e4a2d" }}>
                {profileData?.name}
              </Title>
              <Text type="secondary" style={{ display: "block", marginBottom: "16px" }}>
                {profileData?.email}
              </Text>

              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <Tag color="#1e4a2d" style={{ borderRadius: "100px", padding: "2px 12px" }}>
                  {currentUser?.role_name || "Staff"}
                </Tag>
                {profileData?.status === 'active' && (
                  <Tag color="success" style={{ borderRadius: "100px", padding: "2px 12px" }}>{t.active_account}</Tag>
                )}
              </Space>

              <Divider style={{ margin: "24px 0" }} />

              <div style={{ textAlign: "left" }}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <ShopOutlined style={{ color: "#c0a060", fontSize: "18px" }} />
                    <div>
                      <Text type="secondary" size="small" style={{ display: "block", fontSize: "11px" }}>{t.branch.toUpperCase()}</Text>
                      <Text strong style={{ color: "#1e4a2d" }}>{profileData?.branch_name || "Main Branch"}</Text>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <SafetyCertificateOutlined style={{ color: "#c0a060", fontSize: "18px" }} />
                    <div>
                      <Text type="secondary" size="small" style={{ display: "block", fontSize: "11px" }}>{t.business_label.toUpperCase()}</Text>
                      <Text strong style={{ color: "#1e4a2d" }}>{profileData?.business_name || "Green Grounds"}</Text>
                    </div>
                  </div>
                </Space>
              </div>
            </Card>
          </Col>

          {/* Right Column: Settings Form */}
          <Col xs={24} lg={16}>
            <Card
              bordered={false}
              style={{
                borderRadius: "24px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
              }}
              title={
                <Title level={4} style={{ margin: "8px 0", color: "#1e4a2d" }}>
                  {t.account_settings}
                </Title>
              }
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
              >
                <Row gutter={24}>
                  <Col xs={24}>
                    <Title level={5} style={{ marginBottom: "20px", color: "#c0a060" }}>
                      {t.general_info}
                    </Title>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<Text strong>{t.full_name}</Text>}
                      name="name"
                      rules={[{ required: true, message: "Please enter your name" }]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                        placeholder="Enter full name"
                        size="large"
                        style={{ borderRadius: "8px" }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<Text strong>{t.email_address}</Text>}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                        value={profileData?.email}
                        disabled
                        size="large"
                        style={{ borderRadius: "8px", background: "#f5f5f5" }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Divider style={{ margin: "32px 0 24px" }} />
                    <Title level={5} style={{ marginBottom: "20px", color: "#c0a060" }}>
                      {t.security_settings}
                    </Title>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<Text strong>{t.new_password}</Text>}
                      name="password"
                      rules={[{ min: 6, message: "Minimum 6 characters" }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                        placeholder={t.leave_blank}
                        size="large"
                        style={{ borderRadius: "8px" }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<Text strong>{t.confirm_password}</Text>}
                      name="confirm_password"
                      dependencies={['password']}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                        placeholder="Repeat new password"
                        size="large"
                        style={{ borderRadius: "8px" }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} style={{ marginTop: "32px", textAlign: "right" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SaveOutlined />}
                      size="large"
                      style={{
                        height: "50px",
                        padding: "0 40px",
                        borderRadius: "12px",
                        background: "#1e4a2d",
                        borderColor: "#1e4a2d",
                        boxShadow: "0 8px 20px rgba(30,74,45,0.2)"
                      }}
                    >
                      {t.save_changes}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProfilePage;
