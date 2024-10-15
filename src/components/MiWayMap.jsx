import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import protobuf from 'protobufjs';

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

  useEffect(() => {
    const fetchBusData = async () => {
      console.log('Fetching bus data...');
      try {
        const root = await protobuf.load('/proto/gtfs-realtime.proto');
        const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

        const url = '/.netlify/functions/proxy';

        console.log('Fetching data from:', url);
        const response = await axios.get(url, {
          responseType: 'arraybuffer'
        });
        console.log('Response received:', response);

        const message = FeedMessage.decode(new Uint8Array(response.data));
        const object = FeedMessage.toObject(message, {
          enums: String,
          longs: String,
          defaults: true,
          arrays: true,
          objects: true
        });
        console.log('Decoded protobuf message:', object);

        const vehiclePositions = object.entity.map(entity => ({
          fleet_number: entity.vehicle.vehicle.id,
          route: entity.vehicle.trip.routeId,
          latitude: entity.vehicle.position.latitude,
          longitude: entity.vehicle.position.longitude,
          occupancy: entity.vehicle.occupancyStatus || 'Unknown'
        }));

        console.log('Processed bus data:', vehiclePositions);
        setBuses(vehiclePositions);
        setError(null);
      } catch (error) {
        console.error('Error fetching bus data:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        setError(`Failed to fetch bus data: ${error.message}. ${error.response ? JSON.stringify(error.response.data) : ''}`);
      }
    };

    fetchBusData();
    const interval = setInterval(fetchBusData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter buses based on search term (fleet number or route)
  const filteredBuses = buses.filter(bus => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      bus.fleet_number.toString().toLowerCase().includes(lowerSearchTerm) || 
      bus.route.toString().toLowerCase().includes(lowerSearchTerm)
    );
  });

  return (
    <div>
      <h1>MiWay Transit Tracker</h1>
      <p>Search Term: {searchTerm}</p>
      <p>If you can see this, the component is rendering correctly.</p>
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
                Fleet Number: {bus.fleet_number}<br />
                Route: {bus.route}<br />
                Occupancy: {bus.occupancy}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MiWayMap;