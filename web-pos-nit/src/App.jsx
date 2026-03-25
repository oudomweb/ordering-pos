
import "./App.css";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import HomePage from "./page/home/HomePage";
import LogingPage from "./page/auth/LogingPage";
import RegisterPage from "./page/auth/RegisterPage";
import ScanPage from "./page/auth/ScanPage";

import MainLayout from "./component/layout/MainLayout";
import MainLayoutAuth from "./component/layout/MainLayoutAuth";
import EmployeePage from "./page/employee/EmployeePage";
import CoffeeMenuApp from "./page/CoffeeMenuApp/CoffeeMenuApp";
import CategoryPage from "./page/category/CategoryPage";
import UserPage from "./page/user/UserPage";
import RolePage from "./page/role/RolePage";
import PermissionPage from "./page/role/PermissionPage";
import PlanPage from "./page/plans/PlanPage";
import SupplierPage from "./page/purchase/SupplierPage";
import ProductPage_single from "./page/product/ProductPage_single";
import OrderPage from "./page/orderPage/OrderPage";
import ReportSale_Summary from "./page/report/ReportSale_Summary";
import ReportExpense_Summary from "./page/report/ReportExpense_Summary";
import ReportCustomer_Summary from "./page/report/ReportCustomer_Summary";
import ReportPurchase_Summary from "./page/report/ReportPurchase_Summary";
import Top_Sales from "./page/top_sale/Top_Sales";
import ProfilePage from "./page/user/ProfilePage";
import PosPage from "./page/pos/PosPage";
import { ExchangeRateProvider } from "./component/pos/ExchangeRateContext";
import ExchangeRatePage from "./page/ExchangeRatePage/ExchangeRatePage";
import BranchPage from "./page/branch/BranchPage";
import ExpensePage from "./page/expense/ExpensePage";
import BusinessPage from "./page/business/BusinessPage";
// import SmartProductEntry from "./page/product/ProductPage";
// import ChatPage from "./component/chat/ChatPage";
import RawMaterialPage from "./page/raw_material/RawMaterialPage";
import PurchasePage from "./page/purchase/PurchasePage";
import StockPage from "./page/stock/StockPage";
import MyPlanPage from "./page/plans/MyPlanPage";
import PaymentResultPage from "./page/plans/PaymentResultPage";
import TablePage from "./page/table/TablePage";
import SettingsPage from "./page/settings/SettingsPage";
import { getProfile } from "./store/profile.store";

const RootRedirect = () => {
  const profile = getProfile();
  // Safe check for admin session using multiple common ID properties
  const isAdmin = profile && (profile.id || profile.user_id) && profile.role_code !== "guest";

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/customer" replace />;
};

function App() {
  const MainLayoutWrapper = () => (
    <MainLayoutAuth>
      <Outlet />
    </MainLayoutAuth>
  );
  return (
    <ExchangeRateProvider>
      <BrowserRouter basename="/">
        <Routes >
          <Route path="/customer" element={<CoffeeMenuApp />} />
          <Route path="/scan" element={<ScanPage />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/invoices" element={<PosPage />} />
            <Route path="/table" element={<TablePage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/shop_managment" element={<BranchPage />} />
            <Route path="/expense" element={<ExpensePage />} />
            {/* <Route path="/total_due" element={<SmartProductEntry />} /> */}

            <Route path="/user" element={<UserPage />} />
            <Route path="/product" element={<ProductPage_single />} />
            <Route path="/role" element={<RolePage />} />
            <Route path="/permission" element={<PermissionPage />} />
            <Route path="/plans" element={<PlanPage />} />
            <Route path="/business" element={<BusinessPage />} />
            <Route path="/my-plan" element={<MyPlanPage />} />
            <Route path="/payment/result" element={<PaymentResultPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/supplier" element={<SupplierPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/report_Sale_Summary" element={<ReportSale_Summary />} />
            <Route path="/report_Expense_Summary" element={<ReportExpense_Summary />} />
            <Route path="/report_Customer" element={<ReportCustomer_Summary />} />
            <Route path="/purchase_Summary" element={<ReportPurchase_Summary />} />
            <Route path="/Top_Sale" element={<Top_Sales />} />
            <Route path="/raw_material" element={<RawMaterialPage />} />
            <Route path="/purchase" element={<PurchasePage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="*" element={<Navigate to="/customer" replace />} />
          </Route>

          <Route path="/login" element={<LogingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>


    </ExchangeRateProvider>

  );
}

export default App;


