import React, { useState } from 'react';
import MiWayMap from './components/MiWayMap';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <h1>MIIWAY Transit Tracker</h1>
      <MiWayMap searchTerm={searchTerm} />
    </div>
  );
};

export default App;

