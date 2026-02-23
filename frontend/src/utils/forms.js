export function applyFieldChange({ e, setData, clearError }) {
  const { name, value } = e.target;
  setData((prev) => ({ ...prev, [name]: value }));

  if (clearError) {
    clearError(name);
  }
}
