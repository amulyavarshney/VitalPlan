import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Scan, Upload, X, Info, Zap, Apple, RotateCcw, FlashlightOff as FlashOff, Slash as Flash, Barcode } from 'lucide-react';
import type { ScannedFood } from '../../types';
import { scannerAPI, getApiErrorMessage } from '../../services/api';

interface FoodScannerProps {
  onAddToCart?: (items: any[]) => void;
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array], filename, { type: mime });
}

function mapAnalysisToScannedFood(
  analysis: Awaited<ReturnType<typeof scannerAPI.analyzeImage>>,
  imageData?: string
): ScannedFood {
  return {
    id: analysis.id || `scan-${Date.now()}`,
    name: analysis.foodName || analysis.name || 'Unknown food',
    brand: analysis.brand,
    barcode: analysis.barcode || '',
    calories: analysis.calories,
    servingSize: analysis.servingSize,
    macros: analysis.macros,
    nutritionDetails: {
      vitamins: analysis.nutritionDetails?.vitamins || {},
      minerals: analysis.nutritionDetails?.minerals || {},
      fiber: analysis.nutritionDetails?.fiber || 0,
      sugar: analysis.nutritionDetails?.sugar || 0,
      sodium: analysis.nutritionDetails?.sodium || 0,
      cholesterol: analysis.nutritionDetails?.cholesterol || 0,
      saturatedFat: analysis.nutritionDetails?.saturatedFat || 0,
      transFat: analysis.nutritionDetails?.transFat || 0,
    },
    confidence: analysis.confidence,
    aiInsights: analysis.aiInsights,
    analyzedAt: analysis.analyzedAt ? new Date(analysis.analyzedAt) : new Date(),
    imageData,
  };
}

export default function FoodScanner({ onAddToCart }: FoodScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions or try uploading an image.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Stop camera
    stopCamera();

    // Start AI analysis
    setIsProcessing(true);
    try {
      const file = dataUrlToFile(imageData, `scan-${Date.now()}.jpg`);
      const analysis = await scannerAPI.analyzeImage(file);
      setScannedFood(mapAnalysisToScannedFood(analysis, imageData));
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError(getApiErrorMessage(error, 'Failed to analyze image. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  }, [stopCamera]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;

      setIsProcessing(true);
      try {
        const analysis = await scannerAPI.analyzeImage(file);
        setScannedFood(mapAnalysisToScannedFood(analysis, imageData));
      } catch (error) {
        console.error('Error analyzing image:', error);
        setError(getApiErrorMessage(error, 'Failed to analyze image. Please try again.'));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBarcodeLookup = async () => {
    const cleaned = barcode.trim();
    if (cleaned.length < 8) {
      setError('Enter a valid barcode (at least 8 digits)');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const analysis = await scannerAPI.scanBarcode(cleaned);
      setScannedFood(mapAnalysisToScannedFood(analysis));
    } catch (err) {
      console.error('Error looking up barcode:', err);
      setError(getApiErrorMessage(err, 'Barcode lookup failed. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isScanning) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  };

  const resetScanner = () => {
    setScannedFood(null);
    setError(null);
    setIsProcessing(false);
    stopCamera();
  };

  const addToMealPlan = () => {
    if (scannedFood && onAddToCart) {
      onAddToCart([{
        id: scannedFood.id,
        name: scannedFood.name,
        type: 'grocery',
        price: 3.99,
        quantity: 1
      }]);
      alert('Food added to your meal plan!');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl mb-4">
            <Scan className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">AI Food Scanner</h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-4">
            Instantly analyze any food with AI-powered nutrition tracking. Snap a photo to get detailed nutritional information.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center text-red-800">
              <Info className="w-5 h-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Camera View */}
        {isScanning && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Camera Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 sm:w-80 sm:h-80 border-2 border-white rounded-2xl opacity-50"></div>
              </div>

              {/* Camera Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <button
                  onClick={switchCamera}
                  className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                >
                  {flashEnabled ? <Flash className="w-5 h-5" /> : <FlashOff className="w-5 h-5" />}
                </button>
              </div>

              {/* Capture Button */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                >
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
              </div>

              {/* Cancel Button */}
              <div className="absolute bottom-6 right-6">
                <button
                  onClick={stopCamera}
                  className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Analyzing Your Food</h3>
            <p className="text-gray-600 text-sm sm:text-base">AI is processing nutritional information...</p>
          </div>
        )}

        {/* Scan Options */}
        {!isScanning && !scannedFood && !isProcessing && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Camera Scan */}
              <button
                onClick={startCamera}
                className="p-6 sm:p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-emerald-500 transition-colors group text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-2xl mb-4 group-hover:bg-emerald-200 transition-colors">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Scan with Camera</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-4">Take a photo of your food for instant AI analysis</p>
                <div className="inline-flex items-center text-emerald-600 font-medium text-sm sm:text-base">
                  <Zap className="w-4 h-4 mr-1" />
                  AI-Powered Analysis
                </div>
              </button>

              {/* Upload Photo */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-6 sm:p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 transition-colors group text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl mb-4 group-hover:bg-blue-200 transition-colors">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Upload Photo</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-4">Upload an existing photo from your gallery</p>
                <div className="inline-flex items-center text-blue-600 font-medium text-sm sm:text-base">
                  <Apple className="w-4 h-4 mr-1" />
                  Any Format
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </button>

              {/* Barcode Lookup */}
              <div className="p-6 sm:p-8 border-2 border-dashed border-gray-300 rounded-2xl">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-2xl mb-4">
                    <Barcode className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Lookup by Barcode</h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-4">
                    Enter a product barcode to fetch nutrition from Open Food Facts
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 3017620422003"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleBarcodeLookup}
                    className="inline-flex items-center justify-center px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Look up
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanned Results */}
        {scannedFood && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="relative">
              {(scannedFood.imageUrl || scannedFood.imageData) ? (
                <img
                  src={scannedFood.imageUrl || scannedFood.imageData}
                  alt={scannedFood.name}
                  className="w-full h-48 sm:h-64 object-cover"
                />
              ) : (
                <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                  <Apple className="w-16 h-16 text-emerald-500" />
                </div>
              )}
              <button
                onClick={resetScanner}
                className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* AI Confidence Badge */}
              {scannedFood.confidence && (
                <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {Math.round(scannedFood.confidence * 100)}% Match
                </div>
              )}
            </div>

            <div className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="mb-4 sm:mb-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{scannedFood.name}</h2>
                  <p className="text-gray-600">{scannedFood.brand}</p>
                  <p className="text-sm text-gray-500 mt-1">Serving: {scannedFood.servingSize}</p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{scannedFood.calories}</div>
                  <div className="text-sm text-gray-600">calories</div>
                </div>
              </div>

              {/* Macronutrients - Mobile Optimized */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                  <div className="font-semibold text-red-600 text-lg sm:text-xl">{scannedFood.macros.protein}g</div>
                  <div className="text-xs sm:text-sm text-gray-600">Protein</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-600 text-lg sm:text-xl">{scannedFood.macros.carbs}g</div>
                  <div className="text-xs sm:text-sm text-gray-600">Carbs</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                  <div className="font-semibold text-yellow-600 text-lg sm:text-xl">{scannedFood.macros.fat}g</div>
                  <div className="text-xs sm:text-sm text-gray-600">Fat</div>
                </div>
              </div>

              {/* AI Insights */}
              {scannedFood.aiInsights && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-emerald-600" />
                    AI Health Insights
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scannedFood.aiInsights.map((insight, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Nutrition - Collapsible on Mobile */}
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Nutrients</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fiber:</span>
                      <span className="font-medium">{scannedFood.nutritionDetails.fiber}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sugar:</span>
                      <span className="font-medium">{scannedFood.nutritionDetails.sugar}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sodium:</span>
                      <span className="font-medium">{scannedFood.nutritionDetails.sodium}mg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cholesterol:</span>
                      <span className="font-medium">{scannedFood.nutritionDetails.cholesterol}mg</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Vitamins</h4>
                    <div className="space-y-1">
                      {Object.entries(scannedFood.nutritionDetails.vitamins).map(([vitamin, amount]) => (
                        <div key={vitamin} className="flex justify-between text-sm">
                          <span className="text-gray-600">{vitamin}:</span>
                          <span className="font-medium">{amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Minerals</h4>
                    <div className="space-y-1">
                      {Object.entries(scannedFood.nutritionDetails.minerals).map(([mineral, amount]) => (
                        <div key={mineral} className="flex justify-between text-sm">
                          <span className="text-gray-600">{mineral}:</span>
                          <span className="font-medium">{amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={addToMealPlan}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center"
                >
                  <Apple className="w-5 h-5 mr-2" />
                  Add to Meal Plan
                </button>
                <button
                  onClick={resetScanner}
                  className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <Scan className="w-5 h-5 mr-2" />
                  Scan Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}