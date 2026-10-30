import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/App";
import { SiteImagesProvider } from "@/context/SiteImages";
import { SiteSettingsProvider } from "@/context/SiteSettings";
import { initInstallPrompt, registerServiceWorker } from "@/lib/pwa";
import { watchConnectivity } from "@/lib/inquiries";
import { initNativeShell, lockToAdminDashboard } from "@/lib/native";

/* Global stylesheet — the approved Edgeway design, unchanged. */
import "@/styles/global.css";

/* Mirrors the original main.js behaviour of flagging JS as available, so the
   reveal-on-scroll styles only apply when they can actually be undone. */
document.documentElement.classList.add("js");

/* Android/iOS shell: the packaged app is admin-only, so drop the visitor URLs
   before the router mounts. No-op on the web. */
lockToAdminDashboard();

/* PWA: offline shell, push handling, install prompt, queued form submissions. */
registerServiceWorker((data) => {
  if (data && typeof data === "object" && (data as { type?: string }).type === "resubscribe-push") {
    window.dispatchEvent(new CustomEvent("edgeway:resubscribe-push"));
  }
  if (data && typeof data === "object" && (data as { type?: string }).type === "navigate") {
    window.location.assign((data as { url: string }).url);
  }
});
initInstallPrompt();
void initNativeShell();
watchConnectivity((sent) => {
  window.dispatchEvent(new CustomEvent("edgeway:queued-sent", { detail: { sent } }));
});

const container = document.getElementById("root");
if (!container) throw new Error("Root container #root not found");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SiteSettingsProvider>
        <SiteImagesProvider>
          <App />
        </SiteImagesProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
