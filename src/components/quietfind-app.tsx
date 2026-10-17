"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  LONDON_SPOTS,
  TYPE_LABEL,
  formatDistanceKm,
  haversineKm,
  quietLabel,
  type QuietLevel,
  type Spot,
  type SpotType,
} from "@/lib/spots";
import {
  addQuietLog,
  loadCustomSpots,
  loadFavorites,
  loadLogs,
  saveCustomSpots,
  saveFavorites,
  type CustomSpot,
} from "@/lib/storage";

const SpotMap = dynamic(
  () => import("@/components/spot-map").then((m) => m.SpotMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-[var(--muted)]">
        Loading map…
      </div>
    ),
  },
);

const LONDON = { lat: 51.515, lng: -0.12 };

function toSpot(c: CustomSpot): Spot {
  return {
    id: c.id,
    name: c.name,
    type: (c.type as SpotType) || "cafe",
    area: c.area,
    lat: c.lat,
    lng: c.lng,
    quiet: Math.min(5, Math.max(1, Math.round(c.quiet))) as QuietLevel,
    wifi: c.wifi,
    plugs: c.plugs,
    hours: c.hours,
    blurb: c.blurb,
  };
}

export function QuietFindApp() {
  const [ready, setReady] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [custom, setCustom] = useState<CustomSpot[]>([]);
  const [logs, setLogs] = useState(loadLogs);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [geoError, setGeoError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [minQuiet, setMinQuiet] = useState(3);
  const [needWifi, setNeedWifi] = useState(false);
  const [needPlugs, setNeedPlugs] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | SpotType>("all");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    area: "",
    type: "cafe" as SpotType,
    quiet: 4,
    wifi: true,
    plugs: true,
    hours: "Check before you go",
    blurb: "",
  });
  const [addError, setAddError] = useState("");

  useEffect(() => {
    setFavorites(loadFavorites());
    setCustom(loadCustomSpots());
    setLogs(loadLogs());
    setReady(true);
  }, []);

  const allSpots: Spot[] = useMemo(() => {
    const base = LONDON_SPOTS.map((s) => {
      const log = logs.find((l) => l.spotId === s.id);
      return log ? { ...s, quiet: Math.min(5, Math.max(1, Math.round(log.quiet))) as QuietLevel } : s;
    });
    return [...custom.map(toSpot), ...base];
  }, [custom, logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSpots
      .filter((s) => s.quiet >= minQuiet)
      .filter((s) => (needWifi ? s.wifi : true))
      .filter((s) => (needPlugs ? s.plugs : true))
      .filter((s) => (typeFilter === "all" ? true : s.type === typeFilter))
      .filter((s) => (onlyFavs ? favorites.includes(s.id) : true))
      .filter((s) =>
        q
          ? s.name.toLowerCase().includes(q) ||
            s.area.toLowerCase().includes(q) ||
            s.blurb.toLowerCase().includes(q)
          : true,
      )
      .map((s) => ({
        spot: s,
        km: userPos ? haversineKm(userPos, s) : null,
      }))
      .sort((a, b) => {
        if (a.km != null && b.km != null && a.km !== b.km) return a.km - b.km;
        return b.spot.quiet - a.spot.quiet;
      });
  }, [
    allSpots,
    minQuiet,
    needWifi,
    needPlugs,
    typeFilter,
    onlyFavs,
    favorites,
    query,
    userPos,
  ]);

  const selected =
    allSpots.find((s) => s.id === selectedId) ?? filtered[0]?.spot ?? null;

  const mapCenter = selected
    ? { lat: selected.lat, lng: selected.lng }
    : userPos ?? LONDON;

  function locateMe() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn’t available in this browser.");
      return;
    }
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => setGeoError(err.message || "Couldn’t get your location."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      saveFavorites(next);
      return next;
    });
  }

  function logQuiet(spotId: string, quiet: number) {
    const next = addQuietLog({
      spotId,
      quiet,
      note: "Logged from QuietFind",
      at: new Date().toISOString(),
    });
    setLogs(next);
  }

  function addSpot(e: React.FormEvent) {
    e.preventDefault();
    const name = addForm.name.trim();
    if (!name) {
      setAddError("Give the spot a name.");
      return;
    }
    if (!userPos) {
      setAddError("Use “Near me” first so we can drop a pin at your location.");
      return;
    }
    const spot: CustomSpot = {
      id: `custom-${Date.now()}`,
      name,
      area: addForm.area.trim() || "Near you",
      type: addForm.type,
      quiet: addForm.quiet,
      wifi: addForm.wifi,
      plugs: addForm.plugs,
      hours: addForm.hours,
      blurb: addForm.blurb.trim() || "Added from your visit.",
      lat: userPos.lat,
      lng: userPos.lng,
    };
    const next = [spot, ...custom];
    saveCustomSpots(next);
    setCustom(next);
    setSelectedId(spot.id);
    setShowAdd(false);
    setAddForm((f) => ({ ...f, name: "", area: "", blurb: "" }));
    setAddError("");
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-full max-w-6xl items-center justify-center px-4 py-16">
        <p className="text-[var(--muted)]">Finding quiet rooms…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-4 py-7 sm:px-6 sm:py-9">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          QuietFind
        </p>
        <h1 className="max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-[1.08] tracking-tight sm:text-5xl">
          Find a place that&apos;s actually quiet — not just “laptop friendly”
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Google stars don&apos;t tell you if you can think. QuietFind ranks
          London spots by hush level, plugs, and Wi‑Fi — then lets you log what
          it felt like when you sat down. No account.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={locateMe}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
          >
            Near me
          </button>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm"
          >
            {showAdd ? "Cancel" : "Add spot at my pin"}
          </button>
          <button
            type="button"
            onClick={() => setOnlyFavs((v) => !v)}
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm"
          >
            {onlyFavs ? "Show all" : "Favorites only"}
          </button>
        </div>
        {geoError ? (
          <p className="text-sm text-red-700">{geoError}</p>
        ) : userPos ? (
          <p className="text-sm text-[var(--muted)]">
            Sorting by distance from your pin.
          </p>
        ) : null}
      </header>

      {showAdd ? (
        <form
          onSubmit={addSpot}
          className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"
        >
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Log a quiet spot where you are
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Saves to this browser and drops a pin at your current location.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Name
              <input
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5"
                placeholder="Corner table at…"
              />
            </label>
            <label className="text-sm font-medium">
              Area
              <input
                value={addForm.area}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, area: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5"
                placeholder="Hackney"
              />
            </label>
            <label className="text-sm font-medium">
              Type
              <select
                value={addForm.type}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    type: e.target.value as SpotType,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5"
              >
                {(Object.keys(TYPE_LABEL) as SpotType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Quiet score (1–5)
              <input
                type="range"
                min={1}
                max={5}
                value={addForm.quiet}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, quiet: Number(e.target.value) }))
                }
                className="mt-3 w-full"
              />
              <span className="text-[var(--muted)]">
                {addForm.quiet} · {quietLabel(addForm.quiet)}
              </span>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addForm.wifi}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, wifi: e.target.checked }))
                }
              />
              Wi‑Fi
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addForm.plugs}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, plugs: e.target.checked }))
                }
              />
              Plugs
            </label>
          </div>
          {addError ? (
            <p className="mt-3 text-sm text-red-700">{addError}</p>
          ) : null}
          <button
            type="submit"
            className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
          >
            Save spot
          </button>
        </form>
      ) : null}

      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--line)] bg-white/90 p-4">
        <label className="text-sm">
          Min quiet
          <select
            value={minQuiet}
            onChange={(e) => setMinQuiet(Number(e.target.value))}
            className="mt-1 block rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          >
            <option value={1}>1+ Lively</option>
            <option value={2}>2+ Soft chat</option>
            <option value={3}>3+ Hush</option>
            <option value={4}>4+ Whisper</option>
            <option value={5}>5 Silent only</option>
          </select>
        </label>
        <label className="text-sm">
          Type
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | SpotType)
            }
            className="mt-1 block rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          >
            <option value="all">Any</option>
            {(Object.keys(TYPE_LABEL) as SpotType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={needWifi}
            onChange={(e) => setNeedWifi(e.target.checked)}
          />
          Wi‑Fi
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={needPlugs}
            onChange={(e) => setNeedPlugs(e.target.checked)}
          />
          Plugs
        </label>
        <label className="min-w-[12rem] flex-1 text-sm">
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="King’s Cross, library…"
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          />
        </label>
      </section>

      <div className="grid flex-1 gap-5 lg:grid-cols-[1.35fr_0.9fr]">
        <section className="h-[50vh] min-h-[320px] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm lg:h-auto lg:min-h-[520px]">
          <SpotMap
            center={mapCenter}
            spots={filtered.map((f) => f.spot)}
            selectedId={selected?.id ?? null}
            userPos={userPos}
            onSelect={setSelectedId}
          />
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-[family-name:var(--font-display)] text-lg">
              {filtered.length} quiet option{filtered.length === 1 ? "" : "s"}
            </h2>
            {filtered.length === 0 ? (
              <p className="mt-4 rounded-xl bg-[var(--bg)] px-3 py-8 text-center text-sm text-[var(--muted)]">
                Nothing matches — lower the quiet filter or clear Wi‑Fi / plugs.
              </p>
            ) : (
              <ul className="mt-3 max-h-[28rem] space-y-2 overflow-auto">
                {filtered.map(({ spot, km }) => {
                  const active = selected?.id === spot.id;
                  return (
                    <li key={spot.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(spot.id)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--line)] bg-[var(--bg)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{spot.name}</p>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {TYPE_LABEL[spot.type]} · {spot.area}
                              {km != null ? ` · ${formatDistanceKm(km)}` : ""}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-[var(--ink)] px-2 py-0.5 text-xs font-medium text-white">
                            {spot.quiet} {quietLabel(spot.quiet)}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {selected ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--ink)] p-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-[family-name:var(--font-display)] text-xl">
                  {selected.name}
                </h2>
                <button
                  type="button"
                  onClick={() => toggleFav(selected.id)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs"
                >
                  {favorites.includes(selected.id)
                    ? "★ Saved"
                    : "☆ Save favorite"}
                </button>
              </div>
              <p className="mt-2 text-sm text-white/75">
                {TYPE_LABEL[selected.type]} · {selected.area} · {selected.hours}
              </p>
              <p className="mt-3 text-sm text-white/85">{selected.blurb}</p>
              <p className="mt-3 text-sm">
                Quiet {selected.quiet}/5 ({quietLabel(selected.quiet)}) ·{" "}
                {selected.wifi ? "Wi‑Fi" : "No Wi‑Fi"} ·{" "}
                {selected.plugs ? "Plugs" : "No plugs"}
              </p>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">
                  How quiet was it for you?
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => logQuiet(selected.id, n)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
