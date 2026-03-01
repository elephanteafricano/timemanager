import { getApiErrorMessage } from './apiError';

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
    const message = getApiErrorMessage(err);
    setError(message);
    return null;
  } finally {
    setLoading(false);
  }
}
