# Developer Runbook

## Quick Start Guide

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- All dependencies installed (see Installation section below)

### Installation (One-Time Setup)

#### 1. Python Dependencies
```bash
cd model_inference
pip install -r requirements.txt
```

**Note**: TensorFlow installation may take 5-10 minutes depending on your internet connection.

#### 2. Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Frontend Dependencies
```bash
cd frontend
npm install
```

### Running the Application

**Option 1: Using Batch Scripts (Windows)**

1. Open **Terminal 1** and run:
   ```bash
   start-backend.bat
   ```

2. Open **Terminal 2** and run:
   ```bash
   start-frontend.bat
   ```

**Option 2: Manual Start**

1. **Terminal 1 - Backend Server**:
   ```bash
   cd backend
   npm start
   ```
   Server will start on `http://localhost:3001`

2. **Terminal 2 - Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   UI will be available at `http://localhost:5173`

3. **Open Browser**: Navigate to `http://localhost:5173`

### Testing the Application

1. Upload a breast ultrasound image (JPG, JPEG, or PNG)
2. Select model(s) to run:
   - **All Models (Ensemble)** - Runs all three models and shows voting result
   - **ResNet101** - Single model
   - **InceptionV3** - Single model
   - **EfficientNetB0** - Single model
3. Click "Analyze Image"
4. Wait for inference (5-20 seconds on CPU, 0.2-1 second on GPU)
5. View results with Grad-CAM overlays

### Sample Test Images

Use images from the `Dataset_BUSI_with_GT` folder:
- **Benign**: `Dataset_BUSI_with_GT/benign/*.png`
- **Malignant**: `Dataset_BUSI_with_GT/malignant/*.png`
- **Normal**: `Dataset_BUSI_with_GT/normal/*.png`

### Troubleshooting

#### Backend won't start
**Error**: `Cannot find module 'express'`

**Solution**: Install dependencies
```bash
cd backend
npm install
```

#### Frontend won't start
**Error**: `Cannot find module 'react'`

**Solution**: Install dependencies
```bash
cd frontend
npm install
```

#### Python script fails
**Error**: `ModuleNotFoundError: No module named 'tensorflow'`

**Solution**: Install Python dependencies
```bash
cd model_inference
pip install -r requirements.txt
```

#### Models not found
**Error**: `Model not found: models/resnet101_breast_ultrasound.keras`

**Solution**: Ensure all `.keras` files are in the `models/` directory:
- `efficientnetb0_breast_ultrasound.keras`
- `inceptionv3_breast_ultrasound.keras`
- `resnet101_breast_ultrasound.keras`

#### Port already in use
**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**: Kill the process using the port
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use a different port
set PORT=3002 && npm start
```

#### CORS errors
**Error**: `Access to fetch at 'http://localhost:3001' has been blocked by CORS policy`

**Solution**: Ensure backend is running and CORS is enabled (already configured)

### Performance Optimization

#### Using GPU (Recommended for Production)

**Check GPU availability**:
```python
import tensorflow as tf
print("GPUs Available:", tf.config.list_physical_devices('GPU'))
```

**Expected performance**:
- **CPU Mode**: 5-20 seconds per image
- **GPU Mode**: 0.2-1 second per image

#### Memory Management

- Maximum 1 concurrent inference by default (configured in `backend/queue.js`)
- Heatmaps auto-deleted after 24 hours
- Uploaded images deleted immediately after processing

### API Testing

Test backend API directly with curl:

```bash
# Test health endpoint
curl http://localhost:3001/status

# Test prediction endpoint
curl -X POST http://localhost:3001/predict \
  -F "image=@path/to/test_image.png" \
  -F "model=all"
```

### Development Mode

#### Hot Reload
- Frontend: Vite hot reload enabled by default
- Backend: Use `nodemon` for auto-restart
  ```bash
  cd backend
  npm run dev
  ```

#### Debugging

**Backend Logs**:
- Check console output in Terminal 1
- Logs show request IDs, model processing, and errors

**Frontend Logs**:
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls

**Python Logs**:
- Check backend console for Python stdout/stderr
- Python script logs to `stderr` for progress

### Stopping the Application

1. Press `Ctrl+C` in Terminal 1 (Backend)
2. Press `Ctrl+C` in Terminal 2 (Frontend)

### Cleanup

**Remove generated heatmaps**:
```bash
# Windows
del /Q backend\public\heatmaps\*

# Linux/Mac
rm backend/public/heatmaps/*
```

**Remove temporary files**:
```bash
# Windows
del /Q backend\tmp_uploads\*

# Linux/Mac
rm backend/tmp_uploads/*
```

### Production Deployment Notes

1. Build frontend for production:
   ```bash
   cd frontend
   npm run build
   ```

2. Serve the built frontend from backend (optional):
   ```javascript
   // In backend/server.js
   app.use(express.static(path.join(__dirname, '../frontend/dist')));
   ```

3. Use PM2 or similar for process management:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name breast-cancer-api
   ```

4. Configure reverse proxy (nginx/Apache) for production deployment

5. Set environment variables:
   ```bash
   export NODE_ENV=production
   export PORT=3001
   ```

### Support

For issues or questions:
1. Check this runbook first
2. Review README.md for architecture details
3. Check backend and frontend console logs
4. Verify all dependencies are installed
5. Open an issue in the repository

---

**Last Updated**: December 2024  
**Project**: Breast Cancer Ultrasound Classification System  
**Version**: 1.0.0
