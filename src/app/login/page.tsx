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
  Terminal,
  User,
  Briefcase,
  Phone
} from "lucide-react";
import ShaderCanvas from "@/components/custom/ShaderCanvas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { useLoginMutation, useRegisterMutation } from "@/hooks/useQueryHooks";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setSuccessMsg("Access authorized. Redirecting...");
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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    registerMutation.mutate(
      { 
        email, 
        name, 
        password, 
        company_name: companyName, 
        phone 
      },
      {
        onSuccess: () => {
          setSuccessMsg("Registration successful! Switching to login...");
          setTimeout(() => {
            setMode("login");
            setSuccessMsg("");
          }, 1500);
        },
        onError: (err: any) => {
          setErrorMsg(err.message || "Registration failed. Please check validation rules.");
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

      {/* Right Side: Forms */}
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
            <h2 className="font-headline-sm text-headline-sm text-on-surface-variant">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="font-label-md text-label-md text-outline">
              {mode === "login" 
                ? "Please enter your credentials to continue." 
                : "Register with company profile and contact credentials."}
            </p>
          </div>

          {/* Form Glass Card */}
          <div className="glass-card rounded-[24px] p-lg">
            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-md">
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

                {/* Status Messages */}
                {errorMsg && (
                  <div className="bg-error-container text-on-error-container p-sm rounded-xl text-label-md font-medium text-center border border-error/20">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-secondary-container text-on-secondary-container p-sm rounded-xl text-label-md font-medium text-center border border-secondary/20">
                    {successMsg}
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
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-md">
                {/* Full Name */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline px-base" htmlFor="name">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<User className="w-5 h-5" />}
                    required
                  />
                </div>

                {/* Email Address */}
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

                {/* Company Name */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline px-base" htmlFor="companyName">
                    Company Name
                  </label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="NextGen Security LLC"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    icon={<Briefcase className="w-5 h-5" />}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline px-base" htmlFor="phone">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    icon={<Phone className="w-5 h-5" />}
                    required
                  />
                </div>

                {/* Password */}
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

                {/* Status Messages */}
                {errorMsg && (
                  <div className="bg-error-container text-on-error-container p-sm rounded-xl text-label-md font-medium text-center border border-error/20">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-secondary-container text-on-secondary-container p-sm rounded-xl text-label-md font-medium text-center border border-secondary/20">
                    {successMsg}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-sm">
                  <Button
                    className="w-full py-4 text-white font-semibold"
                    type="submit"
                    disabled={registerMutation.isPending || registerMutation.isSuccess}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : registerMutation.isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 animate-bounce text-secondary" />
                    ) : (
                      "Register Account"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Link Toggle */}
          <div className="mt-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => { setMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
                    className="text-primary font-bold hover:underline decoration-2 underline-offset-4 cursor-pointer"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button 
                    onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
                    className="text-primary font-bold hover:underline decoration-2 underline-offset-4 cursor-pointer"
                  >
                    Login
                  </button>
                </>
              )}
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
