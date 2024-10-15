const axios = require('axios');

exports.handler = async function(event, context) {
  const { route } = event.queryStringParameters;

  if (!route) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Route parameter is required' })
    };
  }

  try {
    const response = await axios.get(`https://www.transsee.ca/routeveh?a=miway&r=${route}&refresh=30`);
    
    console.log(`Transsee response for route ${route}:`, response.data);

    // Ensure the response is an array, or wrap it in an array if it's an object
    const data = Array.isArray(response.data) ? response.data : [response.data];
    
    // Transform the data to include only the necessary information
    const transformedData = data.map(bus => ({
      id: bus.id,
      vehicle: bus.vehicle,
      route: route // Use the route from the query parameter
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(transformedData)
    };
  } catch (error) {
    console.error('Error fetching Transsee data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch Transsee data', details: error.message })
    };
  }
};