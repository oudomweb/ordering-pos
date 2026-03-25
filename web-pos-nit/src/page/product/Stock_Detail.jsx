import { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { RiCodeView } from "react-icons/ri";
import { formatDateClient, formatDateServer, request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import Style from "../../page/orderPage/OrderPage.module.css"
import dayjs from "dayjs";
function Stock_Detail() {
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [orderDetail, seOrderDetail] = useState([]);
  const [summary, setSummary] = useState({ total_amount: 0, total_order: 0 });
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    name: "",
    descriptoin: "",
    status: "",
    parentId: null,
    txtSearch: "",
  });
  const [filter, setFilter] = useState({
    from_date: dayjs(), 
    to_date: dayjs(),  
  });
  useEffect(() => {
    getList();
  }, []);
  const getList = async () => {
    setLoading(true);
    try {
      const param = {
        txtSearch: state.txtSearch,
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
      };
      const res = await request("order", "get", param);
      if (res) {
        setList(res.list);
        setSummary(res.summary || { total_amount: 0, total_order: 0 });
      }
    } catch (error) {
      console.error("Error fetching list: ", error);
    } finally {
      setLoading(false);
    }
  };
  const getOderdetail = async (data) => {
    setLoading(true);
    const res = await request("order_detail/" + data.id, "get");
    setLoading(false);
    if (res) {
      seOrderDetail(res.list);
      setState({
        ...state,
        visibleModal: true,
      });
    }
  };
  const onClickAddBtn = () => {
    setState({
      ...state,
      visibleModal: true,
    });
  };
  const onCloseModal = () => {
    formRef.resetFields();
    setState({
      ...state,
      visibleModal: false,
      id: null,
    });
  };
  const onFinish = async (items) => {
    var data = {
      id: formRef.getFieldValue("id"),
      name: items.name,
      description: items.description,
      status: items.status,
      parent_id: 0,
    };
    var method = "post";
    if (formRef.getFieldValue("id")) {
      method = "put";
    }
    const res = await request("order", method, data);
    if (res && !res.error) {
      message.success(res.message);
      getList();
      onCloseModal();
    }
  };
  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          <div>
            <div style={{ fontWeight: "bold" }}>Order</div>
            <div >Total:
              <Tag color="green">
                {summary?.total_order ?? 0} order
              </Tag>
              <Tag color="blue">
                {summary?.total_amount ?? 0}$
              </Tag>
            </div>
            <div></div>
          </div>
          <Input.Search
            onChange={(value) =>
              setState((p) => ({ ...p, txtSearch: value.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder="Search"   
          />
          <DatePicker.RangePicker
            allowClear
            defaultValue={[
              dayjs(filter.from_date, "DD/MM/YYYY"),
              dayjs(filter.to_date, "DD/MM/YYYY")
            ]}
            format={"DD/MM/YYYY"} 
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                from_date: value[0] , 
                to_date: value[1]             
              }));
            }}
          />    
          <Button type="primary" onClick={getList}>
            Filter
          </Button>
        </Space>
        <Button type="primary" onClick={onClickAddBtn}>
          NEW
        </Button>
      </div>
      <Modal
        open={state.visibleModal}
        title={formRef.getFieldValue("id") ? "Edit order" : "New order"}
        footer={null}
        onCancel={onCloseModal}
        width={800}
        centered={true}
      >
        <Table
          dataSource={orderDetail}
          columns={[
            {
              key: "p_name",
              title: "Product",
              dataIndex: "p_name",
              render: (text, data) => (
                <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>
                    {data.p_name}
                  </div>
                  <div style={{ color: "#777" }}>
                    {data.p_category_name} | {data.p_brand}
                  </div>
                  <div
                    className="truncate-text"
                    title={text}
                    style={{ whiteSpace: "pre-line", color: "#666" }}
                  >
                    {data.p_des}
                    | {text}
                  </div>
                </div>
              )
            },
            {
              key: "qty",
              title: "Qty",
              dataIndex: "qty",
              render: (text) => <div style={{ textAlign: "center", fontWeight: "bold" }}>
                <Tag color="green">{text}</Tag>
              </div>,
            },
            {
              key: "price",
              title: "Price",
              dataIndex: "price",
              render: (text) => <div style={{ textAlign: "right", fontWeight: "bold" }}><Tag color="pink">${text}</Tag></div>,
            },
            {
              key: "discount",
              title: "Discount",
              dataIndex: "discount",
              render: (text) => <div style={{ textAlign: "right" }}><Tag color="red">{text}%</Tag></div>,
            },
            {
              key: "total",
              title: "Total",
              dataIndex: "total",
              render: (text) => <div style={{ textAlign: "right", fontWeight: "bold", color: "#333" }}><Tag color="blue">${text}</Tag></div>,
            },
          ]}
          pagination={{ pageSize: 5 }}
          rowKey="id"
          style={{ marginTop: "20px" }} 
          rowClassName="table-row-hover"
          onRow={(record, rowIndex) => ({
            onMouseEnter: () => {
            },
          })}
          bordered
          scroll={{ x: 'max-content' }}
        />
      </Modal>
      <div>
      <Tag className={Style.Tag_Style}>
  <Table
    dataSource={list}
    columns={[
      {
        key: "order_no",
        title: (
          <div className="table-header">
            <div className="khmer-text">លេខបញ្ជា</div>
            <div className="english-text">Order No</div>
          </div>
        ),
        dataIndex: "order_no",
        render: (value) => (
          <div>
            <Tag color="blue">{value}</Tag>
          </div>
        ),
      },
      {
        key: "customer",
        title: (
          <div className="table-header">
            <div className="khmer-text">អតិថិជន</div>
            <div className="english-text">Customer</div>
          </div>
        ),
        dataIndex: "customer_name",
        render: (value, data) => (
          <>
            <div style={{ fontWeight: "bold" }}>{data.customer_name}</div>
            <div>{data.customer_tel}</div>
            <div>{data.customer_address}</div>
          </>
        ),
      },
      {
        key: "Total",
        title: (
          <div className="table-header">
            <div className="khmer-text">សរុប</div>
            <div className="english-text">Total</div>
          </div>
        ),
        dataIndex: "total_amount",
      },
      {
        key: "Paid",
        title: (
          <div className="table-header">
            <div className="khmer-text">បានបង់</div>
            <div className="english-text">Paid</div>
          </div>
        ),
        dataIndex: "paid_amount",
        render: (value) => (
          <div style={{ color: "green", fontWeight: "bold" }}>{value}</div>
        ),
      },
      {
        key: "Due",
        title: (
          <div className="table-header">
            <div className="khmer-text">នៅសល់</div>
            <div className="english-text">Due</div>
          </div>
        ),
        dataIndex: "Due",
        render: (value, data) => (
          <Tag color="red">
            {(Number(data.total_amount) - Number(data.paid_amount)).toFixed(2)}
          </Tag>
        ),
      },
      {
        key: "PaymentMethod",
        title: (
          <div className="table-header">
            <div className="khmer-text">វិធីបង់ប្រាក់</div>
            <div className="english-text">Payment Method</div>
          </div>
        ),
        dataIndex: "payment_method",
        render: (value) => (
          <div style={{ textAlign: "center" }}>
            <Tag color="green">{value}</Tag>
          </div>
        ),
      },
      {
        key: "Remark",
        title: (
          <div className="table-header">
            <div className="khmer-text">កំណត់សម្គាល់</div>
            <div className="english-text">Remark</div>
          </div>
        ),
        dataIndex: "remark",
      },
      {
        key: "User",
        title: (
          <div className="table-header">
            <div className="khmer-text">អ្នកប្រើប្រាស់</div>
            <div className="english-text">User</div>
          </div>
        ),
        dataIndex: "create_by",
        render: (value) => (
          <div>
            <Tag color="pink">{value}</Tag>
          </div>
        ),
      },
      {
        key: "Order_Date",
        title: (
          <div className="table-header">
            <div className="khmer-text">កាលបរិច្ឆេទបញ្ជាទិញ</div>
            <div className="english-text">Order Date</div>
          </div>
        ),
        dataIndex: "create_at",
        render: (value) => formatDateClient(value, "DD/MM/YYYY H:m A"),
      },
      {
        key: "Action",
        title: (
          <div className="table-header">
            <div className="khmer-text">សកម្មភាព</div>
            <div className="english-text">Action</div>
          </div>
        ),
        align: "center",
        render: (item, data, index) => (
          <Space>
            <Button
              type="primary"
              icon={<RiCodeView />}
              onClick={() => getOderdetail(data, index)}
            />
          </Space>
        ),
      },
    ]}
  />
</Tag>    
      </div>
    </MainPage>
  );
}
export default Stock_Detail;