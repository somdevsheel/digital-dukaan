"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";

// Web-public has no signed-in session/saved addresses (that's native-app-only, Architecture
// §4) — geolocation-on-tap is the closest read-only equivalent to the wireframe's "location
// bar" (plate 01), driving the same GET /businesses?lat&lng&sort=distance the app itself uses.
export function NearMeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!("geolocation" in navigator)) {
      setError("Location isn't available in this browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/search?lat=${latitude}&lng=${longitude}&sort=distance`);
      },
      () => {
        setLoading(false);
        setError("Couldn't get your location. Try browsing by city instead.");
      },
    );
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        Shops near me
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
