/* This file should be renamed as keys.js It is aimed to store an array of
hashed keys to be compared against the hashed api key received from the user
request. A custom message can be returned in case of 'Missing' or 'Invalid'
API key. */

module.exports = {
  get: function() {
    // authorized keys array
    return ['API_KEY_1', 'API_KEY_2', '...'];
  },
  message: function(wrong) {
    return wrong + ' API key. Add custom message in keys.js';
  },
}
