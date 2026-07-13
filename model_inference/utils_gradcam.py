import tensorflow as tf
import numpy as np
import cv2
from matplotlib import cm
from PIL import Image


def get_last_conv_layer(model, model_name):
    """
    Identifies the last convolutional layer for each model architecture.
    
    Args:
        model: Loaded Keras model
        model_name: String identifier ('resnet101', 'inceptionv3', 'efficientnetb0')
    
    Returns:
        String: Layer name of the last convolutional layer
    """
    # Iterate backwards through layers to find the last Conv2D
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
    
    # Fallback: return None if no Conv2D found
    return None


def compute_gradcam(model, img_array, last_conv_layer_name, pred_index):
    """
    Computes Grad-CAM heatmap using gradient-weighted class activation mapping.
    
    Args:
        model: Loaded Keras model
        img_array: Preprocessed image array (batch dimension included)
        last_conv_layer_name: Name of the last conv layer
        pred_index: Index of the target class
    
    Returns:
        numpy array: Normalized heatmap (0-1 range)
    """
    # Create a model that maps the input to the activations of the last conv layer
    # and the output predictions
    grad_model = tf.keras.models.Model(
        inputs=[model.inputs],
        outputs=[model.get_layer(last_conv_layer_name).output, model.output]
    )
    
    # Compute the gradient of the top predicted class for the input image
    # with respect to the activations of the last conv layer
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        loss = predictions[:, pred_index]
    
    # Extract gradients
    grads = tape.gradient(loss, conv_outputs)
    
    # Global average pooling of gradients to get channel weights
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    
    # Weight the channels by the gradients
    conv_outputs = conv_outputs[0]
    pooled_grads = pooled_grads.numpy()
    conv_outputs = conv_outputs.numpy()
    
    # Weighted combination of feature maps
    for i in range(pooled_grads.shape[0]):
        conv_outputs[:, :, i] *= pooled_grads[i]
    
    # Average over all feature maps
    heatmap = np.mean(conv_outputs, axis=-1)
    
    # Apply ReLU to focus on positive contributions
    heatmap = np.maximum(heatmap, 0)
    
    # Normalize to 0-1 range
    if np.max(heatmap) != 0:
        heatmap = heatmap / np.max(heatmap)
    
    return heatmap


def generate_overlay(heatmap, original_img_path, alpha=0.4):
    """
    Creates RGBA overlay by applying colormap and compositing with original image.
    
    Args:
        heatmap: Normalized heatmap array (0-1 range)
        original_img_path: Path to the original image file
        alpha: Opacity of the heatmap overlay (0-1 range)
    
    Returns:
        tuple: (heatmap_rgb, overlay_rgb) as numpy arrays
    """
    # Load the original image
    img = cv2.imread(original_img_path)
    if img is None:
        raise ValueError(f"Could not load image from {original_img_path}")
    
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Resize heatmap to match original image dimensions
    heatmap_resized = cv2.resize(heatmap, (img.shape[1], img.shape[0]))
    
    # Apply colormap (jet colormap for visualization)
    colormap = cm.get_cmap('jet')
    heatmap_colored = colormap(heatmap_resized)
    heatmap_colored = (heatmap_colored[:, :, :3] * 255).astype(np.uint8)
    
    # Superimpose the heatmap on the original image
    overlay = cv2.addWeighted(img, 1 - alpha, heatmap_colored, alpha, 0)
    
    return heatmap_colored, overlay


def save_heatmaps(heatmap_colored, overlay, output_dir, model_name, request_id):
    """
    Saves both raw heatmap and overlay images.
    
    Args:
        heatmap_colored: Colored heatmap array
        overlay: Overlay image array
        output_dir: Directory to save images
        model_name: Model identifier
        request_id: Unique request identifier
    
    Returns:
        dict: Paths to saved files
    """
    import os
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filenames
    heatmap_filename = f"{model_name}_heatmap_{request_id}.png"
    overlay_filename = f"{model_name}_{request_id}.png"
    
    heatmap_path = os.path.join(output_dir, heatmap_filename)
    overlay_path = os.path.join(output_dir, overlay_filename)
    
    # Save heatmap (raw colored)
    heatmap_img = Image.fromarray(heatmap_colored)
    heatmap_img.save(heatmap_path)
    
    # Save overlay
    overlay_img = Image.fromarray(overlay)
    overlay_img.save(overlay_path)
    
    return {
        'heatmap': heatmap_path,
        'overlay': overlay_path,
        'heatmap_url': f"/heatmaps/{overlay_filename}"
    }
