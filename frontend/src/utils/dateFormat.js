const REPORT_RANGE_DAYS = 30;

export const toDateOnlyString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const buildDateRange = (days = REPORT_RANGE_DAYS) => {
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);

  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - Math.max(0, days - 1));
  fromDate.setHours(0, 0, 0, 0);

  return {
    from: toDateOnlyString(fromDate),
    to: toDateOnlyString(toDate),
    fromDate,
    toDate,
  };
};
