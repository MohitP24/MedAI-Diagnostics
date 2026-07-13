import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

const FAQ = [
    {
        q: 'What image formats are supported?',
        a: 'JPG, JPEG, and PNG files up to 10MB. The images should be breast ultrasound scans for meaningful results.',
    },
    {
        q: 'What do the three classes mean?',
        a: 'Benign  -  a non-cancerous mass. Malignant  -  a potentially cancerous growth requiring further clinical evaluation. Normal  -  no significant abnormality detected.',
    },
    {
        q: 'What is the "Confidence" score?',
        a: 'It is the softmax probability assigned by the model to its top predicted class. A score of 99% means the model is very certain; 60% means it is less certain and clinical judgement is especially important.',
    },
    {
        q: 'What is Grad-CAM?',
        a: 'Gradient-weighted Class Activation Mapping (Grad-CAM) computes which pixels in the image had the largest gradient with respect to the predicted class. Hot (red) regions had the most influence; cool (blue) regions had the least.',
    },
    {
        q: 'What if ResNet101 shows 0.00% or no badge?',
        a: 'This usually means the ResNet101 model file is missing from SWE/models/. Check that resnet101_breast_ultrasound.keras exists there. It may have been accidentally moved during setup.',
    },
    {
        q: 'How long does a prediction take?',
        a: 'With the persistent Flask server running, predictions complete in 5–15 seconds. The first startup takes 1–2 minutes while models load into memory, but subsequent predictions are instant.',
    },
];

const STEPS = [
    {
        number: '01',
        title: 'Start the Python Flask Server',
        code: 'cd SWE/model_inference\npython app.py',
        note: 'Wait until you see "✅ All models loaded. Ready to serve on port 5001."',
    },
    {
        number: '02',
        title: 'Start the Node.js Backend',
        code: 'cd SWE/backend\nnpm start',
        note: 'Should print "🚀 Server running on port 3001"',
    },
    {
        number: '03',
        title: 'Start the React Frontend',
        code: 'cd SWE/frontend\nnpm run dev',
        note: 'Open http://localhost:5173 in your browser',
    },
    {
        number: '04',
        title: 'Upload & Analyze',
        code: '',
        note: 'Drag & drop or click to browse for a breast ultrasound image, select your model, and click "Analyze Image".',
    },
];

export default function Docs() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="page-container fade-in">
            <div className="page-hero">
                <div className="page-hero-badge">Documentation</div>
                <h1 className="page-title">How to Use MedAI Diagnostics</h1>
                <p className="page-subtitle">
                    Complete guide to running the project, interpreting results,
                    and understanding the Grad-CAM visualizations.
                </p>
            </div>

            {/* Quick Start */}
            <section className="docs-section">
                <h2 className="section-heading">🚀 Quick Start</h2>
                <div className="steps-grid">
                    {STEPS.map((step) => (
                        <div key={step.number} className="step-card">
                            <div className="step-number">{step.number}</div>
                            <h3 className="step-title">{step.title}</h3>
                            {step.code && (
                                <pre className="step-code"><code>{step.code}</code></pre>
                            )}
                            <p className="step-note">{step.note}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Interpreting Results */}
            <section className="docs-section">
                <h2 className="section-heading">📊 Interpreting Results</h2>
                <div className="page-grid">
                    <div className="page-card">
                        <div className="card-icon-row">
                            <span className="card-icon">🗳️</span>
                            <h3>Ensemble Card</h3>
                        </div>
                        <p>
                            The top card shows the final <strong>majority-vote prediction</strong> across all
                            3 models, along with the average confidence among agreeing models. This is
                            the most reliable signal.
                        </p>
                    </div>
                    <div className="page-card">
                        <div className="card-icon-row">
                            <span className="card-icon">📈</span>
                            <h3>Per-Model Cards</h3>
                        </div>
                        <p>
                            Each individual model card shows its own top class, confidence score, and a
                            probability bar chart for all 3 classes. Pay attention when models disagree
                            -  it signals a borderline case.
                        </p>
                    </div>
                    <div className="page-card">
                        <div className="card-icon-row">
                            <span className="card-icon">🌡️</span>
                            <h3>Grad-CAM Heatmaps</h3>
                        </div>
                        <p>
                            Hover over or click a model result to see the Grad-CAM overlay.
                            <strong> Red / warm</strong> areas were most influential in the prediction.
                            <strong> Blue / cool</strong> areas were ignored. A good model should focus
                            on the mass region, not the surrounding tissue.
                        </p>
                    </div>
                    <div className="page-card">
                        <div className="card-icon-row">
                            <span className="card-icon">📊</span>
                            <h3>Model Comparison Chart</h3>
                        </div>
                        <p>
                            The bar chart at the bottom compares the probability each model assigned to
                            Benign, Malignant, and Normal. When all bars are the same color and height,
                            the models are in strong agreement  -  high confidence.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="docs-section">
                <h2 className="section-heading">❓ Frequently Asked Questions</h2>
                <div className="faq-list">
                    {FAQ.map((item, i) => (
                        <div
                            key={i}
                            className={`faq-item ${openFaq === i ? 'faq-open' : ''}`}
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        >
                            <div className="faq-question">
                                <span>{item.q}</span>
                                <span className="faq-chevron">{openFaq === i ? '▲' : '▼'}</span>
                            </div>
                            {openFaq === i && (
                                <div className="faq-answer">{item.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <div className="page-cta">
                <Link to="/" className="cta-btn">
                    ← Try the Classifier
                </Link>
                <Link to="/about" className="cta-btn cta-secondary">
                    About the Project →
                </Link>
            </div>
        </div>
    );
}
