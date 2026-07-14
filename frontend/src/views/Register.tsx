import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { api } from '../lib/api';
import { Activity, UserPlus, Mail, Lock, User } from 'lucide-react';
import '../styles/pages.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (auth?.user) {
            navigate('/');
        }
    }, [auth?.user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            const res = await fetch(api('/api/v1/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            navigate('/login', { state: { message: 'Account created! Please sign in with your new credentials.' } });
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
                    <h1>Join MedAI</h1>
                    <p>Create your account and access AI-powered diagnostic assistance. Built for clinicians, backed by research.</p>

                    <div className="auth-brand-features">
                        <div className="auth-feature-item">
                            <span className="auth-feature-dot"></span>
                            <span>Ensemble deep learning (ResNet, DenseNet, EfficientNet)</span>
                        </div>
                        <div className="auth-feature-item">
                            <span className="auth-feature-dot"></span>
                            <span>Grad-CAM heatmap visualization</span>
                        </div>
                        <div className="auth-feature-item">
                            <span className="auth-feature-dot"></span>
                            <span>Full scan history & analytics dashboard</span>
                        </div>
                        <div className="auth-feature-item">
                            <span className="auth-feature-dot"></span>
                            <span>IEEE peer-reviewed methodology</span>
                        </div>
                    </div>

                    <div className="auth-brand-badge">
                        <span>🔒 Your data is encrypted end-to-end</span>
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
                        <h2>Create account</h2>
                        <p>Free access to clinical AI tools</p>
                    </div>

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
                            <label htmlFor="reg-name">Full Name</label>
                            <div className="auth-input-wrapper">
                                <User size={16} className="auth-input-icon" />
                                <input
                                    id="reg-name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Dr. Jane Doe"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="reg-email">Email Address</label>
                            <div className="auth-input-wrapper">
                                <Mail size={16} className="auth-input-icon" />
                                <input
                                    id="reg-email"
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
                            <label htmlFor="reg-password">Password</label>
                            <div className="auth-input-wrapper">
                                <Lock size={16} className="auth-input-icon" />
                                <input
                                    id="reg-password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="reg-confirm">Confirm Password</label>
                            <div className="auth-input-wrapper">
                                <Lock size={16} className="auth-input-icon" />
                                <input
                                    id="reg-confirm"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner spinner-sm" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <p className="auth-switch-text">
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
