import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, FileImage, Cpu } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ResultView from '../components/ResultView';
import { api } from '../lib/api';
import '../styles/pages.css';

export default function PredictionDetail() {
    const { id } = useParams<{ id: string }>();
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const [prediction, setPrediction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPrediction = async () => {
            try {
                const res = await fetch(api(`/api/v1/predictions/${id}`), {
                    headers: { 'Authorization': `Bearer ${auth?.user?.token}` }
                });
                if (res.status === 401) {
                    auth?.logout();
                    return;
                }
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to load prediction');
                }
                const data = await res.json();
                setPrediction(data.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (auth?.user && id) {
            fetchPrediction();
        }
    }, [id, auth]);

    if (loading) {
        return (
            <div className="page-container loading-state">
                <div className="spinner"></div>
                <p>Loading scan record...</p>
            </div>
        );
    }

    if (error || !prediction) {
        return (
            <div className="page-container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-danger)', marginBottom: '2rem' }}>
                    {error || 'Prediction not found.'}
                </p>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </div>
        );
    }


    return (
        <div className="page-container fade-in">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2.5rem' }}
            >
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard')}
                    style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-full)' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="glass-card" style={{ padding: '1.5rem 2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {new Date(prediction.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileImage size={16} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                            {prediction.imageFileName}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Cpu size={16} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Models: {prediction.modelsUsed}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Check if we have full model details to show the rich view */}
            {prediction.modelDetails && prediction.modelDetails.models ? (
                    <ResultView
                        models={prediction.modelDetails.models}
                        combined={prediction.modelDetails.combined || {
                            voting: prediction.ensemblePrediction,
                            notes: `${prediction.modelsUsed} ensemble — ${Object.keys(prediction.modelDetails.models).length} model(s)`,
                            avg_confidence: prediction.confidence,
                        }}
                        originalImage={prediction.originalImagePath || ''}
                        onReset={() => navigate('/dashboard')}
                    />
            ) : (
                /* Fallback: simple summary card when modelDetails not stored */
                <motion.div
                    className="glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '3rem', textAlign: 'center' }}
                >
                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Ensemble Diagnosis
                    </h2>
                    <h1 style={{
                        fontSize: '3.5rem',
                        textTransform: 'capitalize',
                        color: prediction.ensemblePrediction === 'malignant' ? 'var(--color-danger)'
                            : prediction.ensemblePrediction === 'benign' ? 'var(--color-success)'
                                : 'var(--color-info)',
                        marginBottom: '1rem'
                    }}>
                        {prediction.ensemblePrediction}
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                        Confidence: <strong style={{ color: 'var(--text-primary)' }}>
                            {(prediction.confidence * 100).toFixed(1)}%
                        </strong>
                    </p>
                    <p style={{ marginTop: '2rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                        Detailed per-model breakdown is only available for scans run after the latest update.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
