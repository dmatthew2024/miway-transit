import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import protobuf from 'protobufjs';

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);
  const [mapKey, setMapKey] = useState('default-map');
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Function to fetch bus data from the .pb file
  const fetchBusData = async () => {
    try {
      const root = await protobuf.load('/proto/gtfs-realtime.proto');
      const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

      const response = await axios.get('/api/GTFS_RT/Vehicle/VehiclePositions.pb', {
        responseType: 'arraybuffer',
      });

      const message = FeedMessage.decode(new Uint8Array(response.data));
      const object = FeedMessage.toObject(message, {
        enums: String,
        longs: String,
        defaults: true,
        arrays: true,
        objects: true,
      });

      const vehiclePositions = object.entity.map(entity => ({
        fleet_number: entity.vehicle.vehicle.id,
        route: entity.vehicle.trip.routeId,
        latitude: entity.vehicle.position.latitude,
        longitude: entity.vehicle.position.longitude,
        occupancy: entity.vehicle.occupancyStatus || 'Unknown',
      }));

      setBuses(vehiclePositions);
    } catch (error) {
      console.error('Error fetching or decoding the .pb file:', error);
    }
  };

  // Fetch bus data on component mount and set up interval to refresh data every 15 seconds
  useEffect(() => {
    fetchBusData();
    const intervalId = setInterval(() => {
      fetchBusData();
    }, 15000); // Update every 15 seconds

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Reset the map key whenever the search term changes to avoid map reinitialization issues
  useEffect(() => {
    setMapKey(`map-${localSearchTerm}`);
  }, [localSearchTerm]);

  // Filter buses based on the search term for both fleet number and route
  const filteredBuses = buses.filter(bus => {
    const routeMatch = bus.route.toLowerCase().includes(localSearchTerm.toLowerCase());
    const fleetMatch = bus.fleet_number.toLowerCase().includes(localSearchTerm.toLowerCase());
    return routeMatch || fleetMatch;
  });

  return (
    <>
      <input
        type="text"
        placeholder="Search by fleet number or route" // Updated placeholder text
        value={localSearchTerm}
        onChange={(e) => setLocalSearchTerm(e.target.value)} // Update the search term as the user types
      />
      <MapContainer
        key={mapKey} // Reset the map if the key changes
        center={[43.5890, -79.6441]}
        zoom={12}
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {filteredBuses.map(bus => (
          <Marker key={bus.fleet_number} position={[bus.latitude, bus.longitude]}>
            <Popup>
              <strong>Fleet Number:</strong> {bus.fleet_number} <br />
              <strong>Route:</strong> {bus.route} <br />
              <strong>Occupancy:</strong> {bus.occupancy}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
};

export default MiWayMap;
