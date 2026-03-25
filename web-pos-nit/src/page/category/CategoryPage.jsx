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
  Divider
} from "antd";
import { MdAdd, MdDelete, MdEdit, MdCategory } from "react-icons/md";
import { SearchOutlined } from "@ant-design/icons";
import { request, getIconForCategory, getColorForCategory } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";

import { useLanguage, translations } from "../../store/language.store";
import { useProfileStore } from "../../store/profileStore";

const { Title } = Typography;

function CategoryPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    visibleModal: false,
    loading: false,
  });
  const [searchText, setSearchText] = useState("");

  const userId = useProfileStore(s => s.profile?.id || s.profile?.user_id);
  useEffect(() => {
    if (userId) getList();
  }, [userId]);

  const getList = async () => {
    setState((pre) => ({ ...pre, loading: true }));
    const res = await request("category", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list || [],
        loading: false,
      }));
    } else {
      message.error(t.no_data);
      setState((pre) => ({ ...pre, loading: false }));
    }
  };

  const onCloseModal = () => {
    setState((p) => ({ ...p, visibleModal: false }));
    form.resetFields();
  };

  const onFinish = async (values) => {
    const res = await request("category", values.id ? "put" : "post", values);
    if (res && !res.error) {
      message.success(t.success);
      onCloseModal();
      getList();
    } else {
      message.error(t.failed);
    }
  };

  const onClickEdit = (item) => {
    form.setFieldsValue(item);
    setState((pre) => ({ ...pre, visibleModal: true }));
  };

  const onClickDelete = (item) => {
    Modal.confirm({
      title: t.delete + " " + t.category,
      content: `${t.remove_data} "${item.name}"?`,
      okText: t.delete,
      okType: "danger",
      onOk: async () => {
        const res = await request("category", "delete", { id: item.id });
        if (res && !res.error) {
          message.success(t.success);
          getList();
        } else {
          message.error(res?.message || t.failed);
        }
      },
    });
  };

  const filteredList = state.list.filter((item) =>
    item.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <MainPage loading={state.loading}>
      <Card style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Space size="middle">
            <div style={{
              width: 45, height: 45, borderRadius: 12,
              background: "#2d6a42", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#fff"
            }}>
              <MdCategory size={24} />
            </div>
            <Title level={4} style={{ margin: 0 }}>{t.categories}</Title>
          </Space>
          <Button
            type="primary"
            icon={<MdAdd />}
            onClick={() => setState({ ...state, visibleModal: true })}
            size="large"
            style={{ borderRadius: 10, background: "#2d6a42", borderColor: "#2d6a42" }}
          >
            {t.add_new}
          </Button>
        </div>

        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder={t.search}
          size="large"
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 24, borderRadius: 12 }}
        />

        <Table
          dataSource={filteredList}
          rowKey="id"
          columns={[
            {
              title: t.category,
              dataIndex: "name",
              render: (name) => (
                <Space>
                  <span style={{ fontSize: 20 }}>{getIconForCategory(name)}</span>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                </Space>
              )
            },
            {
              title: t.status,
              dataIndex: "name",
              render: (name) => <Tag color={getColorForCategory(name)}>{name.toUpperCase()}</Tag>
            },
            {
              title: t.action,
              align: "center",
              render: (_, record) => (
                <Space>
                  <Button type="text" icon={<MdEdit color="#2d6a42" size={18} />} onClick={() => onClickEdit(record)} />
                  <Button type="text" danger icon={<MdDelete size={18} />} onClick={() => onClickDelete(record)} />
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal
        open={state.visibleModal}
        title={form.getFieldValue("id") ? t.edit : t.add_new}
        onCancel={onCloseModal}
        footer={null}
        centered
        width={400}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} style={{ marginTop: 20 }}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Form.Item
            name="name"
            label={t.name}
            rules={[{ required: true, message: t.name + " is required" }]}
          >
            <Input placeholder="e.g. Hot Drinks" size="large" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            style={{ marginTop: 10, background: "#2d6a42", height: 50, borderRadius: 10 }}
          >
            {t.save}
          </Button>
        </Form>
      </Modal>
    </MainPage>
  );
}

export default CategoryPage;