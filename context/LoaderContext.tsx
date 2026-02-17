"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import OdyLoader from "@/components/OdyLoader";

const MIN_VISIBLE_MS = 1000;

type LoaderContextType = {
  showLoader: () => void;
  hideLoader: () => void;
};

const LoaderContext = createContext<LoaderContextType | null>(null);

export function LoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const showLoaderStartRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const showLoader = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showLoaderStartRef.current = Date.now();
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
      setLoading(false);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        hideTimeoutRef.current = null;
        showLoaderStartRef.current = null;
        setLoading(false);
      }, MIN_VISIBLE_MS - elapsed);
    }
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {loading && <OdyLoader />}
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
