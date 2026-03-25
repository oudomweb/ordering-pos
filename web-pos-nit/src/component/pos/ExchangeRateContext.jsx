import React, { useState, useEffect, useContext } from 'react';
import { request } from '../../util/helper';
import { getAcccessToken } from '../../store/profile.store';

// Context for exchange rate management
const ExchangeRateContext = React.createContext();

// Provider component
export const ExchangeRateProvider = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState(4000); // Default fallback rate
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchExchangeRate = async () => {
    const token = getAcccessToken();
    if (!token || token === "null" || token === "undefined") {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await request('exchange_rate', 'get');

      if (response && response.live_rate) {
        setExchangeRate(response.live_rate);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Keep using fallback rate
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();

    // Refresh rate every 30 minutes
    const interval = setInterval(fetchExchangeRate, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ExchangeRateContext.Provider value={{
      exchangeRate,
      loading,
      lastUpdated,
      refreshRate: fetchExchangeRate
    }}>
      {children}
    </ExchangeRateContext.Provider>
  );
};

// Hook to use exchange rate
export const useExchangeRate = () => {
  const context = useContext(ExchangeRateContext);
  if (!context) {
    throw new Error('useExchangeRate must be used within ExchangeRateProvider');
  }
  return context;
};

// Price display component
export const PriceDisplay = ({
  usdAmount,
  showBothCurrencies = true,
  primaryCurrency = 'USD', // 'USD' or 'KHR'
  size = 'medium', // 'small', 'medium', 'large'
  orientation = 'horizontal', // 'horizontal' or 'vertical'
  className = '',
  style = {}
}) => {
  const { exchangeRate, loading } = useExchangeRate();

  const usdPrice = parseFloat(usdAmount) || 0;
  const khrPrice = usdPrice * exchangeRate;

  // Format numbers with proper separators
  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatKHR = (amount) => {
    return new Intl.NumberFormat('km-KH', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Size configurations
  const sizeConfig = {
    small: {
      primarySize: '14px',
      secondarySize: '12px',
      gap: '4px',
      separator: '2px'
    },
    medium: {
      primarySize: '18px',
      secondarySize: '14px',
      gap: '6px',
      separator: '4px'
    },
    large: {
      primarySize: '24px',
      secondarySize: '18px',
      gap: '8px',
      separator: '6px'
    }
  };

  const config = sizeConfig[size];

  // Base styles
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: config.gap,
    ...style
  };

  const primaryStyle = {
    fontSize: config.primarySize,
    fontWeight: '700',
    color: '#2c3e50'
  };

  const secondaryStyle = {
    fontSize: config.secondarySize,
    fontWeight: '500',
    color: '#6b7280'
  };

  const separatorStyle = {
    fontSize: config.secondarySize,
    color: '#9ca3af',
    margin: orientation === 'vertical' ? '0' : `0 ${config.separator}`
  };

  if (loading) {
    return (
      <div className={className} style={containerStyle}>
        <span style={primaryStyle}>
          {primaryCurrency === 'USD' ? formatUSD(usdPrice) : `${formatKHR(khrPrice)} ៛`}
        </span>
        {showBothCurrencies && (
          <>
            <span style={separatorStyle}>|</span>
            <span style={secondaryStyle}>Loading...</span>
          </>
        )}
      </div>
    );
  }

  if (!showBothCurrencies) {
    return (
      <div className={className} style={containerStyle}>
        <span style={primaryStyle}>
          {primaryCurrency === 'USD' ? formatUSD(usdPrice) : `${formatKHR(khrPrice)} ៛`}
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      {primaryCurrency === 'USD' ? (
        <>
          <span style={primaryStyle}>{formatUSD(usdPrice)}</span>
          <span style={separatorStyle}>|</span>
          <span style={secondaryStyle}>{formatKHR(khrPrice)} ៛</span>
        </>
      ) : (
        <>
          <span style={primaryStyle}>{formatKHR(khrPrice)} ៛</span>
          <span style={separatorStyle}>|</span>
          <span style={secondaryStyle}>{formatUSD(usdPrice)}</span>
        </>
      )}
    </div>
  );
};

// Exchange rate status component
export const ExchangeRateStatus = () => {
  const { exchangeRate, lastUpdated, loading, refreshRate } = useExchangeRate();

  const timeAgo = lastUpdated ?
    Math.floor((new Date() - lastUpdated) / (1000 * 60)) : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: '#6b7280',
      padding: '4px 8px',
      background: '#f9fafb',
      borderRadius: '6px',
      border: '1px solid #e5e7eb'
    }}>
      <span>1 USD = {exchangeRate.toLocaleString()} KHR</span>
      {!loading && lastUpdated && (
        <span>• Updated {timeAgo}m ago</span>
      )}
      <button
        onClick={refreshRate}
        disabled={loading}
        style={{
          background: 'none',
          border: 'none',
          color: '#3b82f6',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          padding: '2px 4px'
        }}
      >
        {loading ? '⟳' : '↻'}
      </button>
    </div>
  );
};