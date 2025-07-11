import express from 'express';
import upload from '../middleware/upload.js';
import { analyzePosture } from '../controllers/analysisController.js';

const router = express.Router();

router.post('/analyze', upload.single('file'), analyzePosture);

export default router;
