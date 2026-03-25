const axios = require('axios');

async function debug() {
    try {
        const login = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'pongchiva257@gmail.com',
            password: '123'
        });
        const token = login.data.access_token;
        console.log("Token acquired.");

        const res = await axios.get('http://localhost:8080/api/my-plan', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}

debug();
