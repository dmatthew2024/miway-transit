import React, { useState } from 'react';
import MiWayMap from './components/MiWayMap';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="App">
      <input
        type="text"
        placeholder="Search for a bus or route"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border rounded"
      />
      <MiWayMap searchTerm={searchTerm} />
    </div>
  );
}

export default App;