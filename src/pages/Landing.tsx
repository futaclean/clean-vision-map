import { Button } from "@/components/ui/button";
import { 
  MapPin, Camera, BarChart3, Users, Shield, 
  ArrowRight, ChevronRight, Globe, Zap, Target, 
  CheckCircle2, Sparkles, TrendingUp, Award, Download,
  Eye, Brain, Cpu, Scan, Activity, Recycle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import heroImage from "@/assets/hero-waste-scan.jpg";
import wasteMapImage from "@/assets/waste-map-overview.jpg";
import beforeAfterImage from "@/assets/before-after-cleanup.jpg";

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

const Landing = () => {
  const reports = useCounter(12400, 2500);
  const cleaned = useCounter(9800, 2500);
  const users = useCounter(3200, 2000);
  const accuracy = useCounter(97, 1500);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const statsSection = useInView(0.3);
  const featuresSection = useInView(0.15);
  const howItWorksSection = useInView(0.15);

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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
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
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="shadow-button font-semibold">
              <Link to="/auth">
                Launch App
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full screen immersive */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="AI waste detection technology" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>

        {/* Animated scan lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-primary/20 top-1/4 animate-pulse" />
          <div className="absolute left-0 right-0 h-px bg-primary/10 top-2/4" style={{ animationDelay: "1s" }} />
          <div className="absolute left-0 right-0 h-px bg-primary/20 top-3/4 animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 neon-border bg-background/40 backdrop-blur-sm px-4 py-2 rounded-full mb-8 animate-fade-in">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-mono text-primary tracking-wider uppercase">AI Detection Active</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-mono text-muted-foreground">v2.0</span>
            </div>
            
            <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-foreground mb-6 leading-[1.05] animate-fade-in" style={{ animationDelay: "0.1s" }}>
              See Waste.
              <br />
              <span className="text-gradient">Scan It.</span>
              <br />
              <span className="text-muted-foreground/60">Track It.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Waste-Track AI uses computer vision to detect, classify, and track waste in real-time. 
              Report issues instantly. Watch them get resolved.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" asChild className="shadow-button text-base px-8 h-14 font-semibold group relative overflow-hidden">
                <Link to="/auth">
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
            </div>

            {/* Mini stats */}
            <div className="flex flex-wrap gap-8 mt-14 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              {[
                { icon: Eye, label: "Reports Filed", value: "12K+" },
                { icon: Brain, label: "AI Accuracy", value: "97%" },
                { icon: Activity, label: "Avg Response", value: "< 2h" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 neon-border">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-display font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary/60 rounded-full animate-pulse" />
          </div>
        </div>
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
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 neon-border px-4 py-2 rounded-full mb-6">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">Measurable Impact</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Numbers That
              <span className="text-gradient"> Matter</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time intelligence driving cleaner environments worldwide
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: reports.count, suffix: "+", label: "Reports Filed", icon: Camera, desc: "Waste incidents documented" },
              { value: cleaned.count, suffix: "+", label: "Issues Resolved", icon: CheckCircle2, desc: "Successfully cleaned up" },
              { value: users.count, suffix: "+", label: "Active Users", icon: Users, desc: "Community members" },
              { value: accuracy.count, suffix: "%", label: "AI Accuracy", icon: Brain, desc: "Detection precision" },
            ].map((stat, i) => (
              <div key={i} className={`group relative neon-border rounded-2xl p-8 bg-card hover:bg-primary/5 transition-all duration-500 ${statsSection.inView ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <stat.icon className="h-8 w-8 text-primary mb-4" />
                <div className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-1">
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual showcase - Before/After + Map */}
      <section className="py-28 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Before/After image */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative neon-border rounded-2xl overflow-hidden">
                <img src={beforeAfterImage} alt="Before and after waste cleanup powered by AI tracking" className="w-full" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card rounded-xl p-4">
                    <div className="text-sm font-display font-semibold text-foreground">AI-Tracked Cleanup</div>
                    <div className="text-xs text-muted-foreground">Report → Assign → Resolve in under 2 hours</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Waste heatmap */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-l from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative neon-border rounded-2xl overflow-hidden">
                <img src={wasteMapImage} alt="Real-time waste hotspot map with AI detection" className="w-full" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card rounded-xl p-4">
                    <div className="text-sm font-display font-semibold text-foreground">Live Waste Heatmap</div>
                    <div className="text-xs text-muted-foreground">Real-time hotspot detection & monitoring</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 bg-background relative overflow-hidden" ref={featuresSection.ref}>
        <div className="hero-glow w-[600px] h-[600px] top-0 right-0 opacity-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 neon-border px-4 py-2 rounded-full mb-6">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">Core Capabilities</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Built for
              <span className="text-gradient"> Intelligence</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed to make waste detection and management effortless
            </p>
          </div>
          
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
              <div 
                key={index}
                className={`group relative neon-border rounded-2xl p-8 bg-card hover:bg-primary/5 transition-all duration-500 ${featuresSection.inView ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-28 bg-muted/30" ref={howItWorksSection.ref}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 neon-border px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">3 Simple Steps</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Report in
              <span className="text-gradient"> Seconds</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From spotting waste to tracking cleanup — all in one seamless flow
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              
              {[
                {
                  step: "01",
                  icon: Camera,
                  title: "Scan & Detect",
                  desc: "Point your camera at waste. Our AI instantly classifies the type, assesses severity, and prepares your report."
                },
                {
                  step: "02",
                  icon: MapPin,
                  title: "Auto-Submit",
                  desc: "GPS location is captured automatically. Add a note if you want, then submit with one tap."
                },
                {
                  step: "03",
                  icon: CheckCircle2,
                  title: "Track & Resolve",
                  desc: "Watch in real-time as cleaners are dispatched. Get notified when the area is clean again."
                }
              ].map((item, i) => (
                <div key={i} className={`relative text-center ${howItWorksSection.inView ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: `${i * 0.2}s` }}>
                  <div className="w-16 h-16 neon-border bg-card rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:scale-110 transition-transform">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-mono text-primary/60 tracking-widest mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="hero-glow w-[600px] h-[600px] -bottom-40 -left-40 opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Trusted by Communities
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Real feedback from people making a real difference
            </p>
          </div>

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
              <div key={i} className="neon-border rounded-2xl p-8 bg-card/10 backdrop-blur-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Sparkles key={s} className="h-4 w-4 text-primary" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <div className="font-display font-semibold text-white">{testimonial.author}</div>
                  <div className="text-sm text-white/50 font-mono">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl" />
            <div className="relative neon-border rounded-3xl p-12 sm:p-16 bg-card">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono font-medium text-primary tracking-wider uppercase">Get Started Free</span>
              </div>
              <h2 className="font-display text-4xl sm:text-6xl font-bold text-foreground mb-6">
                Ready to Track
                <span className="text-gradient"> Smarter?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of users using AI to build cleaner, healthier communities
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="shadow-button text-base px-10 h-14 font-semibold group">
                  <Link to="/auth">
                    Launch Waste-Track AI
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-10 h-14 border-primary/30">
                  <Link to="/auth?role=admin">Admin Portal</Link>
                </Button>
              </div>
            </div>
          </div>
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
