import React, { useState } from "react";
import { Typography, InputNumber, Button, Tag, Avatar, Divider, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, CoffeeOutlined, HeartOutlined, HeartFilled } from "@ant-design/icons";
import { Flame, Snowflake, Minus, Plus, Coffee, ShoppingCart, Star } from "lucide-react";
import { Config } from "../../util/config";
import { PriceDisplay } from "./ExchangeRateContext";
const { Text } = Typography;

function BillItem({
  id,
  name,
  description,
  cart_qty,
  unit_price,
  actual_price,
  price,
  image,
  mood,
  size,
  sugar,
  ice,
  brand,
  category,
  barcode,
  qty,
  handleQuantityChange,
  handlePriceChange,
  handleActualPriceChange,
  handleRemoveItem,
  onToggleFavorite,
  isFavorite = false,
  ...otherProps
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tempQty, setTempQty] = useState(cart_qty);
  const [tempPrice, setTempPrice] = useState(unit_price);
  const [showDetails, setShowDetails] = useState(false);

  const fullImageUrl = image ? Config.getFullImagePath(image) : null;

  // Calculate prices safely with fallback values (NO DISCOUNT)
  const safeUnitPrice = Number(unit_price) || Number(price) || 0;
  const safeActualPrice = Number(actual_price) || safeUnitPrice || 0;
  const safeCartQty = Number(cart_qty) || 1;
  const safeStockQty = Number(qty) || 0;

  // Calculate item total (NO DISCOUNT)
  const itemTotal = safeCartQty * safeUnitPrice;

  const formatPrice = (price) => {
    return `$${Number(price).toFixed(2)}`;
  };

  const handleQuantityUpdate = (newQty) => {
    if (newQty > 0 && newQty <= safeStockQty && handleQuantityChange) {
      handleQuantityChange(newQty);
      setTempQty(newQty);
    }
  };

  const handlePriceUpdate = (newPrice) => {
    if (newPrice >= 0 && handlePriceChange) {
      handlePriceChange(newPrice);
      setTempPrice(newPrice);
    }
  };

  const handleSaveEdit = () => {
    if (handleQuantityChange) handleQuantityChange(tempQty);
    if (handlePriceChange) handlePriceChange(tempPrice);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempQty(cart_qty);
    setTempPrice(unit_price);
    setIsEditing(false);
  };

  const getStockStatus = () => {
    if (safeStockQty <= 0) return { color: '#ef4444', text: 'Out of Stock', bgColor: '#fef2f2' };
    if (safeStockQty <= 5) return { color: '#f59e0b', text: 'Low Stock', bgColor: '#fffbeb' };
    return { color: '#10b981', text: 'In Stock', bgColor: '#f0fdf4' };
  };

  const stockStatus = getStockStatus();

  // Helper function to safely convert values to string
  const safeStringify = (value) => {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.name) return value.name;
    if (typeof value === 'object' && value.label) return value.label;
    return String(value);
  };

  // Simplified display functions with safe string conversion
  const getDisplayValue = (value, type, emoji) => {
    if (value === null || value === undefined || value === '') return null;

    const stringValue = safeStringify(value);

    switch (type) {
      case 'mood': {
        const lowerValue = stringValue.toLowerCase();
        if (lowerValue === 'hot') return `${emoji} HOT`;
        if (lowerValue === 'cold' || lowerValue === 'iced') return `${emoji} COLD`;
        return `${emoji} ${stringValue.toUpperCase()}`;
      }

      case 'size': {
        return `${emoji} ${stringValue.toUpperCase()}`;
      }

      case 'sugar':
      case 'ice': {
        const cleanValue = stringValue.replace('%', '');
        return `${emoji} ${type.toUpperCase()} ${cleanValue}%`;
      }

      default:
        return `${emoji} ${stringValue}`;
    }
  };

  // Consistent styling function with safe string conversion
  const getTagStyle = (value, type) => {
    if (value === null || value === undefined) return null;

    const stringValue = safeStringify(value);

    switch (type) {
      case 'mood':
        const lowerMood = stringValue.toLowerCase();
        if (lowerMood === 'hot') {
          return {
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fca5a5'
          };
        } else if (lowerMood === 'cold' || lowerMood === 'iced') {
          return {
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #93c5fd'
          };
        } else {
          return {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24'
          };
        }

      case 'size':
        const sizeUpper = stringValue.toUpperCase();
        if (sizeUpper === 'S' || sizeUpper === 'SMALL') {
          return {
            background: '#dbeafe',
            color: '#2563eb',
            border: '1px solid #60a5fa'
          };
        } else if (sizeUpper === 'L' || sizeUpper === 'LARGE') {
          return {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24'
          };
        } else {
          return {
            background: '#d1fae5',
            color: '#059669',
            border: '1px solid #34d399'
          };
        }

      case 'sugar':
        const sugarLevel = parseInt(stringValue.replace('%', '')) || 0;
        if (sugarLevel <= 30) {
          return {
            background: '#d1fae5',
            color: '#059669',
            border: '1px solid #34d399'
          };
        } else if (sugarLevel >= 70) {
          return {
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fca5a5'
          };
        } else {
          return {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24'
          };
        }

      case 'ice':
        const iceLevel = parseInt(stringValue.replace('%', '')) || 0;
        if (iceLevel <= 30) {
          return {
            background: '#cffafe',
            color: '#0891b2',
            border: '1px solid #22d3ee'
          };
        } else if (iceLevel >= 70) {
          return {
            background: '#dbeafe',
            color: '#2563eb',
            border: '1px solid #60a5fa'
          };
        } else {
          return {
            background: '#ede9fe',
            color: '#7c3aed',
            border: '1px solid #a855f7'
          };
        }

      default:
        return {
          background: '#f3f4f6',
          color: '#6b7280',
          border: '1px solid #d1d5db'
        };
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        boxShadow: isHovered
          ? '0 20px 40px rgba(0, 0, 0, 0.15)'
          : '0 10px 30px rgba(0, 0, 0, 0.08)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      }} />

      {/* Main Content */}
      <div style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
        {/* Enhanced Product Image */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 16,
          overflow: 'hidden',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          marginTop: 15
        }}>
          {fullImageUrl ? (
            <img
              src={fullImageUrl}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: fullImageUrl ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <CoffeeOutlined style={{ fontSize: 32 }} />
          </div>

          {/* Stock status indicator */}
          <div style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: stockStatus.color,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }} />
        </div>

        {/* Enhanced Product Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Product Name, Brand and Category */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{
                fontSize: 18,
                color: '#1a202c',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {name || 'Product Name'}
              </Text>
              {onToggleFavorite && (
                <Button
                  type="text"
                  size="small"
                  icon={isFavorite ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
                  onClick={() => onToggleFavorite(id)}
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              )}
            </div>

            {description && (
              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                display: 'block',
                marginBottom: 8,
                lineHeight: '1.4'
              }}>
                {description.length > 50 ? `${description.substring(0, 50)}...` : description}
              </Text>
            )}

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {brand && (
                <Tag
                  color="#f59e0b"
                  style={{
                    fontSize: 10,
                    margin: 0,
                    borderRadius: 10,
                    fontWeight: '600',
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fbbf24'
                  }}
                >
                  {brand}
                </Tag>
              )}
              {category && (
                <Tag
                  color="#8b5cf6"
                  style={{
                    fontSize: 10,
                    margin: 0,
                    borderRadius: 10,
                    fontWeight: '600',
                    background: '#ede9fe',
                    color: '#6b21a8',
                    border: '1px solid #a855f7'
                  }}
                >
                  {category}
                </Tag>
              )}
              {barcode && (
                <Tag
                  style={{
                    fontSize: 9,
                    margin: 0,
                    borderRadius: 6,
                    background: '#f3f4f6',
                    color: '#4b5563',
                    border: '1px solid #d1d5db'
                  }}
                >
                  #{barcode}
                </Tag>
              )}
            </div>
          </div>

          {/* Current Selection Display with safe string handling */}
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#374151'
          }}>
            <div style={{
              fontWeight: '700',
              marginBottom: '8px',
              color: '#1f2937',
              letterSpacing: '0.5px'
            }}>
              CURRENT SELECTION:
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}>
              {/* Only show values that actually exist and are not empty/default */}
              {mood && safeStringify(mood) && (
                <span style={{
                  ...getTagStyle(mood, 'mood'),
                  padding: '4px 8px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '10px'
                }}>
                  {getDisplayValue(mood, 'mood', safeStringify(mood).toLowerCase() === 'hot' ? '🔥' : safeStringify(mood).toLowerCase() === 'cold' ? '❄️' : '☕')}
                </span>
              )}

              {size && safeStringify(size) && (
                <span style={{
                  ...getTagStyle(size, 'size'),
                  padding: '4px 8px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '10px'
                }}>
                  {getDisplayValue(size, 'size', '📏')}
                </span>
              )}

              {(sugar !== null && sugar !== undefined && sugar !== '' && safeStringify(sugar)) && (
                <span style={{
                  ...getTagStyle(sugar, 'sugar'),
                  padding: '4px 8px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '10px'
                }}>
                  {getDisplayValue(sugar, 'sugar', '🍯')}
                </span>
              )}

              {(ice !== null && ice !== undefined && ice !== '' && safeStringify(ice)) && (
                <span style={{
                  ...getTagStyle(ice, 'ice'),
                  padding: '4px 8px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '10px'
                }}>
                  {getDisplayValue(ice, 'ice', '🧊')}
                </span>
              )}
            </div>

            {/* Stock Quantity Tag */}
            {safeStockQty > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                borderRadius: 12,
                background: stockStatus.bgColor,
                color: stockStatus.color,
                border: `1px solid ${stockStatus.color}`,
                padding: '4px 8px',
                fontWeight: '600',
                marginTop: '8px',
                width: 'fit-content'
              }}>
                <span>📦</span>
                <span>{safeStockQty} left</span>
              </div>
            )}
          </div>

          {/* Enhanced Quantity and Price Controls */}
          {!isEditing ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {/* Enhanced Quantity Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: 12,
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
              }}>
                <Tooltip title="Decrease quantity">
                  <Button
                    type="text"
                    size="small"
                    icon={<Minus size={14} />}
                    onClick={() => handleQuantityUpdate(safeCartQty - 1)}
                    disabled={safeCartQty <= 1}
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: safeCartQty <= 1 ? '#f3f4f6' : '#ffffff',
                      border: '1px solid #d1d5db',
                      color: safeCartQty <= 1 ? '#9ca3af' : '#374151'
                    }}
                  />
                </Tooltip>
                <Text strong style={{
                  minWidth: 24,
                  textAlign: 'center',
                  fontSize: 16,
                  color: '#1f2937'
                }}>
                  {safeCartQty}
                </Text>
                <Tooltip title="Increase quantity">
                  <Button
                    type="text"
                    size="small"
                    icon={<Plus size={14} />}
                    onClick={() => handleQuantityUpdate(safeCartQty + 1)}
                    disabled={safeCartQty >= safeStockQty}
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: safeCartQty >= safeStockQty ? '#f3f4f6' : '#ffffff',
                      border: '1px solid #d1d5db',
                      color: safeCartQty >= safeStockQty ? '#9ca3af' : '#374151'
                    }}
                  />
                </Tooltip>
              </div>

              {/* Enhanced Price Display (NO DISCOUNT) */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280'
                  }}>
                    {formatPrice(safeUnitPrice)} × {safeCartQty}
                  </Text>
                </div>

                <PriceDisplay
                  usdAmount={itemTotal}
                  size="medium"
                  primaryCurrency="USD"
                  orientation="horizontal"
                />

              </div>
            </div>
          ) : (
            // Enhanced Edit Mode
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              padding: 16,
              borderRadius: 12,
              border: '2px solid #0ea5e9',
              marginTop: 8
            }}>
              <div style={{
                display: 'flex',
                gap: 12,
                marginBottom: 12
              }}>
                <div style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#0369a1',
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: 4
                  }}>
                    Quantity
                  </Text>
                  <InputNumber
                    size="small"
                    min={1}
                    max={safeStockQty}
                    value={tempQty}
                    onChange={setTempQty}
                    style={{
                      width: '100%',
                      borderRadius: 8
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#0369a1',
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: 4
                  }}>
                    Unit Price
                  </Text>
                  <InputNumber
                    size="small"
                    min={0}
                    step={0.1}
                    value={tempPrice}
                    onChange={setTempPrice}
                    style={{
                      width: '100%',
                      borderRadius: 8
                    }}
                    formatter={value => `$ ${value}`}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={handleSaveEdit}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  💾 Save
                </Button>
                <Button
                  size="small"
                  onClick={handleCancelEdit}
                  style={{
                    borderRadius: 8,
                    borderColor: '#d1d5db'
                  }}
                >
                  ❌ Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        gap: 6
      }}>
        <Tooltip title="Edit item">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setIsEditing(!isEditing)}
            style={{
              width: 32,
              height: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isEditing ? '#dbeafe' : 'rgba(255, 255, 255, 0.8)',
              color: isEditing ? '#1d4ed8' : '#6b7280',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
          />
        </Tooltip>
        {handleRemoveItem && (
          <Tooltip title="Remove item">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveItem(id)}
              style={{
                width: 32,
                height: 32,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.8)',
                color: '#ef4444',
                borderRadius: '50%',
                border: '1px solid #fecaca',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            />
          </Tooltip>
        )}
      </div>

      {/* Stock Warning Badge */}
      {safeStockQty <= 5 && safeStockQty > 0 && (
        <div style={{
          position: 'absolute',
          bottom: -8,
          right: 16,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          fontSize: 9,
          padding: '3px 8px',
          borderRadius: 8,
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
        }}>
          ⚠️ Low Stock
        </div>
      )}
    </div>
  );
}

export default BillItem;