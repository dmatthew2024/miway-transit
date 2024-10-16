import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

const MapUpdater = ({ vehicles }) => {
  const map = useMap();

  useEffect(() => {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    vehicles.forEach((vehicle) => {
      L.marker([vehicle.Lat, vehicle.Lon])
        .addTo(map)
        .bindPopup(`Bus Number: ${vehicle.Bus}<br>Route: ${vehicle.Route}<br>Capacity: ${vehicle.Capacity || 'N/A'}`);
    });
  }, [map, vehicles]);

  return null;
};

const MiWayMap = ({ searchTerm }) => {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);

  const fetchTransitData = async () => {
    try {
      const response = await axios.get('/.netlify/functions/transitProxy');
      if (typeof response.data === 'object' && response.data !== null) {
        const vehiclesArray = Object.values(response.data);
        setVehicles(vehiclesArray);
        setError(null);
      } else {
        setError('Received invalid data format');
      }
    } catch (error) {
      setError(`Failed to fetch transit data: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchTransitData();
    const interval = setInterval(fetchTransitData, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true;
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    return (
      vehicle.Bus?.toString().toLowerCase() === trimmedSearchTerm ||
      vehicle.Route?.toString().toLowerCase() === trimmedSearchTerm
    );
  });

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold mb-4">MiWay Transit Tracker</h1>
      <p className="mb-4">Search Term: {searchTerm}</p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {/* Map Container */}
      <div className="h-[600px] w-full mb-8" style={{ border: '1px solid #ccc' }}>
        <MapContainer center={[43.5890, -79.6441]} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapUpdater vehicles={filteredVehicles} />
        </MapContainer>
      </div>

      {/* Fleet Number Mapping */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Fleet Number Mapping</h2>
        {filteredVehicles.length > 0 ? (
          <ul className="list-disc pl-5">
            {filteredVehicles.map((vehicle) => (
              <li key={vehicle.Bus}>
                Bus Number: {vehicle.Bus}, Route: {vehicle.Route}, Status: {vehicle.Status}
              </li>
            ))}
          </ul>
        ) : (
          <p>No vehicles match the search criteria.</p>
        )}
      </div>
    </div>
  );
};

export default MiWayMap;