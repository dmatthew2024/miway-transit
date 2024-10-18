import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState(null);

  const fetchBusData = async () => {
    try {
      const response = await axios.get('/.netlify/functions/transitProxy');
      if (response.data && typeof response.data === 'object') {
        const parsedBuses = Object.values(response.data).map(bus => ({
          ...bus,
          Model: bus.Model ? bus.Model.replace(/"/g, '').trim() : 'N/A',
          Route: bus.Route ? bus.Route.toString().trim() : 'N/A'
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

  useEffect(() => {
    fetchBusData();
    const interval = setInterval(fetchBusData, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredBuses = buses.filter(bus => {
    if (!searchTerm) return true;
    const trimmedSearchTerm = searchTerm.trim();
    
    // Convert both to strings and trim for comparison
    const busRoute = bus.Route.toString().trim();
    
    // Exact match for route number
    if (busRoute === trimmedSearchTerm) return true;
    
    // If searchTerm is not a number, allow partial match for bus number (fleet ID)
    if (isNaN(trimmedSearchTerm) && bus.Bus.toString().includes(trimmedSearchTerm)) return true;
    
    return false;
  });

  return (
    <div className="map-container" style={{ height: '600px', width: '100%' }}>
      {error && <p className="error-message">Error: {error}</p>}
      <MapContainer center={[43.5890, -79.6441]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredBuses.map(bus => (
          <Marker key={bus.Bus} position={[bus.Lat, bus.Lon]}>
            <Popup>
              <div className="bus-info">
                <h2>Bus Information</h2>
                <p><strong>Fleet Number:</strong> {bus.Bus || 'N/A'}</p>
                <p><strong>Route:</strong> {bus.Route || 'N/A'}</p>
                <p><strong>Model:</strong> {bus.Model || 'N/A'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MiWayMap;