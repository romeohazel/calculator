"use client";

import { useCallback, useEffect, useState } from "react";
import { PricingModal } from "./PricingModal";
import { SurveyModal } from "./SurveyModal";
import styles from "./Calculator.module.css";

const KEYS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
] as const;

const LOADING_MS = 1600;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [showPricing, setShowPricing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    fetch("/api/access")
      .then((r) => r.json())
      .then((d) => setHasAccess(Boolean(d.hasAccess)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!calculating) {
      setLoadProgress(0);
      return;
    }

    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(92, (elapsed / LOADING_MS) * 92);
      setLoadProgress(pct);
    }, 40);

    return () => clearInterval(tick);
  }, [calculating]);

  const append = useCallback((key: string) => {
    setDisplay((prev) => {
      if (prev === "0" && key !== ".") return key === "±" ? prev : key;
      if (key === "±") {
        if (prev.startsWith("-")) return prev.slice(1) || "0";
        return "-" + prev;
      }
      return prev + key;
    });
  }, []);

  const clear = useCallback(() => setDisplay("0"), []);

  const operatorSymbol = (key: string) => {
    if (key === "×") return "×";
    if (key === "÷") return "÷";
    return key;
  };

  const handleKey = useCallback(
    async (key: string) => {
      if (key === "C") {
        clear();
        return;
      }
      if (key === "=") {
        if (display === "0" || !display.trim() || calculating) return;

        setCalculating(true);
        const expression = display;

        try {
          const [res] = await Promise.all([
            fetch("/api/calculate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ expression }),
            }),
            wait(LOADING_MS),
          ]);

          setLoadProgress(100);
          await wait(120);

          const data = await res.json();

          if (data.requiresPayment) {
            setHasAccess(false);
            setShowPricing(true);
            return;
          }

          if (data.result !== undefined) {
            setDisplay(data.result);
            setHasAccess(true);
            setPulse(true);
            setTimeout(() => setPulse(false), 600);
            return;
          }

          setDisplay("Error");
        } finally {
          setCalculating(false);
        }
        return;
      }

      if (["+", "-", "×", "÷"].includes(key)) {
        append(operatorSymbol(key));
        return;
      }

      if (key === "%") {
        setDisplay((prev) => {
          const n = parseFloat(prev);
          if (isNaN(n)) return prev;
          return String(n / 100);
        });
        return;
      }

      append(key === "×" || key === "÷" ? operatorSymbol(key) : key);
    },
    [append, clear, display, calculating],
  );

  return (
    <>
      <div className={styles.shell}>
        <div className={styles.glow} aria-hidden />
        <div
          className={`${styles.displayPanel} ${pulse ? styles.displayPulse : ""} ${!hasAccess ? styles.displayLocked : ""}`}
        >
          {calculating && (
            <div className={styles.loading} aria-live="polite">
              <p className={styles.loadingText}>Consulting mathematicians…</p>
              <div className={styles.loadingTrack}>
                <div
                  className={styles.loadingBar}
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className={`${styles.display} ${calculating ? styles.displayHidden : ""}`}>
            {display}
          </div>
        </div>

        <div className={styles.keys}>
          {KEYS.flat().map((key, i) => {
            const isZero = key === "0";
            const isEquals = key === "=";
            return (
              <button
                key={`${key}-${i}`}
                type="button"
                disabled={calculating}
                className={[
                  styles.key,
                  isZero ? styles.zero : "",
                  isEquals ? styles.equals : "",
                  ["+", "-", "×", "÷"].includes(key) ? styles.op : "",
                  ["C", "±", "%"].includes(key) ? styles.fn : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleKey(key)}
              >
                <span className={styles.keyInner}>{key}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      <SurveyModal />
    </>
  );
}
