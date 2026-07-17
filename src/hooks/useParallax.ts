"use client";

import { useState } from "react";

export function useParallax(factor: number = 15) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const width = typeof window !== "undefined" ? window.innerWidth : 1280;
    const height = typeof window !== "undefined" ? window.innerHeight : 720;
    const x = (clientX / width) - 0.5;
    const y = (clientY / height) - 0.5;
    setRotation({ x: x * factor, y: y * factor });
  };

  const reset = () => {
    setRotation({ x: 0, y: 0 });
  };

  return { rotation, handleMouseMove, reset };
}
