"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import OdyLoader from "@/components/OdyLoader";

const MIN_VISIBLE_MS = 1000;

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
  const targetRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  const startTicker = () => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      setProgressState((current) => {
        if (current >= targetRef.current) {
          if (tickerRef.current) clearInterval(tickerRef.current);
          return targetRef.current;
        }
        return current + 1;
      });
    }, 18); // ~55 ticks/sec — smooth but not too fast
  };

  const showLoader = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showLoaderStartRef.current = Date.now();
    targetRef.current = 0;
    setProgressState(0);
    setLoading(true);
  };

  const hideLoader = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    const start = showLoaderStartRef.current;
    if (start === null) {
      setLoading(false);
      return;
    }
    const elapsed = Date.now() - start;
    if (elapsed >= MIN_VISIBLE_MS) {
      showLoaderStartRef.current = null;
      if (tickerRef.current) clearInterval(tickerRef.current);
      setProgressState(0);
      setLoading(false);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        hideTimeoutRef.current = null;
        showLoaderStartRef.current = null;
        if (tickerRef.current) clearInterval(tickerRef.current);
        setProgressState(0);
        setLoading(false);
      }, MIN_VISIBLE_MS - elapsed);
    }
  };

  const setProgress = (n: number) => {
    const clamped = Math.min(100, Math.max(0, n));
    targetRef.current = clamped;
    startTicker();
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
