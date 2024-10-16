import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// This component will handle map updates
const MapUpdater = ({ vehicles }) => {
  const map = useMap();

  useEffect(() => {
    const markers = {};

    vehicles.forEach((vehicle) => {
      const position = [vehicle.Lat, vehicle.Lon];
      
      if (markers[vehicle.Bus]) {
        markers[vehicle.Bus].setLatLng(position);
      } else {
        markers[vehicle.Bus] = L.marker(position)
          .addTo(map)
          .bindPopup(`Bus Number: ${vehicle.Bus}<br>Route: ${vehicle.Route}<br>Status: ${vehicle.Status}`);
      }
    });

    // Remove markers for buses that are no longer in the data
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const busNumber = layer.getPopup().getContent().split('<br>')[0].split(': ')[1];
        if (!vehicles.some(v => v.Bus.toString() === busNumber)) {
          map.removeLayer(layer);
        }
      }
    });

    return () => {
      Object.values(markers).forEach(marker => map.removeLayer(marker));
    };
  }, [map, vehicles]);

  return null;
};

const MiWayMap = ({ searchTerm }) => {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);

  const fetchTransitData = async () => {
    console.log('Fetching transit data...');
    try {
      const response = await axios.get('/.netlify/functions/transitProxy');
      console.log('Received transit data:', response.data);
      if (typeof response.data === 'object' && response.data !== null) {
        const vehiclesArray = Object.values(response.data);
        setVehicles(vehiclesArray);
        setError(null);
      } else {
        console.error('Received data is not an object:', response.data);
        setError('Received invalid data format');
      }
    } catch (error) {
      console.error('Error fetching transit data:', error);
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

  const chartData = filteredVehicles.reduce((acc, vehicle) => {
    const routeIndex = acc.findIndex(item => item.Route === vehicle.Route);
    if (routeIndex > -1) {
      acc[routeIndex].count += 1;
    } else {
      acc.push({ Route: vehicle.Route, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold mb-4">MiWay Transit Tracker</h1>
      <p className="mb-4">Search Term: {searchTerm}</p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {/* Map Container */}
      <div className="h-[400px] w-full mb-8" style={{ border: '1px solid #ccc' }}>
        <MapContainer center={[43.5890, -79.6441]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapUpdater vehicles={vehicles} />
        </MapContainer>
      </div>

      {/* Chart and Fleet Number Mapping */}
      {vehicles.length === 0 ? (
        <p>Loading transit data... (Vehicles: {vehicles.length})</p>
      ) : (
        <>
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Fleet Number and Route Chart</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Route" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Number of Buses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
        </>
      )}
    </div>
  );
};

export default MiWayMap;