"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => { addListener: (e: string, cb: () => void) => void; dispose: () => void };
  }
}

export function JitsiRoom({
  domain,
  room,
  displayName,
  email,
  audioOnly,
  leaveHref,
}: {
  domain: string;
  room: string;
  displayName: string;
  email?: string | null;
  audioOnly: boolean;
  leaveHref: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let api: { dispose: () => void; addListener: (e: string, cb: () => void) => void } | null = null;
    const start = () => {
      if (!window.JitsiMeetExternalAPI || !ref.current) return setError("Could not load the call. Check your connection and refresh.");
      api = new window.JitsiMeetExternalAPI(domain, {
        roomName: room,
        parentNode: ref.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName, email: email ?? undefined },
        configOverwrite: {
          prejoinConfig: { enabled: true },
          startWithVideoMuted: audioOnly,
          startAudioOnly: audioOnly,
          disableDeepLinking: true,
          p2p: { enabled: true },
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: { MOBILE_APP_PROMO: false, SHOW_JITSI_WATERMARK: false },
      });
      api.addListener("readyToClose", () => router.push(leaveHref));
    };
    const existing = document.querySelector<HTMLScriptElement>(`script[data-jitsi="${domain}"]`);
    if (existing && window.JitsiMeetExternalAPI) start();
    else {
      const s = existing ?? document.createElement("script");
      s.src = `https://${domain}/external_api.js`;
      s.async = true;
      s.dataset.jitsi = domain;
      s.onload = start;
      s.onerror = () => setError("Could not reach the video service. Please try again.");
      if (!existing) document.body.appendChild(s);
    }
    return () => api?.dispose();
  }, [domain, room, displayName, email, audioOnly, leaveHref, router]);

  return (
    <div className="relative h-full w-full bg-black">
      {error && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">{error}</p>}
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}
