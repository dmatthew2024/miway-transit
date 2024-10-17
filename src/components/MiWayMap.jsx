import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchBusData = async () => {
    try {
      const response = await axios.get('/.netlify/functions/transitProxy');
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

  const fetchRouteData = async (tripId) => {
    try {
      const response = await axios.get(`/.netlify/functions/routeProxy?id=${tripId}`);
      return response.data;
    } catch (err) {
      console.error('Error fetching route data:', err);
      return null;
    }
  };

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
    const routeData = await fetchRouteData(bus.Trip);
    if (routeData) {
      setSelectedRoute(routeData.coordinates);
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
              </div>
            </Popup>
          </Marker>
        ))}
        {selectedRoute && (
          <Polyline
            positions={selectedRoute}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MiWayMap;