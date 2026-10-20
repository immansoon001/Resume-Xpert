import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe, clerkSync } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            localStorage.removeItem("token")
            await logout()
            if (window.Clerk && window.Clerk.user) {
                await window.Clerk.signOut()
            }
            setUser(null)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleClerkSync = async ({ email, username, clerkId }) => {
        setLoading(true)
        try {
            const data = await clerkSync({ email, username, clerkId })
            if (data?.user) {
                setUser(data.user)
                return data.user
            }
        } catch (err) {
            console.error("Clerk sync error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            try {

                const data = await getMe()
                setUser(data.user)
            } catch (err) { } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { user, setUser, loading, setLoading, handleRegister, handleLogin, handleLogout, handleClerkSync }
}