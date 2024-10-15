import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import protobuf from 'protobufjs';
import FleetNumberChart from './FleetNumberChart';

// ... (keep the existing icon fix code)

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);
  const [fleetNumberMap, setFleetNumberMap] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusData = async () => {
      // ... (keep the existing fetchBusData function)
    };

    const fetchTransseeData = async () => {
      try {
        const routes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']; // Add all relevant route numbers
        const fleetMap = {};

        for (const route of routes) {
          const response = await axios.get(`/.netlify/functions/transseeProxy?route=${route}`);
          const data = response.data;
          
          console.log(`Transsee data for route ${route}:`, data);

          if (Array.isArray(data)) {
            data.forEach(bus => {
              if (bus && bus.id && bus.vehicle) {
                fleetMap[bus.id] = {
                  publicFleetNumber: bus.vehicle,
                  route: bus.route
                };
              }
            });
          }
        }

        console.log('Final fleetMap:', fleetMap);
        setFleetNumberMap(fleetMap);
      } catch (error) {
        console.error('Error fetching Transsee data:', error);
      }
    };

    fetchBusData();
    fetchTransseeData();

    const interval = setInterval(fetchBusData, 30000);
    const transsseeInterval = setInterval(fetchTransseeData, 300000);

    return () => {
      clearInterval(interval);
      clearInterval(transsseeInterval);
    };
  }, []);

  // ... (keep the existing filteredBuses logic)

  return (
    <div>
      <h1>MiWay Transit Tracker</h1>
      <p>Search Term: {searchTerm}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {buses.length === 0 ? (
        <p>Loading bus data...</p>
      ) : (
        <div style={{ height: "600px", width: "100%" }}>
          <MapContainer center={[43.5890, -79.6441]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredBuses.map((bus) => (
              <Marker key={bus.fleet_number} position={[bus.latitude, bus.longitude]}>
                <Popup>
                  Internal ID: {bus.fleet_number}<br />
                  Route: {bus.route}<br />
                  Occupancy: {bus.occupancy}<br />
                  Public Fleet Number: {fleetNumberMap[bus.fleet_number]?.publicFleetNumber || 'Unknown'}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
      <FleetNumberChart fleetNumberMap={fleetNumberMap} />
    </div>
  );
};

export default MiWayMap;