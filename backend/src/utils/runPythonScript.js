import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const runPythonScript = async (inputPath, outputPath, postureType) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'python', 'posture_analyzer.py');

    if (!fs.existsSync(pythonScript)) {
      console.error('Python script not found:', pythonScript);
      return resolve({ success: false, error: 'Python script not found' });
    }

    const pythonProcess = spawn('python', [pythonScript, inputPath, outputPath, postureType], {
      cwd: __dirname
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          console.error('Error parsing Python output:', error);
          resolve({ success: false, error: 'Failed to parse Python output' });
        }
      } else {
        console.error('Python script error:', stderr);
        resolve({ success: false, error: stderr });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      resolve({ success: false, error: error.message });
    });
  });
};

export default runPythonScript;
