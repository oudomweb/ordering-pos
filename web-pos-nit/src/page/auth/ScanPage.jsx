
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { request } from "../../util/helper";
import { setAcccessToken, setProfile } from "../../store/profile.store";
import { Spin, message } from "antd";

const ScanPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        handleScan();
    }, []);

    const handleScan = async () => {
        const biz = searchParams.get("biz");
        const branch = searchParams.get("branch");
        const table = searchParams.get("table");

        if (!biz || !branch) {
            message.error("Invalid QR Code!");
            navigate("/");
            return;
        }

        try {
            // Get guest token
            const res = await request(`auth/guest-access?biz=${biz}&branch=${branch}&table=${table || ""}`, "get");
            if (res && res.access_token) {
                setAcccessToken(res.access_token);
                setProfile(res.profile);
                if (res.permissions) {
                    localStorage.setItem("permission", JSON.stringify(res.permissions));
                }
                // Ensure customer app sees this as a valid guest entry
                localStorage.setItem("is_guest", "true");
                // Redirect to the customer menu app
                navigate("/customer");
            } else {
                message.error(res?.message || "Failed to access shop menu.");
                navigate("/");
            }
        } catch (error) {
            console.error("Scan Error:", error);
            message.error("Connection error. Please try again.");
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "20px" }}>
            <Spin size="large" />
            <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e4a2d" }}>
                Welcome to Green Grounds
            </div>
            <div style={{ color: "#666" }}>Preparing your menu...</div>
        </div>
    );
};

export default ScanPage;
