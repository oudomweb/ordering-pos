const axios = require('axios');

async function testApi() {
    try {
        console.log("Logging in as User 3...");
        const loginRes = await axios.post("http://localhost:8080/api/auth/login", {
            email: "senlin@gmail.com", // Correct field name
            password: "123" // Default password
        });

        if (!loginRes.data.access_token) {
            console.error("Login failed:", loginRes.data);
            return;
        }

        const token = loginRes.data.access_token;
        console.log("Token acquired.");

        console.log("Fetching categories for Business 2...");
        const catRes = await axios.get("http://localhost:8080/api/category", {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Categories:", catRes.data.list);

        const coffeeCat = catRes.data.list.find(c => c.name === 'Coffee');
        if (!coffeeCat) {
            console.error("Coffee category not found in B2!");
            return;
        }

        console.log(`Fetching products for Category ${coffeeCat.id}...`);
        const prodRes = await axios.get(`http://localhost:8080/api/product?category_id=${coffeeCat.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Products count:", prodRes.data.list.length);
        console.log("Products:", prodRes.data.list);
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e.response?.data || e.message);
        process.exit(1);
    }
}

testApi();
