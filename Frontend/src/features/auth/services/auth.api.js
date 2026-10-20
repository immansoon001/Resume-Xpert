import axios from "axios"


const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export async function register({ username, email, password }) {

    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })

        if (response.data?.token) {
            localStorage.setItem("token", response.data.token)
        }

        return response.data

    } catch (err) {

        console.log(err)

    }

}

export async function login({ email, password }) {

    try {

        const response = await api.post("/api/auth/login", {
            email, password
        })

        if (response.data?.token) {
            localStorage.setItem("token", response.data.token)
        }

        return response.data

    } catch (err) {
        console.log(err)
    }

}

export async function logout() {
    try {
        localStorage.removeItem("token")
        const response = await api.get("/api/auth/logout")

        return response.data

    } catch (err) {
        localStorage.removeItem("token")
    }
}

export async function getMe() {

    try {

        const response = await api.get("/api/auth/get-me")

        return response.data

    } catch (err) {
        console.log(err)
    }

}

export async function clerkSync({ email, username, clerkId }) {
    try {
        const response = await api.post("/api/auth/clerk-sync", {
            email, username, clerkId
        })

        if (response.data?.token) {
            localStorage.setItem("token", response.data.token)
        }

        return response.data
    } catch (err) {
        console.error("Clerk sync error:", err)
        throw err
    }
}