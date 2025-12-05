import { Button } from "@/components/ui/button";
import { 
  MapPin, Leaf, Camera, BarChart3, Users, Shield, 
  ArrowRight, ChevronRight, Globe, Zap, Target, 
  CheckCircle2, Sparkles, TrendingUp, Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import splashImage from "@/assets/cleanfuta-splash.png";

// Animated counter hook (Unchanged)
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

const Landing = () => {
  const reports = useCounter(2500, 2500);
  const cleaned = useCounter(1800, 2500);
  const users = useCounter(500, 2000);
  const locations = useCounter(150, 1500);
  
  // --- START: PWA Service Worker Registration Logic (RUNS ONCE) ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register the service worker, which is located at public/sw.js
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('CleanFUTA PWA: Service Worker registered successfully:', registration.scope);
        })
        .catch(error => {
          console.error('CleanFUTA PWA: Service Worker registration failed:', error);
        });
    }
  }, []);
  // --- END: PWA Service Worker Registration Logic ---

  // Counter Start Effect (Unchanged)
  useEffect(() => {
    const timer = setTimeout(() => {
      reports.start();
      cleaned.start();
      users.start();
      locations.start();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      {/* ... (rest of the component code is unchanged) ... */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary rounded-xl p-2 shadow-button">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">CleanFUTA</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#impact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Impact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="shadow-button">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="hero-glow w-[800px] h-[800px] -top-40 -right-40" />
        <div className="hero-glow w-[600px] h-[600px] -bottom-20 -left-20 opacity-20" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20 animate-fade-in">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-medium text-white/90">AI-Powered Campus Cleanliness</span>
              </div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Transforming
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-200">
                  Campus Waste
                </span>
                Management
              </h1>
              
              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
                CleanFUTA empowers students, staff, and administrators to report, track, and resolve 
                waste issues in real-time using cutting-edge AI technology.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <Button size="lg" asChild className="bg-white text-primary hover:bg-white/95 shadow-elevated text-base px-8 h-12 font-semibold group">
                  <Link to="/auth">
                    Start Reporting
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 text-base px-8 h-12 backdrop-blur-sm">
                  <Link to="/auth?role=admin">Admin Portal</Link>
                </Button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                {[
                  { value: reports.count, suffix: "+", label: "Reports Filed" },
                  { value: cleaned.count, suffix: "+", label: "Issues Resolved" },
                  { value: users.count, suffix: "+", label: "Active Users" },
                  { value: locations.count, suffix: "+", label: "Locations Mapped" },
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-display font-bold text-white">
                      {stat.value.toLocaleString()}{stat.suffix}
                    </div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - App mockup */}
            <div className="flex-1 relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="relative max-w-md mx-auto">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-accent/40 rounded-[3rem] blur-3xl animate-glow" />
                
                {/* Phone frame */}
                <div className="relative glass-card rounded-[2.5rem] p-3 animate-float-slow">
                  <img 
                    src={splashImage} 
                    alt="CleanFUTA App Interface" 
                    className="w-full rounded-[2rem] shadow-2xl"
                  />
                </div>
                
                {/* Floating badges */}
                <div className="absolute -left-8 top-1/4 glass-card rounded-2xl p-4 animate-float" style={{ animationDelay: "0.5s" }}>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 rounded-xl p-2">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">AI Detection</div>
                      <div className="text-xs text-muted-foreground">Auto-classify waste</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-8 bottom-1/4 glass-card rounded-2xl p-4 animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 rounded-xl p-2">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">GPS Tracking</div>
                      <div className="text-xs text-muted-foreground">Precise locations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Real Impact</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Making a Measurable Difference
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform is transforming how campuses approach waste management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Target, 
                value: "95%", 
                label: "Resolution Rate",
                desc: "Of reported issues resolved within 48 hours"
              },
              { 
                icon: Globe, 
                value: "40%", 
                label: "Waste Reduction",
                desc: "Decrease in campus waste accumulation"
              },
              { 
                icon: Award, 
                value: "#1", 
                label: "In Innovation",
                desc: "Leading campus sustainability solution in Nigeria"
              },
            ].map((item, i) => (
              <div 
                key={i}
                className="group relative bg-gradient-card rounded-3xl p-8 border border-border hover:border-primary/50 hover:shadow-glow transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="bg-primary/10 rounded-2xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-5xl font-display font-bold text-foreground mb-2">
                    {item.value}
                  </div>
                  <div className="text-lg font-semibold text-foreground mb-2">{item.label}</div>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="hero-glow w-[600px] h-[600px] top-0 right-0 opacity-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powerful Features</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools designed for efficient campus waste management
            </p>
            </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Camera,
                title: "AI Waste Detection",
                description: "Upload photos and let AI automatically identify waste type, severity, and recommended actions"
              },
              {
                icon: MapPin,
                title: "Precise GPS Tracking",
                description: "Automatic location capture with FUTA-specific landmarks for accurate waste hotspot mapping"
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Real-time insights, trends, and exportable reports for data-driven decision making"
              },
              {
                icon: Users,
                title: "Team Management",
                description: "Efficiently assign, track, and manage cleanup tasks with your cleaning crew"
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                description: "Secure access control for students, cleaners, and administrators"
              },
              {
                icon: Leaf,
                title: "Environmental Impact",
                description: "Track your contributions and promote sustainable campus practices"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border border-border hover:border-primary/30"
              >
                <div className="bg-gradient-primary rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold text-card-foreground mb-2">
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
      <section id="how-it-works" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Simple Process</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Report waste issues in seconds and watch them get resolved
            </p>
            </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              
              {[
                {
                  step: "01",
                  title: "Spot & Snap",
                  desc: "See waste? Take a photo with your phone. Our AI will automatically detect the type and severity."
                },
                {
                  step: "02",
                  title: "Submit Report",
                  desc: "Your location is captured automatically. Add a description and submit in seconds."
                },
                {
                  step: "03",
                  title: "Track Progress",
                  desc: "Get notified when your report is assigned to a cleaner and when it's resolved."
                }
              ].map((item, i) => (
                <div key={i} className="relative text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-button relative z-10">
                    <span className="text-lg font-bold text-primary-foreground">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="hero-glow w-[600px] h-[600px] -bottom-40 -left-40 opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Trusted by FUTA Community
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Join hundreds of students and staff making a difference
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "CleanFUTA has made reporting so easy. I can now contribute to keeping our campus clean with just a few taps!",
                author: "Adebayo O.",
                role: "400L Student, SEET"
              },
              {
                quote: "As a cleaner, this app helps me prioritize and navigate to waste locations efficiently. Game changer!",
                author: "Musa K.",
                role: "Campus Cleaner"
              },
              {
                quote: "The analytics dashboard gives us real insights into campus cleanliness trends. Essential for planning.",
                author: "Dr. Ajayi",
                role: "Facilities Manager"
              }
            ].map((testimonial, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <p className="text-foreground/90 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Ready to Make Your Campus
              <span className="text-gradient"> Cleaner?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join CleanFUTA today and be part of the movement towards a sustainable campus
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-button text-base px-10 h-14 font-semibold group">
                <Link to="/auth">
                  Get Started for Free
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-10 h-14">
                <Link to="/auth?role=cleaner">Cleaner Portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-primary rounded-xl p-2 shadow-button">
                  <Leaf className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-display font-bold text-foreground">CleanFUTA</span>
              </div>
              <p className="text-muted-foreground max-w-sm mb-4">
                Transforming campus waste management through technology. 
                Making FUTA cleaner, one report at a time.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#impact" className="text-muted-foreground hover:text-primary transition-colors">Our Impact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Get Started</h4>
              <ul className="space-y-2">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">Sign Up</Link></li>
                <li><Link to="/auth?role=cleaner" className="text-muted-foreground hover:text-primary transition-colors">Cleaner Portal</Link></li>
                <li><Link to="/auth?role=admin" className="text-muted-foreground hover:text-primary transition-colors">Admin Portal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 CleanFUTA. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Proudly built for Federal University of Technology, Akure
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
