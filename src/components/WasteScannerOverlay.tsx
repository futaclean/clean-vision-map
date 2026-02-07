import { useState, useEffect } from 'react';
import { Check, X, Scan, Shield, Sparkles, Loader2, AlertTriangle, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface ScanResult {
  verified: boolean;
  confidence: number;
  reason: string;
  suggestedWasteType?: string | null;
  wasteDescription?: string | null;
}

interface WasteScannerOverlayProps {
  imageUrl: string;
  isScanning: boolean;
  onVerified: (suggestedWasteType?: string, wasteDescription?: string) => void;
  onRejected: (reason: string) => void;
}

const wasteTypeLabels: Record<string, { label: string; color: string }> = {
  plastic: { label: 'Plastic Waste', color: 'bg-blue-500' },
  paper: { label: 'Paper/Cardboard', color: 'bg-amber-500' },
  food: { label: 'Food/Organic', color: 'bg-green-500' },
  hazardous: { label: 'Hazardous', color: 'bg-red-500' },
  mixed: { label: 'Mixed Waste', color: 'bg-purple-500' },
  other: { label: 'Other', color: 'bg-gray-500' },
};

const WasteScannerOverlay = ({ 
  imageUrl, 
  isScanning, 
  onVerified,
  onRejected
}: WasteScannerOverlayProps) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState<'initializing' | 'analyzing' | 'classifying' | 'verifying' | 'complete'>('initializing');
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<'verified' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [detectedWasteType, setDetectedWasteType] = useState<string | null>(null);
  const [wasteDescription, setWasteDescription] = useState<string | null>(null);

  useEffect(() => {
    if (!isScanning) {
      setScanProgress(0);
      setScanPhase('initializing');
      setShowResult(false);
      setScanResult(null);
      setRejectionReason('');
      setDetectedWasteType(null);
      setWasteDescription(null);
      return;
    }

    // Start AI verification in the background
    const verifyImage = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-waste-image', {
          body: { imageUrl }
        });

        if (error) {
          console.error('Verification error:', error);
          // On error, accept the image
          setScanResult('verified');
        } else if (data) {
          if (data.verified) {
            setScanResult('verified');
            setDetectedWasteType(data.suggestedWasteType || null);
            setWasteDescription(data.wasteDescription || null);
          } else {
            setScanResult('rejected');
            setRejectionReason(data.reason || 'Image does not appear to contain waste');
          }
        }
      } catch (err) {
        console.error('Verification failed:', err);
        // On error, accept the image
        setScanResult('verified');
      }
    };

    verifyImage();

    // Simulate scanning progress for UX
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Update scan phases for visual effect
    const phaseTimers = [
      setTimeout(() => setScanPhase('analyzing'), 600),
      setTimeout(() => setScanPhase('classifying'), 1400),
      setTimeout(() => setScanPhase('verifying'), 2200),
    ];

    return () => {
      clearInterval(progressInterval);
      phaseTimers.forEach(clearTimeout);
    };
  }, [isScanning, imageUrl]);

  // Show result when scan is complete (both progress and API response)
  useEffect(() => {
    if (scanProgress >= 100 && scanResult !== null) {
      setScanPhase('complete');
      setShowResult(true);
    }
  }, [scanProgress, scanResult]);

  // Handle completion callback
  useEffect(() => {
    if (showResult && scanResult) {
      const timer = setTimeout(() => {
        if (scanResult === 'verified') {
          onVerified(detectedWasteType || undefined, wasteDescription || undefined);
        } else {
          onRejected(rejectionReason);
        }
      }, scanResult === 'verified' ? 2000 : 2500);
      return () => clearTimeout(timer);
    }
  }, [showResult, scanResult, onVerified, onRejected, rejectionReason, detectedWasteType, wasteDescription]);

  if (!isScanning && !showResult) return null;

  const phaseMessages = {
    initializing: 'Initializing AI Scanner...',
    analyzing: 'Analyzing image content...',
    classifying: 'Classifying waste type...',
    verifying: 'Verifying detection...',
    complete: scanResult === 'verified' ? 'Waste Detected!' : 'Verification Failed'
  };

  const typeInfo = detectedWasteType ? wasteTypeLabels[detectedWasteType] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      >
        <div className="relative max-w-lg w-full">
          {/* Scanner Frame */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative rounded-2xl overflow-hidden bg-card border-2 border-primary/50 shadow-2xl"
          >
            {/* Image Container */}
            <div className="relative aspect-video">
              <img
                src={imageUrl}
                alt="Scanning waste"
                className="w-full h-full object-cover"
              />
              
              {/* Scanning Overlay Effects */}
              {!showResult && (
                <>
                  {/* Grid Overlay */}
                  <div className="absolute inset-0 opacity-30">
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: `
                          linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                      }}
                    />
                  </div>

                  {/* Scanning Line Animation */}
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-lg"
                    style={{ 
                      boxShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5)' 
                    }}
                    animate={{
                      top: ['0%', '100%', '0%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />

                  {/* Corner Brackets */}
                  <div className="absolute inset-4 pointer-events-none">
                    {/* Top Left */}
                    <motion.div 
                      className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    {/* Top Right */}
                    <motion.div 
                      className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.25 }}
                    />
                    {/* Bottom Left */}
                    <motion.div 
                      className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                    />
                    {/* Bottom Right */}
                    <motion.div 
                      className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.75 }}
                    />
                  </div>

                  {/* Floating Detection Points */}
                  <motion.div
                    className="absolute top-1/4 left-1/3 w-3 h-3 bg-primary rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute top-1/2 right-1/4 w-3 h-3 bg-primary rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                  />
                  <motion.div
                    className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-primary rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 }}
                  />
                </>
              )}

              {/* Result Overlay */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center ${
                    scanResult === 'verified' 
                      ? 'bg-green-500/30' 
                      : 'bg-red-500/30'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      scanResult === 'verified'
                        ? 'bg-green-500 shadow-[0_0_40px_rgba(34,197,94,0.6)]'
                        : 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)]'
                    }`}
                  >
                    {scanResult === 'verified' ? (
                      <Check className="w-10 h-10 text-white" />
                    ) : (
                      <X className="w-10 h-10 text-white" />
                    )}
                  </motion.div>

                  {/* Waste Type Badge on successful scan */}
                  {scanResult === 'verified' && typeInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4"
                    >
                      <Badge className={`${typeInfo.color} text-white text-sm px-4 py-2 shadow-lg`}>
                        <Tag className="w-4 h-4 mr-2" />
                        {typeInfo.label}
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Status Panel */}
            <div className="p-4 bg-card border-t border-border">
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      showResult && scanResult === 'rejected' 
                        ? 'bg-red-500' 
                        : 'bg-primary'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Status Message */}
              <div className="flex items-center justify-center gap-2">
                {!showResult ? (
                  <>
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm font-medium text-foreground">
                      {phaseMessages[scanPhase]}
                    </span>
                  </>
                ) : scanResult === 'verified' ? (
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        Waste Verified!
                      </span>
                    </div>
                    {wasteDescription && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-muted-foreground max-w-xs"
                      >
                        {wasteDescription}
                      </motion.p>
                    )}
                    {typeInfo && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs text-primary font-medium"
                      >
                        Auto-selecting: {typeInfo.label}
                      </motion.p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        Image Not Accepted
                      </span>
                    </div>
                    {rejectionReason && (
                      <p className="text-xs text-muted-foreground max-w-xs">
                        {rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* AI Badge */}
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>Powered by AI Waste Detection</span>
              </div>
            </div>
          </motion.div>

          {/* Scan Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2"
          >
            <Scan className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-white">Waste Scanner</span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WasteScannerOverlay;