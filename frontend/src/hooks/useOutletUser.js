import { useOutletContext } from 'react-router-dom';

export default function useOutletUser() {
  const context = useOutletContext();

  if ((!context || typeof context.user === 'undefined') && process.env.NODE_ENV !== 'production') {
    throw new Error('useOutletUser must be used under <AppShell />');
  }

  return context?.user || null;
}
