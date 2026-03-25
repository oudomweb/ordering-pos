import React, { useState } from 'react';
import { Card, Button, Badge, Tag, Modal, Row, Col, InputNumber, Select } from 'antd';
import { Heart, Plus, Flame, Snowflake, Coffee, ShoppingCart, Percent } from 'lucide-react';
import { Config } from "../../util/config";
import { CoffeeOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { request } from '../../util/helper';
import { PriceDisplay } from "../pos/ExchangeRateContext";

const { Option } = Select;

const ProductItem = ({
  id,
  name,
  description,
  price,
  unit_price,
  actual_price,
  discount = 0,
  image,
  qty,
  barcode,
  category,
  category_id,
  handleAdd,
  ...otherProps
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState('hot');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedSugar, setSelectedSugar] = useState(50);
  const [selectedIce, setSelectedIce] = useState(50);
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [sizes, setSizes] = useState([]);

  const displayPrice = Number(actual_price || unit_price || price || 0);
  const safeDiscount = Number(discount) || 0;
  const fullImageUrl = image ? Config.getFullImagePath(image) : null;

  // Check if this is a coffee product (category_id 51)
  const isCoffeeProduct = category_id === 51 || category_id === "51";
  
  // Check if this is a rice product (category_id 55) - no customization needed
  const isRiceProduct = category_id === 55 || category_id === "55";

  useEffect(() => {
    if (isCoffeeProduct) {
      const fetchSizes = async () => {
        try {
          const res = await request(`sizes?product_id=${id}`, 'get');
          if (res && res.list) {
            setSizes(res.list);
          }
        } catch (error) {
          console.error("Failed to fetch product sizes:", error);
        }
      };
      fetchSizes();
    }
  }, [id, isCoffeeProduct]);

  const getCategoryEmoji = () => {
    switch(category_id) {
      case 51: case "51": return "☕"; // Coffee
      case 52: case "52": return "🧃"; // Juice
      case 53: case "53": return "🥛"; // Milk Based
      case 54: case "54": return "🍪"; // Snack
      case 55: case "55": return "🍚"; // Rice
      case 56: case "56": return "🍰"; // Dessert
      default: return "🍽️";
    }
  };

  const getDiscountedPrice = (originalPrice) => {
    if (safeDiscount > 0) {
      return originalPrice - (originalPrice * safeDiscount / 100);
    }
    return originalPrice;
  };

  const discountedPrice = getDiscountedPrice(displayPrice);

  const getFinalPrice = () => {
    if (isCoffeeProduct && sizes.length > 0) {
      const sizeObj = sizes.find((s) => s.label === selectedSize);
      const sizePrice = sizeObj ? parseFloat(sizeObj.price) : 0;
      const basePrice = getDiscountedPrice(displayPrice);
      return (basePrice + sizePrice).toFixed(2);
    }
    return getDiscountedPrice(displayPrice).toFixed(2);
  };

  const sugarOptions = [
    { value: 0, label: '0%', icon: '🚫' },
    { value: 30, label: '30%', icon: '🍯' },
    { value: 50, label: '50%', icon: '🍯' },
    { value: 70, label: '70%', icon: '🍯' }
  ];

  const iceOptions = [
    { value: 30, label: '30%', icon: '🧊' },
    { value: 50, label: '50%', icon: '🧊' },
    { value: 70, label: '70%', icon: '🧊' }
  ];

  const getStockStatus = () => {
    if (isRiceProduct) return { color: 'blue', text: 'Available' }; // Rice products don't track stock
    if (qty <= 0) return { color: 'red', text: 'Out of Stock' };
    if (qty <= 5) return { color: 'orange', text: 'Low Stock' };
    return { color: 'green', text: 'In Stock' };
  };

  const stockStatus = getStockStatus();

  const handleCustomizedAdd = () => {
    const finalPrice = parseFloat(getFinalPrice());

    for (let i = 0; i < customQuantity; i++) {
      let productData = {
        id,
        name,
        description,
        price: finalPrice,
        unit_price: finalPrice,
        actual_price: displayPrice,
        discount: safeDiscount,
        image,
        qty,
        barcode,
        category,
        category_id,
        cart_qty: 1,
        customization_id: `${id}_${Date.now()}_${i}`,
        ...otherProps
      };

      let customizationDetails = {};

      // Add customization based on product type
      if (isCoffeeProduct) {
        productData = {
          ...productData,
          mood: selectedMood,
          size: selectedSize,
          sugar: selectedSugar,
          ice: selectedIce,
        };
        
        customizationDetails = {
          size: selectedSize,
          temperature: selectedMood === 'hot' ? 'Hot' : 'Cold',
          sugarLevel: `${selectedSugar}%`,
          iceLevel: `${selectedIce}%`,
        };
      }

      handleAdd(productData, customizationDetails);
    }
    setCustomQuantity(1);
  };

  // Compact card container
  const cardContainerStyle = {
    width: '100%',
    maxWidth: '280px',
    margin: '0 auto',
    background: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: isHovered
      ? '0 15px 30px -8px rgba(0, 0, 0, 0.2)'
      : '0 6px 20px -3px rgba(0, 0, 0, 0.08)',
    transform: isHovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: (!isRiceProduct && qty <= 0) ? '2px solid #ef4444' : '1px solid rgba(229, 231, 235, 0.3)',
    opacity: (!isRiceProduct && qty <= 0) ? 0.6 : 1,
    position: 'relative',
  };

  // Compact image section
  const imageContainerStyle = {
    height: '140px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const imageStyle = {
    width: '90px',
    height: '90px',
    borderRadius: '14px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  // Compact floating elements
  const likeButtonStyle = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: isLiked
      ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
      : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    border: 'none',
    color: isLiked ? '#ffffff' : '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  };

  const discountBadgeStyle = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '9px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
  };

  const stockBadgeStyle = {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '9px',
    fontWeight: '600',
    background: (!isRiceProduct && qty <= 0)
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  };

  // Category badge
  const categoryBadgeStyle = {
    position: 'absolute',
    top: '10px',
    right: '50px',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '9px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
  };

  // Compact content section
  const contentStyle = {
    padding: '16px',
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '6px',
    lineHeight: '1.3',
  };

  const priceContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  };

  const priceStyle = {
    fontSize: '18px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const originalPriceStyle = {
    fontSize: '13px',
    color: '#9ca3af',
    textDecoration: 'line-through',
    marginRight: '6px',
  };

  // Compact selection display (only for coffee)
  const selectionDisplayStyle = {
    marginBottom: '12px',
    padding: '10px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '12px',
    border: '1px solid rgba(226, 232, 240, 0.8)',
  };

  const selectionTitleStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: '#374151',
    marginBottom: '6px',
    letterSpacing: '0.3px',
  };

  const selectionTagsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
  };

  const getSelectionTagStyle = (type, value) => {
    const baseStyle = {
      padding: '3px 8px',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '9px',
      border: '1px solid',
    };

    if (type === 'mood') {
      return {
        ...baseStyle,
        background: value === 'hot' ? '#fef2f2' : '#eff6ff',
        color: value === 'hot' ? '#dc2626' : '#2563eb',
        borderColor: value === 'hot' ? '#fca5a5' : '#93c5fd',
      };
    }

    if (type === 'size') {
      const colors = {
        S: { bg: '#dbeafe', color: '#2563eb', border: '#60a5fa' },
        M: { bg: '#d1fae5', color: '#059669', border: '#34d399' },
        L: { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' },
      };
      const colorSet = colors[value] || colors.M;
      return {
        ...baseStyle,
        background: colorSet.bg,
        color: colorSet.color,
        borderColor: colorSet.border,
      };
    }

    if (type === 'sugar' || type === 'ice') {
      const getColorByLevel = (level) => {
        if (level <= 30) return { bg: '#d1fae5', color: '#059669', border: '#34d399' };
        if (level >= 70) return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
        return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' };
      };
      const colorSet = getColorByLevel(value);
      return {
        ...baseStyle,
        background: colorSet.bg,
        color: colorSet.color,
        borderColor: colorSet.border,
      };
    }

    return baseStyle;
  };

  // Compact customization section
  const customSectionStyle = {
    marginBottom: '16px',
  };

  const sectionLabelStyle = {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '6px',
    fontWeight: '600',
    letterSpacing: '0.2px',
  };

  const optionGroupStyle = {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  };

  const optionButtonStyle = (isActive, colorTheme = 'default') => {
    const themes = {
      hot: { bg: '#ef4444', border: '#ef4444' },
      cold: { bg: '#06b6d4', border: '#06b6d4' },
      size: { bg: '#8b5cf6', border: '#8b5cf6' },
      default: { bg: '#10b981', border: '#10b981' },
    };

    const theme = themes[colorTheme] || themes.default;

    return {
      flex: '1',
      minWidth: '0',
      padding: '6px 8px',
      border: isActive ? `2px solid ${theme.border}` : '2px solid #e5e7eb',
      background: isActive ? theme.bg : 'white',
      color: isActive ? 'white' : '#6b7280',
      borderRadius: '8px',
      fontSize: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center',
    };
  };

  const twoColumnStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
  };

  const columnStyle = {
    flex: 1,
  };

  // Custom dropdown styles
  const dropdownStyle = {
    width: '100%',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    '&:hover': {
      borderColor: '#10b981',
    },
    '&:focus': {
      borderColor: '#10b981',
      boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.1)',
    }
  };

  // Add to cart button
  const addToCartButtonStyle = {
    width: '100%',
    height: '52px',
    background: (!isRiceProduct && qty <= 0)
      ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: (!isRiceProduct && qty <= 0) ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
    boxShadow: (!isRiceProduct && qty <= 0)
      ? 'none'
      : '0 10px 25px rgba(16, 185, 129, 0.3)',
  };

  return (
    <>
      <div
        style={cardContainerStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div style={imageContainerStyle}>
          <div style={imageStyle}>
            {fullImageUrl ? (
              <img
                src={fullImageUrl}
                alt={name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '20px'
                }}
              />
            ) : (
              <div style={{ fontSize: '32px' }}>
                {getCategoryEmoji()}
              </div>
            )}
          </div>

          {/* Floating Elements */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            style={likeButtonStyle}
          >
            {isLiked ? '♥' : '♡'}
          </button>

          {/* Category Badge */}
          <div style={categoryBadgeStyle}>
            {getCategoryEmoji()} {category || 'Product'}
          </div>

          {safeDiscount > 0 && (
            <div style={discountBadgeStyle}>
              <Percent size={12} />
              {safeDiscount}% OFF
            </div>
          )}

          <div style={stockBadgeStyle}>
            {isRiceProduct ? 'Available' : `${qty} ${qty <= 0 ? 'Unavailable' : 'Available'}`}
          </div>
        </div>

        {/* Content Section */}
        <div style={contentStyle}>
          {/* Title */}
          <h3 style={titleStyle}>
            {name || 'Product Name'}
          </h3>

          {/* Price Section */}
          <div style={priceContainerStyle}>
            <div>
              {safeDiscount > 0 ? (
                <div>
                  <span style={originalPriceStyle}>
                    ${displayPrice.toFixed(2)}
                  </span>
                  <PriceDisplay usdAmount={getFinalPrice()} />
                </div>
              ) : (
                <PriceDisplay usdAmount={getFinalPrice()} />
              )}
            </div>
          </div>

          {/* Current Selection Display - Only for Coffee */}
          {isCoffeeProduct && (
            <div style={selectionDisplayStyle}>
              <div style={selectionTitleStyle}>
                CURRENT SELECTION:
              </div>
              <div style={selectionTagsStyle}>
                <span style={getSelectionTagStyle('mood', selectedMood)}>
                  {selectedMood === 'hot' ? '🔥 HOT' : '❄️ COLD'}
                </span>
                <span style={getSelectionTagStyle('size', selectedSize)}>
                  📏 SIZE {selectedSize}
                </span>
                <span style={getSelectionTagStyle('sugar', selectedSugar)}>
                  🍯 SUGAR {selectedSugar}%
                </span>
                <span style={getSelectionTagStyle('ice', selectedIce)}>
                  🧊 ICE {selectedIce}%
                </span>
              </div>
            </div>
          )}

          {/* Customization Options - Only for Coffee */}
          {isCoffeeProduct && (
            <div style={customSectionStyle}>
              {/* Temperature */}
              <div style={{ marginBottom: '16px' }}>
                <div style={sectionLabelStyle}>Temperature</div>
                <div style={optionGroupStyle}>
                  <button
                    onClick={() => setSelectedMood('hot')}
                    style={optionButtonStyle(selectedMood === 'hot', 'hot')}
                  >
                    🔥 Hot
                  </button>
                  <button
                    onClick={() => setSelectedMood('cold')}
                    style={optionButtonStyle(selectedMood === 'cold', 'cold')}
                  >
                    ❄️ Cold
                  </button>
                </div>
              </div>

              {/* Size Options */}
              {sizes.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={sectionLabelStyle}>Cup Size</div>
                  <div style={optionGroupStyle}>
                    {sizes.map((size) => (
                      <button
                        key={size.label}
                        onClick={() => setSelectedSize(size.label)}
                        style={optionButtonStyle(selectedSize === size.label, 'size')}
                      >
                        {size.label} {Number(size.price) > 0 ? `(+$${Number(size.price).toFixed(2)})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugar and Ice Levels - Now with Dropdowns */}
              <div style={twoColumnStyle}>
                <div style={columnStyle}>
                  <div style={sectionLabelStyle}>Sugar Level</div>
                  <Select
                    value={selectedSugar}
                    onChange={setSelectedSugar}
                    style={dropdownStyle}
                    size="small"
                    placeholder="Select sugar level"
                  >
                    {sugarOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width:50 }}>
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={columnStyle}>
                  <div style={sectionLabelStyle}>Ice Level</div>
                  <Select
                    value={selectedIce}
                    onChange={setSelectedIce}
                    style={dropdownStyle}
                    size="small"
                    placeholder="Select ice level"
                  >
                    {iceOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width:50 }}>
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Simple message for non-customizable products */}
          {!isCoffeeProduct && (
            <div style={{
              marginBottom: '16px',
              padding: '10px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              textAlign: 'center',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
            }}>
              {isRiceProduct ? '🍚 Ready to serve!' : '🍽️ No customization needed'}
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleCustomizedAdd}
            disabled={!isRiceProduct && qty <= 0}
            style={addToCartButtonStyle}
          >
            <ShoppingCart size={20} />
            Add To Cart
          </button>
        </div>
      </div>

      {/* Modal for detailed customization */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '20px' }}>{getCategoryEmoji()}</div>
            <span>Customize {name}</span>
            {safeDiscount > 0 && (
              <div style={{
                background: '#ef4444',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                marginLeft: '8px',
              }}>
                {safeDiscount}% OFF
              </div>
            )}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
        style={{ borderRadius: 16 }}
      >
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            {fullImageUrl ? (
              <img
                src={fullImageUrl}
                alt={name}
                style={{
                  width: '128px',
                  height: '128px',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  margin: '0 auto 16px',
                }}
              />
            ) : (
              <div style={{
                width: '128px',
                height: '128px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #fed7aa, #fdba74)',
                borderRadius: '16px',
                margin: '0 auto 16px',
                fontSize: '48px',
              }}>
                {getCategoryEmoji()}
              </div>
            )}

            <div>
              {safeDiscount > 0 ? (
                <div>
                  <div style={{
                    fontSize: '18px',
                    color: '#9ca3af',
                    textDecoration: 'line-through',
                  }}>
                    ${displayPrice.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#dc2626',
                  }}>
                    ${getFinalPrice()}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#dc2626',
                    fontWeight: '500',
                  }}>
                    You save ${(displayPrice - getFinalPrice()).toFixed(2)} ({safeDiscount}% off)
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#ea580c',
                }}>
                  ${getFinalPrice()}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductItem;