import React from "react";
import "./fonts.css";
import { Config } from "../../util/config";
import dayjs from "dayjs";

const PrintShiftReport = React.forwardRef((props, ref) => {
    const { 
        summary = {}, 
        profile = {}, 
        filter = {}, 
        staff_name = "N/A",
        actual_cash = 0,
        actual_cash_khr = 0,
        opening_cash = 0,
        opening_cash_khr = 0,
        exchange_rate = 4000,
        total_expense_usd = 0,
        remark = ""
    } = props;

    const formatUSD = (value) => {
        const number = parseFloat(value) || 0;
        return number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatKHR = (value) => {
        const number = parseFloat(value) || 0;
        return number.toLocaleString('en-US', {
            maximumFractionDigits: 0
        });
    };

    const opening_total_usd = Number(opening_cash) + (Number(opening_cash_khr) / exchange_rate);
    const actual_total_usd = Number(actual_cash) + (Number(actual_cash_khr) / exchange_rate);
    const expected_total_usd = opening_total_usd + Number(summary.total_cash || 0) - (props.summary?.total_cash_expense || 0);
    const diff = actual_total_usd - expected_total_usd;

    return (
        <div ref={ref} style={{
            width: '80mm',
            maxWidth: '300px',
            margin: '0 auto',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            color: '#000',
            backgroundColor: '#fff'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase' }}>
                    SHIFT REPORT
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {profile?.business_name || "COFFEE SHOP"}
                </div>
                <div style={{ fontSize: '11px' }}>
                    {profile?.branch_name || "Main Branch"}
                </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Info */}
            <div style={{ marginBottom: '10px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Staff:</span>
                    <span style={{ fontWeight: 'bold' }}>{staff_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date:</span>
                    <span>{dayjs(filter.from_date).format("DD MMM YYYY")}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Print Time:</span>
                    <span>{dayjs().format("HH:mm:ss")}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Exchange Rate:</span>
                    <span>1$ = {exchange_rate}៛</span>
                </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Statistics */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>SALES SUMMARY:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Orders:</span>
                    <span>{summary.total_order || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Qty:</span>
                    <span>{summary.total_qty || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>GROSS SALES:</span>
                    <span>${formatUSD(summary.total_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                    <span>TOTAL EXPENSE:</span>
                    <span>-${formatUSD(summary.total_expense)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '5px', fontSize: '14px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                    <span>NET PROFIT:</span>
                    <span>${formatUSD(Number(summary.total_amount) - Number(summary.total_expense))}</span>
                </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Payment Methods */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>PAYMENT METHODS:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CASH ($):</span>
                    <span>${formatUSD(summary.total_cash)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ABA (QR):</span>
                    <span>${formatUSD(summary.total_aba)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>WING/OTHER:</span>
                    <span>${formatUSD(Number(summary.total_wing) + Number(summary.total_other || 0))}</span>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #000', margin: '10px 0', paddingTop: '10px' }}></div>

            {/* Reconciliation */}
            <div style={{ marginBottom: '15px', background: '#f9f9f9', padding: '10px', border: '1px solid #eee' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>RECONCILIATION</div>
                
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>Opening Cash:</span>
                        <span>${formatUSD(opening_cash)} | {formatKHR(opening_cash_khr)}៛</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>Expected Sales (Cash):</span>
                         <span>${formatUSD(summary.total_cash)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ef4444' }}>
                        <span>Expense (Cash):</span>
                         <span>-${formatUSD(summary.total_cash_expense)}</span>
                    </div>
                </div>

                <div style={{ borderTop: '1px dashed #ccc', margin: '5px 0' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>Expected Total:</span>
                    <span style={{ fontWeight: 'bold' }}>${formatUSD(expected_total_usd)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span>Actual Cash:</span>
                    <span style={{ fontWeight: 'bold' }}>${formatUSD(actual_cash)} | {formatKHR(actual_cash_khr)}៛</span>
                </div>

                <div style={{ borderTop: '1px solid #aaa', margin: '5px 0' }}></div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: Math.abs(diff) < 0.01 ? '#1e4a2d' : diff > 0 ? '#2563eb' : '#ef4444'
                }}>
                    <span>DIFFERENCE:</span>
                    <span>${formatUSD(diff)}</span>
                </div>

                {remark && (
                    <div style={{ marginTop: '10px', fontSize: '10px', fontStyle: 'italic', borderTop: '1px dashed #eee', paddingTop: '5px' }}>
                        Note: {remark}
                    </div>
                )}
            </div>

            {/* Top Products */}
            {summary.top_products && summary.top_products.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '11px', borderBottom: '1px solid #eee' }}>TOP SELLING ITEMS:</div>
                    {summary.top_products.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span>{item.name}</span>
                            <span>{item.total_qty} qty</span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #000', width: '60%', margin: '0 auto' }}></div>
                <div style={{ fontSize: '10px', marginTop: '5px' }}>Staff Signature</div>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #000', width: '60%', margin: '0 auto' }}></div>
                <div style={{ fontSize: '10px', marginTop: '5px' }}>Manager Signature</div>
            </div>

            <div style={{ height: '30px' }}></div>
        </div>
    );
});

export default PrintShiftReport;
