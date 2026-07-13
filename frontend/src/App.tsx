import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, ArrowRight, ActivitySquare, LayoutDashboard, LogOut, LogIn, UserPlus } from 'lucide-react';
import UploadForm from './components/UploadForm';
import ResultView from './components/ResultView';
import About from './views/About';
import Models from './views/Models';
import Docs from './views/Docs';
import Login from './views/Login';
import Register from './views/Register';
import Dashboard from './views/Dashboard';
import PredictionDetail from './views/PredictionDetail';
import { AuthProvider, AuthContext } from './context/AuthContext';
import './App.css';

// --- Home (Analysis) Component ---
function Analysis() {
    const [uploading, setUploading] = React.useState(false);
    const [result, setResult] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleUploadComplete = (data: any) => {
        setUploading(false);
        setResult(data);
    };

    const handleError = (errorMsg: string) => {
        setUploading(false);
        setError(errorMsg);
        setTimeout(() => setError(null), 5000);
    };

    return (
        <main className="app-main">
            {/* Beautiful Hero Section */}
            {!result && !uploading && (
                <section className="hero-landing">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="container"
                    >
                        <span className="page-hero-badge">Medical Grade AI</span>
                        <h1 className="page-title">
                            Next Generation <br/>
                            <span className="gradient-text-primary">Breast Cancer Diagnostics</span>
                        </h1>
                        <p className="page-subtitle">
                            Powered by an advanced ensemble of Deep Learning models. Fast, precise, and transparent inference designed for clinical professionals.
                        </p>
                        
                        <div className="page-cta">
                            <a href="#upload-section" className="cta-btn">
                                Start Analysis <ArrowRight size={18} />
                            </a>
                            <Link to="/models" className="cta-btn cta-secondary">
                                View Architecture
                            </Link>
                        </div>
                        
                        <div className="grid grid-3" style={{ marginTop: '5rem', textAlign: 'left' }}>
                            <div className="glass-card">
                                <Activity className="card-icon" style={{ marginBottom: '1rem' }} />
                                <h3>High Accuracy Ensemble</h3>
                                <p>Combines MobileNetV2, ResNet50, and DenseNet121 for robust prediction confidence.</p>
                            </div>
                            <div className="glass-card">
                                <ActivitySquare className="card-icon" style={{ marginBottom: '1rem', color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)' }} />
                                <h3>Explainable AI</h3>
                                <p>Grad-CAM visualizations highlight exactly where the model focuses its clinical attention.</p>
                            </div>
                            <div className="glass-card">
                                <ShieldCheck className="card-icon" style={{ marginBottom: '1rem', color: 'var(--color-info)', background: 'rgba(59, 130, 246, 0.1)' }} />
                                <h3>Secure & Private</h3>
                                <p>End-to-end encryption with secure JWT authentication and protected health information protocols.</p>
                            </div>
                        </div>
                    </motion.div>
                </section>
            )}

            <div className="analysis-layout" id="upload-section">
                {!result && (
                    <motion.section 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="upload-section"
                    >
                        <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2>Image Analysis</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Upload a breast ultrasound image for ensemble classification.</p>
                        </div>

                        <UploadForm
                            onUploadStart={() => setUploading(true)}
                            onUploadComplete={handleUploadComplete}
                            onError={handleError}
                        />

                        {error && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="error-banner">
                                <span className="error-icon">⚠️</span>
                                <div>
                                    <h4>Analysis Failed</h4>
                                    <p>{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </motion.section>
                )}

                {(uploading || result) && (
                    <section className="results-section">
                        <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2>Diagnostic Results</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>AI model predictions and Grad-CAM visualization.</p>
                        </div>

                        {uploading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="loading-state">
                                <div className="spinner"></div>
                                <p>Running ensemble inference...</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>This may take a few moments.</p>
                            </motion.div>
                        ) : result ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <ResultView
                                    models={result.models || {}}
                                    combined={result.combined || {}}
                                    originalImage={result.original_image || ''}
                                    onReset={() => setResult(null)}
                                />
                            </motion.div>
                        ) : null}
                    </section>
                )}
            </div>
        </main>
    );
}

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const auth = useContext(AuthContext);
    if (!auth?.user) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// --- Navbar Actions ---
const NavActions = () => {
    const auth = useContext(AuthContext);

    if (auth?.user) {
        return (
            <div className="nav-actions">
                <span className="user-greeting">Dr. {auth.user.name.split(' ')[0]}</span>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LayoutDashboard size={16} /> Dashboard
                </NavLink>
                <button onClick={auth.logout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LogOut size={16} /> Log Out
                </button>
            </div>
        );
    }

    return (
        <div className="nav-actions">
            <NavLink to="/login" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><LogIn size={16} /> Log In</NavLink>
            <NavLink to="/register" className="cta-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}><UserPlus size={16} /> Sign Up</NavLink>
        </div>
    );
};

// --- Main App ---
function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="app-container">
                    <header className="app-header">
                        <div className="header-content">
                            <Link to="/" className="logo">
                                <ActivitySquare className="logo-icon" />
                                <span className="logo-text">MedAI</span>
                            </Link>
                            <nav className="nav-links">
                                <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')} end>
                                    Analysis
                                </NavLink>
                                <NavLink to="/about" className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}>
                                    Platform
                                </NavLink>
                                <NavLink to="/models" className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}>
                                    Architecture
                                </NavLink>
                                <NavLink to="/docs" className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}>
                                    Docs
                                </NavLink>
                            </nav>
                            <NavActions />
                        </div>
                    </header>

                    <Routes>
                        {/* Protected Routes */}
                        <Route path="/" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/predictions/:id" element={<ProtectedRoute><PredictionDetail /></ProtectedRoute>} />
                        
                        {/* Public Routes */}
                        <Route path="/about" element={<About />} />
                        <Route path="/models" element={<Models />} />
                        <Route path="/docs" element={<Docs />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>

                    <footer className="app-footer">
                        <div className="footer-content">
                            <p>© 2026 MedAI Diagnostics. Advanced Ensemble Inference Platform.</p>
                            <div className="footer-links">
                                <a href="https://ieeexplore.ieee.org/document/11368083" target="_blank" rel="noopener noreferrer">IEEE Publication</a>
                                <NavLink to="/about">Privacy Protocol</NavLink>
                                <NavLink to="/docs">Clinical Support</NavLink>
                            </div>
                        </div>
                    </footer>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
