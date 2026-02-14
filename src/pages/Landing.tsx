import { Button } from "@/components/ui/button";
import { 
  MapPin, Camera, BarChart3, Users, Shield, 
  ArrowRight, ChevronRight, Globe, Zap, Target, 
  CheckCircle2, Sparkles, TrendingUp, Award, Download,
  Eye, Brain, Cpu, Scan, Activity, Recycle, Sun, Moon,
  Home, LogIn, Layers, Leaf, Heart, Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { MobileNav } from "@/components/MobileNav";
import heroImage from "@/assets/hero-waste-scan.jpg";
import wasteMapImage from "@/assets/waste-map-overview.jpg";
import beforeAfterImage from "@/assets/before-after-cleanup.jpg";
import citizenReportImage from "@/assets/citizen-reporting.jpg";
import cleanupTeamImage from "@/assets/cleanup-team.jpg";
import analyticsImage from "@/assets/analytics-dashboard.jpg";

// Animated counter hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, started]);

  return { count, start: () => setStarted(true) };
};

// Intersection observer hook for scroll animations
const useInView = (threshold = 0.2) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

const smoothEase: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: smoothEase }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.15, ease: smoothEase }
  })
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: smoothEase } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: smoothEase } }
};

const Landing = () => {
  const { theme, setTheme } = useTheme();
  const reports = useCounter(12400, 2500);
  const cleaned = useCounter(9800, 2500);
  const users = useCounter(3200, 2000);
  const accuracy = useCounter(97, 1500);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const statsSection = useInView(0.3);
  const featuresSection = useInView(0.15);
  const howItWorksSection = useInView(0.15);
  const showcaseSection = useInView(0.15);

  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  useEffect(() => {
    if (statsSection.inView) {
      reports.start(); cleaned.start(); users.start(); accuracy.start();
    }
  }, [statsSection.inView]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -80 }} 
        animate={{ y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="bg-gradient-primary rounded-xl p-2 shadow-button">
                <Scan className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-display font-bold text-foreground leading-tight">Waste-Track AI</span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Intelligent Detection</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#impact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Impact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="shadow-button font-semibold hidden sm:inline-flex">
              <Link to="/demo">
                Launch App
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <MobileNav
              links={[
                { label: "Home", to: "/", icon: <Home className="h-4 w-4" /> },
                { label: "Features", to: "#features", icon: <Layers className="h-4 w-4" />, isAnchor: true },
                { label: "How It Works", to: "#how-it-works", icon: <Zap className="h-4 w-4" />, isAnchor: true },
                { label: "Impact", to: "#impact", icon: <TrendingUp className="h-4 w-4" />, isAnchor: true },
              ]}
              actions={
                <Button asChild className="w-full shadow-button font-semibold">
                  <Link to="/demo">
                    Launch App
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Full screen immersive */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroParallax }}>
          <img src={heroImage} alt="AI waste detection technology" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </motion.div>

        {/* Animated floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/30"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>

        {/* Animated scan lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl">
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 neon-border bg-background/40 backdrop-blur-sm px-4 py-2 rounded-full mb-8"
            >
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-mono text-primary tracking-wider uppercase">AI Detection Active</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-mono text-muted-foreground">Ondo State</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-foreground mb-6 leading-[1.05]"
            >
              See Waste.
              <br />
              <motion.span
                className="text-gradient"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Scan It.
              </motion.span>
              <br />
              <motion.span
                className="text-muted-foreground/60"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Track It.
              </motion.span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
            >
              Waste-Track AI uses computer vision to detect, classify, and track waste in real-time. 
              Report issues instantly. Watch them get resolved.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" asChild className="shadow-button text-base px-8 h-14 font-semibold group relative overflow-hidden">
                <Link to="/demo">
                  <span className="relative z-10 flex items-center">
                    Start Tracking
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>
              
              {deferredPrompt && (
                <Button size="lg" variant="secondary" onClick={handleInstallClick} className="text-base px-8 h-14 font-semibold">
                  <Download className="mr-2 h-5 w-5" />
                  Install App
                </Button>
              )}

              <Button size="lg" variant="outline" asChild className="border-primary/30 text-foreground hover:bg-primary/10 text-base px-8 h-14 backdrop-blur-sm">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </motion.div>

            {/* Mini stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="flex flex-wrap gap-8 mt-14"
            >
              {[
                { icon: Eye, label: "Reports Filed", value: "12K+" },
                { icon: Brain, label: "AI Accuracy", value: "97%" },
                { icon: Activity, label: "Avg Response", value: "< 2h" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="p-2 rounded-lg bg-primary/10 neon-border">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-display font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
            <motion.div
              className="w-1 h-2 bg-primary/60 rounded-full"
              animate={{ opacity: [0.4, 1, 0.4], y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Scrolling tech ticker */}
      <div className="relative bg-card border-y border-border overflow-hidden py-3">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex items-center gap-8 px-4">
              {["Computer Vision", "Real-time GPS", "AI Classification", "Severity Detection", "Route Optimization", "Analytics Dashboard", "Push Notifications", "Offline Support"].map((t, i) => (
                <span key={i} className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Impact section with real numbers */}
      <section id="impact" className="py-28 bg-background relative" ref={statsSection.ref}>
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 neon-border px-4 py-2 rounded-full mb-6">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">Measurable Impact</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Numbers That
              <span className="text-gradient"> Matter</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time intelligence driving cleaner environments across Ondo State
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: reports.count, suffix: "+", label: "Reports Filed", icon: Camera, desc: "Waste incidents documented" },
              { value: cleaned.count, suffix: "+", label: "Issues Resolved", icon: CheckCircle2, desc: "Successfully cleaned up" },
              { value: users.count, suffix: "+", label: "Active Users", icon: Users, desc: "Community members" },
              { value: accuracy.count, suffix: "%", label: "AI Accuracy", icon: Brain, desc: "Detection precision" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative neon-border rounded-2xl p-8 bg-card hover:bg-primary/5 transition-colors duration-500"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <stat.icon className="h-8 w-8 text-primary mb-4" />
                <div className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-1">
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual showcase - Before/After + Map + More */}
      <section className="py-28 bg-muted/30 relative overflow-hidden" ref={showcaseSection.ref}>
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 neon-border px-4 py-2 rounded-full mb-6">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">See It In Action</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
              From Problem to
              <span className="text-gradient"> Solution</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Waste-Track AI transforms waste management in every community
            </motion.p>
          </motion.div>

          {/* Row 1: Before/After + Citizen Reporting */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <motion.div
              variants={slideInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative neon-border rounded-2xl overflow-hidden">
                <motion.img
                  src={beforeAfterImage}
                  alt="Before and after waste cleanup powered by AI tracking"
                  className="w-full h-72 object-cover"
                  loading="lazy"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Recycle className="h-4 w-4 text-primary" />
                      <div className="text-sm font-display font-semibold text-foreground">Before → After Cleanup</div>
                    </div>
                    <div className="text-xs text-muted-foreground">AI-tracked transformation • Reported, assigned, and resolved in under 2 hours</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={slideInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-gradient-to-l from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative neon-border rounded-2xl overflow-hidden">
                <motion.img
                  src={citizenReportImage}
                  alt="Citizen reporting waste using smartphone with AI classification"
                  className="w-full h-72 object-cover"
                  loading="lazy"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className="h-4 w-4 text-primary" />
                      <div className="text-sm font-display font-semibold text-foreground">Citizen Reporting</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Snap a photo → AI classifies waste type & severity instantly</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 2: Cleanup Team + Dashboard + Map */}
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              variants={scaleIn}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="relative neon-border rounded-2xl overflow-hidden">
                <motion.img
                  src={cleanupTeamImage}
                  alt="Cleanup team dispatched for waste management"
                  className="w-full h-64 object-cover"
                  loading="lazy"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-primary" />
                      <div className="text-xs font-display font-semibold text-foreground">Team Dispatch</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Smart cleaner assignment with optimized routes</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="relative neon-border rounded-2xl overflow-hidden">
                <motion.img
                  src={analyticsImage}
                  alt="Smart waste management analytics dashboard"
                  className="w-full h-64 object-cover"
                  loading="lazy"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <div className="text-xs font-display font-semibold text-foreground">Analytics & Insights</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Data-driven decisions for waste reduction</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="relative neon-border rounded-2xl overflow-hidden">
                <motion.img
                  src={wasteMapImage}
                  alt="Real-time waste hotspot map with AI detection"
                  className="w-full h-64 object-cover"
                  loading="lazy"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div className="text-xs font-display font-semibold text-foreground">Live Waste Heatmap</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Real-time hotspot detection across Ondo State</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 bg-background relative overflow-hidden" ref={featuresSection.ref}>
        <div className="hero-glow w-[600px] h-[600px] top-0 right-0 opacity-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 neon-border px-4 py-2 rounded-full mb-6">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">Core Capabilities</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Built for
              <span className="text-gradient"> Intelligence</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed to make waste detection and management effortless
            </motion.p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Scan,
                title: "AI Waste Scanner",
                description: "Point your camera at waste — AI instantly identifies type, severity, and recommended cleanup actions",
                tag: "CORE"
              },
              {
                icon: MapPin,
                title: "GPS Precision",
                description: "Automatic high-accuracy location capture with landmark-based mapping and hotspot detection",
                tag: "TRACKING"
              },
              {
                icon: BarChart3,
                title: "Live Analytics",
                description: "Real-time dashboards with trend analysis, exportable reports, and predictive insights",
                tag: "DATA"
              },
              {
                icon: Users,
                title: "Team Dispatch",
                description: "Smart cleaner assignment with route optimization and real-time progress tracking",
                tag: "OPS"
              },
              {
                icon: Shield,
                title: "Role Security",
                description: "Granular access control for reporters, cleaners, and administrators with audit trails",
                tag: "SECURITY"
              },
              {
                icon: Recycle,
                title: "Impact Tracking",
                description: "Measure environmental impact with waste volume tracking and sustainability metrics",
                tag: "ESG"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                variants={scaleIn}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative neon-border rounded-2xl p-8 bg-card hover:bg-primary/5 transition-colors duration-500"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-gradient-primary rounded-xl p-3 group-hover:scale-110 transition-transform duration-300 shadow-button">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-primary/70 tracking-widest border border-primary/20 px-2 py-0.5 rounded-full">{feature.tag}</span>
                </div>
                <h3 className="text-lg font-display font-semibold text-card-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-28 bg-muted/30" ref={howItWorksSection.ref}>
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 neon-border px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">3 Simple Steps</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Report in
              <span className="text-gradient"> Seconds</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From spotting waste to tracking cleanup — all in one seamless flow
            </motion.p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              
              {[
                {
                  step: "01",
                  icon: Camera,
                  title: "Scan & Detect",
                  desc: "Point your camera at waste. Our AI instantly classifies the type, assesses severity, and prepares your report.",
                  image: citizenReportImage,
                },
                {
                  step: "02",
                  icon: MapPin,
                  title: "Auto-Submit",
                  desc: "GPS location is captured automatically. Add a note if you want, then submit with one tap.",
                  image: wasteMapImage,
                },
                {
                  step: "03",
                  icon: CheckCircle2,
                  title: "Track & Resolve",
                  desc: "Watch in real-time as cleaners are dispatched. Get notified when the area is clean again.",
                  image: cleanupTeamImage,
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative text-center group"
                >
                  {/* Step image */}
                  <div className="neon-border rounded-2xl overflow-hidden mb-6">
                    <motion.img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-44 object-cover"
                      loading="lazy"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="w-16 h-16 neon-border bg-card rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:scale-110 transition-transform">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-mono text-primary/60 tracking-widest mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ondo State CTA */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative neon-border rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0">
              <img src={cleanupTeamImage} alt="Ondo State cleanup vision" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/60" />
            </div>
            <div className="relative z-10 p-10 sm:p-16 max-w-2xl">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 neon-border px-4 py-2 rounded-full mb-6">
                <Leaf className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">Built for Ondo State</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-5xl font-bold text-foreground mb-6">
                A Cleaner Ondo Starts
                <span className="text-gradient"> Here</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Empowering every citizen, cleaner, and administrator to work together for a waste-free Ondo State. 
                Real-time tracking. AI-powered decisions. Community-driven impact.
              </motion.p>
              <motion.div variants={fadeUp} custom={3}>
                <Button size="lg" asChild className="shadow-button text-base px-10 h-14 font-semibold group">
                  <Link to="/demo">
                    Explore the Platform
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 relative overflow-hidden bg-muted/30">
        <div className="hero-glow w-[600px] h-[600px] -bottom-40 -left-40 opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Trusted by Communities
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real feedback from people making a real difference
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Waste-Track AI makes reporting so intuitive. I just snap a photo and the AI does the rest. It's genuinely changed how I think about waste.",
                author: "Adebayo O.",
                role: "Community Member"
              },
              {
                quote: "The route optimization alone saves me hours each day. I can see exactly where to go and what to prioritize. Total game changer.",
                author: "Musa K.",
                role: "Operations Lead"
              },
              {
                quote: "The analytics give us actionable insights we never had before. We've reduced waste accumulation by 40% in just 3 months.",
                author: "Dr. Ajayi",
                role: "Facilities Director"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="neon-border rounded-2xl p-8 bg-card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-4 w-4 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-6 leading-relaxed text-sm">"{testimonial.quote}"</p>
                <div>
                  <div className="font-display font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground font-mono">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl" />
            <div className="relative neon-border rounded-3xl p-12 sm:p-16 bg-card">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">Get Started Free</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
                Ready to Track
                <span className="text-gradient"> Smarter?</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of users using AI to build cleaner, healthier communities
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="shadow-button text-base px-10 h-14 font-semibold group">
                  <Link to="/demo">
                    Launch Waste-Track AI
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-10 h-14 border-primary/30">
                  <Link to="/auth?role=admin">Admin Portal</Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-gradient-primary rounded-xl p-2 shadow-button">
                  <Scan className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-xl font-display font-bold text-foreground">Waste-Track AI</span>
                  <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Intelligent Detection</div>
                </div>
              </div>
              <p className="text-muted-foreground max-w-sm mb-6">
                AI-powered waste detection and management platform. 
                Building cleaner communities through intelligent tracking.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#impact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Impact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Access</h4>
              <ul className="space-y-3">
                <li><Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sign Up</Link></li>
                <li><Link to="/auth?role=cleaner" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cleaner Portal</Link></li>
                <li><Link to="/auth?role=admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">Admin Portal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs font-mono text-muted-foreground">
              © 2025 Waste-Track AI. All rights reserved.
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Powered by Computer Vision & Machine Learning
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
