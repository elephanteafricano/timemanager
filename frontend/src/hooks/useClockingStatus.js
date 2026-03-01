import { useCallback, useEffect, useMemo, useState } from 'react';
import clocksService from '../services/clocks.service';
import { getApiErrorMessage } from '../utils/apiError';

function useClockingStatus(userId) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState(null);

  const resetClockState = useCallback(() => {
    setIsClockedIn(false);
    setClockInTime(null);
    setElapsedTime(0);
  }, []);

  const activeOpenClock = useMemo(() => {
    return (clocks) => clocks.reduce((latest, clock) => {
      if (!clock || clock.clock_out) return latest;
      const clockInDate = new Date(clock.clock_in);
      if (Number.isNaN(clockInDate.getTime())) return latest;
      if (!latest) return clock;
      const latestIn = new Date(latest.clock_in);
      return clockInDate > latestIn ? clock : latest;
    }, null);
  }, []);

  useEffect(() => {
    if (!userId) {
      resetClockState();
      return;
    }

    const fetchClockStatus = async () => {
      try {
        const response = await clocksService.getUserClocks(userId);
        const clocks = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);

        if (!Array.isArray(clocks) || clocks.length === 0) {
          resetClockState();
          return;
        }

        const activeClock = activeOpenClock(clocks);

        if (activeClock && activeClock.clock_in) {
          const openClockIn = new Date(activeClock.clock_in);
          if (!Number.isNaN(openClockIn.getTime())) {
            setIsClockedIn(true);
            setClockInTime(openClockIn);
            const now = new Date();
            const elapsed = Math.floor((now - openClockIn) / 1000);
            setElapsedTime(elapsed > 0 ? elapsed : 0);
          } else {
            resetClockState();
          }
        } else {
          resetClockState();
        }
      } catch (err) {
        // Preserve current behavior: swallow fetch errors and default to clocked out.
        resetClockState();
      }
    };

    fetchClockStatus();
  }, [userId, activeOpenClock, resetClockState]);

  useEffect(() => {
    if (!isClockedIn || !clockInTime) {
      return undefined;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - clockInTime) / 1000);
      setElapsedTime(Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const toggleClock = useCallback(async () => {
    if (!userId) {
      setClockError('User ID required');
      return;
    }

    setClockLoading(true);
    setClockError(null);

    try {
      const response = await clocksService.toggleClock({ user_id: userId });
      const clockRecord = response?.data || response;

      if (clockRecord) {
        const clockInValue = clockRecord.clock_in;
        const clockOutValue = clockRecord.clock_out;
        const hasOpenClock = !!clockInValue && !clockOutValue;
        setIsClockedIn(hasOpenClock);

        if (hasOpenClock) {
          const openClockIn = new Date(clockInValue);
          if (!Number.isNaN(openClockIn.getTime())) {
            setClockInTime(openClockIn);
            const now = new Date();
            const elapsed = Math.floor((now - openClockIn) / 1000);
            setElapsedTime(Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0);
          } else {
            // Keep open status but show invalid elapsed as "--:--:--" via formatter.
            setClockInTime(null);
            setElapsedTime(Number.NaN);
          }
        } else {
          setClockInTime(null);
          setElapsedTime(0);
        }
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to toggle clock');
      setClockError(message);
    } finally {
      setClockLoading(false);
    }
  }, [userId]);

  return {
    isClockedIn,
    elapsedTime,
    clockLoading,
    clockError,
    toggleClock,
  };
}

export default useClockingStatus;
