import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { apiFetch } from "./api";
import { getSelectedCityId, setSelectedCityId } from "./city-store";
import type { City } from "./types";

export type LocationStatus = "detecting" | "granted" | "denied" | "unavailable";

interface CityContextValue {
  cities: City[];
  selectedCity: City | null;
  coords: { latitude: number; longitude: number } | null;
  locationStatus: LocationStatus;
  /** Human-readable place the device actually detected, e.g. "Bengaluru, Karnataka" — shown
   *  regardless of whether it matches a serviceable city, so the location text always
   *  reflects reality rather than silently falling back. */
  detectedPlaceLabel: string | null;
  /** False when GPS resolved to somewhere that isn't one of the seeded/serviceable cities —
   *  `selectedCity` is then just the nearest fallback, not where the device actually is. */
  isServiceableArea: boolean;
  isLoading: boolean;
  retryLocation: () => void;
}

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const { data: cities, isLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: () => apiFetch<City[]>("/cities"),
  });
  const [selectedCityId, setSelectedCityIdState] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("detecting");
  const [detectedPlaceLabel, setDetectedPlaceLabel] = useState<string | null>(null);
  const [detectedLocality, setDetectedLocality] = useState<string | null>(null);
  const [isServiceableArea, setIsServiceableArea] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void getSelectedCityId()
      .then(setSelectedCityIdState)
      .finally(() => setRestored(true));
  }, []);

  // GPS auto-detect: ask the device (backed by Google Play services on Android, Apple's
  // location services on iOS) for the current position, then reverse-geocode it — used
  // below to auto-select a matching seeded city, but the raw detected place is always
  // surfaced too so the UI never silently shows a hardcoded fallback as if it were real.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLocationStatus("detecting");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== Location.PermissionStatus.GRANTED) {
        setLocationStatus("denied");
        return;
      }
      try {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("granted");

        const [place] = await Location.reverseGeocodeAsync(position.coords);
        if (cancelled || !place) return;

        // Android/iOS geocoders return different field granularity per region — city is
        // often null outside the US, so this falls through several levels rather than
        // assuming `city` is always populated.
        const cityLike = place.city ?? place.subregion ?? place.district ?? null;
        const regionLike = place.region ?? place.country ?? null;
        const label = [cityLike, regionLike].filter(Boolean).join(", ") || null;
        setDetectedPlaceLabel(label);
        setDetectedLocality(cityLike?.toLowerCase() ?? null);
      } catch {
        if (!cancelled) setLocationStatus("unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Resolves the active city: a GPS-matched seeded city wins; otherwise fall back to
  // whatever was previously persisted; otherwise the first serviceable city (this is a
  // single-city MVP, so that's always Mumbai today, but this holds once more cities launch).
  useEffect(() => {
    if (!restored || !cities || cities.length === 0) return;

    if (detectedLocality) {
      const matched = cities.find(
        (c) => detectedLocality.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(detectedLocality),
      );
      setIsServiceableArea(!!matched);
      if (matched && matched.id !== selectedCityId) {
        setSelectedCityIdState(matched.id);
        void setSelectedCityId(matched.id);
        return;
      }
      if (matched) return;
    }

    if (selectedCityId && cities.some((c) => c.id === selectedCityId)) return;

    const firstCity = cities[0];
    if (!firstCity) return;
    setSelectedCityIdState(firstCity.id);
    void setSelectedCityId(firstCity.id);
  }, [restored, cities, selectedCityId, detectedLocality]);

  const retryLocation = () => setAttempt((n) => n + 1);

  const selectedCity = cities?.find((c) => c.id === selectedCityId) ?? null;

  return (
    <CityContext.Provider
      value={{
        cities: cities ?? [],
        selectedCity,
        coords,
        locationStatus,
        detectedPlaceLabel,
        isServiceableArea,
        isLoading,
        retryLocation,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): CityContextValue {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within a CityProvider");
  return ctx;
}
