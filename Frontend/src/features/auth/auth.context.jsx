import { createContext,useState } from "react";



export const AuthContext = createContext()


export const AuthProvider = ({ children, isClerkEnabled = false }) => { 

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)


    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading, isClerkEnabled }} >
            {children}
        </AuthContext.Provider>
    )

    
}