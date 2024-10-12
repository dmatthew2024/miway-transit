import React, { useState } from 'react';
import MiWayMap from './components/MiWayMap';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mb-4">MIIWAY Transit Tracker</h1>
      <input
        type="text"
        placeholder="Search by fleet number or route"
        value={searchTerm}
        onChange={handleSearch}
        className="border rounded-lg p-2 shadow-md w-full max-w-lg mb-4 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <MiWayMap searchTerm={searchTerm} />
    </div>
  );
};

export default App;

