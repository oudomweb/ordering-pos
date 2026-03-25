import React from "react";
import { Chart } from "react-google-charts";
const options = {
  title: "Sale Summary By Month",
  hAxis: { title: "Month", titleTextStyle: { color: "#333" } , fontWeight:"bold" },
  vAxis: { minValue: 0 },
  chartArea: { width: "70%", height: "70%"  },
};
function App({data=[]}) {
  return (
    <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "8px" }}>
      <h2 style={{ textAlign: "center" ,fontWeight:"bold" }}>Sales Overview</h2>
      <Chart
        chartType="ColumnChart"
        width="100%"
        height="400px"
        data={data}
        options={options}
      />
    </div>
  );
}
export default App;