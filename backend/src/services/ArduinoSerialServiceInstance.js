// Singleton instance for ArduinoSerialService
const app = require('../../server');
module.exports = app.get('arduinoService');
