import React from "react";
import { Chart } from "react-google-charts";
export const options = {
  title: "Expense Summary By Month",
  curveType: "function",
  legend: { position: "bottom" },
};
const HomePurchaseChart = ({data =[]}) => {
  return (
    <Chart
      chartType="LineChart"
      width="100%"
      height="400px"
      data={data}
      options={options}
    />
  );
};
export default HomePurchaseChart;