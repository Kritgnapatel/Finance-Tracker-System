// Simple, deterministic rates (dev-friendly)
// NOTE: In prod you’d fetch from an API or cache daily
const RATES = {
  INR: { INR: 1, USD: 0.012, EUR: 0.011 },
  USD: { USD: 1, INR: 83.0, EUR: 0.92 },
  EUR: { EUR: 1, INR: 90.0, USD: 1.09 },
};

const convertAmount = (amount, from, to) => {
  if (!RATES[from] || !RATES[from][to]) {
    throw new Error("Unsupported currency conversion");
  }
  // keep 2-decimal precision
  return Number((Number(amount) * RATES[from][to]).toFixed(2));
};

module.exports = { convertAmount, RATES };
