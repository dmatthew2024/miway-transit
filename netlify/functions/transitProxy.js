const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    const response = await axios.get('https://transit55.ca/mississauga/map/data.json');
    const busData = response.data;

    // Process the data to ensure Trip field is included
    const processedData = Object.entries(busData).reduce((acc, [key, bus]) => {
      acc[key] = {
        ...bus,
        Trip: bus.Trip || '', // Ensure Trip field exists, use empty string if not present
      };
      return acc;
    }, {});

    return {
      statusCode: 200,
      body: JSON.stringify(processedData)
    };
  } catch (error) {
    console.error('Error fetching transit data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch transit data' })
    };
  }
};