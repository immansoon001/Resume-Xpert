import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, Navigate, Link } from 'react-router'
import "../auth.scss"
import { useAuth } from '../hooks/useAuth'
import { AuthContext } from '../auth.context'
import { SignUp, SignedIn, SignedOut } from '@clerk/clerk-react'

const Register = () => {

    const navigate = useNavigate()
    const { user, loading, handleRegister } = useAuth()
    const { isClerkEnabled } = useContext(AuthContext)

    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ showTraditional, setShowTraditional ] = useState(!isClerkEnabled)

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true })
        }
    }, [user, loading, navigate])
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleRegister({ username, email, password })
        navigate("/dashboard")
    }

    if (loading) {
        return (
            <div className="auth-page">
                <div className="auth-loading">
                    <div className="spinner"></div>
                    <p>Preparing registration...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <header className="auth-header">
                <Link to="/" className="brand-logo">
                    Resume<span className="logo-accent">Xpert</span>
                </Link>
                <Link to="/" className="back-link">
                    ← Back to Home
                </Link>
            </header>

            <main className="auth-body">
                <div className="form-container">
                    {isClerkEnabled && !showTraditional ? (
                        <div className="clerk-container">
                            <SignedIn>
                                <Navigate to="/dashboard" replace />
                            </SignedIn>
                            <SignedOut>
                                <SignUp
                                    routing="hash"
                                    signInUrl="/login"
                                    fallbackRedirectUrl="/dashboard"
                                />
                            </SignedOut>
                            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowTraditional(true)}
                                    className="switch-btn"
                                >
                                    Or register with standard password
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="traditional-card">
                            <h1>Create Account</h1>
                            <p className="subtitle">Start preparing for your dream interview</p>

                            {!isClerkEnabled && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.6rem',
                                    background: '#121316',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#94a3b8',
                                    fontSize: '0.825rem',
                                    lineHeight: '1.4'
                                }}>
                                    💡 <strong>Clerk Auth Ready:</strong> Add your <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>Frontend/.env</code> to activate direct Clerk email registration.
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <label htmlFor="username">Full Name or Username</label>
                                    <input
                                        onChange={(e) => { setUsername(e.target.value) }}
                                        type="text" id="username" name='username' placeholder='John Doe' required />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        onChange={(e) => { setEmail(e.target.value) }}
                                        type="email" id="email" name='email' placeholder='name@example.com' required />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        onChange={(e) => { setPassword(e.target.value) }}
                                        type="password" id="password" name='password' placeholder='••••••••' required />
                                </div>

                                <button className='primary-button'>Create Account</button>
                            </form>

                            {isClerkEnabled && (
                                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTraditional(false)}
                                        className="switch-btn"
                                    >
                                        ← Back to Clerk Direct Registration
                                    </button>
                                </div>
                            )}

                            <div className="footer-text">
                                Already have an account? <Link to={"/login"}>Sign In</Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Register