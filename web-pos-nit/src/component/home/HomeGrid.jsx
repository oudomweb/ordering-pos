import React from "react";
import { Row, Col, Card } from "antd";
const colors = ["#4CAF50", "#2196F3", "#FFC107", "#FF5722"];
function HomeGrid({ data = [] }) {
  return (
    <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
      {data?.map((item, index) => (
        <Col xs={24} sm={12} md={8} lg={6} key={index}>
          <Card
            bordered={false}
            style={{
              background: `linear-gradient(135deg, ${colors[index % colors.length]} 30%, #ffffff 100%)`,
              color: "#fff",
              textAlign: "center",
              borderRadius: 10,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
              {item.title}
            </div>
            {item.Summary && Object.keys(item.Summary).map((key,index)=>(
              <div key={index}>
                 <div>
                  {key} : {""} 
                  <label className="text-green-800 font-bold">
                  {item.Summary[key]}
                  </label>
                 </div>
              </div>
            ))}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
export default HomeGrid;