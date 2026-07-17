"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2,
  Terminal
} from "lucide-react";
import ShaderCanvas from "@/components/custom/ShaderCanvas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { useLoginMutation } from "@/hooks/useQueryHooks";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@dicepvc.ai");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loginMutation = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setTimeout(() => {
            if (data.user.role === "admin" || data.user.role === "super_admin") {
              router.push("/admin");
            } else {
              router.push("/dashboard");
            }
          }, 800);
        },
        onError: (err: any) => {
          setErrorMsg(err.message || "Invalid credentials. Please verify your email and password.");
        }
      }
    );
  };

  return (
    <main className="flex min-h-screen">
      {/* Left Side: Abstract Illustration & Shader */}
      <section className="relative hidden md:flex flex-1 items-center justify-center overflow-hidden bg-inverse-surface">
        {/* Animated WebGL Shader Background */}
        <div className="absolute inset-0 w-full h-full opacity-60">
          <ShaderCanvas className="w-full h-full" />
        </div>
        {/* Atmospheric Layering */}
        <div className="absolute inset-0 bg-gradient-to-tr from-inverse-surface via-transparent to-transparent"></div>
        
        <div className="relative z-10 px-lg text-center max-w-xl">
          <div className="mb-base flex justify-center">
            <Shield className="text-white w-20 h-20 stroke-[1.5px] fill-white/10" />
          </div>
          <h1 className="font-display-lg text-display-lg text-white mb-sm tracking-tight">
            Precision Intelligence
          </h1>
          <p className="text-white/80 font-body-lg text-body-lg leading-relaxed">
            Access the DicePVC ecosystem. Advanced security analytics and cloud-native PVC orchestration at your fingertips.
          </p>
          {/* Floating Card Illustration */}
          <div className="mt-xl relative">
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="glass-card rounded-2xl p-md flex flex-col gap-sm border-white/10">
              <div className="flex items-center gap-base">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Terminal className="text-primary w-5 h-5" />
                </div>
                <div className="flex-1 h-2 bg-outline-variant/30 rounded-full"></div>
              </div>
              <div className="space-y-xs">
                <div className="w-full h-1.5 bg-outline-variant/20 rounded-full"></div>
                <div className="w-3/4 h-1.5 bg-outline-variant/20 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="flex-1 flex items-center justify-center p-md bg-surface">
        <div className="w-full max-w-md">
          {/* Branding Header */}
          <div className="text-center mb-xl">
            <div className="inline-flex items-center gap-sm mb-base">
              <Link href="/" className="inline-flex items-center gap-sm hover:opacity-85 transition-opacity">
                <Shield className="text-primary w-8 h-8 fill-primary/10" />
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tighter">
                  DicePVC
                </span>
              </Link>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface-variant">Welcome back</h2>
            <p className="font-label-md text-label-md text-outline">Please enter your credentials to continue.</p>
          </div>

          {/* Login Glass Card */}
          <div className="glass-card rounded-[24px] p-lg">
            <form onSubmit={handleSubmit} className="space-y-md">
              {/* Email Field */}
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline px-base" htmlFor="email">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline px-base" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-5 h-5" />}
                  rightElement={
                    <button
                      className="text-outline hover:text-primary transition-colors cursor-pointer"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  required
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-xs">
                <label className="flex items-center gap-sm cursor-pointer group">
                  <input
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    type="checkbox"
                    defaultChecked
                  />
                  <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                    Remember me
                  </span>
                </label>
                <a className="font-label-md text-label-md text-primary font-semibold hover:underline decoration-2 underline-offset-4" href="#">
                  Forgot password?
                </a>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="bg-error-container text-on-error-container p-sm rounded-xl text-label-md font-medium text-center border border-error/20">
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="pt-sm space-y-base">
                <Button
                  className="w-full py-4 text-white font-semibold"
                  type="submit"
                  disabled={loginMutation.isPending || loginMutation.isSuccess}
                  variant={loginMutation.isSuccess ? "secondary" : "primary"}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : loginMutation.isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 animate-bounce text-secondary" />
                  ) : (
                    "Login"
                  )}
                </Button>
                <div className="relative py-sm">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-outline-variant/30"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-outline font-label-sm tracking-widest">
                      or continue with
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full py-3.5 flex items-center justify-center gap-sm"
                  type="button"
                  variant="outline"
                >
                  <img
                    alt="Google"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9TA5ZtGEDzjT0n-huMAVTeRVlEBqmUrQ1izu-PvwhjgXjBYaTt8EQETesN2J0r6LOmf-VKazhrdDkzHMct1qCSfxgaY9w8ByMgVMXUMTudlL9xIqJwlDDZXTjBjiGqHz37_qAfiLMIaOwzOxgh9GS7vzopTc6yeIR6pYEgsVBGpOQ9SwWmSG3Rz6OLfSCKOuiifml2ygwEZdEbpgl7Yy3j150cdDMLquy3Ecy2ssBY0CXWeLIoSs-"
                  />
                  Continue with Google
                </Button>
              </div>
            </form>
          </div>

          {/* Footer Link */}
          <div className="mt-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?{" "}
              <a className="text-primary font-bold hover:underline decoration-2 underline-offset-4" href="#">
                Register
              </a>
            </p>
          </div>
          {/* Minimal Footer Info */}
          <div className="mt-xl flex justify-center gap-md">
            <a className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors" href="#">Terms</a>
            <a className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors" href="#">Support</a>
          </div>
        </div>
      </section>
    </main>
  );
}
