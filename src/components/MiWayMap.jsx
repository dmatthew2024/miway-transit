import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import protobuf from 'protobufjs';
import FleetNumberChart from './FleetNumberChart';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);
  const [fleetNumberMap, setFleetNumberMap] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusData = async () => {
      try {
        const root = await protobuf.load('/proto/gtfs-realtime.proto');
        const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

        const response = await axios.get('/.netlify/functions/proxy', {
          responseType: 'arraybuffer'
        });

        const message = FeedMessage.decode(new Uint8Array(response.data));
        const object = FeedMessage.toObject(message, {
          enums: String,
          longs: String,
          defaults: true,
          arrays: true,
          objects: true
        });

        const vehiclePositions = object.entity.map(entity => ({
          fleet_number: entity.vehicle.vehicle.id,
          route: entity.vehicle.trip.routeId,
          latitude: entity.vehicle.position.latitude,
          longitude: entity.vehicle.position.longitude,
          occupancy: entity.vehicle.occupancyStatus || 'Unknown'
        }));

        setBuses(vehiclePositions);
        setError(null);
      } catch (error) {
        console.error('Error fetching bus data:', error);
        setError(`Failed to fetch bus data: ${error.message}`);
      }
    };

    const fetchTransseeData = async () => {
      try {
        const routes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']; // Add all relevant route numbers
        const fleetMap = {};

        for (const route of routes) {
          const response = await axios.get(`/.netlify/functions/transseeProxy?route=${route}`);
          const data = response.data;
          
          if (Array.isArray(data)) {
            data.forEach(bus => {
              if (bus && bus.id && bus.vehicle) {
                fleetMap[bus.id] = {
                  publicFleetNumber: bus.vehicle,
                  route: bus.route
                };
              }
            });
          } else {
            console.error('Unexpected data format for route:', route, data);
          }
        }

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

  const filteredBuses = buses.filter(bus => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return (
      bus.fleet_number.toString().toLowerCase().includes(lowerSearchTerm) || 
      bus.route.toString().toLowerCase().includes(lowerSearchTerm)
    );
  });

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