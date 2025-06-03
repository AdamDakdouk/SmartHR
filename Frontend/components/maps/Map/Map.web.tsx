// // components/maps/Map/Map.web.tsx
// import React, { useEffect, useRef, useState } from "react";
// import { View, Text, StyleSheet } from "react-native";
// import { LocationTrackingData, MapBaseProps } from "./Map.types";
// import { LEBANON_COORDINATES } from "@/api/location";
// import { FontAwesome5 } from "@expo/vector-icons";

// declare global {
//   interface Window {
//     google: any;
//     initMap?: () => void;
//   }
// }

// const WebMap: React.FC<MapBaseProps> = ({
//   locationData,
//   selectedEmployee,
//   themeColors,
//   mapRef,
//   allEmployees,
// }) => {
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const googleMapRef = useRef<any>(null);
//   // Using an array reference for markers
//   const markersRef = useRef<any[]>([]);
//   const [mapError, setMapError] = useState<string | null>(null);
//   const [mapLoaded, setMapLoaded] = useState(false);

//   useEffect(() => {
//     let scriptElement: HTMLScriptElement | null = null;
//     const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

//     if (!API_KEY) {
//       setMapError("Google Maps API key is missing");
//       return;
//     }

//     const initializeMap = () => {
//       if (!mapContainerRef.current) return;

//       try {
//         const mapInstance = new window.google.maps.Map(
//           mapContainerRef.current,
//           {
//             center: {
//               lat: LEBANON_COORDINATES.latitude,
//               lng: LEBANON_COORDINATES.longitude,
//             },
//             zoom: 8,
//             disableDefaultUI: true,
//             zoomControl: true,
//             styles: [
//               {
//                 elementType: "geometry",
//                 stylers: [{ color: themeColors.cardBackground }],
//               },
//               {
//                 elementType: "labels.text.fill",
//                 stylers: [{ color: themeColors.text }],
//               },
//               {
//                 elementType: "labels.text.stroke",
//                 stylers: [{ color: themeColors.background }],
//               },
//             ],
//           }
//         );

//         googleMapRef.current = mapInstance;
//         if (mapRef) {
//           // @ts-ignore - Assigning to the ref from props
//           mapRef.current = mapInstance;
//         }
//         setMapLoaded(true);
//       } catch (error) {
//         console.error("Map initialization error:", error);
//         setMapError("Failed to initialize map");
//       }
//     };

//     const loadGoogleMaps = () => {
//       window.initMap = initializeMap;

//       if (!window.google?.maps) {
//         scriptElement = document.createElement("script");
//         scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`;
//         scriptElement.async = true;
//         scriptElement.onerror = () => setMapError("Failed to load Google Maps");
//         document.head.appendChild(scriptElement);
//       } else {
//         initializeMap();
//       }
//     };

//     loadGoogleMaps();

//     return () => {
//       if (scriptElement) {
//         document.head.removeChild(scriptElement);
//       }
//       window.initMap = undefined;
//     };
//   }, [themeColors]);

//   // Clear all markers
//   const clearMarkers = () => {
//     if (markersRef.current.length > 0) {
//       markersRef.current.forEach((marker) => marker.setMap(null));
//       markersRef.current = [];
//     }
//   };

//   // Calculate distance between two points using Haversine formula (in kilometers)
//   const calculateDistance = (
//     loc1: { latitude: number; longitude: number },
//     loc2: { latitude: number; longitude: number }
//   ): number => {
//     if (!loc1 || !loc2) return 0;

//     // Earth radius in km
//     const R = 6371;
//     const lat1 = (loc1.latitude * Math.PI) / 180;
//     const lat2 = (loc2.latitude * Math.PI) / 180;
//     const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
//     const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

//     // Use Number() to ensure we're working with number types
//     const a =
//       Math.sin(Number(dLat) / 2) * Math.sin(Number(dLat) / 2) +
//       Math.cos(Number(lat1)) *
//         Math.cos(Number(lat2)) *
//         Math.sin(Number(dLon) / 2) *
//         Math.sin(Number(dLon) / 2);

//     const c = 2 * Math.atan2(Math.sqrt(Number(a)), Math.sqrt(1 - Number(a)));
//     return R * Number(c);
//   };

//   // Format time difference for the info window
//   const formatTimeDiff = (timestamp: string | number | Date): string => {
//     if (!timestamp) return "N/A";

//     const now = new Date();
//     const updatedAt = new Date(timestamp);
//     const diffMs = now.getTime() - updatedAt.getTime();

//     if (diffMs < 60000) return "Just now";
//     if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
//     if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
//     return `${Math.floor(diffMs / 86400000)}d ago`;
//   };

//   // Create a marker for an employee
//   const createEmployeeMarker = (employee: LocationTrackingData) => {
//     if (!googleMapRef.current || !employee?.location) return null;

//     const position = {
//       lat: employee.location.latitude,
//       lng: employee.location.longitude,
//     };

//     // Check if employee is away from default location
//     const isAway =
//       employee.defaultLocation &&
//       calculateDistance(employee.location, employee.defaultLocation) > 0.1;

//     const markerColor = isAway ? "#FF5252" : themeColors.tint;

//     const marker = new window.google.maps.Marker({
//       position,
//       map: googleMapRef.current,
//       title: `${employee.firstName} ${employee.lastName}`,
//       icon: {
//         url:
//           "data:image/svg+xml;charset=UTF-8," +
//           encodeURIComponent(`
//           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//             <circle cx="12" cy="12" r="12" fill="${markerColor}"/>
//             <circle cx="12" cy="12" r="6" fill="white"/>
//           </svg>
//         `),
//         size: new window.google.maps.Size(24, 24),
//         anchor: new window.google.maps.Point(12, 12),
//       },
//     });

//     const infoWindow = new window.google.maps.InfoWindow({
//       content: `
//         <div style="padding: 8px; max-width: 200px;">
//           <div style="font-weight: 600; margin-bottom: 4px;">
//             ${employee.firstName} ${employee.lastName}
//           </div>
//           <div style="font-size: 12px; margin-bottom: 4px;">
//             ${employee.job || employee.email || ""}
//           </div>
//           <div style="font-size: 12px; color: #666;">
//             Last updated: ${formatTimeDiff(
//               employee.location.updatedAt || employee.lastUpdate
//             )}
//           </div>
//           ${
//             isAway
//               ? `
//             <div style="font-size: 12px; color: #FF5252; margin-top: 4px; font-weight: 500;">
//               Away from default location
//             </div>
//           `
//               : ""
//           }
//         </div>
//       `,
//     });

//     marker.addListener("click", () => {
//       infoWindow.open(googleMapRef.current, marker);
//     });

//     // Add marker to our array so we can reference it later
//     markersRef.current.push(marker);
//     return marker;
//   };

//   // Display all employees on map
//   useEffect(() => {
//     if (!googleMapRef.current || !mapLoaded) return;

//     clearMarkers();

//     // If there's a selected employee, show just that one with focus
//     if (selectedEmployee && selectedEmployee.location) {
//       const marker = createEmployeeMarker(selectedEmployee);

//       if (marker) {
//         const position = {
//           lat: selectedEmployee.location.latitude,
//           lng: selectedEmployee.location.longitude,
//         };
//         googleMapRef.current.panTo(position);
//         googleMapRef.current.setZoom(15);
//       }
//     }
//     // Otherwise show all employees if available
//     else if (allEmployees && allEmployees.length > 0) {
//       const bounds = new window.google.maps.LatLngBounds();

//       allEmployees.forEach((employee) => {
//         if (employee && employee.location) {
//           const marker = createEmployeeMarker(employee);

//           if (marker) {
//             bounds.extend(marker.getPosition());
//           }
//         }
//       });

//       // Only adjust bounds if we have markers
//       if (markersRef.current.length > 0) {
//         googleMapRef.current.fitBounds(bounds);

//         // Don't zoom in too far
//         const listener = window.google.maps.event.addListener(
//           googleMapRef.current,
//           "idle",
//           () => {
//             if (googleMapRef.current.getZoom() > 15) {
//               googleMapRef.current.setZoom(15);
//             }
//             window.google.maps.event.removeListener(listener);
//           }
//         );
//       }
//     }
//     // If we only have single locationData (backward compatibility)
//     else if (locationData && locationData.location) {
//       const marker = createEmployeeMarker(locationData);

//       if (marker) {
//         const position = {
//           lat: locationData.location.latitude,
//           lng: locationData.location.longitude,
//         };
//         googleMapRef.current.panTo(position);
//         googleMapRef.current.setZoom(15);
//       }
//     }
//   }, [selectedEmployee, allEmployees, locationData, mapLoaded]);

//   if (mapError) {
//     return (
//       <View
//         style={[
//           styles.errorContainer,
//           { backgroundColor: themeColors.cardBackground },
//         ]}
//       >
//         <FontAwesome5
//           name="map-marked-alt"
//           size={32}
//           color={themeColors.icon}
//           style={styles.errorIcon}
//         />
//         <Text style={[styles.errorText, { color: themeColors.text }]}>
//           {mapError}
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <div
//       ref={mapContainerRef}
//       style={{
//         width: "100%",
//         height: "100%",
//         borderRadius: "18px",
//         overflow: "hidden",
//       }}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   errorContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 20,
//     borderRadius: 18,
//   },
//   errorIcon: {
//     marginBottom: 12,
//     opacity: 0.5,
//   },
//   errorText: {
//     fontSize: 16,
//     textAlign: "center",
//     opacity: 0.7,
//   },
// });

// export default WebMap;
