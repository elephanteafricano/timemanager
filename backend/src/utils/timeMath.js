function getWorkedSeconds(clockInValue, clockOutValue) {
  if (!clockInValue || !clockOutValue) {
    return null;
  }

  const clockIn = new Date(clockInValue);
  const clockOut = new Date(clockOutValue);

  if (Number.isNaN(clockIn.getTime()) || Number.isNaN(clockOut.getTime()) || clockOut <= clockIn) {
    return null;
  }

  return Math.floor((clockOut - clockIn) / 1000);
}

module.exports = { getWorkedSeconds };
