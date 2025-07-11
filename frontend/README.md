# PostureGuard AI - Real-time Posture Detection System

A modern web application that uses AI-powered pose detection to analyze and provide feedback on posture during squats and desk sitting. Built with React, Node.js, and MediaPipe.

## 🚀 Features

- **Real-time Posture Analysis**: Upload videos or use webcam for live posture detection
- **Dual Mode Detection**: Specialized analysis for squats and desk sitting postures
- **Rule-based Feedback**: Intelligent posture assessment with specific warnings
- **Visual Overlays**: Pose landmarks and angle measurements displayed on video
- **Modern UI**: Clean, responsive interface with real-time feedback panels
- **File Management**: Secure upload, processing, and download of videos

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Vite** - Fast build tool

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### AI/ML
- **MediaPipe** - Pose detection and landmark extraction
- **OpenCV** - Computer vision and image processing
- **Python** - AI processing scripts

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/posture-guard-ai.git
cd posture-guard-ai
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Install Python Dependencies
```bash
cd backend/python
pip install -r requirements.txt
```

### 5. Create Required Directories
```bash
mkdir backend/uploads
mkdir backend/processed
```

## 🚦 Running the Application

### Development Mode (Recommended)
```bash
# From root directory
npm run dev-full
```

This will start both the frontend (port 5173) and backend (port 3001) servers.

### Separate Servers
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run server
```

## 🎯 Usage

### 1. Select Posture Type
- Choose between "Squat Analysis" or "Sitting Analysis"

### 2. Upload Video or Use Webcam
- **File Upload**: Drag and drop video files (MP4, AVI, MOV)
- **Webcam**: Click "Start Webcam" for real-time capture

### 3. Analyze Posture
- Click "Analyze Posture" to process your video
- View real-time feedback in the side panel

### 4. Review Results
- Check posture quality indicators
- View angle measurements
- Download processed video with overlays

## 🔍 Posture Analysis Rules

### Squat Analysis
- **Knee Position**: Flags if knee extends beyond toe
- **Back Angle**: Warns if back angle < 150°
- **Depth Check**: Ensures proper squat depth

### Sitting Analysis
- **Neck Posture**: Detects forward head posture (> 30°)
- **Back Alignment**: Checks for neutral spine position
- **Overall Posture**: Comprehensive sitting assessment

## 📊 API Endpoints

### `POST /api/upload`
Upload video files for processing
- **Body**: FormData with file
- **Response**: File information and URL

### `POST /api/analyze`
Analyze posture in uploaded video
- **Body**: FormData with file and postureType
- **Response**: Analysis results with feedback

### `GET /api/health`
Health check endpoint
- **Response**: Server status and uptime

## 🎨 UI Components

### Main Interface
- **Upload Zone**: Drag-and-drop file upload
- **Webcam Panel**: Live video capture
- **Control Buttons**: Analysis and upload controls

### Feedback Panel
- **Real-time Status**: Good/poor posture indicators
- **Angle Measurements**: Precise angle calculations
- **Warnings**: Specific posture improvement suggestions

## 🔧 Configuration

### Environment Variables
```bash
# Backend server port
PORT=3001

# File upload limits
MAX_FILE_SIZE=100MB

# Python script path
PYTHON_SCRIPT_PATH=./python/posture_analyzer.py
```

### Customization
- Modify posture rules in `backend/python/posture_analyzer.py`
- Adjust UI colors in `tailwind.config.js`
- Update analysis parameters in server configuration

## 📝 Project Structure

```
posture-guard-ai/
├── src/                    # Frontend React components
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles
├── backend/               # Backend server
│   ├── server.js          # Express server
│   ├── python/            # Python processing scripts
│   │   ├── posture_analyzer.py
│   │   └── requirements.txt
│   ├── uploads/           # Uploaded files
│   └── processed/         # Processed outputs
├── public/                # Static assets
└── README.md              # This file
```

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)
```bash
npm run build
# Deploy dist/ folder
```

### Backend Deployment (Heroku/Railway)
```bash
# Ensure Python and Node.js buildpacks
git push heroku main
```

### Full Stack Deployment
- Frontend: Netlify, Vercel, or GitHub Pages
- Backend: Heroku, Railway, or DigitalOcean
- Database: MongoDB Atlas or PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MediaPipe** team for pose detection technology
- **OpenCV** community for computer vision tools
- **React** team for the amazing frontend framework
- **Tailwind CSS** for beautiful styling utilities

## 📞 Support

For support, email support@postureguard.ai or join our Discord community.

---

**Made with ❤️ by the PostureGuard AI Team**