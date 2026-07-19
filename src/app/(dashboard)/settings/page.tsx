"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Briefcase, 
  Phone, 
  MapPin, 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUserProfile, useUpdateProfileMutation } from "@/hooks/useQueryHooks";

export default function SettingsPage() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfileMutation();

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("IN");

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">("");

  // Sync state with profile data
  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || "");
      setPhone(profile.phone || "");
      setGstNumber(profile.gst_number || "");
      
      const addr = profile.billing_address || {};
      setStreet(addr.street || "");
      setCity(addr.city || "");
      setState(addr.state || "");
      setPostalCode(addr.postal_code || "");
      setCountry(addr.country || "IN");
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg("");
    setFeedbackType("");

    const payload: any = {
      company_name: companyName,
      phone: phone,
      billing_address: {
        street,
        city,
        state,
        postal_code: postalCode,
        country
      }
    };

    if (gstNumber) {
      payload.gst_number = gstNumber;
    }

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setFeedbackType("success");
        setFeedbackMsg("Profile settings updated successfully!");
        setTimeout(() => {
          setFeedbackMsg("");
          setFeedbackType("");
        }, 3000);
      },
      onError: (err: any) => {
        setFeedbackType("error");
        setFeedbackMsg(err.message || "Failed to update settings. Verify validation rules (e.g. GST format).");
      }
    });
  };

  if (isLoading) {
    return (
      <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
        <div className="mb-md">
          <ProfileHeader pageName="Settings" />
        </div>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-md">
        <ProfileHeader pageName="Settings" />
      </div>

      <div className="flex flex-col gap-md mt-md">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold">Account Settings</h1>
          <p className="text-on-surface-variant font-body-md">
            Modify profile metadata, customize physical billing profiles, and inspect organization keys.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          {/* Settings Form */}
          <Card className="lg:col-span-8 p-lg" animateHover={false}>
            <form onSubmit={handleSubmit} className="space-y-md">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-outline-variant/10 pb-xs mb-sm">
                Company Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                {/* Full Name (Read-only) */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                    Primary Account Owner
                  </label>
                  <Input
                    type="text"
                    value={profile?.name || ""}
                    disabled
                    className="opacity-75 bg-surface-container"
                    icon={<User className="w-5 h-5 text-outline-variant" />}
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                    Primary Email (Immutable)
                  </label>
                  <Input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="opacity-75 bg-surface-container"
                    icon={<User className="w-5 h-5 text-outline-variant" />}
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="company">
                    Company Name
                  </label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    icon={<Briefcase className="w-5 h-5" />}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="phone">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    icon={<Phone className="w-5 h-5" />}
                    required
                  />
                </div>
              </div>

              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-outline-variant/10 pt-base pb-xs mb-sm">
                Billing &amp; Tax Profile
              </h3>

              <div className="space-y-sm">
                {/* Street Address */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="street">
                    Street Address
                  </label>
                  <Input
                    id="street"
                    type="text"
                    placeholder="123 Security Blvd, Suite 100"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    icon={<MapPin className="w-5 h-5" />}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="city">
                      City
                    </label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="state">
                      State / Province
                    </label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="zip">
                      Postal Code
                    </label>
                    <Input
                      id="zip"
                      type="text"
                      placeholder="110001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="country">
                      Country ISO
                    </label>
                    <Input
                      id="country"
                      type="text"
                      maxLength={2}
                      placeholder="IN"
                      value={country}
                      onChange={(e) => setCountry(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                {/* GST Number */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="gst">
                    GSTIN / Tax ID (Format: 07AAAAA1111A1Z1)
                  </label>
                  <Input
                    id="gst"
                    type="text"
                    placeholder="GSTIN Number"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    icon={<FileText className="w-5 h-5" />}
                  />
                </div>
              </div>

              {/* Action and feedback */}
              <div className="pt-base border-t border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-base">
                <div>
                  {feedbackMsg && (
                    <div className={`p-sm rounded-xl text-label-md font-bold flex items-center gap-xs ${
                      feedbackType === "success" 
                        ? "bg-secondary-container text-on-secondary-container" 
                        : "bg-error-container text-on-error-container"
                    }`}>
                      {feedbackType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {feedbackMsg}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="flex items-center gap-xs font-semibold px-md"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Settings Sidebar Panel */}
          <Card className="lg:col-span-4 p-lg flex flex-col gap-md" animateHover>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-sm">API &amp; Integrations</h3>
              <p className="text-on-surface-variant font-body-md leading-relaxed">
                Connect your printing workstations to custom endpoints. Regenerate tokens under your Security Dashboard.
              </p>
            </div>
            
            <div className="p-sm bg-surface-container rounded-2xl border border-outline-variant/10 text-center select-none">
              <span className="text-[10px] text-primary uppercase font-bold tracking-widest leading-none block mb-xs">Role Scope</span>
              <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface uppercase">
                {profile?.role || "Customer"}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
