"use client";

import { useState } from "react";
import styles from "./PricingModal.module.css";

type Props = {
  onClose: () => void;
};

export function PricingModal({ onClose }: Props) {
  const [loading, setLoading] = useState<"lifetime" | "monthly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: "lifetime" | "monthly") {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout failed");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Checkout failed");
      setLoading(null);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-labelledby="pricing-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="pricing-title">See the answer</h2>
          <p>Your calculation is ready. Pick a plan to reveal it.</p>
        </header>

        <div className={styles.plans}>
          <article className={`${styles.plan} ${styles.featured}`}>
            <span className={styles.badge}>Best value</span>
            <h3>Lifetime</h3>
            <p className={styles.promo}>
              Limited time: 900% off — was $2,990, now $299
            </p>
            <p className={styles.price}>
              $299 <span>one-time</span>
            </p>
            <p className={styles.desc}>Use the calculator forever. Pay once.</p>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => checkout("lifetime")}
            >
              {loading === "lifetime" ? "Redirecting…" : "Get lifetime access"}
            </button>
          </article>

          <article className={styles.plan}>
            <h3>Monthly</h3>
            <p className={styles.price}>
              $50 <span>/ month</span>
            </p>
            <p className={styles.desc}>Subscribe and calculate as much as you want.</p>
            <button
              type="button"
              className={styles.secondary}
              disabled={loading !== null}
              onClick={() => checkout("monthly")}
            >
              {loading === "monthly" ? "Redirecting…" : "Subscribe"}
            </button>
          </article>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="button" className={styles.dismiss} onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
