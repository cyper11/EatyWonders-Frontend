import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";

// Mapbox GL is the heaviest dependency on the site. Load it only when the map
// is about to scroll into view (or when a deep link targets the map), so phones
// get the rest of the page much faster.
const EatyMap = lazy(() => import("./EatyMap"));

const placeholderStyle = {
  height: "clamp(360px, 60vh, 660px)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-secondary)",
};

function MapPlaceholder({ loading }) {
  return (
    <div
      style={placeholderStyle}
      className="grid place-items-center text-content-secondary"
      role={loading ? "status" : undefined}
      aria-label={loading ? "Loading map" : undefined}
    >
      <div className="flex flex-col items-center gap-2">
        <MapOutlinedIcon sx={{ fontSize: 36, color: "var(--accent)" }} aria-hidden="true" />
        <span className="text-sm font-semibold">{loading ? "Loading map…" : "Map"}</span>
      </div>
    </div>
  );
}

const Map = (props) => {
  const ref = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(Boolean(props.mapFocus));

  useEffect(() => {
    if (shouldLoad) return undefined;
    if (props.mapFocus) {
      setShouldLoad(true);
      return undefined;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad, props.mapFocus]);

  return (
    <div ref={ref}>
      {shouldLoad ? (
        <Suspense fallback={<MapPlaceholder loading />}>
          <EatyMap {...props} />
        </Suspense>
      ) : (
        <MapPlaceholder />
      )}
    </div>
  );
};

export default Map;
