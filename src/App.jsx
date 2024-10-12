import React, { useState } from 'react';
import MiWayMap from './components/MiWayMap';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="App">
      <h1>MIIWAY Transit Tracker</h1>
      <input
        type="text"
        placeholder="Search by fleet number or route"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <MiWayMap searchTerm={searchTerm} />
    </div>
  );
}

export default App;

