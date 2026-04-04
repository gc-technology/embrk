import { createContext, useContext } from 'react'

const AuthContext = createContext({ user: { name: 'Gideon' }, isLoaded: true })

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    return (
        <AuthContext.Provider value={{ user: { name: 'Gideon' }, isLoaded: true }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext