import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Map from './Map';
import './StoreFinder.css';

// Store templates for additional information
const storeTemplates = {
  "Home Depot": {
    rating: 4.5,
    reviews: 128,
    hours: "7:00 AM - 9:00 PM",
    phone: "(555) 123-4567",
    website: "https://homedepot.com",
  },
  "Lowe's": {
    rating: 4.3,
    reviews: 95,
    hours: "6:00 AM - 10:00 PM",
    phone: "(555) 987-6543",
    website: "https://lowes.com",
  },
  "Ace Hardware": {
    rating: 4.7,
    reviews: 64,
    hours: "8:00 AM - 8:00 PM",
    phone: "(555) 456-7890",
    website: "https://acehardware.com",
  },
  "True Value": {
    rating: 4.4,
    reviews: 82,
    hours: "8:00 AM - 7:00 PM",
    phone: "(555) 789-0123",
    website: "https://truevalue.com",
  },
  "Cole Hardware": {
    rating: 4.6,
    reviews: 156,
    hours: "7:30 AM - 8:30 PM",
    phone: "(555) 234-5678",
    website: "https://colehardware.com",
  },
  "Menards": {
    rating: 4.2,
    reviews: 112,
    hours: "6:30 AM - 9:00 PM",
    phone: "(555) 345-6789",
    website: "https://menards.com",
  },
  "Harbor Freight": {
    rating: 4.1,
    reviews: 89,
    hours: "8:00 AM - 8:00 PM",
    phone: "(555) 567-8901",
    website: "https://harborfreight.com",
  }
};

function StoreFinder() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(10); // Default 10 miles radius
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [useMiles, setUseMiles] = useState(true); // Default to miles

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c; // Distance in km
    return useMiles ? Math.round((distanceKm * 0.621371) * 10) / 10 : Math.round(distanceKm * 10) / 10;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const fetchNearbyStores = useCallback(async (lat, lng, radius) => {
    try {
      // Convert radius from miles to meters for Google Places API
      const radiusMeters = radius * 1609.34;
      
      // Create the Google Places API request
      const request = {
        location: { lat, lng },
        radius: radiusMeters,
        type: 'hardware_store',
        keyword: 'hardware store'
      };

      console.log('Searching for stores with request:', request);

      // Use the Google Places API
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            console.log('Google Places API results:', results);
            
            // Process the results
            const stores = results.map(place => {
              // Get additional details for each place
              service.getDetails({
                placeId: place.place_id,
                fields: ['name', 'formatted_address', 'formatted_phone_number', 'opening_hours', 'website', 'rating', 'user_ratings_total']
              }, (placeDetails, detailsStatus) => {
                if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK) {
                  console.log('Place details:', placeDetails);
                }
              });

              // Find matching template or create default
              const template = storeTemplates[Object.keys(storeTemplates).find(key => 
                place.name.toLowerCase().includes(key.toLowerCase())
              )] || {
                rating: place.rating || 4.0,
                reviews: place.user_ratings_total || 50,
                hours: place.opening_hours ? place.opening_hours.weekday_text.join(', ') : "8:00 AM - 6:00 PM",
                phone: place.formatted_phone_number || "(555) 000-0000",
                website: place.website || "#"
              };

              return {
                id: place.place_id,
                name: place.name,
                coordinates: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                address: place.vicinity || 'Address not available',
                distance: calculateDistance(lat, lng, place.geometry.location.lat(), place.geometry.location.lng()),
                ...template
              };
            });

            console.log('Processed stores:', stores);
            resolve(stores);
          } else {
            console.error('Google Places API error:', status);
            reject(new Error('Failed to fetch stores'));
          }
        });
      });
    } catch (error) {
      console.error('Error fetching stores:', error);
      return [];
    }
  }, [calculateDistance]);

  // Get user location
  useEffect(() => {
    let isMounted = true;

    const getLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isMounted) {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              console.log('Received user location:', newLocation);
              setUserLocation(newLocation);
            }
          },
          (error) => {
            if (isMounted) {
              console.error('Error getting location:', error);
              setLocationError("Unable to get your location. Using default location.");
              // Set default location
              setUserLocation({ lat: 37.7749, lng: -122.4194 });
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        if (isMounted) {
          setLocationError("Geolocation is not supported by your browser.");
          // Set default location
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch stores when user location or radius changes
  useEffect(() => {
    const loadStores = async () => {
      if (userLocation) {
        setLoading(true);
        const fetchedStores = await fetchNearbyStores(
          userLocation.lat,
          userLocation.lng,
          radius
        );
        setStores(fetchedStores);
        setLoading(false);
      }
    };

    loadStores();
  }, [userLocation, radius, fetchNearbyStores]);

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.distance - b.distance);

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
  };

  const handleRadiusChange = (e) => {
    const newRadius = Number(e.target.value);
    setRadius(newRadius);
  };

  const handleGetDirections = () => {
    if (selectedStore && userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedStore.coordinates.lat},${selectedStore.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleCallStore = () => {
    if (selectedStore) {
      window.location.href = `tel:${selectedStore.phone}`;
    }
  };

  return (
    <div className="store-finder">
      <div className="store-finder-header">
        <h2>Find Hardware Stores Near You</h2>
        <p>Locate the nearest stores for your repair supplies</p>
        {locationError && <p className="location-error">{locationError}</p>}
      </div>

      <div className="store-finder-content">
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="radius-filter">
            <label>Search Radius:</label>
            <select value={radius} onChange={handleRadiusChange}>
              <option value={5}>5 {useMiles ? 'miles' : 'km'}</option>
              <option value={10}>10 {useMiles ? 'miles' : 'km'}</option>
              <option value={15}>15 {useMiles ? 'miles' : 'km'}</option>
              <option value={20}>20 {useMiles ? 'miles' : 'km'}</option>
            </select>
            <button 
              className="unit-toggle"
              onClick={() => setUseMiles(!useMiles)}
            >
              Switch to {useMiles ? 'km' : 'miles'}
            </button>
          </div>
        </div>

        <div className="stores-container">
          <div className="stores-list">
            {loading ? (
              <div className="loading">Loading stores...</div>
            ) : filteredStores.length === 0 ? (
              <div className="no-stores">No stores found in this area</div>
            ) : (
              filteredStores.map(store => (
                <motion.div
                  key={store.id}
                  className={`store-card ${selectedStore?.id === store.id ? 'selected' : ''}`}
                  onClick={() => handleStoreSelect(store)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3>{store.name}</h3>
                  <div className="store-details">
                    <p className="address">{store.address}</p>
                    <p className="distance">{store.distance} {useMiles ? 'miles' : 'km'} away</p>
                    <div className="rating">
                      <span className="stars">{"★".repeat(Math.floor(store.rating))}</span>
                      <span className="rating-number">{store.rating}</span>
                      <span className="reviews">({store.reviews} reviews)</span>
                    </div>
                    <p className="hours">Hours: {store.hours}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="store-map">
            <Map
              stores={filteredStores}
              selectedStore={selectedStore}
              onStoreSelect={handleStoreSelect}
              userLocation={userLocation}
            />
          </div>
        </div>

        {selectedStore && (
          <motion.div
            className="store-details-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3>{selectedStore.name}</h3>
            <div className="details-content">
              <div className="detail-item">
                <span className="label">Address:</span>
                <span className="value">{selectedStore.address}</span>
              </div>
              <div className="detail-item">
                <span className="label">Phone:</span>
                <span className="value">{selectedStore.phone}</span>
              </div>
              <div className="detail-item">
                <span className="label">Hours:</span>
                <span className="value">{selectedStore.hours}</span>
              </div>
              <div className="detail-item">
                <span className="label">Website:</span>
                <a href={selectedStore.website} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              </div>
            </div>
            <div className="action-buttons">
              <button 
                className="directions-button"
                onClick={handleGetDirections}
                disabled={!userLocation}
              >
                Get Directions
              </button>
              <button 
                className="call-button"
                onClick={handleCallStore}
              >
                Call Store
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default StoreFinder; 