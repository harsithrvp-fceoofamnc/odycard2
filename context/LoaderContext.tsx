"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import OdyLoader from "@/components/OdyLoader";

const MIN_VISIBLE_MS = 600;

type LoaderContextType = {
  showLoader: () => void;
  hideLoader: () => void;
  setProgress: (n: number) => void;
};

const LoaderContext = createContext<LoaderContextType | null>(null);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgressState] = useState(0);

  const showLoaderStartRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef<number>(0);  // tracks actual displayed value
  const targetRef = useRef<number>(0);   // tracks where we want to go

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  const stopTicker = () => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  };

  const startTicker = () => {
    stopTicker();
    tickerRef.current = setInterval(() => {
      setProgressState((current) => {
        const next = current + 1;
        currentRef.current = next;
        if (next >= targetRef.current) {
          stopTicker();
          return targetRef.current;
        }
        return next;
      });
    }, 18); // ~55 ticks/sec — smooth 1-by-1
  };

  const animateTo = (target: number) => {
    const clamped = Math.min(100, Math.max(0, target));
    targetRef.current = clamped;
    if (currentRef.current < clamped) {
      startTicker();
    }
  };

  const showLoader = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    stopTicker();
    currentRef.current = 0;
    targetRef.current = 0;
    setProgressState(0);
    showLoaderStartRef.current = Date.now();
    setLoading(true);

    // Auto-creep: slowly go from 0 → 90% while loading
    // 1% every 300ms = reaches 90% in ~27 seconds (covers any cold start)
    setTimeout(() => {
      targetRef.current = 90;
      startTicker();
      // After reaching 30%, slow down the ticker to 1% per 300ms
      const slowTimer = setInterval(() => {
        if (!tickerRef.current) {
          // Ticker stopped (hit target), restart slowly toward 90
          if (currentRef.current < 90) {
            targetRef.current = 90;
            tickerRef.current = setInterval(() => {
              setProgressState((c) => {
                const n = c + 1;
                currentRef.current = n;
                if (n >= 90) {
                  stopTicker();
                  return 90;
                }
                return n;
              });
            }, 300);
          } else {
            clearInterval(slowTimer);
          }
        }
      }, 500);
    }, 20);
  };

  const hideLoader = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    // Jump to 100% then hide
    stopTicker();
    targetRef.current = 100;
    currentRef.current = 100;
    setProgressState(100);

    const start = showLoaderStartRef.current;
    const elapsed = start ? Date.now() - start : MIN_VISIBLE_MS;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    hideTimeoutRef.current = setTimeout(() => {
      hideTimeoutRef.current = null;
      showLoaderStartRef.current = null;
      currentRef.current = 0;
      setProgressState(0);
      setLoading(false);
    }, remaining + 300); // small pause at 100% before disappearing
  };

  const setProgress = (n: number) => {
    animateTo(n);
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, setProgress }}>
      {loading && <OdyLoader progress={progress} />}
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used inside LoaderProvider");
  }
  return context;
}
