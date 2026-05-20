"use client";

import { useCallback, useEffect, useState } from "react";
import { PricingModal } from "./PricingModal";
import styles from "./Calculator.module.css";

const KEYS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
] as const;

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [showPricing, setShowPricing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    fetch("/api/access")
      .then((r) => r.json())
      .then((d) => setHasAccess(Boolean(d.hasAccess)))
      .catch(() => {});
  }, []);

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
        if (display === "0" || !display.trim()) return;

        const res = await fetch("/api/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expression: display }),
        });
        const data = await res.json();

        if (data.requiresPayment) {
          setHasAccess(false);
          setShowPricing(true);
          return;
        }

        if (data.result !== undefined) {
          setDisplay(data.result);
          setHasAccess(true);
          return;
        }

        setDisplay("Error");
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
    [append, clear, display],
  );

  return (
    <div className={styles.wrap}>
      <header className={styles.brand}>
        <h1>Calculator</h1>
        {hasAccess && <span className={styles.paid}>Unlocked</span>}
      </header>

      <div className={styles.display} aria-live="polite">
        {display}
      </div>

      <div className={styles.keys}>
        {KEYS.flat().map((key, i) => {
          const isZero = key === "0";
          const isEquals = key === "=";
          return (
            <button
              key={`${key}-${i}`}
              type="button"
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
              {key}
            </button>
          );
        })}
      </div>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
