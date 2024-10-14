const axios = require('axios');

exports.handler = async function(event, context) {
  console.log('Proxy function invoked');
  try {
    const response = await axios.get('https://www.miapp.ca/GTFS_RT/Vehicle/VehiclePositions.pb', {
      responseType: 'arraybuffer'
    });
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Access-Control-Allow-Origin': '*',
      },
      body: response.data.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error in proxy function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data', details: error.message }),
    };
  }
};