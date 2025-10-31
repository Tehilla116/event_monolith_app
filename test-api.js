import axios from 'axios'

async function testAPI() {
  try {
    console.log('Testing API connection...')

    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3001/health')
    console.log('✅ Health check:', healthResponse.data)

    // Test user registration
    const registerResponse = await axios.post('http://localhost:3001/auth/signup', {
      email: 'test@example.com',
      password: 'test123',
      role: 'ATTENDEE'
    })
    console.log('✅ User registration:', registerResponse.data)

    // Test login
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    })
    console.log('✅ User login:', loginResponse.data)

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message)
  }
}

testAPI()