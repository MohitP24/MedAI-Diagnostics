# S R Sreeram – AI & ML Engineering Contributions

**Role:** AI/ML Engineer  
**Focus:** Deep Learning Architecture, Transfer Learning, Explainable AI (XAI), and Model Inference Pipelines  

## Key Responsibilities & Achievements

### 1. Deep Learning Model Engineering
- Selected and trained an ensemble of three diverse, state-of-the-art CNN architectures: **ResNet101**, **InceptionV3**, and **EfficientNetB0**.
- Implemented **Transfer Learning** using pre-trained ImageNet weights to achieve rapid convergence on the specialized BUSI (Breast Ultrasound Images) dataset.
- Engineered data augmentation pipelines to handle the limited dataset size and prevent overfitting.
- Achieved a highly robust 94% accuracy via a custom Majority-Vote Ensemble architecture, compensating for individual model weaknesses.

### 2. Explainable AI (XAI) with Grad-CAM
- Engineered a custom implementation of **Gradient-weighted Class Activation Mapping (Grad-CAM)**.
- Extracted and hooked into the final convolutional layers of ResNet, Inception, and EfficientNet to compute spatial gradients.
- Designed dynamic heatmap generation that overlays highly activated regions directly onto the clinical ultrasound image, providing essential transparency for medical professionals.

### 3. Model Optimization & Inference
- Developed the Python Inference API using Flask to serve the `.keras` models.
- Implemented robust preprocessing pipelines to resize, normalize, and convert raw byte streams into NumPy tensors dynamically.
- Developed the core algorithm to parse multi-model probabilities and compute aggregate confidences dynamically.
- Authored the comprehensive model architecture and parameter tuning documentation.

## Technology Stack Used
- **Deep Learning Frameworks:** TensorFlow, Keras
- **Computer Vision:** OpenCV, Pillow, NumPy
- **Inference Serving:** Python, Flask
- **Core Algorithms:** Transfer Learning, Grad-CAM, Ensemble Voting
