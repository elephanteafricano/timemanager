export async function runAsyncAction({ setLoading, setError, action, onSuccess }) {
  setLoading(true);
  setError(null);

  try {
    const result = await action();
    if (onSuccess) {
      onSuccess(result);
    }
    return result;
  } catch (err) {
    const message = err?.response?.data?.error?.message || err?.message;
    setError(message);
    return null;
  } finally {
    setLoading(false);
  }
}
