import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { Button, Form, Input, message, Modal, Space, Table } from "antd";
import dayjs from "dayjs";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { useLanguage, translations } from "../../store/language.store";

function SupplierPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
    txtSearch: "",
  });
  useEffect(() => {
    getList();
  }, []);
  const getList = async () => {
    setState((p) => ({
      ...p,
      loading: true,
    }));
    var param = {
      txtSearch: state.txtSearch,
    };
    const res = await request("supplier", "get", param);
    if (res && !res.error) {
      setState((p) => ({
        ...p,
        list: res.list,
        loading: false,
      }));
    }
  };
  const openModal = () => {
    setState((p) => ({
      ...p,
      visible: true,
    }));
  };
  const closeModal = () => {
    setState((p) => ({
      ...p,
      visible: false,
    }));
    form.resetFields();
  };
  const onFinish = async (items) => {
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    setState((p) => ({
      ...p,
      loading: true,
    }));
    const res = await request("supplier", method, {
      ...items,
      id: form.getFieldValue("id"),
    });
    if (res && !res.error) {
      getList();
      closeModal();
      message.success(res.message);
    }
  };
  const onClickBtnEdit = (items) => {
    form.setFieldsValue({
      ...items,
      id: items.id,
    });
    openModal();
  };
  const onClickBtnDelete = (items) => {
    Modal.confirm({
      title: t.delete + " " + t.supplier,
      content: t.confirm_delete_supplier,
      onOk: async () => {
        setState((p) => ({
          ...p,
          loading: true,
        }));
        const res = await request("supplier", "delete", {
          id: items.id,
        });

        if (res && !res.error) {
          const newList = state.list.filter((item) => item.id !== items.id);
          setState((p) => ({
            ...p,
            list: newList,
            loading: false,
          }));
          message.success(t.supplier_deleted);
        } else {
          message.error(res?.message || "Error deleting supplier");
          setState((p) => ({
            ...p,
            loading: false,
          }));
        }
      },
    });
  };

  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">
        <Space>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{t.supplier_list}</div>
          <Input.Search
            onChange={(value) =>
              setState((p) => ({ ...p, txtSearch: value.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder={t.search}
          />
        </Space>
        <Button type="primary" onClick={openModal} icon={<MdOutlineCreateNewFolder />}>
          {t.add_new}
        </Button>
      </div>
      <Modal
        open={state.visible}
        title={<b>{form.getFieldValue("id") ? t.edit_supplier : t.add_new_supplier}</b>}
        onCancel={closeModal}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            name="name"
            label={t.name}
            rules={[{ required: true, message: t.name + " is required!" }]}
          >
            <Input placeholder={t.name} />
          </Form.Item>

          <Form.Item
            name="code"
            label={t.code}
            rules={[{ required: true, message: t.code + " is required!" }]}
          >
            <Input placeholder={t.code} />
          </Form.Item>

          <Form.Item
            name="tel"
            label={t.tel}
            rules={[{ required: true, message: t.tel + " is required!" }]}
          >
            <Input placeholder={t.tel} />
          </Form.Item>

          <Form.Item
            name="email"
            label={t.email}
            rules={[{ required: true, message: t.email + " is required!" }]}
          >
            <Input placeholder={t.email} />
          </Form.Item>

          <Form.Item
            name="address"
            label={t.address}
            rules={[{ required: true, message: t.address + " is required!" }]}
          >
            <Input placeholder={t.address} />
          </Form.Item>

          <Form.Item
            name="website"
            label={t.website}
          >
            <Input placeholder={t.website} />
          </Form.Item>

          <Form.Item
            name="note"
            label={t.note}
          >
            <Input.TextArea placeholder={t.note} />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={closeModal}>{t.cancel}</Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? t.edit : t.save}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Table
        rowClassName={() => "pos-row"}
        dataSource={state.list}
        columns={[
          {
            key: "name",
            title: t.name,
            dataIndex: "name",
          },
          {
            key: "code",
            title: t.code,
            dataIndex: "code",
          },
          {
            key: "tel",
            title: t.tel,
            dataIndex: "tel",
          },
          {
            key: "email",
            title: t.email,
            dataIndex: "email",
          },
          {
            key: "address",
            title: t.address,
            dataIndex: "address",
          },
          {
            key: "website",
            title: t.website,
            dataIndex: "website",
          },
          {
            key: "create_at",
            title: t.created_at,
            dataIndex: "create_at",
            render: (value) => dayjs(value).format("DD/MM/YYYY"),
          },
          {
            key: "action",
            title: t.action,
            align: 'center',
            render: (value, data) => (
              <Space>
                <Button type="primary" onClick={() => onClickBtnEdit(data)}>
                  {t.edit}
                </Button>
                <Button type="primary" danger onClick={() => onClickBtnDelete(data)}>
                  {t.delete}
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </MainPage>
  );
}

export default SupplierPage;