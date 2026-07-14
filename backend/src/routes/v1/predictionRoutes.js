const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const predictionController = require('../../controllers/predictionController');
const validate = require('../../middleware/validate');
const { protect } = require('../../middleware/auth');
const { uploadLimiter } = require('../../middleware/rateLimiter');
const { listPredictionsSchema, predictSchema } = require('../../validators/predictionValidator');
const ApiError = require('../../utils/ApiError');

// Configure Multer for secure file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'tmp_uploads/');
    },
    filename: (req, file, cb) => {
        // Use UUID to prevent file name collisions
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(ApiError.badRequest('Error: Images Only (jpeg, jpg, png)'));
    }
});

// All prediction routes are protected
router.use(protect);

// Routes
router.route('/')
    .get(validate(listPredictionsSchema, 'query'), predictionController.getPredictions)
    .post(uploadLimiter, upload.single('image'), validate(predictSchema, 'body'), predictionController.createPrediction);

router.route('/stats')
    .get(predictionController.getStats);

router.route('/:id')
    .get(predictionController.getPredictionById)
    .delete(predictionController.deletePrediction);

module.exports = router;
