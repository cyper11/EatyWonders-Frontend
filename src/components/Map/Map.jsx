import React from "react";
import EatyMap from "./EatyMap";

const Map = (props) => {
  // Delegate to the new Mapbox-based EatyMap component
  return <EatyMap {...props} />;
};

export default Map;
