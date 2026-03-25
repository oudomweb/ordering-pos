import React, { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, DatePicker, Flex, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
export const options = {
  curveType: "function",
  legend: { position: "bottom" },
};
function ReportCustomer_Summary() {
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const [filter,setFilter]=useState({
    from_date:dayjs().subtract(29,"d"),
    to_date:dayjs(),
  })
  const [state, setState] = useState({
    Data_Chat: [],
    list: [],
  });
  useEffect(() => {
    getList();
  }, []);
  const onreset = () => {
    setFilter({
      from_date: dayjs().subtract(29, "d"), 
      to_date: dayjs(), 
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
    });
  };
  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
      };
      const res = await request("report_Customer", "get", param);
      if (res) {
        const listTMP = [["Day", "Sale"]];
        res.list?.forEach((item) => {
          listTMP.push([item.title, Number(item.total_amount)]);
        });
        setState({
          Data_Chat: listTMP,
          list: res.list,
        });
      } else {
        setState({
          Data_Chat: [["Day", "Sale"]],
          list: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch sales summary:", error);
    } finally {
      setLoading(false);
    }
  }; 
  return (
    <div>
      <div style={{ display: "flex", color: "#333", marginBottom: "10px", marginRight:"10px"}}>
  <h1 style={{marginRight:"20px" , fontWeight:"bold"}}> Customer Performance Chart</h1>
     <Space>
      <DatePicker.RangePicker
            value={[filter.from_date,filter.to_date]}
            loading={true}
            allowClear={false}
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
          <Select
          allowClear
          placeholder="Select Category"
          value={filter.category_id}
          options={config?.category}
          onChange={(value) => {
            setFilter((prev) => ({
              ...prev,
              category_id : value
            }));        
          }} 
          />  
          <Button onClick={onreset}>
  Reset Filters
</Button>
          <Button type="primary" onClick={()=>getList()}>Filter</Button>
           </Space>
        </div>
    {state.Data_Chat.length > 1 ? (
    <Chart
      chartType="LineChart"
      width="100%"
      height="400px"
      data={state.Data_Chat}
      options={options}
      legendToggle
    />
  ) : (
    <div style={{ textAlign: "center", marginTop: "20px", color: "#888" }}>
      No data available for the selected filters.
    </div>
  )}      
      <div style={{ width: "100%", marginTop: "20px" }}>
      <Table   
  style={{
    width: "100vw",
    height: "100vh",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    padding: "10px",
    boxSizing: "border-box",
  }}
  dataSource={state.list}
  columns={[
    {
      key: "title",
      title: "Seller Date",
      dataIndex: "title",
      render: (value) => (
        <Tag color="blue" style={{ fontSize: "14px" }}>
          {value}
        </Tag>
      ),
    },  
    {
      key: "totalamount",
      title: "Total Amount",
      dataIndex: "total_amount",
      render: (value) => (
        <div>
        <Tag
        color={value > 10 ? "green"  : "pink"}
        style={{ fontSize: "14px" }}
      >
        {value} People
      </Tag>
      </div>  
      ),
    },
  ]}
  pagination={false}
/>
      </div>
    </div>
  );
}
export default ReportCustomer_Summary;