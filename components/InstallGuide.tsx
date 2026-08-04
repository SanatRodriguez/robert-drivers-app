"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "rd_install_guide_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallGuide() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS()) {
      setPlatform("ios");
      setVisible(true);
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  }

  if (!visible || !platform) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50">
      <div className="bg-bg-elevated border border-border rounded-2xl p-4 flex items-start gap-3 shadow-lg">
        <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-sm font-extrabold text-white shrink-0">
          RD
        </div>
        <div className="flex-1 min-w-0">
          {platform === "ios" ? (
            <p className="text-xs text-ink leading-snug">
              Instala esta app: toca <span className="font-bold">Compartir</span> (□↑) y luego{" "}
              <span className="font-bold">"Agregar a pantalla de inicio"</span>.
            </p>
          ) : (
            <>
              <p className="text-xs text-ink leading-snug mb-2">
                Instala Robert's Drivers como app en tu celular.
              </p>
              <button
                type="button"
                onClick={handleInstallClick}
                className="text-xs font-bold text-white bg-brand rounded-lg px-3 py-1.5"
              >
                Instalar
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="text-muted text-sm shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
