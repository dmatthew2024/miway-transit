const axios = require('axios');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    let response;
    
    if (event.queryStringParameters && event.queryStringParameters.shape_id) {
      // Fetch route shape data
      response = await axios.get(`https://transit55.ca/json/mississauga/map/trip_shape?id=${event.queryStringParameters.shape_id}`);
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