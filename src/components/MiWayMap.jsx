import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransitData = async () => {
      try {
        const response = await axios.get('/.netlify/functions/transitProxy');
        setVehicles(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching transit data:', error);
        setError(`Failed to fetch transit data: ${error.message}`);
      }
    };

    fetchTransitData();
    const interval = setInterval(fetchTransitData, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return (
      vehicle.id.toString().toLowerCase().includes(lowerSearchTerm) ||
      vehicle.fleet.toString().toLowerCase().includes(lowerSearchTerm) ||
      vehicle.route.toString().toLowerCase().includes(lowerSearchTerm)
    );
  });

  return (
    <div>
      <h1>MiWay Transit Tracker</h1>
      <p>Search Term: {searchTerm}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {vehicles.length === 0 ? (
        <p>Loading transit data...</p>
      ) : (
        <div style={{ height: "600px", width: "100%" }}>
          <MapContainer center={[43.5890, -79.6441]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredVehicles.map((vehicle) => (
              <Marker key={vehicle.id} position={[vehicle.lat, vehicle.lon]}>
                <Popup>
                  ID: {vehicle.id}<br />
                  Fleet Number: {vehicle.fleet}<br />
                  Route: {vehicle.route}<br />
                  Status: {vehicle.status}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default MiWayMap;