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
    
    // Ensure the response is an array
    const data = Array.isArray(response.data) ? response.data : [];
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching Transsee data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch Transsee data', details: error.message })
    };
  }
};