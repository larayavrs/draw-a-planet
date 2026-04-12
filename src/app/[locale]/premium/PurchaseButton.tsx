"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function PurchaseButton() {
  const t = useTranslations("premium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePurchase() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) { setError(t("checkout_error")); return; }
      window.location.href = data.init_point;
    } catch {
      setError(t("checkout_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <Button
        variant="cta"
        size="lg"
        className="w-full"
        onClick={handlePurchase}
        loading={loading}
      >
        {t("cta_subscribe")}
      </Button>
    </>
  );
}
