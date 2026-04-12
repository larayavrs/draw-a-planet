"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dap_guest_token";

export function useGuestSession() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      setToken(existing);
      setLoading(false);
      return;
    }

    // Request a new guest session
    fetch("/api/auth/guest", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem(STORAGE_KEY, data.token);
          setToken(data.token);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function clearGuestSession() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }

  return { token, loading, clearGuestSession };
}
