import React from "react";
import { Outlet } from "react-router-dom";
function MainLayoutAuth() {
  return (
    <div>
      <div>
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
export default MainLayoutAuth;