/**
 * Client-side error reporting hook for AEC
 * Reports errors to the backend for monitoring and alerting
 */

import { useEffect } from "react";
import { useLocation } from "wouter";

export function useErrorReporting() {
  const [location] = useLocation();

  useEffect(() => {
    // Report client-side errors to backend
    const reportError = async (error: Error, errorInfo?: any) => {
      try {
        await fetch("/api/aec/report-error", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            errorType: error.name || "CLIENT_ERROR",
            severity: "high",
            message: error.message,
            stackTrace: error.stack,
            source: "client-side",
            endpoint: location,
            userContext: {
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              errorInfo,
            },
          }),
        });
      } catch (err) {
        console.error("[AEC] Failed to report error:", err);
      }
    };

    // Global error handler
    const handleError = (event: ErrorEvent) => {
      console.error("[AEC] Client error detected:", event.error);
      reportError(event.error || new Error(event.message));
    };

    // Unhandled promise rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[AEC] Unhandled promise rejection:", event.reason);
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      reportError(error);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [location]);

  // Function to manually report errors (can be called from error boundaries)
  const reportError = async (error: Error, errorInfo?: any) => {
    try {
      await fetch("/api/aec/report-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errorType: error.name || "CLIENT_ERROR",
          severity: "high",
          message: error.message,
          stackTrace: error.stack,
          source: "client-side",
          endpoint: location,
          userContext: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            errorInfo,
          },
        }),
      });
    } catch (err) {
      console.error("[AEC] Failed to report error:", err);
    }
  };

  // Function to report 404 errors
  const report404 = async (path: string) => {
    try {
      await fetch("/api/aec/report-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errorType: "PAGE_NOT_FOUND",
          severity: "medium",
          message: `404 Not Found: ${path}`,
          source: "client-router",
          endpoint: path,
          userContext: {
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (err) {
      console.error("[AEC] Failed to report 404:", err);
    }
  };

  return { reportError, report404 };
}
