import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Camera, Play, AlertCircle, CheckCircle, Image, Info,
  AlignVerticalJustifyEnd, Sun, Moon, Sparkles, Zap, Target,
  Activity, TrendingUp, Shield, ChevronRight, Eye, BarChart3,
  HeartPulse, Monitor, Dumbbell, Maximize2, X, Users,
  Github,
  GithubIcon
} from 'lucide-react';
import Logo from './assets/logo3.svg';

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
  const [dragActive, setDragActive] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
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

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFileType(file.type.startsWith('video/') ? 'video' : 'image');

      setAnalysisResult(null);
      setCurrentFeedback(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
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

        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `webcam-capture-${timestamp}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);

            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setFileType('image');

            setAnalysisResult(null);
            setCurrentFeedback(null);

            // Keep webcam active after capture
            // Don't stop the webcam here
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
    const localhost = 'http://localhost:3001/api/analyze'
    const live_server = 'https://posture-guard.onrender.com/api/analyze'
    const server_url = live_server; // Change this to localhost if testing locally
    try {
      const response = await fetch(server_url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);

      if (result.success && result.analysis && result.analysis.length > 0) {
        setCurrentFeedback(result.analysis[0]);
      }
    } catch (error) {
      console.error('Error analyzing posture:', error);
      setAnalysisResult({
        success: false,
        message: 'Failed to analyze posture. Please try again later or try another file.',
        analysis: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background - Made more spontaneous and faster */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute inset-0 transition-all duration-700 ${darkMode
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
          }`} />

        {/* Faster animated gradient orbs */}
        <motion.div
          className={`absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-80 blur-3xl ${darkMode ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-400/70 to-purple-400/70'
            }`}
          animate={{
            scale: [1, 1.3, 0.8, 1.2, 1],
            rotate: [0, 90, 180, 270, 360],
            x: [-10, 20, -15, 25, -10],
            y: [-15, 25, -20, 15, -15]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-80 blur-3xl ${darkMode ? 'bg-gradient-to-r from-indigo-600 to-cyan-600' : 'bg-gradient-to-r from-pink-400/70 to-orange-400/70'
            }`}
          animate={{
            scale: [1.2, 0.8, 1.4, 0.9, 1.2],
            rotate: [360, 270, 180, 90, 0],
            x: [15, -25, 20, -15, 15],
            y: [20, -15, 25, -20, 20]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className={`absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-40 blur-3xl ${darkMode ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gradient-to-r from-indigo-400/60 to-pink-400/60'
            }`}
          animate={{
            x: [-30, 40, -25, 35, -30],
            y: [-25, 35, -30, 25, -25],
            scale: [1, 1.2, 0.9, 1.3, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* More floating particles with faster motion */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-3 h-3 rounded-full ${darkMode ? 'bg-white/30' : 'bg-gradient-to-r from-purple-400/50 to-pink-400/50'
              }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-30, 40, -35, 30, -30],
              x: [-20, 30, -25, 20, -20],
              opacity: [0.2, 0.9, 0.3, 0.8, 0.2],
              scale: [0.5, 1.2, 0.7, 1, 0.5]
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-7xl max-h-[90vh] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setFullscreenImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={fullscreenImage}
                alt="Fullscreen view"
                className="w-full h-full object-contain rounded-xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with enhanced hover effects */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`relative backdrop-blur-xl border-b transition-all duration-300 ${darkMode
          ? 'bg-slate-900/30 border-purple-500/20'
          : 'bg-white/40 border-purple-200/60 shadow-lg shadow-purple-100/20'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className={`p-3 rounded-2xl shadow-lg backdrop-blur-md ${darkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-purple-200/50'
                  }`}
                whileHover={{
                  rotate: [0, -10, 10, -5, 5, 0],
                  scale: 1.1
                }}
                transition={{ duration: 0.6 }}
              >
                <img src={Logo} alt="Posture Guard Logo" className="h-10 w-10 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${darkMode
                    ? 'from-purple-400 via-pink-400 to-cyan-400'
                    : 'from-blue-600 via-purple-600 to-pink-600 drop-shadow-sm'
                    }`}
                  whileHover={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Posture Guard
                </motion.h1>
                <motion.p
                  className={`text-sm mt-1 ${darkMode ? 'text-purple-200' : 'text-purple-600/80 font-medium'
                    }`}
                  whileHover={{ scale: 1.05 }}
                >
                  Professional Posture Analysis
                </motion.p>
              </div>
            </motion.div>

            <nav className="flex items-center space-x-4">
              <motion.button
                whileHover={{
                  scale: 1.1,
                  boxShadow: darkMode ? '0 10px 25px rgba(168, 85, 247, 0.4)' : '0 10px 25px rgba(147, 51, 234, 0.3)'
                }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-xl backdrop-blur-md transition-all ${darkMode
                  ? 'bg-slate-800/50 hover:bg-slate-700/60 text-purple-300'
                  : 'bg-white/60 hover:bg-purple-50/80 text-purple-600 shadow-lg shadow-purple-100/30'
                  }`}
                onClick={() => setDarkMode(d => !d)}
                title="Toggle dark mode"
              >
                <AnimatePresence mode="wait">
                  {darkMode ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sun className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Moon className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.1,
                  boxShadow: darkMode ? '0 10px 25px rgba(168, 85, 247, 0.4)' : '0 10px 25px rgba(147, 51, 234, 0.3)'
                }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-xl backdrop-blur-md transition-all ${darkMode
                  ? 'bg-slate-800/50 hover:bg-slate-700/60 text-purple-300'
                  : 'bg-white/60 hover:bg-purple-50/80 text-purple-600 shadow-lg shadow-purple-100/30'
                  }`}
                onClick={() => {
                  window.open('https://github.com/anand-devx/posture-guard', '_blank');
                }}
                title="Github Repository"
              >
                <AnimatePresence mode="wait">

                  <motion.div
                    key="github"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GithubIcon className="h-6 w-6" />
                  </motion.div>

                </AnimatePresence>
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.1,
                  rotate: [0, -5, 5, 0],
                  boxShadow: darkMode ? '0 10px 25px rgba(168, 85, 247, 0.4)' : '0 10px 25px rgba(147, 51, 234, 0.3)'
                }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-xl backdrop-blur-md transition-all ${darkMode
                  ? 'bg-slate-800/50 hover:bg-slate-700/60 text-purple-300'
                  : 'bg-white/60 hover:bg-purple-50/80 text-purple-600 shadow-lg shadow-purple-100/30'
                  }`}
                onClick={() => {
                  window.open('https://github.com/anand-devx/posture-guard/?tab=readme-ov-file#postureguard-ai---real-time-posture-detection-system', '_blank');
                }}
              >
                <Info className="h-6 w-6" />
              </motion.button>
            </nav>
          </div>
        </div>
      </motion.header>

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Upload Section */}
          <motion.div
            className="xl:col-span-2"
            variants={cardVariants}
          >
            <motion.div
              className={`rounded-3xl backdrop-blur-xl border shadow-2xl p-8 transition-all duration-300 ${darkMode
                ? 'bg-slate-900/40 border-purple-500/30'
                : 'bg-white/50 border-purple-200/60 shadow-purple-100/20'
                }`}
              whileHover={{
                boxShadow: darkMode
                  ? '0 25px 50px rgba(168, 85, 247, 0.2)'
                  : '0 25px 50px rgba(147, 51, 234, 0.15)',
                y: -5
              }}
            >
              <motion.h2
                variants={itemVariants}
                className={`text-3xl font-bold mb-8 ${darkMode ? 'text-purple-100' : 'text-slate-800'
                  }`}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  className="inline-block"
                >
                  <Sparkles className="inline-block mr-3 h-8 w-8 text-purple-500" />
                </motion.div>
                Upload & Analyze
              </motion.h2>

              {/* Posture Type Selection with better icons */}
              <motion.div variants={itemVariants} className="mb-8">
                <motion.label
                  className={`block text-lg font-semibold mb-4 ${darkMode ? 'text-purple-200' : 'text-slate-700'
                    }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <Target className="inline-block mr-2 h-5 w-5" />
                  Select Analysis Type
                </motion.label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { type: 'squat', icon: Dumbbell, label: 'Squat Form', color: 'from-orange-500 to-red-500' },
                    { type: 'sitting', icon: Monitor, label: 'Sitting Posture', color: 'from-blue-500 to-cyan-500' }
                  ].map(({ type, icon: Icon, label, color }) => (
                    <motion.button
                      key={type}
                      onClick={() => setPostureType(type as 'squat' | 'sitting')}
                      className={`relative px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 backdrop-blur-md ${postureType === type
                        ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                        : darkMode
                          ? 'bg-slate-800/50 text-slate-200 hover:bg-slate-700/60'
                          : 'bg-white/60 text-slate-700 hover:bg-purple-50/80 shadow-lg shadow-purple-100/20'
                        }`}
                      whileHover={{
                        scale: postureType === type ? 1.05 : 1.02,
                        boxShadow: postureType === type
                          ? `0 15px 30px ${type === 'squat' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`
                          : undefined
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        className="inline-block"
                      >
                        <Icon className="inline-block mr-2 h-5 w-5" />
                      </motion.div>
                      {label}
                      {postureType === type && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl border-2 border-white/30"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Important Areas Information */}
                <motion.div
                  className={`mt-4 p-4 rounded-2xl backdrop-blur-md border ${darkMode
                    ? 'bg-indigo-900/30 border-indigo-400/30'
                    : 'bg-indigo-50/80 border-indigo-200/60 shadow-lg shadow-indigo-100/30'
                    }`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  whileHover={{ scale: 1.01 }}
                >
                  <p className={`font-semibold mb-2 ${darkMode ? 'text-indigo-200' : 'text-indigo-800'
                    }`}>
                    <Users className="inline-block mr-2 h-5 w-5" />
                    Key Areas for {postureType === 'squat' ? 'Squat' : 'Sitting'} Analysis:
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-indigo-100' : 'text-indigo-700'
                    }`}>
                    {postureType === 'squat'
                      ? 'Hip • Knee • Ankle • Toe • Shoulder alignment'
                      : 'Ear • Shoulder • Hip • Knee alignment'
                    }
                  </p>
                  <motion.p
                    className={`text-sm mt-3 transition-colors  ${darkMode ? 'text-purple-300/70 hover:text-purple-300' : 'text-purple-600/80 font-medium hover:text-purple-700'
                      }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    💡 Tip: A clear side view yields the most accurate analysis
                  </motion.p>
                </motion.div>
              </motion.div>

              {/* File Upload Area with dotted border */}
              <motion.div
                variants={itemVariants}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${dragActive
                  ? darkMode
                    ? 'border-purple-400 bg-purple-900/20 scale-105 shadow-2xl shadow-purple-400/30'
                    : 'border-purple-400 bg-purple-50/80 scale-105 shadow-2xl shadow-purple-200/50'
                  : darkMode
                    ? 'border-purple-500/50 bg-slate-800/30 hover:border-purple-400/70 hover:bg-slate-700/30'
                    : 'border-purple-300/60 bg-white/40 hover:border-purple-400/80 hover:bg-purple-50/60 shadow-lg shadow-purple-100/30'
                  }`}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{
                  scale: 1.02,
                  boxShadow: darkMode
                    ? '0 20px 40px rgba(168, 85, 247, 0.2)'
                    : '0 20px 40px rgba(147, 51, 234, 0.15)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    whileHover={{
                      rotate: [0, -10, 10, -5, 5, 0],
                      scale: 1.1
                    }}
                    className="inline-block mb-6"
                  >
                    <Upload className={`h-20 w-20 mx-auto ${darkMode ? 'text-purple-400' : 'text-purple-500'
                      }`} />
                  </motion.div>
                  <motion.p
                    className={`text-2xl font-bold mb-3 ${darkMode ? 'text-purple-100' : 'text-slate-800'
                      }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {selectedFile ? selectedFile.name : 'Drop your file here or click to browse'}
                  </motion.p>
                  <motion.p
                    className={`text-lg ${darkMode ? 'text-purple-200' : 'text-slate-600'
                      }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    Supports MP4, AVI, MOV, JPG, PNG formats
                  </motion.p>
                </motion.div>

                {dragActive && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </motion.div>

              {/* File Preview */}
              <AnimatePresence>
                {previewUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-8"
                  >
                    <motion.h3
                      className={`text-xl font-semibold mb-4 ${darkMode ? 'text-purple-200' : 'text-slate-800'
                        }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Eye className="inline-block mr-2 h-5 w-5" />
                      Preview
                    </motion.h3>
                    <motion.div
                      className={`rounded-3xl overflow-hidden border-2 backdrop-blur-md relative ${darkMode ? 'border-purple-400/50' : 'border-purple-300/60 shadow-lg shadow-purple-100/30'
                        }`}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: darkMode
                          ? '0 20px 40px rgba(168, 85, 247, 0.3)'
                          : '0 20px 40px rgba(147, 51, 234, 0.2)'
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {fileType === 'video' ? (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full max-h-100 object-cover"
                        />
                      ) : (
                        <div className="relative">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full max-h-100 object-cover"
                          />
                          <motion.button
                            onClick={() => setFullscreenImage(previewUrl)}
                            className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${darkMode
                              ? 'bg-slate-900/60 hover:bg-slate-800/80 text-white'
                              : 'bg-white/60 hover:bg-white/90 text-slate-700'
                              }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="View fullscreen"
                          >
                            <Maximize2 className="h-5 w-5" />
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>



              {/* Webcam Section with better colors */}
              <motion.div variants={itemVariants} className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <motion.h3
                    className={`text-xl font-semibold ${darkMode ? 'text-purple-200' : 'text-slate-800'
                      }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Camera className="inline-block mr-2 h-5 w-5" />
                    Live Webcam
                  </motion.h3>
                  <div className="flex gap-3">
                    {!isWebcamActive ? (
                      <motion.button
                        onClick={startWebcam}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg backdrop-blur-md hover:shadow-emerald-300/50"
                        variants={buttonVariants}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: '0 15px 30px rgba(16, 185, 129, 0.4)',
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                        }}
                        whileTap="tap"
                        transition={{ duration: 0.2 }}
                      >
                        <Camera className="h-5 w-5 inline-block mr-2" />
                        Start Webcam
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          onClick={captureFrame}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg backdrop-blur-md hover:shadow-blue-300/50"
                          variants={buttonVariants}
                          whileHover={{
                            scale: 1.05,
                            boxShadow: '0 15px 30px rgba(59, 130, 246, 0.4)',
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                          }}
                          whileTap="tap"
                          transition={{ duration: 0.2 }}
                        >
                          <Image className="h-5 w-5 inline-block mr-2" />
                          Capture
                        </motion.button>
                        <motion.button
                          onClick={stopWebcam}
                          className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg backdrop-blur-md hover:shadow-rose-300/50"
                          variants={buttonVariants}
                          whileHover={{
                            scale: 1.05,
                            boxShadow: '0 15px 30px rgba(244, 63, 94, 0.4)',
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                          }}
                          whileTap="tap"
                          transition={{ duration: 0.2 }}
                        >
                          Stop
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
                <motion.div
                  className={`rounded-3xl overflow-hidden border-2 backdrop-blur-md ${darkMode ? 'border-purple-400/50' : 'border-purple-300/60 shadow-lg shadow-purple-100/30'
                    }`}
                  whileHover={{
                    scale: 1.01,
                    boxShadow: darkMode
                      ? '0 20px 40px rgba(168, 85, 247, 0.3)'
                      : '0 20px 40px rgba(147, 51, 234, 0.2)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-100 object-cover"
                    style={{ display: isWebcamActive ? 'block' : 'none' }}
                  />
                  {!isWebcamActive && (
                    <div className={`w-full h-64 flex items-center justify-center ${darkMode
                      ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-black'
                      : 'bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50'
                      }`}>
                      <div className="text-center">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Camera className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-slate-500' : 'text-purple-400'
                            }`} />
                        </motion.div>
                        <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-purple-500'
                          }`}>Webcam inactive</p>
                      </div>
                    </div>
                  )}
                </motion.div>
                <canvas ref={canvasRef} className="hidden" />
              </motion.div>

              {/* Enhanced Action Button */}
              <motion.div variants={itemVariants} className="mt-10">
                <motion.button
                  onClick={analyzePosture}
                  disabled={!selectedFile || isAnalyzing}
                  className={`w-full py-6 px-8 rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 ${!selectedFile || isAnalyzing
                    ? 'opacity-50 cursor-not-allowed bg-slate-400'
                    : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:from-purple-700 hover:via-pink-700 hover:to-purple-700'
                    }`}
                  whileHover={!selectedFile || isAnalyzing ? {} : {
                    scale: 1.02,
                    boxShadow: '0 25px 50px rgba(168, 85, 247, 0.5)',
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  whileTap={!selectedFile || isAnalyzing ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                      <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center space-x-3"
                      >
                        <motion.div
                          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Analyzing Posture...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="analyze"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center space-x-3"
                      >
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                          className="inline-block"
                        >
                          <Zap className="h-6 w-6" />
                        </motion.div>
                        <span>Analyze Posture</span>
                        <ChevronRight className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Feedback & Results Panel */}
          <motion.div
            className="xl:col-span-1"
            variants={cardVariants}
          >
            <motion.div
              className={`rounded-3xl backdrop-blur-xl border shadow-2xl p-8 transition-all duration-300 ${darkMode
                ? 'bg-slate-900/40 border-purple-500/30'
                : 'bg-white/50 border-purple-200/60 shadow-purple-100/20'
                }`}
              whileHover={{
                boxShadow: darkMode
                  ? '0 25px 50px rgba(168, 85, 247, 0.2)'
                  : '0 25px 50px rgba(147, 51, 234, 0.15)',
                y: -5
              }}
            >
              <motion.h2
                variants={itemVariants}
                className={`text-2xl font-bold mb-6 ${darkMode ? 'text-purple-100' : 'text-slate-800'
                  }`}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  className="inline-block"
                >
                  <BarChart3 className="inline-block mr-3 h-7 w-7 text-purple-500" />
                </motion.div>
                Analysis Results
              </motion.h2>

              <AnimatePresence mode="wait">
                {currentFeedback ? (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-6"
                  >
                    {/* Posture Status */}
                    <motion.div
                      className={`p-6 rounded-2xl border-2 shadow-lg backdrop-blur-md ${currentFeedback.isGoodPosture
                        ? darkMode
                          ? 'bg-emerald-900/40 border-emerald-400/50'
                          : 'bg-emerald-50/90 border-emerald-300/60 shadow-emerald-100/50'
                        : darkMode
                          ? 'bg-red-900/40 border-red-400/50'
                          : 'bg-red-50/90 border-red-300/60 shadow-red-100/50'
                        }`}
                      variants={pulseVariants}
                      animate={currentFeedback.isGoodPosture ? {} : "pulse"}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center space-x-4">
                        {currentFeedback.isGoodPosture ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          >
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          >
                            <AlertCircle className="h-8 w-8 text-red-500" />
                          </motion.div>
                        )}
                        <div>
                          <p className={`font-bold text-lg ${currentFeedback.isGoodPosture
                            ? darkMode ? 'text-emerald-200' : 'text-emerald-800'
                            : darkMode ? 'text-red-200' : 'text-red-800'
                            }`}>
                            {currentFeedback.isGoodPosture ? 'Excellent Posture!' : 'Needs Improvement'}
                          </p>
                          <p className={`text-sm mt-1 ${currentFeedback.isGoodPosture
                            ? darkMode ? 'text-emerald-100' : 'text-emerald-600'
                            : darkMode ? 'text-red-100' : 'text-red-600'
                            }`}>
                            {currentFeedback.feedback}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Analysis Type */}
                    <motion.div
                      className={`rounded-2xl p-4 backdrop-blur-md border ${darkMode
                        ? 'bg-purple-900/30 border-purple-400/30'
                        : 'bg-purple-50/80 border-purple-200/60 shadow-lg shadow-purple-100/30'
                        }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className={`font-semibold ${darkMode ? 'text-purple-200' : 'text-purple-800'
                        }`}>
                        <Shield className="inline-block mr-2 h-5 w-5" />
                        Analysis: {currentFeedback.postureType === 'squat' ? 'Squat Form' : 'Sitting Posture'}
                      </p>
                    </motion.div>

                    {/* Measurements */}
                    <div className="space-y-3">
                      <motion.h3
                        className={`font-semibold text-lg ${darkMode ? 'text-purple-200' : 'text-slate-800'
                          }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <TrendingUp className="inline-block mr-2 h-5 w-5" />
                        Measurements
                      </motion.h3>
                      {Object.entries(currentFeedback.angles).map(([key, value], index) =>
                        value !== undefined && (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className={`flex justify-between items-center rounded-xl px-4 py-3 backdrop-blur-md ${darkMode ? 'bg-slate-800/50' : 'bg-white/70 shadow-lg shadow-purple-100/20'
                              }`}
                            whileHover={{
                              scale: 1.02,
                              boxShadow: darkMode
                                ? '0 10px 25px rgba(148, 163, 184, 0.2)'
                                : '0 10px 25px rgba(147, 51, 234, 0.1)'
                            }}
                          >
                            <span className={`font-medium capitalize ${darkMode ? 'text-slate-200' : 'text-slate-700'
                              }`}>
                              {key} Angle:
                            </span>
                            <motion.span
                              className="font-bold text-lg text-purple-500"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                            >
                              {value}°
                            </motion.span>
                          </motion.div>
                        )
                      )}
                    </div>

                    {/* Recommendations */}
                    {currentFeedback.warnings.length > 0 && (
                      <div className="space-y-3">
                        <motion.h3
                          className={`font-semibold text-lg ${darkMode ? 'text-purple-200' : 'text-slate-800'
                            }`}
                          whileHover={{ scale: 1.02 }}
                        >
                          Recommendations
                        </motion.h3>
                        <div className="space-y-2">
                          {currentFeedback.warnings.map((warning, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + index * 0.1 }}
                              className={`flex items-start space-x-3 rounded-xl px-4 py-3 backdrop-blur-md ${darkMode
                                ? 'bg-gradient-to-r from-orange-900/40 to-yellow-900/40 border border-orange-400/30'
                                : 'bg-gradient-to-r from-orange-100/80 to-yellow-100/80 border border-orange-200/60 shadow-lg shadow-orange-100/30'
                                }`}
                              whileHover={{
                                scale: 1.02,
                                boxShadow: darkMode
                                  ? '0 10px 25px rgba(251, 146, 60, 0.3)'
                                  : '0 10px 25px rgba(251, 146, 60, 0.2)'
                              }}
                            >
                              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-orange-500" />
                              <span className={`text-sm ${darkMode ? 'text-orange-100' : 'text-orange-800'
                                }`}>
                                {warning}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : isAnalyzing ? ((
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex flex-col items-center justify-center rounded-2xl backdrop-blur-md border p-8 ${darkMode
                      ? 'bg-slate-900/40 border-purple-500/30'
                      : 'bg-white/50 border-purple-200/60 shadow-lg shadow-purple-100/30'
                      }`}
                  >
                    <motion.div
                      className="w-16 h-16 border-4 border-t-transparent border-purple-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                    />
                    <motion.p
                      className={`mt-6 text-lg font-medium ${darkMode ? 'text-purple-200' : 'text-slate-800'
                        }`}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      Analyzing your posture...
                    </motion.p>
                  </motion.div>
                )
                )

                  : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        className={`rounded-full p-6 w-24 h-24 mx-auto mb-6 backdrop-blur-md ${darkMode ? 'bg-slate-800/50' : 'bg-white/70 shadow-lg shadow-purple-100/30'
                          }`}
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Camera className={`h-12 w-12 mx-auto ${darkMode ? 'text-slate-400' : 'text-purple-400'
                          }`} />
                      </motion.div>
                      <motion.p
                        className={`text-lg mb-2 ${darkMode ? 'text-purple-200' : 'text-slate-600'
                          }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        Ready for Analysis
                      </motion.p>
                      <motion.p
                        className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        Upload a file or capture from webcam to begin
                      </motion.p>
                    </motion.div>
                  )}
              </AnimatePresence>

              {/* Analysis Results */}
              <AnimatePresence>
                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`mt-8 rounded-2xl backdrop-blur-md border p-6 ${darkMode
                      ? 'bg-slate-800/40 border-slate-600/30'
                      : 'bg-white/70 border-purple-200/60 shadow-lg shadow-purple-100/30'
                      }`}
                  >
                    <motion.h3
                      className={`text-lg font-semibold mb-4 ${darkMode ? 'text-purple-200' : 'text-slate-800'
                        }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      Processing Results
                    </motion.h3>

                    {analysisResult.success ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <motion.div
                          className={`rounded-xl p-4 backdrop-blur-md ${darkMode
                            ? 'bg-emerald-900/30 border border-emerald-400/30'
                            : 'bg-emerald-50/90 border border-emerald-200/60 shadow-lg shadow-emerald-100/30'
                            }`}
                          whileHover={{ scale: 1.02 }}
                        >
                          <p className={`font-semibold ${darkMode ? 'text-emerald-200' : 'text-emerald-800'
                            }`}>
                            ✅ Analysis Complete!
                          </p>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-emerald-100' : 'text-emerald-600'
                            }`}>
                            {analysisResult.message}
                          </p>
                        </motion.div>

                        {(analysisResult.processedVideoUrl || analysisResult.processedUrl) && (
                          <div className="space-y-3">
                            <motion.p
                              className={`font-semibold ${darkMode ? 'text-purple-200' : 'text-slate-800'
                                }`}
                              whileHover={{ scale: 1.02 }}
                            >
                              Processed Result:
                            </motion.p>
                            <motion.div
                              className={`rounded-xl overflow-hidden border-2 relative ${darkMode ? 'border-purple-400/50' : 'border-purple-400/60 shadow-lg shadow-purple-100/30'
                                }`}
                              whileHover={{
                                scale: 1.02,
                                boxShadow: darkMode
                                  ? '0 20px 40px rgba(168, 85, 247, 0.3)'
                                  : '0 20px 40px rgba(147, 51, 234, 0.2)'
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              {fileType === 'video' ? (
                                <iframe
                                  src={analysisResult.processedVideoUrl}
                                  allow="autoplay; fullscreen"
                                  width="100%"
                                  height="250"
                                  className="bg-black"
                                />
                              ) : (
                                <div className="relative">
                                  <img
                                    src={analysisResult.processedUrl}
                                    alt="Processed result"
                                    className="w-full object-cover"
                                  />
                                  <motion.button
                                    onClick={() => setFullscreenImage(analysisResult.processedUrl!)}
                                    className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${darkMode
                                      ? 'bg-slate-900/60 hover:bg-slate-800/80 text-white'
                                      : 'bg-white/60 hover:bg-white/90 text-slate-700'
                                      }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="View fullscreen"
                                  >
                                    <Maximize2 className="h-5 w-5" />
                                  </motion.button>
                                </div>
                              )}
                            </motion.div>
                          </div>
                        )}

                        {analysisResult.analysis.length > 0 && (
                          <motion.div
                            className={`rounded-xl p-4 backdrop-blur-md ${darkMode
                              ? 'bg-blue-900/30 border border-blue-400/30'
                              : 'bg-blue-50/90 border border-blue-200/60 shadow-lg shadow-blue-100/30'
                              }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <p className={`font-semibold mb-2 ${darkMode ? 'text-blue-200' : 'text-blue-800'
                              }`}>
                              Summary:
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-blue-100' : 'text-blue-700'
                              }`}>
                              Analyzed {analysisResult.analysis.length} frame(s) • {' '}
                              {analysisResult.analysis[0]?.isGoodPosture ? 'Good form detected' : 'Improvement areas identified'}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`rounded-xl p-4 backdrop-blur-md ${darkMode
                          ? 'bg-red-900/30 border border-red-400/30'
                          : 'bg-red-50/90 border border-red-200/60 shadow-lg shadow-red-100/30'
                          }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className={`font-semibold ${darkMode ? 'text-red-200' : 'text-red-800'
                          }`}>
                          ❌ Analysis Failed
                        </p>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-red-100' : 'text-red-600'
                          }`}>
                          {analysisResult.message}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default App;