import React, { useState } from 'react';
import { Modal, Button, message, Spin, Image } from 'antd';
import QRCode from 'react-qr-code';
import { QrcodeOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Config } from '../util/config';

const CRC16 = (data) => {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const generateKHQR = (merchantId, name, amount, currency = "USD") => {
  const f = (id, val) => id + val.length.toString().padStart(2, '0') + val;

  // Merchant ID format (ID 29)
  const merchantInfo = f("00", merchantId);

  let payload =
    f("00", "01") + // Payload Format Indicator
    f("01", "12") + // Point of Initiation Method (12 = dynamic)
    f("29", merchantInfo) + // Merchant Account Information
    f("52", "5999") + // Merchant Category Code
    f("53", currency === "USD" ? "840" : "116") + // Currency (840=USD, 116=KHR)
    f("54", amount.toFixed(2)) + // Amount
    f("58", "KH") + // Country Code
    f("59", name.substring(0, 25)) + // Merchant Name
    f("60", "PHNOM PENH"); // City

  payload += "6304"; // CRC ID and length
  return payload + CRC16(payload);
};

const QRPaymentModal = ({ visible, onClose, paymentLink, orderNo, total, branchInfo }) => {
  const [copying, setCopying] = useState(false);

  const staticQR = branchInfo?.khqr_image;
  const merchantId = branchInfo?.payment_merchant_id || "pong_chiva@bkrt";
  const receiverName = branchInfo?.payment_receiver_name || branchInfo?.name || "POS COFFEE";
  const paymentProvider = branchInfo?.payment_provider || "KHQR";
  const apiUrl = branchInfo?.payment_api_url;

  let dynamicKHQR = null;
  if (merchantId && total > 0) {
    // Standard KHQR generation - works with most Cambodian banks
    dynamicKHQR = generateKHQR(merchantId, receiverName, total);
  }

  const handleCopyLink = async () => {
    try {
      setCopying(true);
      const textToCopy = paymentLink || dynamicKHQR || "";
      await navigator.clipboard.writeText(textToCopy);
      message.success('Payment content copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <QrcodeOutlined style={{ fontSize: '24px', marginRight: '8px', color: '#1e4a2d' }} />
          <span style={{ fontWeight: 600 }}>Payment QR Code</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        (paymentLink || dynamicKHQR) && (
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyLink} loading={copying}>
            Copy {dynamicKHQR ? "QR Data" : "Link"}
          </Button>
        ),
        <Button key="close" type="primary" onClick={onClose} style={{ background: '#1e4a2d' }}>
          Done
        </Button>
      ]}
      width={400}
      centered
    >
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        {dynamicKHQR ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#fff',
              padding: '15px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'inline-block',
              marginBottom: 16
            }}>
              <QRCode
                value={dynamicKHQR}
                size={240}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1e4a2d' }}>${total.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Order: {orderNo}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{receiverName}</div>
            </div>
            <div style={{
              background: '#f6ffed',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #b7eb8f',
              fontSize: '12px',
              color: '#52c41a'
            }}>
              <CheckCircleOutlined /> Dynamic QR Generated for this order
            </div>
          </div>
        ) : staticQR ? (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={Config.getFullImagePath(staticQR)}
              style={{ width: '100%', borderRadius: 8, border: '1px solid #eee' }}
              placeholder={<Spin />}
            />
            <div style={{ marginTop: 16, fontWeight: 700, color: '#1e4a2d' }}>
              Scan to Pay (${total.toFixed(2)})
            </div>
          </div>
        ) : paymentLink ? (
          <>
            <div style={{
              background: '#f5f5f5',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <QRCode
                value={paymentLink}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "200px" }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p><strong>Order:</strong> {orderNo}</p>
              <p><strong>Amount:</strong> ${total.toFixed(2)}</p>
            </div>

            <div style={{
              background: '#e6f7ff',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#1890ff'
            }}>
              Scan QR code or click "Copy Link" to complete payment
            </div>
          </>
        ) : (
          <div style={{ padding: '40px' }}>
            <Spin size="large" tip="Generating..." />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QRPaymentModal;