import React, { useState, useEffect } from 'react';
import styles from './TypewriterText.module.css';

export default function TypewriterText({ text, delay = 0, speed = 15, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let startTimer;
    if (delay > 0) {
      startTimer = setTimeout(() => {
        setHasStarted(true);
        setIsTyping(true);
      }, delay);
    } else {
      setHasStarted(true);
      setIsTyping(true);
    }

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!isTyping || !hasStarted) return;

    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      if (onComplete) onComplete();
    }
  }, [displayedText, isTyping, text, speed, onComplete, hasStarted]);

  if (!hasStarted) return null;

  return (
    <span className={styles.typewriter}>
      {displayedText}
      {isTyping && <span className={styles.cursor}></span>}
    </span>
  );
}
