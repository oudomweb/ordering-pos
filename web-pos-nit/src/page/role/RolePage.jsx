import { useEffect, useState } from "react";
import { request } from "../../util/helper";
import { Button, Form, Input, message, Modal, Space, Table, Tag } from "antd";
function RolePage() {
  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
  });
  const [form] = Form.useForm();
  useEffect(() => {
    getList();
  }, []);
  const getList = async () => {
    const res = await request("role", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list,
      }));
    }
  };
  const clickBtnEdit = (item) => {
    form.setFieldsValue({
      ...item,
    });
    handleOpenModal();
  };
  const clickBtnDelete = (item) => {
    Modal.confirm({
      title: "Delete",
      content: "Are you sure to remove?",
      onOk: async () => {
        const res = await request("role", "delete", {
          id: item.id,
        });
        if (res && !res.error) {
          message.success(res.message);
          const newList = state.list.filter((item1) => item1.id != item.id);
          setState((pre) => ({
            ...pre,
            list: newList,
          }));
        }
      },
    });
  };
  const onFinish = async (item) => {
    var data = {
      id: form.getFieldValue("id"),
      code: item.code,
      name: item.name,
    };
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    const res = await request("role", method, data);
    if (res && !res.error) {
      message.success(res.message);
      getList();
      handleCloseModal();
    } else {
      message.warning(res.error);
    }
  };
  const handleOpenModal = () => {
    setState((pre) => ({
      ...pre,
      visible: true,
    }));
  };
  const handleCloseModal = () => {
    setState((pre) => ({
      ...pre,
      visible: false,
    }));
    form.resetFields();
  };
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div>Role</div>
          <Input.Search style={{ marginLeft: 10 }} placeholder="Search" />
        </div>
        <Button type="primary" onClick={handleOpenModal}>
          New
        </Button>
      </div>
      <Modal
  title={
    form.getFieldValue("id") ? (
      <div>
        <span className="khmer-text">កែប្រែ</span> / <span className="english-text">Update</span>
      </div>
    ) : (
      <div>
        <span className="khmer-text">តួនាទីថ្មី</span> / <span className="english-text">New Role</span>
      </div>
    )
  }
  open={state.visible}
  onCancel={handleCloseModal}
  footer={null}
>
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Form.Item
      name="name"
      label={
        <div>
          <span className="khmer-text">ឈ្មោះតួនាទី</span> / <span className="english-text">Role Name</span>
        </div>
      }
    >
      <Input placeholder="Role Name" />
    </Form.Item>
    <Form.Item
      name="code"
      label={
        <div>
          <span className="khmer-text">កូដតួនាទី</span> / <span className="english-text">Role Code</span>
        </div>
      }
    >
      <Input placeholder="Role Code" />
    </Form.Item>
    <Form.Item>
      <Space>
        <Button onClick={handleCloseModal}>
          <span className="khmer-text">បោះបង់</span> 
        </Button>
        <Button type="primary" htmlType="submit">
          {form.getFieldValue("id") ? (
            <span>
              <span className="khmer-text">កែប្រែ</span> 
            </span>
          ) : (
            <span>
              <span className="khmer-text">រក្សាទុក</span> 
            </span>
          )}
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
      key: "no",
      title: <span className="khmer-text">ល.រ</span>,
      render: (value, data, index) => index + 1,
    },
    {
      key: "name",
      title: <span className="khmer-text">ឈ្មោះ</span> ,
      dataIndex: "name",
    },
    {
      key: "code",
      title: <span className="khmer-text">កូដ</span>,
      dataIndex: "code",
    },
    {
      key: "is_active",
      title: <span className="khmer-text">ស្ថានភាព</span> ,
      dataIndex: "is_active",
      render: (value) =>
        value ? (
          <Tag color="green" className="khmer-text">សកម្ម</Tag>
        ) : (
          <Tag color="red" className="khmer-text">អសកម្ម</Tag>
        ),
    },
    {
      key: "action",
      title: <span className="khmer-text">សកម្មភាព</span>,
      align: "center",
      render: (value, data) => (
        <Space>
          <Button onClick={() => clickBtnEdit(data)} type="primary">
            <span className="khmer-text">កែប្រែ</span>
          </Button>
          <Button onClick={() => clickBtnDelete(data)} danger type="primary">
            <span className="khmer-text">លុប</span>
          </Button>
        </Space>
      ),
    },
  ]}
/>
    </div>
  );
}
export default RolePage;