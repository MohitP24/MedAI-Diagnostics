import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { Activity, LogIn, Mail, Lock } from 'lucide-react';
import '../styles/pages.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const successMessage = location.state?.message;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            auth?.login(data);
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            {/* Left Panel — Branding */}
            <motion.div
                className="auth-brand-panel"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="auth-brand-content">
                    <div className="auth-logo-mark">
                        <Activity size={28} />
                    </div>
                    <h1>MedAI Diagnostics</h1>
                    <p>Clinical-grade AI for breast cancer classification, built on peer-reviewed ensemble deep learning models.</p>

                    <div className="auth-brand-stats">
                        <div className="auth-stat">
                            <span className="auth-stat-value">94%</span>
                            <span className="auth-stat-label">Accuracy</span>
                        </div>
                        <div className="auth-stat-divider" />
                        <div className="auth-stat">
                            <span className="auth-stat-value">3</span>
                            <span className="auth-stat-label">AI Models</span>
                        </div>
                        <div className="auth-stat-divider" />
                        <div className="auth-stat">
                            <span className="auth-stat-value">IEEE</span>
                            <span className="auth-stat-label">Published</span>
                        </div>
                    </div>

                    <div className="auth-brand-badge">
                        <span>🏥 For Clinical Decision Support Only</span>
                    </div>
                </div>
            </motion.div>

            {/* Right Panel — Form */}
            <div className="auth-form-panel">
                <motion.div
                    className="auth-form-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="auth-form-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to your clinical account</p>
                    </div>

                    {successMessage && (
                        <motion.div
                            className="auth-alert auth-alert-success"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {successMessage}
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            className="auth-alert auth-alert-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form-body">
                        <div className="auth-field">
                            <label htmlFor="login-email">Email Address</label>
                            <div className="auth-input-wrapper">
                                <Mail size={16} className="auth-input-icon" />
                                <input
                                    id="login-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="doctor@hospital.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label htmlFor="login-password">Password</label>
                            </div>
                            <div className="auth-input-wrapper">
                                <Lock size={16} className="auth-input-icon" />
                                <input
                                    id="login-password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner spinner-sm" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={16} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <p className="auth-switch-text">
                        Don't have an account?{' '}
                        <Link to="/register">Create account</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
