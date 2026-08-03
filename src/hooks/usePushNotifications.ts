import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { profile, updateProfile } = useAppData();
  const [subscribed, setSubscribed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setChecking(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false))
      .finally(() => setChecking(false));
  }, []);

  const setPushFlag = useCallback(
    (value: boolean) => updateProfile({ notification_settings: { ...profile.notification_settings, push: value } }),
    [profile.notification_settings, updateProfile]
  );

  const subscribe = useCallback(async () => {
    if (!user || !isPushSupported()) {
      setError("Push notifications aren't supported in this browser.");
      return false;
    }
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was denied.");
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await (supabase as any)
        .from("push_subscriptions")
        .upsert({ user_id: user.id, subscription: sub.toJSON() }, { onConflict: "user_id" });
      await setPushFlag(true);
      setSubscribed(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to subscribe to push notifications.");
      return false;
    }
  }, [user, setPushFlag]);

  const unsubscribe = useCallback(async () => {
    if (!isPushSupported()) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      if (user) await (supabase as any).from("push_subscriptions").delete().eq("user_id", user.id);
      await setPushFlag(false);
      setSubscribed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to unsubscribe.");
    }
  }, [user, setPushFlag]);

  return { subscribed, checking, error, subscribe, unsubscribe, supported: isPushSupported() };
}
