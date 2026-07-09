import { lazy, Suspense } from "react";
import type { Bucket, CountyDatum, CountyMarker } from "@/components/KenyaChoropleth";

type Props = {
  data: CountyDatum[];
  ramp?: [string, string];
  buckets?: Bucket[];
  valueLabel?: string;
  height?: number;
  formatValue?: (n: number) => string;
  emptyMessage?: string;
  markers?: CountyMarker[];
};

const KenyaChoroplethImpl = lazy(() =>
  import("@/components/KenyaChoropleth").then((mod) => ({ default: mod.KenyaChoropleth })),
);

export function LazyKenyaChoropleth(props: Props) {
  const height = props.height ?? 420;
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low/50 text-metric-subtext text-on-surface-variant"
          style={{ height }}
        >
          Loading map...
        </div>
      }
    >
      <KenyaChoroplethImpl {...props} />
    </Suspense>
  );
}

export type { Bucket, CountyDatum, CountyMarker };
