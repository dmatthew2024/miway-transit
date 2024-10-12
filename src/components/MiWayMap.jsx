import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import protobuf from 'protobufjs';  // Import protobufjs

const MiWayMap = ({ searchTerm }) => {
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    const fetchBusData = async () => {
      try {
        // Load the GTFS-RT proto file
        const root = await protobuf.load('/proto/gtfs-realtime.proto');
        const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

        // Use the proxy URL to fetch the .pb file
        const response = await axios.get('/api/GTFS_RT/Vehicle/VehiclePositions.pb', {
          responseType: 'arraybuffer'  // We need raw binary data
        });

        // Decode the protobuf binary data
        const message = FeedMessage.decode(new Uint8Array(response.data));
        const object = FeedMessage.toObject(message, {
          enums: String,  // Enums as string names
          longs: String,  // Longs as strings
          defaults: true, // Populate default values
          arrays: true,   // Populate empty arrays
          objects: true   // Populate empty objects
        });

        // Extract vehicle positions and set them in state
        const vehiclePositions = object.entity.map(entity => ({
          fleet_number: entity.vehicle.vehicle.id,
          route: entity.vehicle.trip.routeId,
          latitude: entity.vehicle.position.latitude,
          longitude: entity.vehicle.position.longitude,
          occupancy: entity.vehicle.occupancyStatus || 'Unknown'
        }));
        setBuses(vehiclePositions);

        console.log("Bus data: ", vehiclePositions);  // Log the bus data

      } catch (error) {
        console.error('Error fetching or decoding the .pb file:', error);
      }
    };

    // Fetch bus data when component mounts
    fetchBusData();

    // Optionally, refetch data every 30 seconds for real-time updates
    const intervalId = setInterval(fetchBusData, 30000);
    return () => clearInterval(intervalId);  // Clean up the interval on unmount

  }, []);

  // Log the search term to check what is being entered
  console.log("Search Term: ", searchTerm);

  // Filtering buses based on search term (case-insensitive partial matching)
  const filteredBuses = buses.filter((bus) => {
    const routeMatch = bus.route.toLowerCase().includes(searchTerm.toLowerCase());
    const fleetMatch = bus.fleet_number.toLowerCase().includes(searchTerm.toLowerCase());
    return routeMatch || fleetMatch;
  });

  return (
    <MapContainer center={[43.5890, -79.6441]} zoom={12} style={{ height: "100vh", width: "100%" }}>
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
  );
};

export default MiWayMap;
