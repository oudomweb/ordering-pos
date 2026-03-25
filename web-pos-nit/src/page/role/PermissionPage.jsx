import React, { useEffect, useState } from "react";
import {
    Table,
    Checkbox,
    Button,
    Card,
    Row,
    Col,
    Select,
    Typography,
    message,
    Divider,
    Space,
    Empty,
    Badge,
    Tooltip
} from "antd";
import {
    SafetyCertificateOutlined,
    SaveOutlined,
    ReloadOutlined,
    UnlockOutlined,
    ShopOutlined,
    UsergroupAddOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { getProfile, setPermission } from "../../store/profile.store";
import { useLanguage, translations } from "../../store/language.store";

const { Title, Text } = Typography;
const { Option } = Select;

const PermissionPage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [selectedPermIds, setSelectedPermIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const profile = getProfile();
            const isAdmin = profile?.business_id === 1;

            if (isAdmin) {
                const bizRes = await request("business", "get");
                if (bizRes && bizRes.list) {
                    setBusinesses(bizRes.list);
                    if (!selectedBusinessId) setSelectedBusinessId(profile.business_id);
                }
            }

            const permRes = await request("permission", "get");
            if (permRes && permRes.list) setAllPermissions(permRes.list);

            const targetBiz = selectedBusinessId || profile?.business_id;
            const roleRes = await request(`role?target_business_id=${targetBiz}`, "get");

            if (roleRes && roleRes.list) {
                setRoles(roleRes.list);
                if (roleRes.list.length > 0) {
                    setSelectedRoleId(roleRes.list[0].id);
                    fetchRolePermissions(roleRes.list[0].id);
                } else {
                    setSelectedRoleId(null);
                    setSelectedPermIds([]);
                }
            }
        } catch (error) {
            message.error(t.failed);
        } finally {
            setLoading(false);
        }
    };

    const fetchRolePermissions = async (roleId) => {
        try {
            const res = await request(`permission/${roleId}`, "get");
            if (res && res.list) {
                setSelectedPermIds(res.list);
            }
        } catch (error) {
            message.error(t.failed);
        }
    };

    const handleBusinessChange = (bizId) => {
        setSelectedBusinessId(bizId);
        // We'll trigger a re-fetch of roles in a useEffect or by calling fetchInitialData
    };

    useEffect(() => {
        if (selectedBusinessId) {
            fetchInitialData();
        }
    }, [selectedBusinessId]);

    const handleRoleChange = (roleId) => {
        setSelectedRoleId(roleId);
        fetchRolePermissions(roleId);
    };

    const handleCheckboxChange = (permId, checked) => {
        setSelectedPermIds(prev => {
            if (checked) {
                return [...new Set([...prev, permId])];
            } else {
                return prev.filter(id => id !== permId);
            }
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedPermIds(allPermissions.map(p => p.id));
        } else {
            // 🛡️ IRONCLAD GUARD: Never allow mass unselection on critical roles
            if (isOwnRole || isOwnerRole || selectedRole?.code?.toLowerCase() === 'super_admin') {
                message.error("Security Violation: Mass unselection is prohibited for administrative and active roles.");
                return;
            }
            setSelectedPermIds([]);
        }
    };

    const handleSave = async () => {
        if (!selectedRoleId) return;
        setSaving(true);
        try {
            const res = await request("permission/assign", "post", {
                role_id: selectedRoleId,
                permission_ids: selectedPermIds
            });
            if (res && !res.error) {
                message.success(t.success);

                // Reactive Session Update:
                // If the user just edited THEIR OWN role, we need to refresh their local session
                // so the changes (like sidebar visibility) take effect immediately.
                const profile = getProfile();
                if (profile && Number(profile.role_id) === Number(selectedRoleId)) {
                    // Update current user session permissions
                    const newPermList = allPermissions
                        .filter(p => selectedPermIds.includes(p.id))
                        .map(p => ({ web_route_key: p.route_key, name: p.name }));

                    setPermission(newPermList);
                    window.location.reload(); // Force refresh to apply new security context
                }
            }
        } catch (error) {
            message.error(t.failed);
        } finally {
            setSaving(false);
        }
    };

    const profile = getProfile();
    const isSuperAdmin = profile?.is_super_admin === 1;
    const selectedRole = roles.find(r => r.id === selectedRoleId);
    const isOwnerRole = selectedRole?.code?.toLowerCase() === 'owner';
    const isOwnRole = Number(profile?.role_id) === Number(selectedRoleId);

    const columns = [
        {
            title: t.permission_name || "Permission Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <Text strong style={{ color: '#1e4a2d' }}>{text}</Text>
        },
        {
            title: t.navigation_path || "Navigation Path",
            dataIndex: "route_key",
            key: "route_key",
            render: (text) => <Badge status="processing" text={text} style={{ opacity: 0.7 }} />
        },
        {
            title: t.action,
            key: "access",
            align: 'center',
            render: (_, record) => {
                const isChecked = selectedPermIds.includes(record.id);
                // 🛡️ IRONCLAD GUARD:
                // 1. If editing OWN role, cannot UNCHECK existing permissions (prevent lockout)
                // 2. If editing OWNER role, cannot UNCHECK if not Super Admin
                // 3. If it's a critical module like Dashboard or Permission, prevent unchecking for Admins
                const isCritical = ['/dashboard', '/permission', '/role'].includes(record.route_key);
                const isDisabled = (isOwnRole && isChecked) || 
                                   (!isSuperAdmin && isOwnerRole && isChecked) || 
                                   (isCritical && (isOwnRole || isOwnerRole));

                return (
                    <Tooltip title={isDisabled ? "Protected" : ""}>
                        <Checkbox
                            checked={isChecked}
                            onChange={(e) => handleCheckboxChange(record.id, e.target.checked)}
                            disabled={isDisabled}
                        />
                    </Tooltip>
                );
            }
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#f4f1eb', minHeight: '100vh' }}>
            <div style={{
                marginBottom: '24px',
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col>
                        <Title level={2} style={{ margin: 0, color: '#1e4a2d', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <SafetyCertificateOutlined /> {t.security_permissions || "Security & Permissions"}
                        </Title>
                        <Text type="secondary">{t.security_permissions_desc || "Control what each user role can access across branches"}</Text>
                    </Col>
                    <Col>
                        <Space size="middle">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchInitialData}
                                disabled={loading || saving}
                            >
                                {t.refresh}
                            </Button>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                loading={saving}
                                style={{
                                    background: '#1e4a2d',
                                    borderColor: '#1e4a2d',
                                    height: '40px',
                                    borderRadius: '8px',
                                    padding: '0 24px'
                                }}
                            >
                                {t.save_changes || t.save}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            <Row gutter={24}>
                <Col xs={24} md={8}>
                    <Card
                        title={
                            <Space>
                                <UsergroupAddOutlined style={{ color: '#c0a060' }} />
                                <span>{t.select_user_role || "Select User Role"}</span>
                            </Space>
                        }
                        style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                    >
                        {profile?.business_id === 1 && (
                            <>
                                <Text type="secondary" strong style={{ display: 'block', marginBottom: '8px', color: '#1e4a2d' }}>
                                    {t.select_business || "Step 1: Select Business"}
                                </Text>
                                <Select
                                    style={{ width: '100%', marginBottom: '20px' }}
                                    size="large"
                                    placeholder="Select Business"
                                    value={selectedBusinessId}
                                    onChange={handleBusinessChange}
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {businesses.map(biz => (
                                        <Option key={biz.id} value={biz.id}>
                                            <Space>
                                                <Badge status={biz.status === 'active' ? 'success' : 'error'} />
                                                {biz.name} (ID: {biz.id})
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                                <Divider style={{ margin: '12px 0' }} />
                            </>
                        )}

                        <Text type="secondary" strong style={{ display: 'block', marginBottom: '8px', color: '#1e4a2d' }}>
                            {t.select_user_role || "Step 2: Select User Role"}
                        </Text>
                        <Select
                            style={{ width: '100%', marginBottom: '16px' }}
                            size="large"
                            placeholder={t.pick_role_placeholder || t.user_role}
                            value={selectedRoleId}
                            onChange={handleRoleChange}
                            loading={loading}
                        >
                            {roles.map(role => (
                                <Option key={role.id} value={role.id}>
                                    <Space>
                                        <Badge color="#c0a060" />
                                        {role.name} {role.code ? `(${role.code})` : ''}
                                    </Space>
                                </Option>
                            ))}
                        </Select>

                        <Divider />

                        <div style={{ background: 'rgba(192, 160, 96, 0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #c0a060' }}>
                            <Title level={5} style={{ margin: 0, color: '#c0a060' }}><UnlockOutlined /> {t.multi_branch_access || "Multi-Branch Access"}</Title>
                            <Text size="small" type="secondary">
                                {t.multi_branch_access_desc || "Permissions defined here are universal across all branches. Staff will only see data for their assigned branch."}
                            </Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card
                        title={
                            <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                                <Col>
                                    <Space>
                                        <ShopOutlined style={{ color: '#1e4a2d' }} />
                                        <span>{t.module_permissions || "Module Permissions"}</span>
                                    </Space>
                                </Col>
                                <Col>
                                    <Checkbox
                                        indeterminate={selectedPermIds.length > 0 && selectedPermIds.length < allPermissions.length}
                                        checked={selectedPermIds.length === allPermissions.length && allPermissions.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    >
                                        {t.select_all || "Select All"}
                                    </Checkbox>
                                </Col>
                            </Row>
                        }
                        style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                        bodyStyle={{ padding: 0 }}
                    >
                        {allPermissions.length > 0 ? (
                            <Table
                                columns={columns}
                                dataSource={allPermissions}
                                rowKey="id"
                                pagination={false}
                                loading={loading}
                                scroll={{ y: 500 }}
                            />
                        ) : (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <Empty description={t.no_data} />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PermissionPage;
