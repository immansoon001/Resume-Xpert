import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.scss"
import { useAuth } from '../hooks/useAuth'
import { AuthContext } from '../auth.context'
import { SignIn } from '@clerk/clerk-react'

const Login = () => {

    const { user, loading, handleLogin, handleLogout } = useAuth()
    const { isClerkEnabled } = useContext(AuthContext)
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ showTraditional, setShowTraditional ] = useState(!isClerkEnabled)

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({ email, password })
        navigate('/dashboard')
    }

    if (loading) {
        return (
            <div className="auth-page">
                <div className="auth-loading">
                    <div className="spinner"></div>
                    <p>Loading your account...</p>
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
                    {/* If user is already logged in, give clear options instead of silent redirect */}
                    {user ? (
                        <div className="traditional-card session-card">
                            <div style={{ fontSize: "2.5rem", textAlign: "center" }}>👋</div>
                            <h1>Already Signed In</h1>
                            <p className="subtitle">
                                Signed in as <strong style={{ color: "#00e573" }}>{user.email || user.username}</strong>
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                                <button className="primary-button" onClick={() => navigate('/dashboard')}>
                                    Continue to Dashboard →
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    style={{
                                        background: "rgba(255, 255, 255, 0.05)",
                                        border: "1px solid rgba(255, 255, 255, 0.15)",
                                        color: "#f8fafc",
                                        padding: "0.75rem",
                                        borderRadius: "0.6rem",
                                        cursor: "pointer",
                                        fontSize: "0.9rem",
                                        fontWeight: "500",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Sign Out to Use Another Email
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isClerkEnabled && !showTraditional ? (
                                <div className="clerk-container">
                                    <SignIn
                                        routing="hash"
                                        signUpUrl="/register"
                                        fallbackRedirectUrl="/dashboard"
                                    />
                                    <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowTraditional(true)}
                                            className="switch-btn"
                                        >
                                            Or sign in with standard password
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="traditional-card">
                                    <h1>Welcome Back</h1>
                                    <p className="subtitle">Sign in to your ResumeXpert account</p>

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
                                            💡 <strong>Clerk Auth Ready:</strong> Add your <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>Frontend/.env</code> to activate direct Clerk email login.
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit}>
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
                                        <button className='primary-button'>Sign In</button>
                                    </form>

                                    {isClerkEnabled && (
                                        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowTraditional(false)}
                                                className="switch-btn"
                                            >
                                                ← Back to Clerk Direct Login
                                            </button>
                                        </div>
                                    )}

                                    <div className="footer-text">
                                        Don't have an account? <Link to={"/register"}>Create Account</Link>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Login