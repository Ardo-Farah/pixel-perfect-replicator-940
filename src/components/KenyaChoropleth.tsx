import { useMemo, useState } from "react";
import { kenyaCounties } from "@/assets/kenya-counties";

// Zero-dependency choropleth of Kenya's 47 counties, shaded by a numeric value
// (e.g. case counts) and matched to county data by name. No map library, no
// API key, no external tiles — the geometry is bundled and projected to SVG.

export type CountyDatum = {
  county: string | null;
  value: number | null;
  hotspot?: boolean | null;
};

export type Bucket = { upTo: number; color: string };

type Props = {
  data: CountyDatum[];
  /** Light → dark fill endpoints (hex). Defaults to a rose ramp. Ignored if `buckets` is set. */
  ramp?: [string, string];
  /** Graduated colour buckets (ascending by upTo). The last bucket catches everything above. */
  buckets?: Bucket[];
  valueLabel?: string;
  height?: number;
  formatValue?: (n: number) => string;
  emptyMessage?: string;
  /** Optional symbol overlays drawn at each county's centroid. */
  markers?: CountyMarker[];
};

export type MarkerShape = "circle" | "triangle" | "square" | "star" | "droplet";
export type CountyMarker = {
  county: string;
  shape: MarkerShape;
  color: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// Map spelling variants to a single canonical key so DB names line up with the
// GeoJSON names (which use uppercase + odd spellings).
const ALIASES: Record<string, string> = {
  ELEGEYOMARAKWET: "ELGEYOMARAKWET",
  NAIROBICITY: "NAIROBI",
  TAITATAVETA: "TAITATAVETA",
  THARAKANITHI: "THARAKANITHI",
};
const canon = (s: string) => {
  const k = norm(s);
  return ALIASES[k] ?? k;
};

// Canonical keys for the 47 real counties.
const GEO_KEYS = new Set(kenyaCounties.map((c) => canon(c.name)));

// Resolve a possibly sub-county / composite label to a real county key, e.g.
// "Laisamis (Marsabit)" → Marsabit, "Turkana South & East" → Turkana.
// Returns null if no county can be determined.
function resolveCounty(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const direct = canon(raw);
  if (GEO_KEYS.has(direct)) return direct;
  const par = raw.match(/\(([^)]+)\)/);
  if (par) {
    const k = canon(par[1]);
    if (GEO_KEYS.has(k)) return k;
  }
  const words = raw.replace(/\([^)]*\)/g, " ").split(/[^A-Za-z]+/).filter(Boolean);
  for (let n = Math.min(3, words.length); n >= 1; n--) {
    const k = canon(words.slice(0, n).join(""));
    if (GEO_KEYS.has(k)) return k;
  }
  return null;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const c = (k: "r" | "g" | "b") => Math.round(x[k] + (y[k] - x[k]) * t);
  return `rgb(${c("r")}, ${c("g")}, ${c("b")})`;
}

export function KenyaChoropleth({
  data,
  ramp = ["#ffe4e6", "#9f1239"],
  buckets,
  valueLabel = "cases",
  height = 420,
  formatValue = (n) => n.toLocaleString(),
  emptyMessage = "No county data in the latest report.",
  markers,
}: Props) {
  // value + hotspot keyed by canonical county name
  const byCounty = useMemo(() => {
    const m = new Map<string, { value: number; hotspot: boolean }>();
    for (const d of data) {
      const key = resolveCounty(d.county);
      if (!key) continue;
      const prev = m.get(key);
      const value = (prev?.value ?? 0) + (typeof d.value === "number" ? d.value : 0);
      m.set(key, { value, hotspot: Boolean(d.hotspot) || Boolean(prev?.hotspot) });
    }
    return m;
  }, [data]);

  const maxValue = useMemo(() => {
    let max = 0;
    for (const v of byCounty.values()) max = Math.max(max, v.value);
    return max;
  }, [byCounty]);

  // Project lon/lat → SVG using equirectangular with a cos(midLat) x-correction.
  const { paths, width, vbHeight, centroids } = useMemo(() => {
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const c of kenyaCounties) {
      for (const ring of c.rings) {
        for (const [lon, lat] of ring) {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }
    const midLat = (minLat + maxLat) / 2;
    const kx = Math.cos((midLat * Math.PI) / 180);
    const PAD = 8;
    const spanX = (maxLon - minLon) * kx;
    const spanY = maxLat - minLat;
    const H = height;
    const W = (spanX / spanY) * (H - PAD * 2) + PAD * 2;
    const project = (lon: number, lat: number): [number, number] => {
      const x = PAD + ((lon - minLon) * kx) / spanX * (W - PAD * 2);
      const y = PAD + ((maxLat - lat) / spanY) * (H - PAD * 2);
      return [x, y];
    };
    const paths = kenyaCounties.map((c) => {
      let sx = 0, sy = 0, n = 0;
      const d = c.rings
        .map((ring) => {
          if (ring.length === 0) return "";
          const pts = ring.map(([lon, lat]) => {
            const [x, y] = project(lon, lat);
            sx += x; sy += y; n += 1;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          return `M${pts.join("L")}Z`;
        })
        .join("");
      const centroid: [number, number] = n > 0 ? [sx / n, sy / n] : [0, 0];
      return { name: c.name, d, key: canon(c.name), centroid };
    });
    const centroids = new Map<string, [number, number]>();
    for (const p of paths) centroids.set(p.key, p.centroid);
    return { paths, width: W, vbHeight: H, centroids };
  }, [height]);

  const [hover, setHover] = useState<{ name: string; value: number | null; x: number; y: number } | null>(null);

  const hasData = maxValue > 0 || (markers && markers.length > 0);

  return (
    <div className="relative w-full" style={{ minHeight: 280 }}>
      <svg
        viewBox={`0 0 ${width} ${vbHeight}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Map of Kenya counties shaded by value"
      >
        {paths.map((p) => {
          const entry = byCounty.get(p.key);
          let fill: string;
          if (buckets && buckets.length) {
            if (!entry) fill = "#ffffff";
            else fill = (buckets.find((b) => entry.value <= b.upTo) ?? buckets[buckets.length - 1]).color;
          } else {
            const t = entry && maxValue > 0 ? 0.18 + 0.82 * (entry.value / maxValue) : 0;
            fill = entry ? mix(ramp[0], ramp[1], t) : "#eef2f6";
          }
          const isHot = entry?.hotspot;
          return (
            <path
              key={p.name}
              d={p.d}
              fill={fill}
              stroke={isHot ? "#e11d48" : "#94a3b8"}
              strokeWidth={isHot ? 1.6 : 0.4}
              fillRule="evenodd"
              onMouseEnter={(e) =>
                setHover({
                  name: p.name,
                  value: entry?.value ?? null,
                  x: e.nativeEvent.offsetX,
                  y: e.nativeEvent.offsetY,
                })
              }
              onMouseMove={(e) =>
                setHover((h) => (h ? { ...h, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : h))
              }
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer", transition: "fill 120ms" }}
            />
          );
        })}
        {markers?.map((m, i) => {
          const key = resolveCounty(m.county);
          if (!key) return null;
          const c = centroids.get(key);
          if (!c) return null;
          const [cx, cy] = c;
          const r = m.size === "lg" ? 8 : m.size === "sm" ? 4 : 6;
          const stroke = "#0f172a";
          const sw = 0.6;
          const common = { fill: m.color, stroke, strokeWidth: sw, opacity: 0.92 } as const;
          if (m.shape === "circle") {
            return <circle key={i} cx={cx} cy={cy} r={r} {...common}><title>{m.label ?? key}</title></circle>;
          }
          if (m.shape === "square") {
            return <rect key={i} x={cx - r} y={cy - r * 0.55} width={r * 2} height={r * 1.1} {...common}><title>{m.label ?? key}</title></rect>;
          }
          if (m.shape === "triangle") {
            const pts = `${cx},${cy - r} ${cx - r},${cy + r * 0.85} ${cx + r},${cy + r * 0.85}`;
            return <polygon key={i} points={pts} {...common}><title>{m.label ?? key}</title></polygon>;
          }
          if (m.shape === "star") {
            const spikes = 5;
            const outer = r + 1;
            const inner = outer * 0.45;
            let path = "";
            for (let s = 0; s < spikes * 2; s++) {
              const rr = s % 2 === 0 ? outer : inner;
              const a = (Math.PI / spikes) * s - Math.PI / 2;
              path += `${s === 0 ? "M" : "L"}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)} `;
            }
            return <path key={i} d={path + "Z"} {...common}><title>{m.label ?? key}</title></path>;
          }
          // droplet
          const d = `M${cx},${cy - r} C${cx + r},${cy - r / 2} ${cx + r},${cy + r} ${cx},${cy + r} C${cx - r},${cy + r} ${cx - r},${cy - r / 2} ${cx},${cy - r} Z`;
          return <path key={i} d={d} {...common}><title>{m.label ?? key}</title></path>;
        })}
      </svg>

      {hover ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-surface-container-lowest/95 px-3 py-1.5 text-xs shadow-card backdrop-blur"
          style={{ left: Math.min(hover.x + 12, width - 8), top: Math.max(hover.y - 8, 0) }}
        >
          <span className="font-semibold text-on-surface">{titleCase(hover.name)}</span>
          <span className="ml-2 text-on-surface-variant">
            {hover.value == null ? "No data" : `${formatValue(hover.value)} ${valueLabel}`}
          </span>
        </div>
      ) : null}

      {!hasData ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-md bg-surface-container-lowest/90 px-4 py-2 text-metric-subtext text-on-surface-variant shadow-card">
            {emptyMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bNithi\b/, "Nithi");
}
