import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Activity, Database, History, ChevronRight } from 'lucide-react';
import '../styles/pages.css';

interface Prediction {
    _id: string;
    imageFileName: string;
    ensemblePrediction: string;
    confidence: number;
    createdAt: string;
}

interface Stats {
    totalPredictions: number;
    distribution: Record<string, number>;
    averageConfidence: number;
}

const COLORS = {
    benign: '#10b981',    // Emerald
    malignant: '#ef4444', // Soft Red
    normal: '#3b82f6'     // Blue
};

export default function Dashboard() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch User Predictions
                const resPreds = await fetch('/api/predictions', {
                    headers: {
                        'Authorization': `Bearer ${auth?.user?.token}`
                    }
                });
                const dataPreds = await resPreds.json();
                setPredictions(dataPreds);

                // Fetch Global Stats
                const resStats = await fetch('/api/predictions/stats');
                const dataStats = await resStats.json();
                setStats(dataStats);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        if (auth?.user) {
            fetchDashboardData();
        }
    }, [auth]);

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="spinner" style={{ width: '48px', height: '48px', marginBottom: '1rem' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Loading analytics payload...</p>
            </div>
        );
    }

    const distributionData = stats?.distribution ? Object.keys(stats.distribution).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        count: stats.distribution[key],
        fill: COLORS[key as keyof typeof COLORS] || '#8884d8'
    })) : [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <div className="page-container">
            <motion.div 
                className="page-hero"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="page-hero-badge">Clinical Analytics</div>
                <h1 className="page-title">Provider Dashboard</h1>
                <p className="page-subtitle">
                    Comprehensive overview of global platform statistics and your patient analysis history.
                </p>
            </motion.div>

            <motion.div 
                className="page-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Global Stats Section */}
                <motion.div className="page-card span-full" variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="card-icon-row">
                            <Activity className="card-icon" />
                            <h2>Platform Intelligence</h2>
                        </div>
                        <p style={{ marginBottom: '2rem' }}>Aggregated statistics across all MedAI distributed inference nodes.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            <div className="stat-box">
                                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={16}/> Total Scans Processed</span>
                                <span className="stat-value">{stats?.totalPredictions || 0}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16}/> Ensemble Confidence Avg.</span>
                                <span className="stat-value" style={{ color: 'var(--color-info)' }}>{((stats?.averageConfidence || 0) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>Diagnostic Distribution</h3>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 1.5rem 1.5rem 0', border: '1px solid var(--glass-border)' }}>
                            {distributionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={distributionData}>
                                        <XAxis dataKey="name" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} />
                                        <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                                    Awaiting initial telemetry
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* History Section */}
                <motion.div className="page-card span-full" variants={itemVariants}>
                    <div className="card-icon-row" style={{ marginBottom: '2rem' }}>
                        <History className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }} />
                        <h2>Clinical Audit Log</h2>
                    </div>
                    
                    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                        {predictions.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'rgba(0,0,0,0.2)' }}>
                                <History size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '1.1rem' }}>
                                    No scans logged for this profile yet.
                                </p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Timestamp</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Source Image</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ensemble Diagnosis</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Model Confidence</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.map(pred => (
                                        <tr key={pred._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="table-row-hover">
                                            <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
                                                {new Date(pred.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {pred.imageFileName.length > 20 ? pred.imageFileName.substring(0, 20) + '...' : pred.imageFileName}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span className={`badge badge-${pred.ensemblePrediction}`}>
                                                    {pred.ensemblePrediction}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontWeight: 600, width: '45px' }}>{(pred.confidence * 100).toFixed(1)}%</span>
                                                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', maxWidth: '100px' }}>
                                                        <div style={{ height: '100%', width: `${pred.confidence * 100}%`, background: COLORS[pred.ensemblePrediction as keyof typeof COLORS] }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <button onClick={() => navigate(`/predictions/${pred._id}`)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.25rem' }}>
                                                    View <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
