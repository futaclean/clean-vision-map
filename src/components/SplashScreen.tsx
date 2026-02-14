import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(onComplete, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "exit" ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-primary/20 top-1/3 animate-pulse" />
          <div className="absolute left-0 right-0 h-px bg-primary/10 top-2/3" />
        </div>

        {/* Glow */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full blur-[100px] bg-primary/20"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Logo */}
        <motion.div
          className="relative z-10"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        >
          <div className="relative">
            <img
              src="/logo-waste-track.png"
              alt="Waste-Track AI"
              className="h-24 w-24 rounded-2xl shadow-neon"
            />
            {/* Scan line effect over logo */}
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="scan-line absolute left-0 right-0 h-8" />
            </motion.div>
            {/* Pulse ring */}
            <motion.div
              className="absolute -inset-4 rounded-3xl border border-primary/30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.1, 1], opacity: [0, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          className="relative z-10 mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase === "logo" ? 0 : 1, y: phase === "logo" ? 20 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Waste-Track <span className="text-gradient">AI</span>
          </h1>
          <p className="text-xs font-mono text-muted-foreground tracking-[0.3em] uppercase">
            Intelligent Detection System
          </p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          className="relative z-10 mt-10 w-48 h-0.5 bg-border rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "logo" ? 0 : 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.4, ease: "easeInOut", delay: 0.6 }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
