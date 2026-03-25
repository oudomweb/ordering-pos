import React, { useEffect, useState } from "react";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Space,
    Table,
    Tag,
    Card,
    Typography,
    Select,
    InputNumber,
    Row,
    Col
} from "antd";
import { MdHistory, MdAdd } from "react-icons/md";
import { useLanguage, translations } from "../../store/language.store";
import MainPage from "../../component/layout/MainPage";
import { formatDateClient, request } from "../../util/helper";

const { Title } = Typography;
const { Option } = Select;

function StockPage() {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [form] = Form.useForm();
    const [state, setState] = useState({
        logs: [],
        products: [],
        rawMaterials: [],
        visibleModal: false,
        loading: false,
    });
    const [filters, setFilters] = useState({
        item_type: null,
        type: null,
    });

    useEffect(() => {
        getLogs();
        getItems();
    }, [filters]);

    const getLogs = async () => {
        setState((pre) => ({ ...pre, loading: true }));
        try {
            const res = await request("stock/logs", "get", filters);
            if (res && res.logs) {
                setState((pre) => ({
                    ...pre,
                    logs: res.logs || [],
                    loading: false,
                }));
            } else {
                setState((pre) => ({ ...pre, loading: false }));
            }
        } catch (e) {
            setState((pre) => ({ ...pre, loading: false }));
        }
    };

    const getItems = async () => {
        try {
            const [resProd, resRM] = await Promise.all([
                request("product", "get", { is_list_all: 1 }),
                request("raw_material", "get")
            ]);

            setState(p => ({
                ...p,
                products: (resProd && resProd.list) ? resProd.list : p.products,
                rawMaterials: (resRM && resRM.list) ? resRM.list : p.rawMaterials
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const onCloseModal = () => {
        setState((p) => ({ ...p, visibleModal: false }));
        form.resetFields();
    };

    const onFinish = async (values) => {
        const res = await request("stock/adjust", "post", values);
        if (res && !res.error) {
            message.success(res.message);
            onCloseModal();
            getLogs();
        } else {
            message.error(res?.message || "Adjustment failed");
        }
    };

    return (
        <MainPage loading={state.loading}>
            <div style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={6}>
                        <div style={{ background: "linear-gradient(135deg, #1e4a2d 0%, #2d6a42 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>{t.total_products_menu}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{state.products.length}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>{t.raw_material}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{state.rawMaterials.length}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>{t.low_stock_products}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                                {state.products.filter(p => Number(p.qty || 0) <= 10).length}
                            </div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>{t.low_stock_materials}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                                {state.rawMaterials.filter(rm => Number(rm.qty || 0) <= 5).length}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            <Card bordered={false} style={{ borderRadius: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <Space>
                        <div style={{ padding: 8, background: "#e6f4ea", borderRadius: 10, display: 'flex' }}>
                            <MdHistory size={24} style={{ color: "#2d6a42" }} />
                        </div>
                        <Title level={4} style={{ margin: 0 }}>{t.stock_logs_adjustments}</Title>
                    </Space>
                    <Button
                        type="primary"
                        icon={<MdAdd />}
                        onClick={() => {
                            setState(s => ({ ...s, visibleModal: true }));
                            getItems();
                        }}
                        style={{ background: "#2d6a42", borderColor: "#2d6a42", borderRadius: 8 }}
                        size="large"
                    >
                        {t.manual_adjustment}
                    </Button>
                </div>

                <Row gutter={16} style={{ marginBottom: 20 }}>
                    <Col span={6}>
                        <Select
                            placeholder={t.filter_by_item_type}
                            allowClear
                            style={{ width: '100%' }}
                            onChange={(v) => setFilters(f => ({ ...f, item_type: v }))}
                        >
                            <Option value="product">{t.product}</Option>
                            <Option value="raw_material">{t.raw_material}</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Select
                            placeholder={t.filter_by_type}
                            allowClear
                            style={{ width: '100%' }}
                            onChange={(v) => setFilters(f => ({ ...f, type: v }))}
                        >
                            <Option value="purchase">{t.purchase}</Option>
                            <Option value="sale">{t.sale}</Option>
                            <Option value="adjustment">{t.adjustment}</Option>
                            <Option value="waste">{t.waste}</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    dataSource={state.logs}
                    rowKey="id"
                    pagination={{ pageSize: 15 }}
                    columns={[
                        {
                            title: t.date_time,
                            dataIndex: "created_at",
                            render: (d) => formatDateClient(d, "DD/MM HH:mm")
                        },
                        {
                            title: t.category,
                            dataIndex: "item_type",
                            render: (v) => <Tag color={v === 'product' ? 'blue' : 'cyan'}>{(v === 'product' ? t.product : t.raw_material).toUpperCase()}</Tag>
                        },
                        {
                            title: t.product_name,
                            dataIndex: "item_name",
                            render: (name) => <span style={{ fontWeight: 600 }}>{name}</span>
                        },
                        {
                            title: t.transaction,
                            dataIndex: "type",
                            render: (v) => {
                                let color = "grey";
                                let text = v?.toUpperCase() || "";
                                if (v === 'purchase') { color = "green"; text = t.purchase; }
                                if (v === 'receive') { color = "purple"; text = t.receive; }
                                if (v === 'sale') { color = "blue"; text = t.sale || "Sale"; }
                                if (v === 'adjustment') { color = "orange"; text = t.adjustment; }
                                if (v === 'waste') { color = "red"; text = t.waste; }
                                return <Tag color={color}>{(text || "").toUpperCase()}</Tag>
                            }
                        },
                        {
                            title: t.change,
                            dataIndex: "qty_changed",
                            align: 'right',
                            render: (v) => <span style={{ color: v > 0 ? '#3f8600' : '#cf1322', fontWeight: 700 }}>{v > 0 ? `+${v}` : v}</span>
                        },
                        {
                            title: t.balance,
                            dataIndex: "new_qty",
                            align: 'right',
                            render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>
                        },
                        {
                            title: t.staff,
                            dataIndex: "staff_name",
                            render: (v) => <span style={{ fontSize: '0.85rem' }}>{v}</span>
                        },
                        {
                            title: t.reason,
                            dataIndex: "reason",
                            ellipsis: true
                        }
                    ]}
                />
            </Card>

            <Modal
                title={<Title level={4}>{t.stock_correction}</Title>}
                open={state.visibleModal}
                onCancel={onCloseModal}
                footer={null}
                centered
                width={450}
            >
                <Form layout="vertical" form={form} onFinish={onFinish} style={{ marginTop: 15 }}>
                    <Form.Item name="item_type" label={t.inventory_item_type} rules={[{ required: true }]}>
                        <Select placeholder={t.select} onChange={() => form.setFieldValue("item_id", undefined)}>
                            <Option value="product">{t.product}</Option>
                            <Option value="raw_material">{t.raw_material}</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.item_type !== curr.item_type}
                    >
                        {({ getFieldValue }) => {
                            const itemType = getFieldValue("item_type");
                            const items = itemType === 'product' ? state.products : state.rawMaterials;
                            const options = items.map(item => ({
                                label: `${item.name} ${item.code ? `(${item.code})` : ''} - ${t.stock}: ${item.qty || 0} ${item.unit || ''}`,
                                value: item.id
                            }));

                            return (
                                <Form.Item name="item_id" label={t.select_item} rules={[{ required: true }]}>
                                    <Select
                                        placeholder={t.search}
                                        showSearch
                                        optionFilterProp="label"
                                        options={options}
                                        loading={state.loading}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label={t.action_type} rules={[{ required: true }]}>
                                <Select placeholder={t.select}>
                                    <Option value="adjustment">{t.adjustment} (+/-)</Option>
                                    <Option value="waste">{t.waste} (-)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="qty_changed" label={t.qty_change} rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} placeholder="e.g. 10 or -5" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="reason" label={t.remark_reason} rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder={t.remark_reason} />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block style={{ background: "#2d6a42", height: 45, borderRadius: 8 }}>
                        {t.save}
                    </Button>
                </Form>
            </Modal>
        </MainPage>
    );
}

export default StockPage;
