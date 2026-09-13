import { useEffect, useState } from "react";

export default function PWAInstall() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!installEvent) return;

    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;

    if (outcome === "accepted") {
      setInstallEvent(null);
      setShowButton(false);
    }
  };

  if (!showButton) return null;

  return (
    <button
      type="button"
      onClick={installApp}
      className="rounded-full border border-amber/40 bg-night-panel/80 px-3 py-1.5 font-mono text-xs text-amber backdrop-blur-sm transition-colors hover:bg-amber/10"
      aria-label="Install Last Bus app"
    >
      Install App
    </button>
  );
}
