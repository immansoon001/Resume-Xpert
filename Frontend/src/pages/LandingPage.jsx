import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../features/auth/hooks/useAuth';
import useThemeStore, { themeNameMap, themes } from '../store/themeStore';
import { motion } from 'framer-motion';
import './LandingPage.scss';

const LandingPage = () => {
    const { user, handleLogout } = useAuth();
    const navigate = useNavigate();
    
    // Use our new zustand theme store
    const { currentTheme, setTheme } = useThemeStore();

    const onGetStarted = () => {
        navigate('/dashboard');
    }

    const onLogout = async () => {
        await handleLogout();
        navigate('/login');
    }

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 70,
                damping: 15
            }
        }
    };

    const navVariants = {
        hidden: { y: -20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <div className={`landing-page theme-${currentTheme}`}>
            <motion.nav 
                className="navbar"
                initial="hidden"
                animate="visible"
                variants={navVariants}
            >
                <div className="logo">
                    RESUME-XPERT
                </div>
                <div className="nav-actions">
                    <div className="theme-selector">
                        <span>🎨</span>
                        <select 
                            className="theme-dropdown" 
                            value={currentTheme} 
                            onChange={(e) => setTheme(e.target.value)}
                        >
                            {themes.map(t => (
                                <option key={t} value={t}>{themeNameMap[t]}</option>
                            ))}
                        </select>
                    </div>
                    {user ? (
                        <>
                            <button className="button secondary-button" onClick={onLogout}>
                                Logout
                            </button>
                            <motion.button 
                                className="button primary-button theme-primary-btn" 
                                onClick={onGetStarted}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Dashboard
                            </motion.button>
                        </>
                    ) : (
                        <motion.button 
                            className="button primary-button theme-primary-btn" 
                            onClick={() => navigate('/login')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Get Started
                        </motion.button>
                    )}
                </div>
            </motion.nav>

            <main className="hero">
                <motion.div 
                    className="hero-background-glow"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                ></motion.div>
                
                <motion.div 
                    className="hero-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.h1 className="hero-title" variants={itemVariants}>
                        Elevate your career with AI-powered resume analysis.
                    </motion.h1>
                    <motion.p className="hero-subtitle" variants={itemVariants}>
                        Get instant feedback, actionable insights, and master your interview strategy with Resume Xpert.
                    </motion.p>
                    <motion.div className="hero-actions" variants={itemVariants}>
                        {user ? (
                            <motion.button 
                                className="button primary-button theme-primary-btn large-button" 
                                onClick={onGetStarted}
                                whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px var(--accent-glow)" }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Go to Dashboard <motion.span className="arrow" initial={{ x: 0 }} whileHover={{ x: 5 }}>→</motion.span>
                            </motion.button>
                        ) : (
                            <motion.button 
                                className="button primary-button theme-primary-btn large-button" 
                                onClick={() => navigate('/login')}
                                whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px var(--accent-glow)" }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Start Analyzing Now <motion.span className="arrow" initial={{ x: 0 }} whileHover={{ x: 5 }}>→</motion.span>
                            </motion.button>
                        )}
                    </motion.div>
                </motion.div>
            </main>

            <motion.footer 
                className="footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
            >
                <div className="footer-left">
                    <span className="logo-small">RESUME-XPERT</span>
                    <span className="copyright">© 2024 RESUME-XPERT. EMPOWERING YOUR CAREER JOURNEY.</span>
                </div>
                <div className="footer-links">
                    <a href="#">DOCUMENTATION</a>
                    <a href="#">PRIVACY POLICY</a>
                    <a href="#">TERMS OF SERVICE</a>
                    <a href="#">SUPPORT</a>
                </div>
            </motion.footer>
        </div>
    );
};

export default LandingPage;
