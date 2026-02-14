import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Scan, Camera, Brain, MapPin,
  Users, BarChart3, CheckCircle2, ArrowRight, Sparkles,
  Shield, Route, Eye, Activity, Zap, Globe
} from "lucide-react";

import demoWasteProblem from "@/assets/demo-waste-problem.jpg";
import demoCitizenReport from "@/assets/demo-citizen-report.jpg";
import demoAiScan from "@/assets/demo-ai-scan.jpg";
import demoCleanupTeam from "@/assets/demo-cleanup-team.jpg";
import demoCleanFuture from "@/assets/demo-clean-future.jpg";

interface Slide {
  id: number;
  tag: string;
  tagIcon: React.ReactNode;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
  image: string;
  features?: { icon: React.ReactNode; label: string }[];
  stats?: { value: string; label: string }[];
}

const slides: Slide[] = [
  {
    id: 0,
    tag: "THE CHALLENGE",
    tagIcon: <Eye className="h-4 w-4" />,
    title: "Waste Discovered",
    highlight: "Across Ondo State",
    subtitle: "The Problem We're Solving",
    description:
      "Illegal dumping, overflowing bins, and untracked waste are harming our communities. Without a system to report and track waste, issues remain invisible and unresolved for weeks.",
    image: demoWasteProblem,
    stats: [
      { value: "70%", label: "Waste goes unreported" },
      { value: "14 days", label: "Average response time" },
      { value: "₦2.3B", label: "Annual health costs" },
    ],
  },
  {
    id: 1,
    tag: "STEP 1",
    tagIcon: <Camera className="h-4 w-4" />,
    title: "Citizens Report",
    highlight: "Waste Instantly",
    subtitle: "Empowering Every Resident",
    description:
      "Any citizen can open the app, snap a photo of waste, and submit a report in under 30 seconds. GPS location is captured automatically — no typing needed.",
    image: demoCitizenReport,
    features: [
      { icon: <Camera className="h-4 w-4" />, label: "One-tap photo capture" },
      { icon: <MapPin className="h-4 w-4" />, label: "Auto GPS location" },
      { icon: <Zap className="h-4 w-4" />, label: "30-second submission" },
      { icon: <Globe className="h-4 w-4" />, label: "Works offline too" },
    ],
  },
  {
    id: 2,
    tag: "STEP 2",
    tagIcon: <Brain className="h-4 w-4" />,
    title: "AI Scans &",
    highlight: "Classifies Waste",
    subtitle: "Computer Vision Technology",
    description:
      "Our AI instantly analyzes the photo — identifying waste type (plastic, organic, hazardous), severity level, and recommended cleanup action. No manual classification needed.",
    image: demoAiScan,
    features: [
      { icon: <Scan className="h-4 w-4" />, label: "Auto waste detection" },
      { icon: <Shield className="h-4 w-4" />, label: "Severity assessment" },
      { icon: <Brain className="h-4 w-4" />, label: "97% AI accuracy" },
      { icon: <Activity className="h-4 w-4" />, label: "Real-time processing" },
    ],
  },
  {
    id: 3,
    tag: "STEP 3",
    tagIcon: <Users className="h-4 w-4" />,
    title: "Cleaners Dispatched",
    highlight: "& Waste Resolved",
    subtitle: "Intelligent Operations",
    description:
      "Reports are routed to the nearest available cleaner via optimized routes. Admins track progress in real-time. Citizens get notified when their area is clean again.",
    image: demoCleanupTeam,
    features: [
      { icon: <Route className="h-4 w-4" />, label: "Route optimization" },
      { icon: <Users className="h-4 w-4" />, label: "Smart dispatch" },
      { icon: <CheckCircle2 className="h-4 w-4" />, label: "Before/after proof" },
      { icon: <Sparkles className="h-4 w-4" />, label: "Citizen notifications" },
    ],
  },
  {
    id: 4,
    tag: "THE VISION",
    tagIcon: <BarChart3 className="h-4 w-4" />,
    title: "A Cleaner",
    highlight: "Ondo State",
    subtitle: "Data-Driven Impact",
    description:
      "With Waste-Track AI, Ondo State gains full visibility into waste management. Real-time dashboards, performance analytics, and measurable environmental impact — all in one platform.",
    image: demoCleanFuture,
    stats: [
      { value: "< 2h", label: "Target response time" },
      { value: "95%", label: "Report resolution rate" },
      { value: "40%", label: "Cost reduction" },
    ],
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

const contentVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, type: "tween" as const, duration: 0.4 },
  }),
};

export default function Demo() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const slide = slides[current];
  const isLast = current === slides.length - 1;
  const isFirst = current === 0;

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= slides.length) return;
      setDirection(next > current ? 1 : -1);
      setCurrent(next);
    },
    [current]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, go]);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col">
      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 h-14 border-b border-border/30 bg-background/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-primary rounded-lg p-1.5 shadow-button">
            <Scan className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-display font-bold text-foreground leading-tight">Waste-Track AI</span>
            <span className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">
              Ondo State Presentation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
            {current + 1} / {slides.length}
          </span>
          <Button size="sm" variant="outline" asChild className="neon-border text-xs font-mono tracking-wider">
            <Link to="/auth">Skip to App →</Link>
          </Button>
        </div>
      </header>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween" as const, duration: 0.45, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col lg:flex-row"
          >
            {/* Image half */}
            <div className="relative lg:w-1/2 h-[35vh] lg:h-full shrink-0 overflow-hidden">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background" />

              {/* Scan lines */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute left-0 right-0 h-px bg-primary/30 top-1/3 animate-pulse" />
                <div className="absolute left-0 right-0 h-px bg-primary/15 top-2/3 animate-pulse" style={{ animationDelay: "1s" }} />
              </div>

              {/* Slide number overlay */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                <div className="neon-border bg-background/40 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                  {slide.tagIcon}
                  <span className="text-[10px] font-mono text-primary tracking-widest uppercase font-semibold">
                    {slide.tag}
                  </span>
                </div>
              </div>
            </div>

            {/* Content half */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-6 lg:py-12 overflow-y-auto">
              <motion.p
                custom={0}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="text-xs font-mono text-primary tracking-widest uppercase mb-3"
              >
                {slide.subtitle}
              </motion.p>

              <motion.h1
                custom={1}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground leading-tight mb-4"
              >
                {slide.title}
                <br />
                <span className="text-gradient">{slide.highlight}</span>
              </motion.h1>

              <motion.p
                custom={2}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8"
              >
                {slide.description}
              </motion.p>

              {/* Features grid */}
              {slide.features && (
                <motion.div
                  custom={3}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3 max-w-md mb-8"
                >
                  {slide.features.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 neon-border rounded-xl px-3 py-2.5 bg-card/50 backdrop-blur-sm"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">{f.icon}</div>
                      <span className="text-xs font-medium text-foreground">{f.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Stats row */}
              {slide.stats && (
                <motion.div
                  custom={3}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap gap-6 mb-8"
                >
                  {slide.stats.map((s, i) => (
                    <div key={i} className="neon-border rounded-xl px-5 py-3 bg-card/50 backdrop-blur-sm">
                      <div className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                        {s.value}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* CTA on last slide */}
              {isLast && (
                <motion.div
                  custom={4}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Button size="lg" asChild className="shadow-button text-base px-8 h-14 font-semibold group">
                    <Link to="/auth">
                      Launch Waste-Track AI
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="neon-border text-base px-8 h-14">
                    <Link to="/auth?role=admin">Admin Portal</Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <footer className="relative z-20 flex items-center justify-between px-4 sm:px-8 h-16 border-t border-border/30 bg-background/60 backdrop-blur-xl shrink-0">
        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 neon-border"
            onClick={() => go(current - 1)}
            disabled={isFirst}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {isLast ? (
            <Button size="sm" asChild className="shadow-button h-10 px-6 font-semibold">
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              className="shadow-button h-10 px-6 font-semibold"
              onClick={() => go(current + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
