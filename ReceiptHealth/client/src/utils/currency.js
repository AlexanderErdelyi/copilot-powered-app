/**
 * Format currency based on currency code
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (USD, EUR, GBP, etc.)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'EUR') {
  if (amount === null || amount === undefined) {
    amount = 0;
  }

  const currencyFormats = {
    'USD': { symbol: '$', position: 'before', decimals: 2, separator: '.' },
    'EUR': { symbol: '€', position: 'after', decimals: 2, separator: ',' },
    'GBP': { symbol: '£', position: 'before', decimals: 2, separator: '.' },
    'CHF': { symbol: 'CHF', position: 'after', decimals: 2, separator: '.' },
    'JPY': { symbol: '¥', position: 'before', decimals: 0, separator: '.' },
    'CAD': { symbol: 'CA$', position: 'before', decimals: 2, separator: '.' },
    'AUD': { symbol: 'A$', position: 'before', decimals: 2, separator: '.' }
  };

  const format = currencyFormats[currency] || currencyFormats['EUR'];
  
  // Format the number with appropriate decimal places
  let formatted = amount.toFixed(format.decimals);
  
  // Replace decimal separator if needed
  if (format.separator === ',') {
    formatted = formatted.replace('.', ',');
  }

  // Add currency symbol
  if (format.position === 'before') {
    return `${format.symbol}${formatted}`;
  } else {
    return `${formatted} ${format.symbol}`;
  }
}

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currency = 'EUR') {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CHF': 'CHF',
    'JPY': '¥',
    'CAD': 'CA$',
    'AUD': 'A$'
  };
  return symbols[currency] || currency;
}
