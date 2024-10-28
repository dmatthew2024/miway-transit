import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const mapRef = useRef(null);

  const fetchBusData = async () => {
    try {
      const response = await axios.get('/.netlify/functions/transitProxy');
      if (response.data && typeof response.data === 'object') {
        const parsedBuses = Object.entries(response.data).map(([key, bus]) => ({
          id: key,
          Bus: bus.Bus ? bus.Bus.toString().trim() : 'N/A',
          Route: bus.Route ? bus.Route.toString().trim() : 'N/A',
          Model: bus.Model ? bus.Model.replace(/"/g, '').trim() : 'N/A',
          Lat: parseFloat(bus.Lat) || 0,
          Lon: parseFloat(bus.Lon) || 0
        })).filter(bus => bus.Lat !== 0 && bus.Lon !== 0);

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

  const fetchRouteData = async (routeNumber) => {
    try {
      const response = await axios.get('https://transit55.ca/mississauga/map/data.json');
      const routeData = response.data.find(route => route.id === routeNumber);
      
      if (routeData && routeData.path) {
        // Convert path to array of [lat, lng] coordinates
        const coordinates = routeData.path.map(point => [point.lat, point.lon]);
        setRoutePath(coordinates);
      }
    } catch (err) {
      console.error('Error fetching route data:', err);
      setError('Failed to fetch route data');
    }
  };

  useEffect(() => {
    fetchBusData();
    const interval = setInterval(fetchBusData, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredBuses = buses.filter(bus => {
    if (!searchTerm) return true;
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    
    const routeMatch = bus.Route.toLowerCase().includes(trimmedSearchTerm);
    const busMatch = bus.Bus.toLowerCase().includes(trimmedSearchTerm);
    
    return routeMatch || busMatch;
  });

  const handleBusClick = async (bus) => {
    setSelectedBus(bus.id === selectedBus ? null : bus.id);
    if (bus.Route !== 'N/A') {
      await fetchRouteData(bus.Route);
    }
  };

  const RouteDisplay = () => {
    const map = useMap();

    useEffect(() => {
      if (routePath.length > 0) {
        const bounds = L.latLngBounds(routePath);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [routePath, map]);

    return routePath.length > 0 ? (
      <Polyline
        positions={routePath}
        color="#2563eb"
        weight={4}
        opacity={0.8}
      />
    ) : null;
  };

  return (
    <div className="map-container h-[600px] w-full">
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      <MapContainer
        center={[43.5890, -79.6441]}
        zoom={12}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredBuses.map(bus => (
          <Marker 
            key={bus.id} 
            position={[bus.Lat, bus.Lon]}
            eventHandlers={{
              click: () => handleBusClick(bus),
            }}
          >
            <Popup>
              <div className="bus-info">
                <h2 className="text-lg font-bold mb-2">Bus Information</h2>
                <p><strong>Fleet Number:</strong> {bus.Bus}</p>
                <p><strong>Route:</strong> {bus.Route}</p>
                <p><strong>Model:</strong> {bus.Model}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <RouteDisplay />
      </MapContainer>
    </div>
  );
};

export default MiWayMap;