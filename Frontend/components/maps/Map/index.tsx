import React from "react";
import { Platform } from "react-native";
import MapErrorBoundary from "../MapErrorBoundary";
import { MapBaseProps } from "./Map.types";

type PlatformMapComponent = React.ComponentType<MapBaseProps>;

const getPlatformMap = (): PlatformMapComponent => {
  if (Platform.OS === "web") {
    return require("./Map.web").default;
  }

  return require("./Map.native").default;
};

const MapComponent = getPlatformMap();

const Map: React.FC<MapBaseProps> = (props) => (
  <MapErrorBoundary>
    <MapComponent {...props} />
  </MapErrorBoundary>
);

export default Map;

export const MAP_INITIAL_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const WEB_MAP_CONFIG = {
  zoom: 12,
  mapOptions: {
    disableDefaultUI: true,
    zoomControl: true,
  },
};
