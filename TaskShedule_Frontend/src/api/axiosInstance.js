import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://127.0.0.1:8000/api/", // base URL
    timeout: 5000, // optional timeout
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosInstance;
