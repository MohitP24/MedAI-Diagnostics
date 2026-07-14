import React, { useState, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileImage, X, Zap } from 'lucide-react';
import './UploadForm.css';
import { AuthContext } from '../context/AuthContext';
import { api } from '../lib/api';

interface UploadFormProps {
    onUploadStart: () => void;
    onUploadComplete: (result: any) => void;
    onError: (error: string) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadStart, onUploadComplete, onError }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const auth = useContext(AuthContext);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [modelSelection, setModelSelection] = useState<string>('all');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = useCallback((file: File | null) => {
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            onError('Invalid file format. Please upload JPG or PNG images.');
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            onError('File exceeds 10MB limit.');
            return;
        }

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, [onError]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        handleFileSelect(file);
    }, [handleFileSelect]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            onError('Please provide a clinical image for analysis.');
            return;
        }

        setIsUploading(true);
        onUploadStart();

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('models', modelSelection);

            const headers: Record<string, string> = {};
            if (auth?.user?.token) {
                headers['Authorization'] = `Bearer ${auth.user.token}`;
            }

            const response = await fetch(api('/api/v1/predictions'), {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Inference engine failed to process image');
            }

            const result = await response.json();
            onUploadComplete({
                models: result.data.modelDetails.models,
                combined: result.data.modelDetails.combined,
                original_image: previewUrl
            });

        } catch (error: any) {
            onError(error.message || 'Secure connection to inference engine interrupted.');
            setIsUploading(false);
        }
    };

    const handleReset = (e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    return (
        <form onSubmit={handleSubmit} className="upload-form-container">
            <motion.div
                className={`dropzone glass-card ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-preview' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !previewUrl && document.getElementById('file-input')?.click()}
                whileHover={!previewUrl ? { scale: 1.01, borderColor: 'rgba(0, 102, 204, 0.5)' } : {}}
                transition={{ duration: 0.2 }}
                style={{ position: 'relative', overflow: 'hidden' }}
            >
                <AnimatePresence mode="wait">
                    {previewUrl ? (
                        <motion.div 
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="preview-container"
                        >
                            <img src={previewUrl} alt="Patient Scan Preview" className="preview-image" />
                            <div className="preview-overlay">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                                    <FileImage size={16} />
                                    <span className="preview-filename">{selectedFile?.name}</span>
                                </div>
                                <button type="button" className="btn btn-secondary" style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem', marginTop: '1rem', background: 'rgba(0,0,0,0.6)', border: 'none' }} onClick={handleReset}>
                                    <X size={24} />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="upload-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="dropzone-content"
                            style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            <div style={{ background: 'rgba(0, 102, 204, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                                <UploadCloud size={48} color="var(--color-primary)" />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Select Patient Scan</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Drag and drop DICOM-converted images here, or click to browse files</p>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px' }}>
                                Supported: JPG, PNG • Max: 10MB
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <input
                    id="file-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                />
            </motion.div>

            <motion.div 
                className="form-controls glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginTop: '1.5rem', padding: '1.5rem' }}
            >
                <div style={{ flex: 1 }}>
                    <label htmlFor="model-select" style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Inference Architecture
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select
                            id="model-select"
                            value={modelSelection}
                            onChange={(e) => setModelSelection(e.target.value)}
                            disabled={isUploading}
                            style={{ width: '100%', appearance: 'none', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '1rem' }}
                        >
                            <option value="all">Consensus Ensemble (Recommended)</option>
                            <option value="resnet101">ResNet101 Backbone Only</option>
                            <option value="efficientnetb0">EfficientNetB0 Backbone Only</option>
                            <option value="inceptionv3">InceptionV3 Backbone Only</option>
                        </select>
                        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
                            ▼
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!selectedFile || isUploading}
                    style={{ padding: '0.875rem 2rem', height: 'fit-content', borderRadius: 'var(--radius-md)' }}
                >
                    {isUploading ? (
                        <>
                            <div className="spinner spinner-sm"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <Zap size={18} /> Run Diagnostics
                        </>
                    )}
                </button>
            </motion.div>
        </form>
    );
};

export default UploadForm;
