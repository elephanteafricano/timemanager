export function getApiErrorMessage(err, fallbackMessage) {
  return err?.response?.data?.error?.message
    || err?.response?.data?.message
    || err?.message
    || fallbackMessage;
}
