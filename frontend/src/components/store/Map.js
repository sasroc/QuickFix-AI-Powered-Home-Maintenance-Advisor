import React, { useEffect, useRef } from 'react';
import './Map.css';

function Map({ stores, selectedStore, onStoreSelect, userLocation }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Initialize the map
    if (!mapInstanceRef.current && window.google) {
      const mapOptions = {
        center: userLocation || { lat: 37.7749, lng: -122.4194 },
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        title: 'Your Location'
      });
      markersRef.current.push(userMarker);
    }

    // Add store markers
    stores.forEach(store => {
      const marker = new window.google.maps.Marker({
        position: store.coordinates,
        map: mapInstanceRef.current,
        title: store.name,
        animation: selectedStore?.id === store.id ? window.google.maps.Animation.BOUNCE : null
      });

      // Add click listener
      marker.addListener('click', () => {
        onStoreSelect(store);
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="store-info-window">
            <h3>${store.name}</h3>
            <p>${store.address}</p>
            <p>${store.distance} miles away</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => bounds.extend(marker.getPosition()));
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [stores, selectedStore, userLocation, onStoreSelect]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
    </div>
  );
}

export default Map; 