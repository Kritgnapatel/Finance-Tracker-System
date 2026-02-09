// src/utils/currency.js

const RATES = {
  INR: 1,
  USD: 83,
  EUR: 90,
};

const convertAmount = (amount, from, to) => {
  if (!from || !to) return Number(amount);

  const fromRate = RATES[from] || 1;
  const toRate = RATES[to] || 1;

  // convert → INR → target
  const inINR = Number(amount) * fromRate;
  return inINR / toRate;
};

module.exports = {
  convertAmount,
};
