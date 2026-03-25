import React, { useEffect, useState } from "react";
import {
    Button,
    Col,
    Form,
    Image,
    Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Upload,
} from "antd";
import { request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { Config } from "../../util/config";

const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

import { useLanguage, translations } from "../../store/language.store";

function RawMaterialPage() {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [form] = Form.useForm();
    const [state, setState] = useState({
        list: [],
        loading: false,
        visibleModal: false,
    });
    const [filter, setFilter] = useState({
        txt_search: "",
        status: "",
    });
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [imageDefault, setImageDefault] = useState([]);

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setState((pre) => ({ ...pre, loading: true }));
        const param = {
            ...filter,
        };
        const res = await request("raw_material", "get", param);
        if (res && !res.error) {
            setState((pre) => ({
                ...pre,
                list: res.list,
                loading: false,
            }));
        } else {
            setState((pre) => ({ ...pre, loading: false }));
        }
    };

    const onCloseModal = () => {
        setState((p) => ({
            ...p,
            visibleModal: false,
        }));
        setImageDefault([]);
        form.resetFields();
    };

    const onFinish = async (items) => {
        var params = new FormData();
        params.append("name", items.name);
        params.append("code", items.code || "");
        params.append("unit", items.unit);
        params.append("price", items.price || 0);
        params.append("qty", items.qty || 0);
        params.append("min_stock", items.min_stock || 0);
        params.append("status", items.status);
        params.append("id", form.getFieldValue("id"));

        if (items.image_default) {
            if (items.image_default.file.status === "removed") {
                params.append("image_remove", "1");
            } else {
                params.append(
                    "image",
                    items.image_default.file.originFileObj,
                    items.image_default.file.name
                );
            }
        }

        var method = "post";
        if (form.getFieldValue("id")) {
            method = "put";
        }
        const res = await request("raw_material", method, params);
        if (res && !res.error) {
            message.success(res.message);
            onCloseModal();
            getList();
        } else {
            message.error(res.message || t.something_went_wrong);
        }
    };

    const onBtnNew = () => {
        form.resetFields();
        setState((p) => ({
            ...p,
            visibleModal: true,
        }));
    };

    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const handleChangeImageDefault = ({ fileList: newFileList }) =>
        setImageDefault(newFileList);

    const onFilter = () => {
        getList();
    };

    const onClickEdit = (item) => {
        form.setFieldsValue({
            ...item,
        });
        setState((pre) => ({ ...pre, visibleModal: true }));
        if (item.image != "" && item.image != null) {
            const imageProduct = [
                {
                    uid: "-1",
                    name: item.image,
                    status: "done",
                    url: Config.getFullImagePath(item.image),
                },
            ];
            setImageDefault(imageProduct);
        }
    };

    const onClickDelete = (item) => {
        Modal.confirm({
            title: t.delete + " " + t.raw_material,
            content: t.confirm_remove_raw_material,
            onOk: async () => {
                const res = await request("raw_material", "delete", { id: item.id });
                if (res && !res.error) {
                    message.success(res.message);
                    getList();
                }
            },
        });
    };

    const columns = [
        {
            key: "no",
            title: t.no,
            width: 60,
            render: (value, data, index) => index + 1,
        },
        {
            key: "image",
            title: t.product,
            width: 80,
            render: (record) => (
                <div style={{ width: 45, height: 45, borderRadius: "8px", overflow: "hidden", border: "1px solid #f0f0f0" }}>
                    {record.image ? (
                        <Image
                            src={Config.getFullImagePath(record.image)}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            preview={true}
                        />
                    ) : (
                        <div style={{ width: "100%", height: "100%", background: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#ccc" }}>{t.no_image}</div>
                    )}
                </div>
            ),
        },
        {
            key: "name",
            title: t.name + " / " + t.code,
            render: (record) => (
                <div>
                    <div style={{ fontWeight: 600, color: "#333" }}>{record.name}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{t.code}: {record.code || 'N/A'}</div>
                </div>
            )
        },
        {
            key: "unit",
            title: t.unit,
            dataIndex: "unit",
            width: 80,
            render: (unit) => <Tag>{unit}</Tag>
        },
        {
            key: "qty",
            title: t.stock_status,
            width: 250,
            render: (record) => {
                const isLow = Number(record.qty) <= Number(record.min_stock);
                const isOut = Number(record.qty) <= 0;
                let color = "#2ecc71"; // Green
                let statusText = t.in_stock;
                if (isLow) { color = "#f1c40f"; statusText = t.low_stock; }
                if (isOut) { color = "#e74c3c"; statusText = t.out_of_stock; }

                return (
                    <div style={{ width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color }}>
                                {statusText}
                            </span>
                            <span style={{ fontWeight: 600 }}>{record.qty} {record.unit}</span>
                        </div>
                        <div style={{ height: 6, width: "100%", background: "#eee", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                                height: "100%",
                                width: record.qty > 0 ? `${Math.min((record.qty / (record.min_stock * 3)) * 100, 100)}%` : 0,
                                background: color,
                                transition: "0.3s"
                            }} />
                        </div>
                    </div>
                )
            }
        },
        {
            key: "price",
            title: t.last_cost,
            dataIndex: "price",
            align: 'right',
            render: (val) => <b style={{ color: "#333" }}>${Number(val).toFixed(2)}</b>
        },
        {
            key: "status",
            title: t.status,
            dataIndex: "status",
            width: 100,
            render: (status) =>
                status == 1 ? (
                    <BadgeStatus color="#52c41a" text={t.active} />
                ) : (
                    <BadgeStatus color="#ff4d4f" text={t.inactive} />
                ),
        },
        {
            key: "Action",
            title: t.action,
            width: 100,
            align: "center",
            render: (item, data) => (
                <Space>
                    <Button
                        type="text"
                        style={{ color: "#3498db" }}
                        icon={<MdEdit size={18} />}
                        onClick={() => onClickEdit(data)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<MdDelete size={18} />}
                        onClick={() => onClickDelete(data)}
                    />
                </Space>
            ),
        },
    ];

    const BadgeStatus = ({ color, text }) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 13, color: "#666" }}>{text}</span>
        </div>
    );

    return (
        <MainPage loading={state.loading}>
            <div className="pageHeader">
                <Space>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{t.raw_material_list}</div>
                    <Input.Search
                        onChange={(event) =>
                            setFilter((p) => ({ ...p, txt_search: event.target.value }))
                        }
                        onSearch={onFilter}
                        allowClear
                        placeholder={t.search}
                    />
                    <Select
                        allowClear
                        style={{ width: 130 }}
                        placeholder={t.status}
                        options={[
                            { label: t.active, value: 1 },
                            { label: t.inactive, value: 0 },
                        ]}
                        onChange={(val) => {
                            setFilter((pre) => ({ ...pre, status: val }));
                            setTimeout(onFilter, 100);
                        }}
                    />
                </Space>
                <Button type="primary" onClick={onBtnNew} icon={<MdAdd />}>
                    {t.add_new_material}
                </Button>
            </div>

            <Table
                rowKey="id"
                dataSource={state.list}
                columns={columns}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                open={state.visibleModal}
                title={<b>{form.getFieldValue("id") ? t.edit_material : t.add_new_material}</b>}
                footer={null}
                onCancel={onCloseModal}
                width={700}
            >
                <Form layout="vertical" onFinish={onFinish} form={form}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label={t.material_name}
                                rules={[{ required: true, message: t.material_name + " is required" }]}
                            >
                                <Input placeholder="e.g. Coffee Beans" />
                            </Form.Item>

                            <Form.Item name="code" label={t.code}>
                                <Input placeholder="e.g. RM-001" />
                            </Form.Item>

                            <Form.Item
                                name="unit"
                                label={t.unit}
                                rules={[{ required: true, message: t.unit + " is required" }]}
                            >
                                <Select
                                    placeholder={t.unit}
                                    options={[
                                        { label: "Gram (g)", value: "g" },
                                        { label: "Kilogram (kg)", value: "kg" },
                                        { label: "Milliliter (ml)", value: "ml" },
                                        { label: "Liter (l)", value: "l" },
                                        { label: "Piece (pcs)", value: "pcs" },
                                        { label: "Can", value: "can" },
                                        { label: "Pack", value: "pack" },
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item name="status" label={t.status} initialValue={1}>
                                <Select
                                    options={[
                                        { label: t.active, value: 1 },
                                        { label: t.inactive, value: 0 },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="price" label={t.last_cost} initialValue={0}>
                                <InputNumber style={{ width: "100%" }} min={0} step={0.01} addonBefore="$" />
                            </Form.Item>

                            <Form.Item name="qty" label={t.initial_stock} initialValue={0}>
                                <InputNumber style={{ width: "100%" }} min={0} />
                            </Form.Item>

                            <Form.Item name="min_stock" label={t.min_stock_alert} initialValue={10}>
                                <InputNumber style={{ width: "100%" }} min={0} />
                            </Form.Item>

                            <Form.Item name="image_default" label={t.image}>
                                <Upload
                                    customRequest={(options) => options.onSuccess()}
                                    maxCount={1}
                                    listType="picture-card"
                                    fileList={imageDefault}
                                    onPreview={handlePreview}
                                    onChange={handleChangeImageDefault}
                                    onRemove={() => setImageDefault([])}
                                >
                                    {imageDefault.length >= 1 ? null : <div>+ {t.upload}</div>}
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ textAlign: "right", marginTop: 20 }}>
                        <Space>
                            <Button onClick={onCloseModal}>{t.cancel}</Button>
                            <Button type="primary" htmlType="submit">
                                {form.getFieldValue("id") ? t.edit : t.save}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>

            {previewImage && (
                <Image
                    wrapperStyle={{ display: "none" }}
                    preview={{
                        visible: previewOpen,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        afterOpenChange: (visible) => !visible && setPreviewImage(""),
                    }}
                    src={previewImage}
                />
            )}
        </MainPage>
    );
}

export default RawMaterialPage;
