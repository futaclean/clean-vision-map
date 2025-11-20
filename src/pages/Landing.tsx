import { Button } from "@/components/ui/button";
import { MapPin, Leaf, Camera, BarChart3, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import splashImage from "@/assets/cleanfuta-splash.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhoOHYtOGgtOHptMCAxNnY4aDh2LThoLTh6bS0xNiAwdjhoOHYtOGgtOHptMC0xNnY4aDh2LThoLTh6bTE2IDB2OGg4di04aC04eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-primary/20">
                <Leaf className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Smart Waste Management</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                CleanFUTA
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 mb-4 font-light">
                Smart Reporting & Campus Cleanliness System
              </p>
              <p className="text-lg text-white/70 mb-8 max-w-2xl">
                Transform your campus into a cleaner, greener space with AI-powered waste reporting. 
                Track, manage, and resolve waste issues efficiently.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-glow text-lg px-8">
                  <Link to="/auth">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 text-lg px-8">
                  <Link to="/auth">Admin Login</Link>
                </Button>
              </div>
            </div>
            
            <div className="flex-1 animate-float">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-glow" />
                <img 
                  src={splashImage} 
                  alt="CleanFUTA App" 
                  className="relative z-10 max-w-md mx-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Powerful Features for a Cleaner Campus
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to report, track, and manage waste efficiently
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                title: "AI Waste Detection",
                description: "Upload photos and let AI automatically identify waste type and severity level"
              },
              {
                icon: MapPin,
                title: "GPS Tracking",
                description: "Automatic location capture for precise waste hotspot mapping"
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Real-time insights, trends, and detailed reports for data-driven decisions"
              },
              {
                icon: Users,
                title: "Team Management",
                description: "Efficiently assign and track cleanup tasks with your cleaning crew"
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                description: "Secure access control for users, cleaners, admins, and super admins"
              },
              {
                icon: Leaf,
                title: "Eco-Friendly Impact",
                description: "Track your environmental impact and promote sustainable practices"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-glow transition-all duration-300 border border-border hover:border-primary/50"
              >
                <div className="bg-gradient-card rounded-xl p-4 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhoOHYtOGgtOHptMCAxNnY4aDh2LThoLTh6bS0xNiAwdjhoOHYtOGgtOHptMC0xNnY4aDh2LThoLTh6bTE2IDB2OGg4di04aC04eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Make Your Campus Cleaner?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join CleanFUTA today and start making a real environmental impact
          </p>
          <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-glow text-lg px-10">
            <Link to="/auth">Start Now - It's Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-primary rounded-full p-2">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">CleanFUTA</span>
          </div>
          <p className="text-muted-foreground">
            Making campuses cleaner, one report at a time
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            © 2025 CleanFUTA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
