// components/maps/Map/Map.types.ts
export interface Location {
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

export interface CheckedInEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  job?: string;
  status: string;
  location: Location;
  defaultLocation?: Location;
  lastUpdate: string;
}

export interface LocationTrackingData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  job?: string;
  status: string;
  location: Location;
  defaultLocation?: Location;
  lastUpdate: string;
}

export interface ThemeColors {
  tint: string;
  cardBackground: string;
  gradientStart: string;
  gradientEnd: string;
  text: string;
  icon: string;
  background: string;
  buttonBackground?: string;
  buttonText?: string;
}

export interface MapBaseProps {
  locationData?: LocationTrackingData | CheckedInEmployee;
  selectedEmployee?: CheckedInEmployee | null;
  themeColors: ThemeColors;
  mapRef: React.RefObject<any>;
  allEmployees?: CheckedInEmployee[]; // Added for showing multiple employees on map
}
