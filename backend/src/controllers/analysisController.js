import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import uploadToCloudinary from '../utils/cloudinaryUpload.js';
import runPythonScript from '../utils/runPythonScript.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const analyzePosture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { postureType } = req.body;

    const tempInputPath = path.join(__dirname, '..', 'temp', `${Date.now()}-${req.file.originalname}`);
    if (!fs.existsSync(path.dirname(tempInputPath))) {
      fs.mkdirSync(path.dirname(tempInputPath), { recursive: true });
    }
    fs.writeFileSync(tempInputPath, req.file.buffer);

    const outputFilename = `processed-${Date.now()}-${req.file.originalname}`;
    const tempOutputPath = path.join(__dirname, '..', 'temp', outputFilename);

    const pythonResult = await runPythonScript(tempInputPath, tempOutputPath, postureType);

    if (pythonResult.success) {
      const processedBuffer = fs.readFileSync(tempOutputPath);
      const { publicId, secureUrl } = await uploadToCloudinary(processedBuffer);

      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);

      const cloudName = process.env.CLOUD_NAME || 'dq7qoyrvn';
      const playerUrl = `https://player.cloudinary.com/embed/?cloud_name=${cloudName}&public_id=${publicId}&profile=cld-default`;

      res.json({
        success: true,
        message: 'Analysis completed successfully',
        processedUrl: secureUrl,
        processedVideoUrl: playerUrl,
        analysis: pythonResult.analysis,
      });
    } else {
      fs.unlinkSync(tempInputPath);
      if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);

      res.status(500).json({
        success: false,
        message: 'Analysis failed: ' + pythonResult.error,
        analysis: [],
      });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed: ' + error.message,
      analysis: [],
    });
  }
};
