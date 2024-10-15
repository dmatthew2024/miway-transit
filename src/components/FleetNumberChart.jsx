import React from 'react';

const FleetNumberChart = ({ fleetNumberMap }) => {
  return (
    <div className="fleet-number-chart">
      <h2>Fleet Number Mapping</h2>
      {Object.keys(fleetNumberMap).length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Internal ID</th>
              <th>Public Fleet Number</th>
              <th>Route</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(fleetNumberMap).map(([internalId, data]) => (
              <tr key={internalId}>
                <td>{internalId}</td>
                <td>{data.publicFleetNumber}</td>
                <td>{data.route}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No fleet number mapping data available.</p>
      )}
    </div>
  );
};

export default FleetNumberChart;