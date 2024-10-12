import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import protobuf from 'protobufjs';

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  useEffect(() => {
    const fetchBusData = async () => {
      try {
        console.log('Fetching bus data...', new Date().toLocaleTimeString());
        
        const root = await protobuf.load('/miway-transit/proto/gtfs-realtime.proto');
        const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

        const baseUrl = import.meta.env.PROD 
          ? 'https://www.miapp.ca' 
          : '/api';
        const url = `${baseUrl}/GTFS_RT/Vehicle/VehiclePositions.pb`;

        const response = await axios.get(url, {
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
        setLastUpdateTime(new Date());
        console.log("Bus data updated, count:", vehiclePositions.length);
      } catch (error) {
        console.error('Error fetching or decoding the .pb file:', error);
        setError(`Error: ${error.message}`);
      }
    };

    fetchBusData();
    const intervalId = setInterval(fetchBusData, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredBuses = buses.filter((bus) => {
    const routeMatch = bus.route.toLowerCase().includes(searchTerm.toLowerCase());
    const fleetMatch = bus.fleet_number.toLowerCase().includes(searchTerm.toLowerCase());
    return routeMatch || fleetMatch;
  });

  return (
    <div>
      {error && <div style={{color: 'red', padding: '10px'}}>{error}</div>}
      <MapContainer center={[43.5890, -79.6441]} zoom={12} style={{ height: "80vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {filteredBuses.map((bus) => (
          <Marker key={bus.fleet_number} position={[bus.latitude, bus.longitude]}>
            <Popup>
              <strong>Fleet Number:</strong> {bus.fleet_number} <br />
              <strong>Route:</strong> {bus.route} <br />
              <strong>Occupancy:</strong> {bus.occupancy}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div>Total buses: {filteredBuses.length}</div>
      <div>Last updated: {lastUpdateTime.toLocaleTimeString()}</div>
    </div>
  );
};

export default MiWayMap;