import React, { useEffect, useState, useRef } from "react";
import { Button, Form, Image, Space, Table, Tag, Typography, Card, Divider, Tooltip } from "antd";
import { request } from "../../util/helper";
import { MdRefresh, MdFileDownload, MdPrint } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import jsPDF from "jspdf";
import { useReactToPrint } from "react-to-print";

const { Title } = Typography;

function Top_Sales() {
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const printComponentRef = useRef(null);

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    setLoading(true);
    const res = await request("top_sales", "get");
    setLoading(false);
    if (res) {
      setList(res.list);
    }
  };

  const refreshList = () => {
    getList();
  };

  // Function to generate and download PDF without autoTable plugin
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(24, 144, 255); // #1890ff
    doc.text("Top Sales Report", 15, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);
    
    // Set up table parameters
    const tableStartY = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const usablePageWidth = pageWidth - (margin * 2);
    const colWidths = [20, 60, 40, 40, 30];
    const rowHeight = 10;
    
    // Header row
    doc.setFillColor(24, 144, 255); // #1890ff
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.rect(margin, tableStartY, usablePageWidth, rowHeight, 'F');
    
    // Column headers
    doc.text("No", margin + 5, tableStartY + 7);
    doc.text("Product Name", margin + colWidths[0] + 5, tableStartY + 7);
    doc.text("Category", margin + colWidths[0] + colWidths[1] + 5, tableStartY + 7);
    doc.text("Total Sales", margin + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableStartY + 7);
    doc.text("Image", margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, tableStartY + 7);
    
    // Data rows
    let yPosition = tableStartY + rowHeight;
    
    list.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Set background color based on row index (alternating rows)
      if (index % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPosition, usablePageWidth, rowHeight, 'F');
      }
      
      // Row data
      doc.setTextColor(0, 0, 0);
      doc.text((index + 1).toString(), margin + 5, yPosition + 7);
      doc.text(item.product_name.substring(0, 25), margin + colWidths[0] + 5, yPosition + 7);
      doc.text(item.category_name.substring(0, 15), margin + colWidths[0] + colWidths[1] + 5, yPosition + 7);
      
      const formattedAmount = `$${Number(item.total_sale_amount).toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
      doc.text(formattedAmount, margin + colWidths[0] + colWidths[1] + colWidths[2] + 5, yPosition + 7);
      
      const imageStatus = item.product_image ? "Available" : "None";
      doc.text(imageStatus, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, yPosition + 7);
      
      // Move to next row
      yPosition += rowHeight;
      
      // Add horizontal line
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPosition, margin + usablePageWidth, yPosition);
    });
    
    // Save the PDF
    doc.save("top_sales_report.pdf");
  };

  // Function to handle printing - properly implemented
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: "Top Sales Report",
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        setLoading(true);
        resolve();
      });
    },
    onAfterPrint: () => {
      setLoading(false);
    },
    removeAfterPrint: true
  });

  const columns = [
    {
      key: "No",
      title: "No",
      render: (item, data, index) => (
        <span style={{ fontWeight: "bold" }}>{index + 1}</span>
      ),
      align: "center",
      width: 70,
    },
    {
      key: "name",
      title: "Product Name",
      dataIndex: "product_name",
      render: (text) => (
        <span style={{ fontWeight: "bold", color: "#262626" }}>{text}</span>
      ),
    },
    {
      key: "category",
      title: "Category Name",
      dataIndex: "category_name",
      render: (text) => (
        <Tag color="blue" style={{ fontSize: "14px", padding: "2px 10px" }}>
          {text}
        </Tag>
      ),
    },
    {
      key: "total_sale_amount",
      title: "Total Sale Amount",
      dataIndex: "total_sale_amount",
      render: (value) => (
        <Tag color="green" style={{ fontSize: "14px", padding: "2px 10px" }}>
          ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Tag>
      ),
      align: "center",
      sorter: (a, b) => a.total_sale_amount - b.total_sale_amount,
    },
    {
      key: "image",
      title: "Image",
      dataIndex: "product_image",
      render: (value) =>
        value ? (
          <Image
            src={"http://localhost:/fullstack/" + value}
            style={{
              width: 60,
              height: 60,
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            alt="Product"
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              backgroundColor: "#f5f5f5",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
          >
            <span style={{ color: "#8c8c8c" }}>No Image</span>
          </div>
        ),
      align: "center",
      width: 100,
    },
  ];

  return (
    <MainPage loading={loading}>
      <Card 
        className="top-sales-card"
        bordered={false}
        style={{ 
          borderRadius: "12px", 
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
        }}
      >
        <div className="pageHeader" style={{ marginBottom: "20px" }}>
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
              Top Sales
            </Title>
            <Space>
              {/* <Tooltip title="Download as PDF">
                <Button
                  icon={<MdFileDownload />}
                  onClick={handleDownloadPDF}
                  type="primary"
                  style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
                >
                  Download PDF
                </Button>
              </Tooltip>
              <Tooltip title="Print Report">
                <Button
                  icon={<MdPrint />}
                  onClick={handlePrint}
                  type="primary"
                  style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
                >
                  Print
                </Button>
              </Tooltip> */}
              <Tooltip title="Refresh Data">
                <Button
                  icon={<MdRefresh />}
                  onClick={refreshList}
                  type="primary"
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                >
                  Refresh
                </Button>
              </Tooltip>
            </Space>
          </Space>
        </div>
        
        <Divider style={{ margin: "0 0 20px 0" }} />
        
        {/* Main content section - both display and print */}
        <div style={{ width: "100%" }}>
          {/* Regular display table */}
          <Table
            dataSource={list}
            columns={columns}
            bordered={false}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
            }}
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'even-row' : 'odd-row'
            }
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          />
          
          {/* Hidden printable component - only used when print is triggered */}
          <div style={{ display: "none" }}>
            <div ref={printComponentRef} className="print-container">
              <div className="print-header">
                <h1 style={{ textAlign: "center", color: "#1890ff" }}>Top Sales Report</h1>
                <p style={{ textAlign: "center", marginBottom: "20px" }}>
                  Generated: {new Date().toLocaleString()}
                </p>
              </div>
              
              <table className="print-table">
                <thead>
                  <tr>
                    {columns.map((col, index) => (
                      <th key={index}>{col.title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td style={{ textAlign: "center" }}>{rowIndex + 1}</td>
                      <td><strong>{item.product_name}</strong></td>
                      <td>{item.category_name}</td>
                      <td style={{ textAlign: "center" }}>
                        ${Number(item.total_sale_amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {item.product_image ? "Image Available" : "No Image"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
      
      <style jsx global>{`
        .top-sales-card {
          transition: all 0.3s ease;
        }
        .even-row {
          background-color: #ffffff;
        }
        .odd-row {
          background-color: #f9f9f9;
        }
        
        /* Print styles */
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        
        .print-container {
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .print-table th {
          background-color: #1890ff;
          color: white;
          font-weight: bold;
          padding: 8px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        
        .print-table td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        
        .print-table .even-row {
          background-color: #f9f9f9;
        }
      `}</style>
    </MainPage>
  );
}

export default Top_Sales;