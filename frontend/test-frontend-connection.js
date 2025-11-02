// Frontend Connection Test
import ApiService from './src/services/ApiService.js';
import WebSocketService from './src/services/WebSocketService.js';

async function testFrontendConnection() {
  console.log('🔍 Testing Frontend to Backend Connection...\n');
  
  try {
    // Test API Service
    console.log('1. Testing API Service...');
    
    const users = await ApiService.getUsers();
    console.log('✅ Users API:', users.success ? `${users.total} users` : 'Failed');
    
    const accessLogs = await ApiService.getAccessLogs();
    console.log('✅ Access Logs API:', accessLogs.success ? `${accessLogs.total} logs` : 'Failed');
    
    console.log('\n2. Testing WebSocket Service...');
    
    // Test WebSocket
    WebSocketService.connect();
    
    WebSocketService.on('connected', () => {
      console.log('✅ WebSocket connected successfully');
    });
    
    WebSocketService.on('disconnected', () => {
      console.log('❌ WebSocket disconnected');
    });
    
    WebSocketService.on('error', (error) => {
      console.log('❌ WebSocket error:', error);
    });
    
    console.log('\n🎉 Frontend connection test completed!');
    console.log('Check the browser console for real-time connection status.');
    
  } catch (error) {
    console.error('❌ Frontend connection test failed:', error);
  }
}

testFrontendConnection();
