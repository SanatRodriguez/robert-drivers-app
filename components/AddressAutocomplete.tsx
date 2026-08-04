"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { Location } from "@/lib/types";

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (location: Location) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let listener: google.maps.MapsEventListener | undefined;
    let cancelled = false;

    loadGoogleMaps().then((g) => {
      if (cancelled || !g || !inputRef.current) return;
      const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "name", "geometry"],
        componentRestrictions: { country: "pe" },
      });
      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const address_text =
          place.formatted_address || place.name || inputRef.current?.value || "";
        const lat = place.geometry?.location?.lat() ?? null;
        const lng = place.geometry?.location?.lng() ?? null;
        onChangeRef.current({ address_text, lat, lng });
      });
    });

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      onChange={(e) => onChangeRef.current({ address_text: e.target.value, lat: null, lng: null })}
      placeholder={placeholder}
      className={
        className ||
        "w-full px-4 py-3.5 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
      }
    />
  );
}
