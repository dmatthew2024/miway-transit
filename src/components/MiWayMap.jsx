import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const MiWayMap = ({ searchTerm }) => {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransitData = async () => {
      try {
        const response = await axios.get('/.netlify/functions/transitProxy');
        console.log('Received transit data:', response.data);
        setVehicles(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching transit data:', error);
        setError(`Failed to fetch transit data: ${error.message}`);
      }
    };

    fetchTransitData();
    const interval = setInterval(fetchTransitData, 15000);

    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true;
    const trimmedSearchTerm = searchTerm.trim();
    return (
      vehicle.Bus === trimmedSearchTerm ||
      vehicle.Route === trimmedSearchTerm
    );
  });

  // Prepare data for the chart
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
      {vehicles.length === 0 ? (
        <p>Loading transit data...</p>
      ) : (
        <>
          <div className="h-[600px] w-full mb-8">
            <MapContainer center={[43.5890, -79.6441]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredVehicles.map((vehicle) => (
                <Marker key={vehicle.Bus} position={[vehicle.Lat, vehicle.Lon]}>
                  <Popup>
                    Bus Number: {vehicle.Bus}<br />
                    Route: {vehicle.Route}<br />
                    Status: {vehicle.Status}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

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
              <p>No exact matches found for the given search term.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MiWayMap;