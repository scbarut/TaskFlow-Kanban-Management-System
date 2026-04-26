"use client";

import { useEffect } from "react";
import { useUiStore } from "@/lib/uiStore";

/**
 * Subscribes to global loading state and toggles the
 * `loading-cursor` class on the <body> element.
 */
export default function GlobalLoadingCursor() {
  const isGlobalLoading = useUiStore((s) => s.isGlobalLoading);

  useEffect(() => {
    if (isGlobalLoading) {
      document.body.classList.add("loading-cursor");
    } else {
      document.body.classList.remove("loading-cursor");
    }
    return () => {
      document.body.classList.remove("loading-cursor");
    };
  }, [isGlobalLoading]);

  return null; // This component renders nothing — it only manages a side effect
}
