import React, { useState } from 'react';
import MiWayMap from './components/MiWayMap';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="App">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter search term"
      />
      <MiWayMap searchTerm={searchTerm} />
    </div>
  );
}

export default App;
