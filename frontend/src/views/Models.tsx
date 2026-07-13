
import { Link } from 'react-router-dom';
import '../styles/pages.css';

const MODELS = [
    {
        name: 'ResNet101',
        key: 'resnet101',
        icon: '🧠',
        tagline: 'Primary Model · Highest Accuracy',
        architecture: '101 layers · 44.5M parameters',
        inputSize: '224 × 224',
        strengths: [
            'Residual (skip) connections prevent vanishing gradients',
            'Deep representation of complex tissue patterns',
            'Robust to ultrasound speckle noise',
        ],
        performance: '~94% validation accuracy on BUSI',
        colorClass: 'model-primary',
    },
    {
        name: 'InceptionV3',
        key: 'inceptionv3',
        icon: '⚡',
        tagline: 'Secondary Model · Multi-scale Features',
        architecture: '48 layers · 23.9M parameters',
        inputSize: '224 × 224',
        strengths: [
            'Parallel convolutions capture multi-scale textures',
            'Factorized filters reduce computation',
            'Excellent at detecting both fine and coarse features',
        ],
        performance: '~91% validation accuracy on BUSI',
        colorClass: 'model-secondary',
    },
    {
        name: 'EfficientNetB0',
        key: 'efficientnetb0',
        icon: '🚀',
        tagline: 'Tertiary Model · Fastest Inference',
        architecture: '237 layers · 5.3M parameters',
        inputSize: '224 × 224',
        strengths: [
            'Compound scaling balances depth, width & resolution',
            'Most parameter-efficient of the three models',
            'Fastest inference time with competitive accuracy',
        ],
        performance: '~89% validation accuracy on BUSI',
        colorClass: 'model-tertiary',
    },
];

export default function Models() {
    return (
        <div className="page-container fade-in">
            <div className="page-hero">
                <div className="page-hero-badge">Ensemble Architecture</div>
                <h1 className="page-title">The 3-Model Ensemble</h1>
                <p className="page-subtitle">
                    Three state-of-the-art deep learning architectures vote together to produce
                    a confident, reliable diagnosis. Majority voting ensures that no single
                    model's bias dominates the final prediction.
                </p>
            </div>

            {/* Ensemble Voting Diagram */}
            <div className="ensemble-diagram">
                <div className="diagram-node input-node">
                    <span className="node-icon">🖼️</span>
                    <span>Ultrasound Image</span>
                </div>
                <div className="diagram-arrow">→</div>
                <div className="diagram-models">
                    <div className="diagram-model model-primary">ResNet101</div>
                    <div className="diagram-model model-secondary">InceptionV3</div>
                    <div className="diagram-model model-tertiary">EfficientNetB0</div>
                </div>
                <div className="diagram-arrow">→</div>
                <div className="diagram-node output-node">
                    <span className="node-icon">✅</span>
                    <span>Majority Vote</span>
                </div>
            </div>

            {/* Model Cards */}
            <div className="models-grid">
                {MODELS.map((model) => (
                    <div key={model.key} className={`model-detail-card ${model.colorClass}`}>
                        <div className="model-card-header">
                            <span className="model-big-icon">{model.icon}</span>
                            <div>
                                <h2 className="model-card-name">{model.name}</h2>
                                <p className="model-card-tagline">{model.tagline}</p>
                            </div>
                        </div>
                        <div className="model-card-meta">
                            <div className="meta-item">
                                <span className="meta-label">Architecture</span>
                                <span className="meta-value">{model.architecture}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Input Size</span>
                                <span className="meta-value">{model.inputSize}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Performance</span>
                                <span className="meta-value">{model.performance}</span>
                            </div>
                        </div>
                        <div className="model-card-strengths">
                            <p className="strengths-title">Key Strengths</p>
                            <ul>
                                {model.strengths.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {/* Why Ensemble */}
            <div className="page-card span-full ensemble-why">
                <div className="card-icon-row">
                    <span className="card-icon">🎯</span>
                    <h2>Why an Ensemble?</h2>
                </div>
                <p>
                    Each architecture has different inductive biases  -  ResNet101 is better at
                    deep hierarchical features, InceptionV3 at multi-scale textures, and
                    EfficientNetB0 at parameter-efficient edge detection. When they disagree,
                    the majority vote wins. This reduces individual model errors and produces
                    a significantly more robust prediction than any single model alone  - 
                    especially critical in a medical context.
                </p>
            </div>

            <div className="page-cta">
                <Link to="/" className="cta-btn">
                    ← Try the Classifier
                </Link>
                <Link to="/docs" className="cta-btn cta-secondary">
                    Read the Docs →
                </Link>
            </div>
        </div>
    );
}
