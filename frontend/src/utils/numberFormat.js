export const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const toHours = (seconds) => toNumber(seconds) / 3600;
