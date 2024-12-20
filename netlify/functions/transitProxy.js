const axios = require('axios');

exports.handler = async function(event, context) {
try {
const response = await axios.get('https://transit55.ca/mississauga/map/data.json');
return {
statusCode: 200,
body: JSON.stringify(response.data)
};
} catch (error) {
console.error('Error fetching transit data:', error);
return {
statusCode: 500,
body: JSON.stringify({ error: 'Failed to fetch transit data' })
};
}
};
