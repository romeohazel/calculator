"use client";

import { useEffect, useState } from "react";
import styles from "./SurveyModal.module.css";

const STORAGE_KEY = "calc_survey_dismissed";

export function SurveyModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.panel} role="dialog" aria-labelledby="survey-title">
        <button
          type="button"
          className={styles.close}
          onClick={dismiss}
          aria-label="Close survey"
        >
          ×
        </button>
        <h2 id="survey-title">Quick survey</h2>
        <p className={styles.question}>How did you hear about us?</p>
        <button type="button" className={styles.option} onClick={dismiss}>
          Y Combinator
        </button>
      </div>
    </div>
  );
}
