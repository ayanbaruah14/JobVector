import axios from 'axios';

async function testSignup() {
    try {
        const uniqueEmail = `testuser_${Date.now()}@example.com`;
        console.log("Attempting to create user with email:", uniqueEmail);

        const response = await axios.post('http://127.0.0.1:5002/user/create', {
            name: "Test User",
            email: uniqueEmail,
            role: "user",
            password: "password123"
        });

        console.log("Signup successful!", response.status, response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Signup failed:", error.response?.status, error.response?.data);
        } else {
            console.error("Signup error:", error);
        }
    }
}

testSignup();
