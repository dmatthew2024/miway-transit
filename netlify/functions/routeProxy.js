const axios = require('axios');

exports.handler = async function(event, context) {
  const { id } = event.queryStringParameters;
  
  try {
    const response = await axios.get(`https://transit55.ca/json/mississauga/map/trip_shape?id=${id}`);
    const coordinates = response.data.data.map(point => [parseFloat(point.lat), parseFloat(point.lon)]);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ coordinates })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch route data' })
    };
  }
};