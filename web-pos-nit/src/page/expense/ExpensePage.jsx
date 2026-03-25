import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, DatePicker, Select, InputNumber,
    Badge, Tooltip, Empty
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    DollarOutlined,
    SearchOutlined,
    CalendarOutlined,
    FilterOutlined,
    FileTextOutlined,
    TagOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ExpensePage = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [types, setTypes] = useState([]);
    const [form] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState([null, null]);

    useEffect(() => {
        getTypes();
        getList();
    }, []);

    const getTypes = async () => {
        try {
            const res = await request("expense/type", "get");
            if (res && res.list) {
                setTypes(res.list);
            }
        } catch (error) {
            console.error("Failed to fetch expense types");
        }
    };

    const getList = async () => {
        setLoading(true);
        try {
            let url = "expense";
            const params = [];
            if (dateRange[0] && dateRange[1]) {
                params.push(`from_date=${dateRange[0].format("YYYY-MM-DD")}`);
                params.push(`to_date=${dateRange[1].format("YYYY-MM-DD")}`);
            }
            if (params.length > 0) url += "?" + params.join("&");

            const res = await request(url, "get");
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error("Failed to fetch expenses");
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            const method = editId ? "put" : "post";
            const payload = {
                ...values,
                id: editId,
                expense_date: values.expense_date.format("YYYY-MM-DD")
            };

            const res = await request("expense", method, payload);
            if (res) {
                message.success(res.message || `Expense ${editId ? 'updated' : 'recorded'} successfully`);
                setVisible(false);
                form.resetFields();
                setEditId(null);
                getList();
            }
        } catch (error) {
            message.error(error.message || "Operation failed");
        }
    };

    const onClickEdit = (item) => {
        setEditId(item.id);
        form.setFieldsValue({
            expense_type_id: item.expense_type_id,
            amount: item.amount,
            expense_date: moment(item.expense_date),
            description: item.description
        });
        setVisible(true);
    };

    const onClickDelete = (id) => {
        Modal.confirm({
            title: "Remove Expense Record?",
            content: "This action cannot be undone.",
            okText: "Delete",
            okType: "danger",
            onOk: async () => {
                const res = await request("expense", "delete", { id });
                if (res) {
                    message.success("Record deleted");
                    getList();
                }
            }
        });
    };

    const columns = [
        {
            title: "Date",
            dataIndex: "expense_date",
            key: "expense_date",
            render: (date) => (
                <Space>
                    <CalendarOutlined style={{ color: '#1e4a2d' }} />
                    <Text>{moment(date).format("DD MMM YYYY")}</Text>
                </Space>
            )
        },
        {
            title: "Type",
            dataIndex: "type_name",
            key: "type_name",
            render: (text) => (
                <Tag color="blue" icon={<TagOutlined />}>{text}</Tag>
            )
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
            render: (text) => text || "-"
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            align: 'right',
            render: (amount) => (
                <Text strong style={{ color: '#cf1322', fontSize: '15px' }}>
                    ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
            )
        },
        {
            title: "Actions",
            key: "actions",
            align: 'right',
            render: (record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => onClickEdit(record)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onClickDelete(record.id)} />
                </Space>
            )
        }
    ];

    const filteredList = list.filter(item =>
        (item.type_name && item.type_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
    );

    const totalExpense = filteredList.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    return (
        <div style={{ padding: '24px', background: '#f4f1eb', minHeight: '100vh' }}>
            <div style={{
                marginBottom: '24px',
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ margin: 0, color: '#1e4a2d', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <DollarOutlined /> Expense Tracker
                        </Title>
                        <Text type="secondary">Monitor and manage your operational costs</Text>
                    </Col>
                    <Col>
                        <Space size="middle">
                            <RangePicker
                                onChange={(dates) => setDateRange(dates || [null, null])}
                                style={{ borderRadius: '8px' }}
                            />
                            <Button icon={<FilterOutlined />} onClick={getList}>Apply Filter</Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditId(null);
                                    form.resetFields();
                                    form.setFieldsValue({ expense_date: moment() });
                                    setVisible(true);
                                }}
                                style={{
                                    background: '#cf1322',
                                    borderColor: '#cf1322',
                                    height: '40px',
                                    borderRadius: '8px'
                                }}
                            >
                                Record Expense
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            <Row gutter={24} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                    <Card borderRadius="12px" style={{ border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Selected period"
                            value={totalExpense}
                            prefix="$"
                            valueStyle={{ color: '#cf1322', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col span={18}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Search by type or description..."
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ height: '45px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                    />
                </Col>
            </Row>

            <Card
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}><FileTextOutlined /> {editId ? "Edit Expense Report" : "Record New Expense"}</Title>}
                open={visible}
                onCancel={() => setVisible(false)}
                onOk={() => form.submit()}
                okText="Save Record"
                width={500}
            >
                <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ expense_date: moment() }}>
                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item
                                name="expense_type_id"
                                label="Expense Category"
                                rules={[{ required: true, message: "Select a category" }]}
                            >
                                <Select placeholder="Pick a type" size="large">
                                    {types.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item
                                name="expense_date"
                                label="Date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="amount"
                        label="Amount (USD)"
                        rules={[{ required: true, message: "Enter amount" }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            precision={2}
                            prefix="$"
                            size="large"
                            placeholder="0.00"
                        />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Notes / Description"
                    >
                        <Input.TextArea placeholder="What was this for?" rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

const Statistic = ({ title, value, prefix, valueStyle }) => (
    <div>
        <Text type="secondary" style={{ fontSize: '13px' }}>{title}</Text>
        <div style={{ fontSize: '24px', marginTop: '4px', ...valueStyle }}>
            {prefix}{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
    </div>
);

export default ExpensePage;
