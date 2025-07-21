# Posture Guard - Real-time Posture Detection System

A modern web application that uses AI-powered pose detection to analyze and provide feedback on posture during squats and desk sitting. Built with React, Node.js, and MediaPipe.

## 🚀 Features

- **Real-time Posture Analysis**: Upload videos or use webcam for live posture detection
- **Dual Mode Detection**: Specialized analysis for squats and desk sitting postures
- **Rule-based Feedback**: Intelligent posture assessment with specific warnings
- **Visual Overlays**: Pose landmarks and angle measurements displayed on video and images
- **Modern UI**: Clean, responsive interface with real-time feedback panels
- **File Management**: Secure upload and processing of videos

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

### Python
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
git clone https://github.com/anand-devx/posture-guard.git
cd posture-guard
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies
```bash
cd.. # not needed if already using from root directory
cd backend
npm install
```

### 4. Install Python Dependencies
```bash
cd python # Or cd backend/python if using from root directory
pip install -r requirements.txt
```
## 📁 Environment Variables

Rename the file named `.env.sample` to `.env` in the backend directory and add the following:

```env
PORT=3001                               # ✅ Port your local server will run on
CLOUD_NAME=your_cloudinary_cloud_name   # ✅ Cloudinary cloud name
API_KEY=your_cloudinary_api_key         # ✅ Cloudinary API key
API_SECRET=your_cloudinary_api_secret   # ✅ Cloudinary API secret
CORS_ORIGIN=*                           # ✅ Allowed CORS origin(s); * means allow all (use carefully in production)
```

## 🔒 Good practice

Always add `.env` to `.gitignore` to avoid committing secrets:
```
// .gitignore
.env
```

## 🚦 Running the Application

### Change Server in Frontend
In `fronend/src/App.tsx` change the `server_url` at line 174 to `localhost` for testing using local backend, and to `live_server` for using live server. You can also adjust values of `localhost` and `live_server`
```js
// frontend/src/App.tsx : line 172
const localhost = 'http://localhost:3001/api/analyze'; // You can change the port from 3001 to anything here

// frontend/src/App.tsx : line 173
const live_server = 'https://posture-guard.onrender.com/api/analyze'; // You can change the live server here

// frontend/src/App.tsx : line 174
const server_url = live_server; // for using live server
const server_url = localhost; // for using localhost
```

### Development Mode (Recommended)

```bash
# From frontend and backend directory separately run
npm run dev
```

This will start both the frontend (port 5173) and backend (port 3001) servers.

## 🎯 Usage

### 1. Select Posture Type
- Choose between "Squat Analysis" or "Sitting Analysis"

### 2. Upload Video/Image or Use Webcam
- **File Upload**: Drag and drop video files (MP4, AVI, MOV, JPG, PNG formats supported)
- **Webcam**: Click "Start Webcam" for real-time capture

### 3. Analyze Posture
- Click "Analyze Posture" to process your video/image
- View real-time feedback in the side panel

### 4. Review Results
- Check posture quality indicators
- View angle measurements
- Get the proccessed image/video with detection results and angles

## 🔍 Posture Analysis Rules

### Squat Analysis
- **Knee Position**: Flags if knee extends beyond toe
- **Back Angle**: Warns if back angle < 30° or > 60° with respect to thigh
- **Depth Check**: Ensures proper squat depth

### Sitting Analysis
- **Neck Posture**: Detects forward head posture (> 20°)
- **Back Alignment**: Checks for neutral spine position wrt thigh
- **Overall Posture**: Comprehensive sitting assessment

## 📊 API Endpoints

### `POST /api/analyze`
Analyze posture in uploaded video
- **Body**: FormData with file and postureType
- **Response**: Analysis results with feedback

### `GET /api/`
Health check endpoint
- **Response**: Server Name

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

### Customization
- Modify posture rules in `backend/python/posture_analyzer.py`
- Adjust UI colors in `tailwind.config.js`
- Update analysis parameters in server configuration

## 📝 Project Structure

```
posture-guard-ai/
├── backend/                         # Backend server and API
│   ├── package.json                 # Node.js backend dependencies
│   ├── requirements.txt             # Python dependencies for posture analysis
│   ├── server.js                    # Express server entry point
│   ├── .env.sample
│   ├── src/                         # Backend source code
│   │   ├── config/
│   │   │   └── cloudinary.js        # Cloudinary config
│   │   ├── controllers/
│   │   │   └── analysisController.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── upload.js
│   │   ├── python/
│   │   │   └── posture_analyzer.py  # Python script for posture analysis
│   │   ├── routes/
│   │   │   └── analysisRoutes.js
│   │   ├── temp/                    # Temporary and processed files
│   │   │   ├── *.jpg
│   │   │   ├── *.jpeg
│   │   │   └── processed-*.jpg
│   │   └── utils/
│   │       ├── cloudinaryUpload.js
│   │       └── runPythonScript.js
├── frontend/                        # Frontend React app
│   ├── package.json                 # Frontend dependencies
│   ├── index.html                   # Main HTML file
│   ├── eslint.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                  # Main React component
│       ├── index.css                # Global styles
│       ├── main.tsx                 # React entry point
│       ├── vite-env.d.ts
│       └── assets/
│           ├── logo.svg
│           ├── logo2.svg
│           ├── logo3.svg
│           ├── logo4.svg
│           ├── logo5.svg
│           └── meditation-yoga-posture-svgrepo-com.svg
├── .gitignore                       # Git ignore file
├── README.md                        # Project documentation
```

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)
```bash
npm run build
# Deploy dist/ folder
```

### Backend Deployment (Heroku/Railway/Render)
```bash
# Ensure Python and Node.js dependencies are installed
npm install && pip install -r requirements.txt
```

### Full Stack Deployment
- Frontend: Netlify, Vercel, or GitHub Pages
- Backend: Render, Railway, or Heroku
- Database: MongoDB Atlas or PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email anandyadav11206@gmail.com

---

**Made with ❤️ by the Anand**