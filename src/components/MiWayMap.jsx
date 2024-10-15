import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import protobuf from 'protobufjs';
import FleetNumberChart from './FleetNumberChart';

// ... (keep existing icon setup)

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);
  const [fleetNumberMap, setFleetNumberMap] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusData = async () => {
      // ... (keep existing GTFS-RT fetching logic)
    };

    const fetchTransseeData = async () => {
      try {
        const routes = ['1', '2', '3']; // Add all relevant route numbers
        const fleetMap = {};

        for (const route of routes) {
          const response = await axios.get(`https://www.transsee.ca/routeveh?a=miway&r=${route}&refresh=30`);
          const data = response.data; // Adjust based on actual response format
          
          data.forEach(bus => {
            fleetMap[bus.id] = {
              publicFleetNumber: bus.vehicle,
              route: bus.route
            };
          });
        }

        setFleetNumberMap(fleetMap);
      } catch (error) {
        console.error('Error fetching Transsee data:', error);
      }
    };

    fetchBusData();
    fetchTransseeData();

    const interval = setInterval(fetchBusData, 30000);
    const transsseeInterval = setInterval(fetchTransseeData, 300000); // Update every 5 minutes

    return () => {
      clearInterval(interval);
      clearInterval(transsseeInterval);
    };
  }, []);

  // ... (keep existing filtering logic)

  return (
    <div>
      <h1>MiWay Transit Tracker</h1>
      <p>Search Term: {searchTerm}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
                Occupancy: {bus.occupancy}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <FleetNumberChart fleetNumberMap={fleetNumberMap} />
    </div>
  );
};

export default MiWayMap;