import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, ArrowLeft, Scan, Fingerprint, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logoImage from "/logo-waste-track.png?url";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const isStaffLogin = roleParam === 'cleaner' || roleParam === 'admin';
  
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(signupEmail, signupPassword, signupName);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "pl-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 font-mono text-sm placeholder:text-muted-foreground/50";

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-xs font-mono tracking-wider uppercase text-muted-foreground">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
          <Input id="login-email" type="email" placeholder="your@email.com" className={inputClasses} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-xs font-mono tracking-wider uppercase text-muted-foreground">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
          <Input id="login-password" type="password" placeholder="••••••••" className={inputClasses} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="link" className="text-xs font-mono text-primary p-0 h-auto tracking-wider" onClick={() => setShowForgotPassword(true)}>
          Forgot password?
        </Button>
      </div>
      <Button type="submit" className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-button font-semibold text-sm tracking-wide" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Authenticating...</span>
        ) : (
          <span className="flex items-center gap-2"><Fingerprint className="h-4 w-4" /> Sign In</span>
        )}
      </Button>
    </form>
  );

  const renderResetForm = () => (
    <form onSubmit={handlePasswordReset} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reset-email" className="text-xs font-mono tracking-wider uppercase text-muted-foreground">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
          <Input id="reset-email" type="email" placeholder="your@email.com" className={inputClasses} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
        </div>
        <p className="text-xs font-mono text-muted-foreground/70">We'll send you a password reset link</p>
      </div>
      <div className="space-y-2">
        <Button type="submit" className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-button font-semibold" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
        <Button type="button" variant="outline" className="w-full neon-border" onClick={() => setShowForgotPassword(false)}>
          Back to Login
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2djhoOHYtOGgtOHptMCAxNnY4aDh2LThoLTh6bS0xNiAwdjhoOHYtOGgtOHptMC0xNnY4aDh2LThoLTh6bTE2IDB2OGg0di04aC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      <div className="hero-glow w-[500px] h-[500px] -top-40 -right-40 opacity-15" />
      <div className="hero-glow w-[400px] h-[400px] -bottom-40 -left-40 opacity-10" />

      {/* Scan lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 right-0 h-px bg-primary/10 top-1/3 animate-pulse" />
        <div className="absolute left-0 right-0 h-px bg-primary/5 top-2/3" />
      </div>

      {/* Back button */}
      <Button variant="ghost" asChild className="absolute top-4 left-4 text-muted-foreground hover:text-foreground hover:bg-primary/10 z-10 font-mono text-xs tracking-wider">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> HOME</Link>
      </Button>

      {/* Auth Card */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Card */}
        <div className="neon-border rounded-2xl bg-card/95 backdrop-blur-xl shadow-elevated overflow-hidden">
          {/* Header */}
          <div className="text-center pt-10 pb-6 px-8 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <img src={logoImage} alt="Waste-Track AI" className="h-16 w-16 rounded-xl shadow-button" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              {isStaffLogin
                ? roleParam === 'cleaner' ? 'Cleaner Portal' : 'Admin Portal'
                : 'Waste-Track AI'
              }
            </h1>
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
              {isStaffLogin
                ? `Authorized ${roleParam} access`
                : 'Intelligent Waste Management'
              }
            </p>

            {/* Security badge */}
            <div className="inline-flex items-center gap-1.5 mt-4 bg-primary/10 neon-border px-3 py-1 rounded-full">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-mono text-primary tracking-wider uppercase">Secure Connection</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            {isStaffLogin ? (
              <div className="space-y-4">
                {!showForgotPassword ? renderLoginForm() : renderResetForm()}
              </div>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="login" className="font-mono text-xs tracking-wider uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="font-mono text-xs tracking-wider uppercase rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-button">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  {!showForgotPassword ? renderLoginForm() : renderResetForm()}
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-xs font-mono tracking-wider uppercase text-muted-foreground">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                        <Input id="signup-name" type="text" placeholder="John Doe" className={inputClasses} value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-xs font-mono tracking-wider uppercase text-muted-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                        <Input id="signup-email" type="email" placeholder="your@email.com" className={inputClasses} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-xs font-mono tracking-wider uppercase text-muted-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                        <Input id="signup-password" type="password" placeholder="••••••••" className={inputClasses} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-button font-semibold text-sm tracking-wide" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Creating account...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Scan className="h-4 w-4" /> Create Account</span>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            <div className="mt-6 text-center">
              <p className="text-[10px] font-mono text-muted-foreground/60 tracking-wider uppercase">By continuing, you agree to our Terms of Service</p>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
