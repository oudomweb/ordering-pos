import React, { useEffect, useState, useRef } from "react";
import { Chart } from "react-google-charts";
import { request } from "../../util/helper";
import { Button, DatePicker, Select, Space, Table, Tag } from "antd";
import { PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const options = {
  curveType: "function",
  legend: { position: "bottom" },
};

function ReportSale_Summary() {
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
    category_id: null,
    brand_id: null
  });
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
      category_id: null,
      brand_id: null,
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      category_id: null,
      brand_id: null,
    });
  };

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
        category_id: filter.category_id,
        brand_id: filter.brand_id,
      };
      const res = await request("report_Sale_Sammary", "get", param);
      if (res) {
        const listTMP = [["Day", "Sale"]];
        res.list?.forEach((item) => {
          listTMP.push([item.order_date, Number(item.total_amount)]);
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

  // Format number as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Sales_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h1 style={{ marginRight: "20px", fontWeight: "bold" }}>Sales Performance Chart</h1>
        <Space>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            loading={loading}
          >
            Print
          </Button>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleDownloadPDF}
            loading={loading}
          >
            Download PDF
          </Button>
        </Space>
      </div>

      <div style={{ display: "flex", color: "#333", marginBottom: "10px", marginRight: "10px" }}>
        <Space>
          <DatePicker.RangePicker
            value={[filter.from_date, filter.to_date]}
            loading={loading}
            allowClear={false}
            defaultValue={[
              dayjs(filter.from_date, "DD/MM/YYYY"),
              dayjs(filter.to_date, "DD/MM/YYYY")
            ]}
            format={"DD/MM/YYYY"}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                from_date: value[0],
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
                category_id: value
              }));
            }}
          />
          <Select
            allowClear
            placeholder="Select Brand"
            value={filter.brand_id}
            options={config?.brand}
            onChange={(value) => {
              setFilter((prev) => ({
                ...prev,
                brand_id: value
              }));
            }}
          />
          <Button onClick={onreset}>
            Reset Filters
          </Button>
          <Button type="primary" onClick={() => getList()} loading={loading}>
            Filter
          </Button>
        </Space>
      </div>

      <div ref={reportRef} className="report-content">
        <div className="report-header" style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2>Sales Report</h2>
          <p>
            {dayjs(filter.from_date).format("MMM DD, YYYY")} - {dayjs(filter.to_date).format("MMM DD, YYYY")}
          </p>
        </div>

        {state.Data_Chat.length > 1 ? (
          <Chart
            chartType="LineChart"
            width="100%"
            height="400px"
            data={state.Data_Chat}
            options={{
              ...options,
              title: "Daily Sales Performance",
              hAxis: { title: "Date" },
              vAxis: { title: "Sales Amount ($)" },
              colors: ["#3366cc"],
              chartArea: { width: "80%", height: "70%" }
            }}
            legendToggle
          />
        ) : (
          <div style={{ textAlign: "center", marginTop: "20px", color: "#888", height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            No data available for the selected filters.
          </div>
        )}

        <div style={{ width: "100%", marginTop: "20px" }}>
          <Table
            style={{
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              padding: "10px",
              boxSizing: "border-box",
            }}
            loading={loading}
            dataSource={state.list}
            columns={[
              {
                key: "title",
                title: "Order Date",
                dataIndex: "order_date",
                render: (value) => (
                  <Tag color="blue" style={{ fontSize: "14px" }}>
                    {value}
                  </Tag>
                ),
              },
              {
                key: "totalqty",
                title: "Total QTY",
                dataIndex: "total_qty",
                render: (value) => (
                  <Tag
                    color={Number(value) > 20 ? "blue" : Number(value) > 10 ? "green" : "pink"}
                    style={{ fontSize: "14px" }}
                  >
                    {Number(value).toLocaleString()} Items
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
                      color={Number(value) > 200 ? "blue" : Number(value) > 100 ? "green" : "pink"}
                      style={{ fontSize: "14px" }}
                    >
                      {formatCurrency(value)}
                    </Tag>
                  </div>
                ),
              },
            ]}
            pagination={false}
            summary={(pageData) => {
              let totalQty = 0;
              let totalAmount = 0;

              pageData.forEach(({ total_qty, total_amount }) => {
                totalQty += Number(total_qty || 0);
                totalAmount += Number(total_amount || 0);
              });

              return (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <strong>{totalQty.toLocaleString()} Items</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong>{formatCurrency(totalAmount)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-content, .report-content * {
            visibility: visible;
          }
          .report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .ant-tag {
            border: 1px solid #d9d9d9 !important;
            padding: 4px 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportSale_Summary;