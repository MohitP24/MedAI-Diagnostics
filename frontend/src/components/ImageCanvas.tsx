import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize, MousePointer2 } from 'lucide-react';
import './ImageCanvas.css';

interface ImageCanvasProps {
    originalImageUrl: string;
    overlayImageUrl: string;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ originalImageUrl, overlayImageUrl }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [opacity, setOpacity] = useState(0.5);
    const [showOverlay, setShowOverlay] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imagesLoaded, setImagesLoaded] = useState(false);

    const originalImgRef = useRef<HTMLImageElement | null>(null);
    const overlayImgRef = useRef<HTMLImageElement | null>(null);

    // Load images
    useEffect(() => {
        const loadImages = async () => {
            setImagesLoaded(false);

            const originalImg = new Image();
            const overlayImg = new Image();

            originalImg.crossOrigin = 'anonymous';
            overlayImg.crossOrigin = 'anonymous';

            const originalPromise = new Promise<void>((resolve) => {
                originalImg.onload = () => resolve();
                originalImg.src = originalImageUrl;
            });

            const overlayPromise = new Promise<void>((resolve) => {
                overlayImg.onload = () => resolve();
                overlayImg.src = overlayImageUrl;
            });

            await Promise.all([originalPromise, overlayPromise]);

            originalImgRef.current = originalImg;
            overlayImgRef.current = overlayImg;
            setImagesLoaded(true);
        };

        loadImages();
    }, [originalImageUrl, overlayImageUrl]);

    // Draw canvas
    useEffect(() => {
        if (!imagesLoaded || !canvasRef.current || !originalImgRef.current || !overlayImgRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const originalImg = originalImgRef.current;
        const overlayImg = overlayImgRef.current;

        canvas.width = originalImg.width;
        canvas.height = originalImg.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        ctx.drawImage(originalImg, 0, 0);

        if (showOverlay) {
            ctx.globalAlpha = opacity;
            ctx.drawImage(overlayImg, 0, 0);
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    }, [imagesLoaded, opacity, showOverlay, zoom, pan]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div className="image-canvas-wrapper">
            <div className="canvas-display" style={{ position: 'relative' }}>
                {!imagesLoaded ? (
                    <div className="canvas-loading">
                        <div className="spinner"></div>
                        <p>Rendering visualization...</p>
                    </div>
                ) : (
                    <>
                        {/* Interactive Canvas */}
                        <canvas
                            ref={canvasRef}
                            className={`visualization-canvas ${isDragging ? 'grabbing' : zoom > 1 ? 'grab' : ''}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />

                        {/* Floating Controls Overlay */}
                        <motion.div 
                            className="canvas-floating-controls glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-full)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                {/* Opacity Toggle/Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={showOverlay}
                                            onChange={(e) => setShowOverlay(e.target.checked)}
                                            className="toggle-checkbox"
                                        />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Heatmap</span>
                                    </label>
                                    
                                    {showOverlay && (
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={opacity * 100}
                                            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                                            className="opacity-slider"
                                            style={{ width: '80px' }}
                                        />
                                    )}
                                </div>

                                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }} />

                                {/* Zoom Controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button className="icon-btn" onClick={() => setZoom(Math.max(1, zoom - 0.5))} disabled={zoom <= 1} title="Zoom Out">
                                        <ZoomOut size={16} />
                                    </button>
                                    <span style={{ fontSize: '0.8rem', width: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <button className="icon-btn" onClick={() => setZoom(Math.min(3, zoom + 0.5))} disabled={zoom >= 3} title="Zoom In">
                                        <ZoomIn size={16} />
                                    </button>
                                    {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                                        <button className="icon-btn" onClick={handleReset} title="Reset View" style={{ marginLeft: '0.25rem', color: 'var(--color-info)' }}>
                                            <Maximize size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>

            <div className="canvas-legend glass-card" style={{ marginTop: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '150px', height: '8px', background: 'linear-gradient(90deg, blue, cyan, yellow, red)', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Activation Intensity</span>
                    </div>
                    {zoom > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                            <MousePointer2 size={14} /> Click & drag to pan
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageCanvas;
