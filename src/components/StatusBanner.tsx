"use client";

import { useEffect, useState } from "react";
import { fetchStatus } from "@/lib/api-client";

const POLL_INTERVAL_MS = 15000;

export function StatusBanner() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const result = await fetchStatus();
        if (!cancelled) setOk(result.ok);
      } catch {
        if (!cancelled) setOk(false);
      }
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (ok !== false) return null;

  return (
    <div className="bg-amber-100 px-3 py-2 text-center text-xs text-amber-900 dark:bg-amber-900 dark:text-amber-100">
      Vaultに接続できません。WireGuardの接続を確認してください。
    </div>
  );
}
