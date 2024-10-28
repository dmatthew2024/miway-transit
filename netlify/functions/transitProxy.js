const axios = require('axios');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    let response;
    
    // Check if a route parameter is present
    if (event.queryStringParameters && event.queryStringParameters.route) {
      // Fetch route data
      response = await axios.get(`https://transit55.ca/mississauga/map/data.json?route=${event.queryStringParameters.route}`);
    } else {
      // Fetch bus data
      response = await axios.get('https://transit55.ca/mississauga/map/data.json');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch data' })
    };
  }
};