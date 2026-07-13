
import { Link } from 'react-router-dom';
import '../styles/pages.css';

export default function About() {
    return (
        <div className="page-container fade-in">
            <div className="page-hero">
                <div className="page-hero-badge">About the Project</div>
                <h1 className="page-title">MedAI Diagnostics</h1>
                <p className="page-subtitle">
                    An AI-powered clinical decision support tool for breast cancer
                    classification from ultrasound imaging using a state-of-the-art
                    deep learning ensemble.
                </p>
                <div style={{ marginTop: '20px' }}>
                    <a href="https://ieeexplore.ieee.org/document/11368083" target="_blank" rel="noopener noreferrer" className="cta-btn">
                        Read our IEEE Publication ↗
                    </a>
                </div>
            </div>

            <div className="page-grid">
                {/* Problem Statement */}
                <div className="page-card span-full">
                    <div className="card-icon-row">
                        <span className="card-icon">🎯</span>
                        <h2>Problem Statement</h2>
                    </div>
                    <p>
                        Breast cancer is one of the most common cancers worldwide. Early
                        and accurate diagnosis is critical, yet manual ultrasound analysis
                        is time-consuming, subjective, and highly dependent on radiologist
                        expertise. MedAI Diagnostics aims to bridge this gap by providing
                        a fast, reproducible, and explainable AI second opinion.
                    </p>
                </div>

                {/* Dataset */}
                <div className="page-card">
                    <div className="card-icon-row">
                        <span className="card-icon">🗂️</span>
                        <h2>Dataset</h2>
                    </div>
                    <p>
                        Trained on the publicly available <strong>BUSI (Breast Ultrasound
                        Images)</strong> dataset, which contains 780 labelled ultrasound
                        images across three classes: <span className="tag tag-benign">Benign</span>,{' '}
                        <span className="tag tag-malignant">Malignant</span>, and{' '}
                        <span className="tag tag-normal">Normal</span>.
                    </p>
                    <ul className="stat-list">
                        <li><strong>487</strong> Benign images</li>
                        <li><strong>210</strong> Malignant images</li>
                        <li><strong>133</strong> Normal images</li>
                    </ul>
                </div>

                {/* Methodology */}
                <div className="page-card">
                    <div className="card-icon-row">
                        <span className="card-icon">🔬</span>
                        <h2>Methodology</h2>
                    </div>
                    <p>
                        We use Transfer Learning  -  pre-trained ImageNet weights are
                        fine-tuned on the BUSI dataset. The ensemble combines three
                        diverse architectures so that each model's weaknesses are covered
                        by the others, producing a robust majority-vote prediction.
                    </p>
                    <ul className="stat-list">
                        <li>Input: 224×224 RGB ultrasound image</li>
                        <li>Normalization: pixel / 255.0</li>
                        <li>Output: Softmax over 3 classes</li>
                    </ul>
                </div>

                {/* Explainability */}
                <div className="page-card">
                    <div className="card-icon-row">
                        <span className="card-icon">🔍</span>
                        <h2>Explainability</h2>
                    </div>
                    <p>
                        Every prediction includes a <strong>Grad-CAM</strong> (Gradient-weighted
                        Class Activation Map) heatmap. This overlays a color gradient on the
                        original image, visually highlighting exactly which regions of the
                        ultrasound drove the model's decision  -  making the AI transparent and
                        interpretable for clinicians.
                    </p>
                </div>

                {/* Disclaimer */}
                <div className="page-card span-full disclaimer-card">
                    <div className="card-icon-row">
                        <span className="card-icon">⚠️</span>
                        <h2>Medical Disclaimer</h2>
                    </div>
                    <p>
                        This tool is developed as an <strong>academic research prototype</strong> for
                        a 5th Semester Software Engineering project. It is <strong>NOT</strong> a certified
                        medical device and must not be used as a substitute for professional
                        medical advice, diagnosis, or treatment. Always consult a qualified
                        healthcare professional.
                    </p>
                </div>
            </div>

            <div className="page-cta">
                <Link to="/" className="cta-btn">
                    ← Try the Classifier
                </Link>
                <Link to="/models" className="cta-btn cta-secondary">
                    Explore the Models →
                </Link>
            </div>
        </div>
    );
}
