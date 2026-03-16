import { useCallback, useEffect, useState } from 'react';
import clocksService from '../services/clocks.service';
import { getApiErrorMessage } from '../utils/apiError';
import { getArrayData } from '../utils/arrayData';

function findActiveOpenClock(clocks) {
  return clocks.reduce((latest, clock) => {
    if (!clock || clock.clock_out) return latest;
    const clockInDate = new Date(clock.clock_in);
    if (Number.isNaN(clockInDate.getTime())) return latest;
    if (!latest) return clock;
    const latestIn = new Date(latest.clock_in);
    return clockInDate > latestIn ? clock : latest;
  }, null);
}

function getElapsedSeconds(startTime, now = new Date()) {
  const elapsed = Math.floor((now - startTime) / 1000);
  return Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0;
}

function getValidClockInDate(value) {
  const clockInDate = new Date(value);
  return Number.isNaN(clockInDate.getTime()) ? null : clockInDate;
}

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

  useEffect(() => {
    if (!userId) {
      resetClockState();
      return;
    }

    const fetchClockStatus = async () => {
      try {
        const response = await clocksService.getUserClocks(userId);
        const clocks = getArrayData(response.data);

        if (clocks.length === 0) {
          resetClockState();
          return;
        }

        const activeClock = findActiveOpenClock(clocks);

        if (activeClock && activeClock.clock_in) {
          const openClockIn = getValidClockInDate(activeClock.clock_in);
          if (openClockIn) {
            setIsClockedIn(true);
            setClockInTime(openClockIn);
            setElapsedTime(getElapsedSeconds(openClockIn));
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
  }, [userId, resetClockState]);

  useEffect(() => {
    if (!isClockedIn || !clockInTime) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(getElapsedSeconds(clockInTime));
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
      const clockRecord = response?.data;

      if (!clockRecord) {
        resetClockState();
        return;
      }

      const clockInValue = clockRecord.clock_in;
      const clockOutValue = clockRecord.clock_out;
      const hasOpenClock = !!clockInValue && !clockOutValue;
      setIsClockedIn(hasOpenClock);

      if (hasOpenClock) {
        const openClockIn = getValidClockInDate(clockInValue);
        if (openClockIn) {
          setClockInTime(openClockIn);
          setElapsedTime(getElapsedSeconds(openClockIn));
        } else {
          // Keep open status but show invalid elapsed as "--:--:--" via formatter.
          setClockInTime(null);
          setElapsedTime(Number.NaN);
        }
      } else {
        resetClockState();
      }
    } catch (err) {
      setClockError(getApiErrorMessage(err, 'Failed to toggle clock'));
    } finally {
      setClockLoading(false);
    }
  }, [userId, resetClockState]);

  return {
    isClockedIn,
    elapsedTime,
    clockLoading,
    clockError,
    toggleClock,
  };
}

export default useClockingStatus;
