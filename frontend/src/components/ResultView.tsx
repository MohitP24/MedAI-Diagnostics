import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, RefreshCw, BarChart3, Download } from 'lucide-react';
import ImageCanvas from './ImageCanvas';
import ModelComparisonChart from './ModelComparisonChart';
import { api } from '../lib/api';
import './ResultView.css';

interface ModelResult {
    probs: {
        benign: number;
        malignant: number;
        normal: number;
    };
    top_class: string;
    confidence: number;
    gradcam_url: string | null;
}

interface CombinedResult {
    voting: string;
    notes: string;
    vote_count?: Record<string, number>;
    avg_confidence?: number;
}

interface ResultViewProps {
    models: Record<string, ModelResult>;
    combined: CombinedResult;
    originalImage: string;
    onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ models: rawModels, combined: rawCombined, originalImage, onReset }) => {
    // Safety check: if rawModels contains the root python response structure, unwrap it.
    const models = rawModels?.models && rawModels?.status ? (rawModels.models as any) : rawModels;
    const combined = (rawModels?.combined as any) || rawCombined;

    const [selectedModel, setSelectedModel] = useState<string>(models && Object.keys(models).length > 0 ? Object.keys(models)[0] : '');

    const getClassColor = (className: string): string => {
        switch (className.toLowerCase()) {
            case 'benign': return 'var(--color-success)';
            case 'malignant': return 'var(--color-danger)';
            case 'normal': return 'var(--color-info)';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusIcon = (className: string) => {
        switch (className.toLowerCase()) {
            case 'benign': return <CheckCircle2 className="status-icon" style={{ color: 'var(--color-success)' }} />;
            case 'malignant': return <AlertTriangle className="status-icon" style={{ color: 'var(--color-danger)' }} />;
            default: return <Info className="status-icon" style={{ color: 'var(--color-info)' }} />;
        }
    };

    const formatPercentage = (value: number): string => {
        return (value * 100).toFixed(1) + '%';
    };

    const downloadImage = (url: string, filename: string) => {
        const fullUrl = url.startsWith('http') ? url : api(url);
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const hasMultipleModels = Object.keys(models).length > 1;

    return (
        <div className="result-view-container">
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                <button className="btn btn-secondary" onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-full)' }}>
                    <RefreshCw size={16} /> Analyze Another Scan
                </button>
            </div>

            <div className="result-grid-layout">
                {/* Left Column: Diagnostics & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Primary Consensus Result */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.2)' }}
                        className="glass-card"
                        style={{ padding: '2rem', border: `1px solid ${getClassColor(combined.voting)}`, background: `linear-gradient(145deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)` }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Primary Clinical Impression</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {getStatusIcon(combined.voting)}
                                    <h2 style={{ fontSize: '2.5rem', color: getClassColor(combined.voting), margin: 0, textTransform: 'capitalize' }}>
                                        {combined.voting}
                                    </h2>
                                </div>
                            </div>
                            {combined.avg_confidence && (
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatPercentage(combined.avg_confidence)}</span>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Avg. Confidence</p>
                                </div>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                            {combined.notes}
                        </p>
                    </motion.div>

                    {/* Model Architecture Breakdown */}
                    {hasMultipleModels && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
                            className="glass-card"
                        >
                            <div className="card-icon-row" style={{ marginBottom: '1.5rem' }}>
                                <BarChart3 className="card-icon" />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ensemble Details</h3>
                            </div>
                            
                            <div className="model-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                                {Object.keys(models).map(modelName => (
                                    <button 
                                        key={modelName}
                                        onClick={() => setSelectedModel(modelName)}
                                        className={`tab-btn ${selectedModel === modelName ? 'active' : ''}`}
                                        style={{ 
                                            background: 'transparent', 
                                            border: 'none', 
                                            color: selectedModel === modelName ? 'var(--color-primary)' : 'var(--text-secondary)',
                                            padding: '0.5rem 1rem',
                                            cursor: 'pointer',
                                            fontWeight: selectedModel === modelName ? 600 : 400,
                                            borderBottom: selectedModel === modelName ? '2px solid var(--color-primary)' : '2px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {modelName.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={selectedModel}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span className={`badge badge-${models[selectedModel].top_class}`}>
                                            Pred: {models[selectedModel].top_class}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            Confidence: <strong style={{ color: 'var(--text-primary)' }}>{formatPercentage(models[selectedModel].confidence)}</strong>
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {models[selectedModel].probs && Object.entries(models[selectedModel].probs as Record<string, number>).map(([className, prob]) => (
                                            <div key={className} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ width: '80px', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{className}</span>
                                                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${prob * 100}%` }}
                                                        transition={{ duration: 0.5, delay: 0.1 }}
                                                        style={{ height: '100%', background: getClassColor(className) }}
                                                    />
                                                </div>
                                                <span style={{ width: '50px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{formatPercentage(prob)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {hasMultipleModels && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.3 }} 
                            whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
                            className="glass-card"
                        >
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Model Comparison</h3>
                            <ModelComparisonChart models={models} />
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Visualizations */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ position: 'sticky', top: '100px' }}
                >
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Grad-CAM Visualization</h3>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Region of interest highlighted ({selectedModel.toUpperCase()})</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => downloadImage(originalImage, 'original.png')} title="Download Original">
                                    <Download size={14} /> Orig
                                </button>
                                {models[selectedModel]?.gradcam_url && (
                                    <button className="btn btn-secondary btn-sm" onClick={() => downloadImage(models[selectedModel].gradcam_url!, `${selectedModel}_heatmap.png`)} title="Download Heatmap">
                                        <Download size={14} /> Map
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div style={{ background: '#000', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {models[selectedModel]?.gradcam_url ? (
                                <ImageCanvas
                                    originalImageUrl={originalImage.startsWith('http') || originalImage.startsWith('data:') ? originalImage : api(originalImage)}
                                    overlayImageUrl={models[selectedModel].gradcam_url.startsWith('http') ? models[selectedModel].gradcam_url! : api(models[selectedModel].gradcam_url!)}
                                />
                            ) : (
                                <div style={{ color: 'var(--text-tertiary)' }}>Visualization not available</div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ResultView;
