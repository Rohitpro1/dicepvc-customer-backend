"use client";

import { useEffect, useState } from "react";

export function useCounter(end: number, start: number = 0, duration: number = 1500) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * (end - start) + start));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, start, duration]);

  return count;
}
