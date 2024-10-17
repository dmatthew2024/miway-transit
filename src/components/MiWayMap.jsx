import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// ... (keep the existing marker icon fix)

const RouteLayer = ({ routeData }) => {
  const map = useMap();

  useEffect(() => {
    if (routeData) {
      const bounds = L.latLngBounds(routeData);
      map.fitBounds(bounds);
    }
  }, [map, routeData]);

  if (!routeData) return null;

  return (
    <Polyline
      positions={routeData}
      color="blue"
      weight={3}
      opacity={0.7}
    />
  );
};

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchBusData = async () => {
    try {
      const response = await axios.get('/.netlify/functions/transitProxy');
      console.log('Received bus data:', response.data);
      if (response.data && typeof response.data === 'object') {
        const parsedBuses = Object.values(response.data).map(bus => ({
          ...bus,
          Model: bus.Model ? bus.Model.replace(/"/g, '').trim() : 'N/A'
        }));
        setBuses(parsedBuses);
        setError(null);
      } else {
        setError('Invalid data format received');
      }
    } catch (err) {
      setError('Failed to fetch bus data');
      console.error('Error fetching bus data:', err);
    }
  };

  const fetchRouteData = useCallback(async (tripId) => {
    try {
      console.log('Fetching route data for trip:', tripId);
      const response = await axios.get(`/.netlify/functions/routeProxy?id=${tripId}`);
      console.log('Received route data:', response.data);
      return response.data.coordinates;
    } catch (err) {
      console.error('Error fetching route data:', err);
      setError('Failed to fetch route data');
      return null;
    }
  }, []);

  useEffect(() => {
    fetchBusData();
    const interval = setInterval(fetchBusData, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredBuses = buses.filter(bus => 
    !searchTerm || 
    bus.Bus.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
    bus.Route.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkerClick = async (bus) => {
    console.log('Marker clicked for bus:', bus);
    if (bus.Trip) {
      const routeData = await fetchRouteData(bus.Trip);
      if (routeData) {
        console.log('Setting route data:', routeData);
        setSelectedRoute(routeData);
      }
    } else {
      console.log('No Trip ID available for this bus');
      setError('No route information available for this bus');
    }
  };

  return (
    <div className="map-container" style={{ height: '600px', width: '100%' }}>
      {error && <p className="error-message">Error: {error}</p>}
      <MapContainer center={[43.5890, -79.6441]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredBuses.map(bus => (
          <Marker 
            key={bus.Bus} 
            position={[bus.Lat, bus.Lon]}
            eventHandlers={{
              click: () => handleMarkerClick(bus),
            }}
          >
            <Popup>
              <div className="bus-info">
                <h2>Bus Information</h2>
                <p><strong>Fleet Number:</strong> {bus.Bus}</p>
                <p><strong>Route:</strong> {bus.Route}</p>
                <p><strong>Model:</strong> {bus.Model}</p>
                <p><strong>Trip ID:</strong> {bus.Trip || 'N/A'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <RouteLayer routeData={selectedRoute} />
      </MapContainer>
    </div>
  );
};

export default MiWayMap;