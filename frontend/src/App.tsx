import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Play, Pause, AlertCircle, CheckCircle, Download, Home, Info, Image } from 'lucide-react';

interface PostureAnalysis {
  timestamp: number;
  postureType: 'squat' | 'sitting';
  isGoodPosture: boolean;
  feedback: string;
  angles: {
    knee?: number;
    back?: number;
    neck?: number;
  };
  warnings: string[];
}

interface AnalysisResult {
  success: boolean;
  message: string;
  processedVideoUrl?: string;
  processedUrl?: string;
  analysis: PostureAnalysis[];
}

function App() {

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<PostureAnalysis | null>(null);
  const [postureType, setPostureType] = useState<'squat' | 'sitting'>('squat');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'video' | 'image' | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('pgai-dark') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pgai-dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pgai-dark', 'false');
    }
  }, [darkMode]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = (file: File) => {
    if (file && (file.type.startsWith('video/') || file.type.startsWith('image/'))) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Set file type
      setFileType(file.type.startsWith('video/') ? 'video' : 'image');
      
      // Clear previous results
      setAnalysisResult(null);
      setCurrentFeedback(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
      setIsWebcamActive(true);
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Unable to access webcam. Please check permissions and try again.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current && isWebcamActive) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob and create file
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `webcam-capture-${timestamp}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);
            
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setFileType('image');
            
            // Clear previous results
            setAnalysisResult(null);
            setCurrentFeedback(null);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const analyzePosture = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setCurrentFeedback(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('postureType', postureType);

    try {
      const response = await fetch('https://posture-guard.onrender.com/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
      console.log(result.processedUrl)
      if (result.success && result.analysis && result.analysis.length > 0) {
        setCurrentFeedback(result.analysis[0]);
      }
    } catch (error) {
      console.error('Error analyzing posture:', error);
      setAnalysisResult({
        success: false,
        message: 'Failed to analyze posture. Please ensure the backend server is running and try again.',
        analysis: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('File uploaded successfully:', result.url);
        alert('File uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please ensure the backend server is running and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadProcessedFile = () => {
    if (analysisResult?.processedVideoUrl) {
      const link = document.createElement('a');
      link.href = analysisResult.processedVideoUrl;
      link.download = `processed-${selectedFile?.name || 'file'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewUrl]);


 function CloudinaryPlayer({ publicId }) {
  useEffect(() => {
    if (window.cloudinary) {
      const cld = window.cloudinary.Cloudinary.new({ cloud_name: 'dq7qoyrvn' });

      const player = cld.videoPlayer('my-player', {
        controls: true,
        autoplay: false,
        fluid: true,
      });

      player.source(publicId);
    }
  }, [publicId]);

  return (
    <video id="my-player" controls></video>
  );
}
const BACKEND_URL = 'https://posture-guard.onrender.com/';

async function pingBackend() {
  try {
    await fetch(BACKEND_URL);
    console.log('Backend pinged.');
  } catch (err) {
    console.error('Backend ping failed:', err);
  }
}

// On load
pingBackend();

// Every 14 min (14 * 60 * 1000 ms)
setInterval(pingBackend, 14 * 60 * 1000);
return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      {/* Header */}
      <header className={`backdrop-blur-lg shadow-lg border-b ${darkMode ? 'bg-[#0f3460]/80 border-[#1a1a2e]' : 'bg-white/80 border-blue-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg shadow-lg ${darkMode ? 'bg-gradient-to-r from-pink-600 to-yellow-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
                <Home className="h-6 w-6 text-white" />
              </div>
              <h1 className={`text-3xl font-extrabold bg-gradient-to-r ${darkMode ? 'from-pink-400 via-yellow-400 to-purple-400' : 'from-blue-600 to-purple-600'} bg-clip-text text-transparent drop-shadow`}>
                PostureGuard AI
              </h1>
            </div>
            <nav className="flex items-center space-x-6">
              <button
                className={`rounded-full p-2 transition-colors ${darkMode ? 'bg-[#16213e] hover:bg-[#1a1a2e]' : 'bg-gray-100 hover:bg-blue-100'}`}
                onClick={() => setDarkMode(d => !d)}
                title="Toggle dark mode"
              >
                <span className="sr-only">Toggle dark mode</span>
                <svg className="h-6 w-6 text-yellow-400 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {darkMode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 7.05l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                  )}
                </svg>
              </button>
              <button className={`text-gray-600 dark:text-gray-300 hover:text-pink-500 transition-colors`}>
                <Info className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className={`rounded-3xl shadow-2xl border-4 ${darkMode ? 'bg-[#16213e]/80 border-pink-400' : 'bg-white/80 border-blue-200'} p-10`}>
              <h2 className={`text-3xl font-extrabold mb-8 ${darkMode ? 'text-yellow-300' : 'text-purple-700'}`}>Upload Video/Image or Use Webcam</h2>
              
              {/* Posture Type Selection */}
              <div className="mb-8">
                <label className={`block text-lg font-bold mb-4 ${darkMode ? 'text-pink-300' : 'text-blue-700'}`}>
                  Select Posture Type
                </label>
                <div className="flex space-x-6">
                  <button
                    onClick={() => setPostureType('squat')}
                    className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 ${
                      postureType === 'squat'
                        ? 'bg-gradient-to-r from-pink-500 to-yellow-400 text-white scale-105'
                        : 'bg-gray-200 dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200 hover:bg-pink-100 dark:hover:bg-pink-900'
                    }`}
                  >
                    Squat Analysis
                  </button>
                  <button
                    onClick={() => setPostureType('sitting')}
                    className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 ${
                      postureType === 'sitting'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105'
                        : 'bg-gray-200 dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900'
                    }`}
                  >
                    Sitting Analysis
                  </button>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-4 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                  darkMode
                    ? 'border-yellow-400 bg-gradient-to-br from-[#1a1a2e]/80 via-[#16213e]/80 to-[#0f3460]/80 hover:border-pink-400'
                    : 'border-blue-400 bg-gradient-to-br from-blue-100/80 via-white/80 to-purple-100/80 hover:border-purple-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-blue-500'}`} />
                <p className={`text-xl font-bold mb-2 ${darkMode ? 'text-yellow-200' : 'text-gray-700'}`}>
                  {selectedFile ? selectedFile.name : 'Drop your video or image here or click to browse'}
                </p>
                <p className={`text-md ${darkMode ? 'text-pink-200' : 'text-gray-500'}`}>
                  Supports MP4, AVI, MOV, JPG, PNG formats
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* File Preview */}
              {previewUrl && (
                <div className="mt-8">
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-yellow-200' : 'text-gray-800'}`}>Preview</h3>
                  <div className={`rounded-2xl overflow-hidden border-4 ${darkMode ? 'border-pink-400' : 'border-blue-200'} bg-black`}>
                    {fileType === 'video' ? (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full max-h-72 object-contain"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-h-72 object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Webcam Section */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-yellow-200' : 'text-gray-800'}`}>Live Webcam</h3>
                  <div className="flex space-x-3">
                    {!isWebcamActive ? (
                      <button
                        onClick={startWebcam}
                        className="bg-gradient-to-r from-green-400 to-blue-400 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:from-green-500 hover:to-blue-500 transition-all"
                      >
                        <Camera className="h-5 w-5 inline-block mr-2" />
                        Start Webcam
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={captureFrame}
                          className="bg-gradient-to-r from-pink-400 to-yellow-400 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:from-pink-500 hover:to-yellow-500 transition-all"
                        >
                          <Image className="h-5 w-5 inline-block mr-2" />
                          Capture Frame
                        </button>
                        <button
                          onClick={stopWebcam}
                          className="bg-gradient-to-r from-red-400 to-pink-400 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:from-red-500 hover:to-pink-500 transition-all"
                        >
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className={`rounded-2xl overflow-hidden border-4 ${darkMode ? 'border-yellow-400' : 'border-blue-200'} bg-black`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                    style={{ display: isWebcamActive ? 'block' : 'none' }}
                  />
                  {!isWebcamActive && (
                    <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">Webcam not active</p>
                      </div>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Action Buttons */}
              <div className="mt-10 flex space-x-6">
                <button
                  onClick={analyzePosture}
                  disabled={!selectedFile || isAnalyzing}
                  className={`flex-1 bg-gradient-to-r from-pink-500 to-yellow-400 text-white px-8 py-4 rounded-2xl font-extrabold text-lg shadow-lg hover:from-pink-600 hover:to-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      <span>Analyze Posture</span>
                    </>
                  )}
                </button>
                
                
              </div>
            </div>
          </div>

          {/* Feedback & Results Panel */}
          <div className="lg:col-span-1">
            <div className={`rounded-3xl shadow-2xl border-4 ${darkMode ? 'bg-[#16213e]/80 border-yellow-400' : 'bg-white/80 border-blue-200'} p-8`}>
              <h2 className={`text-2xl font-extrabold mb-6 ${darkMode ? 'text-yellow-300' : 'text-purple-700'}`}>Analysis Feedback</h2>
              
              {currentFeedback ? (
                <div className="space-y-6">
                  {/* Posture Status */}
                  <div className={`p-5 rounded-2xl border-4 shadow-lg ${
                    currentFeedback.isGoodPosture 
                      ? (darkMode ? 'bg-green-900/60 border-green-400' : 'bg-green-50 border-green-200')
                      : (darkMode ? 'bg-red-900/60 border-pink-400' : 'bg-red-50 border-red-200')
                  }`}>
                    <div className="flex items-center space-x-4">
                      {currentFeedback.isGoodPosture ? (
                        <CheckCircle className="h-7 w-7 text-green-400" />
                      ) : (
                        <AlertCircle className="h-7 w-7 text-pink-400" />
                      )}
                      <div>
                        <p className={`font-extrabold text-lg ${
                          currentFeedback.isGoodPosture ? (darkMode ? 'text-green-200' : 'text-green-800') : (darkMode ? 'text-pink-200' : 'text-red-800')
                        }`}>
                          {currentFeedback.isGoodPosture ? 'Good Posture!' : 'Poor Posture Detected'}
                        </p>
                        <p className={`text-md ${
                          currentFeedback.isGoodPosture ? (darkMode ? 'text-green-100' : 'text-green-600') : (darkMode ? 'text-pink-100' : 'text-red-600')
                        }`}>
                          {currentFeedback.feedback}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Posture Type */}
                  <div className={`rounded-xl p-3 shadow bg-gradient-to-r ${darkMode ? 'from-pink-900/60 to-yellow-900/60' : 'from-blue-50 to-purple-100'} border-2 ${darkMode ? 'border-yellow-400' : 'border-blue-200'}`}>
                    <p className={`font-bold ${darkMode ? 'text-yellow-200' : 'text-blue-800'}`}>
                      Analysis Type: {currentFeedback.postureType === 'squat' ? 'Squat Form' : 'Sitting Posture'}
                    </p>
                  </div>

                  {/* Angle Measurements */}
                  <div className="space-y-3">
                    <h3 className={`font-bold ${darkMode ? 'text-yellow-200' : 'text-gray-800'}`}>Measurements</h3>
                    {currentFeedback.angles.knee !== undefined && (
                      <div className={`${darkMode ? 'text-yellow-200' : 'text-gray-800'} flex justify-between items-center rounded-xl px-4 py-2 shadow ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gray-50'}`}>
                        <span className={` text-md font-medium`}>Knee Angle:</span>
                        <span className="font-bold">{currentFeedback.angles.knee}°</span>
                      </div>
                    )}
                    {currentFeedback.angles.back !== undefined && (
                      <div className={`${darkMode ? 'text-yellow-200' : 'text-gray-800'} flex justify-between items-center rounded-xl px-4 py-2 shadow ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gray-50'}`}>
                        <span className={` text-md font-medium`}>Back Angle:</span>
                        <span className="font-bold">{currentFeedback.angles.back}°</span>
                      </div>
                    )}
                    {currentFeedback.angles.neck !== undefined && (
                      <div className={`${darkMode ? 'text-yellow-200' : 'text-gray-800'} flex justify-between items-center rounded-xl px-4 py-2 shadow ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gray-50'}`}>
                        <span className="text-md font-medium">Neck Position:</span>
                        <span className="font-bold">{currentFeedback.angles.neck}°</span>
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {currentFeedback.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h3 className={`font-bold ${darkMode ? 'text-yellow-200' : 'text-gray-800'}`}>Recommendations</h3>
                      <div className="space-y-2">
                        {currentFeedback.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className={`flex items-start space-x-3 rounded-xl px-4 py-3 shadow-lg animate-pulse font-semibold ${
                              darkMode
                                ? 'bg-gradient-to-r from-yellow-700/80 via-pink-700/80 to-orange-700/80 text-yellow-100'
                                : 'bg-gradient-to-r from-yellow-400/80 via-pink-300/80 to-orange-400/80 text-gray-900'
                            }`}
                          >
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 drop-shadow" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className={`rounded-full p-5 w-20 h-20 mx-auto mb-4 shadow-lg ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}>
                    <Camera className="h-10 w-10 text-gray-400 mx-auto" />
                  </div>
                  <p className={`mb-2 ${darkMode ? 'text-pink-200' : 'text-gray-500'}`}>
                    Upload a video/image or capture from webcam
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-gray-400'}`}>
                    Then click "Analyze Posture" to get feedback
                  </p>
                </div>
              )}

              {/* Results Panel */}
              {analysisResult && (
                <div className={`mt-8 rounded-2xl shadow-2xl border-4 ${darkMode ? 'bg-[#1a1a2e]/80 border-pink-400' : 'bg-white/80 border-blue-200'} p-6`}>
                  <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-yellow-200' : 'text-gray-800'}`}>Analysis Results</h3>
                  
                  {analysisResult.success ? (
                    <div className="space-y-6">
                      <div className={`rounded-xl p-4 shadow bg-gradient-to-r ${darkMode ? 'from-green-900/60 to-yellow-900/60' : 'from-green-50 to-yellow-100'} border-2 ${darkMode ? 'border-green-400' : 'border-green-200'}`}>
                        <p className={`font-bold ${darkMode ? 'text-green-200' : 'text-green-800'}`}>✅ Analysis Complete!</p>
                        <p className={`text-md ${darkMode ? 'text-green-100' : 'text-green-600'}`}>{analysisResult.message}</p>
                      </div>
                      
                      {(analysisResult.processedVideoUrl || analysisResult.processedUrl) && (
                        <div className="space-y-3">
                          <p className={`font-bold ${darkMode ? 'text-yellow-200' : 'text-gray-800'}`}>Processed Result:</p>
                          {fileType === 'video' ? (
                            <iframe
                              src={analysisResult.processedVideoUrl}
                              allow="autoplay; fullscreen"
                              width="100%"
                              height="300"
                              className="rounded-xl border-4 border-pink-400 shadow-lg"
                              style={{ background: darkMode ? '#1a1a2e' : '#000' }}
                            />
                          ) : (
                            <img
                              src={analysisResult.processedUrl}
                              alt="Processed result"
                              className="w-full rounded-xl border-4 border-yellow-400 shadow-lg"
                              style={{ background: darkMode ? '#1a1a2e' : '#fff' }}
                            />
                          )}
                         
                        </div>
                      )}

                      {/* Analysis Summary */}
                      {analysisResult.analysis.length > 0 && (
                        <div className={`rounded-xl p-4 shadow bg-gradient-to-r ${darkMode ? 'from-blue-900/60 to-purple-900/60' : 'from-blue-50 to-purple-100'} border-2 ${darkMode ? 'border-yellow-400' : 'border-blue-200'}`}>
                          <p className={`font-bold mb-2 ${darkMode ? 'text-yellow-200' : 'text-blue-800'}`}>Analysis Summary:</p>
                          <p className={`text-md ${darkMode ? 'text-yellow-100' : 'text-blue-700'}`}>
                            Analyzed {analysisResult.analysis.length} frame(s) for {postureType} posture
                          </p>
                          <p className={`text-md ${darkMode ? 'text-yellow-100' : 'text-blue-600'}`}>
                            Overall assessment: {analysisResult.analysis[0]?.isGoodPosture ? 'Good form detected' : 'Areas for improvement identified'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`rounded-xl p-4 shadow bg-gradient-to-r ${darkMode ? 'from-red-900/60 to-pink-900/60' : 'from-red-50 to-pink-100'} border-2 ${darkMode ? 'border-pink-400' : 'border-red-200'}`}>
                      <p className={`font-bold ${darkMode ? 'text-pink-200' : 'text-red-800'}`}>❌ Analysis Failed</p>
                      <p className={`text-md ${darkMode ? 'text-pink-100' : 'text-red-600'}`}>{analysisResult.message}</p>
                      <p className={`text-xs mt-2 ${darkMode ? 'text-yellow-200' : 'text-red-500'}`}>
                        Backend Error
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;