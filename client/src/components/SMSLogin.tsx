import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Smartphone, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface SMSLoginProps {
  role?: "patient" | "clinician";
  onSuccess?: (token: string, user: any) => void;
}

export function SMSLogin({ role = "patient", onSuccess }: SMSLoginProps) {
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+964");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  
  const { toast } = useToast();

  const sendOTPMutation = trpc.phoneAuth.sendOTP.useMutation({
    onSuccess: (data) => {
      setFormattedPhone(data.phoneNumber);
      setStep("verify");
      
      // Show dev code if available
      if (data.code) {
        setDevCode(data.code);
        toast({
          title: "Development Mode",
          description: `Your verification code is: ${data.code}`,
        });
      } else {
        toast({
          title: "Code Sent",
          description: "Check your phone for the verification code",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyOTPMutation = trpc.phoneAuth.verifyOTP.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.isNewUser ? "Account created successfully" : "Logged in successfully",
      });
      
      // Note: Token is stored in httpOnly cookie by the server for security
      // No localStorage storage to prevent XSS attacks
      
      if (onSuccess) {
        onSuccess(data.token, data.user);
      } else {
        // Default redirect based on role
        window.location.href = data.user.role === "admin" ? "/admin/dashboard" : "/patient/portal";
      }
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before sending
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    
    if (phoneNumber.length < 10) {
      toast({
        title: "Error",
        description: "Phone number must be at least 10 digits",
        variant: "destructive",
      });
      return;
    }

    sendOTPMutation.mutate({
      phoneNumber,
      countryCode,
    });
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    verifyOTPMutation.mutate({
      phoneNumber: formattedPhone,
      countryCode,
      code: otp,
      name: name.trim() || undefined,
      role,
    });
  };

  if (step === "phone") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Login with SMS
          </CardTitle>
          <CardDescription>
            Enter your phone number to receive a verification code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="country-code"
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24"
                  placeholder="+964"
                />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="7701234567"
                  required
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your phone number without the country code
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={sendOTPMutation.isPending || phoneNumber.length < 10}
            >
              {sendOTPMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Verify Your Phone</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to {formattedPhone}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          {devCode && (
            <Alert>
              <AlertDescription className="font-mono font-bold text-center text-lg">
                Development Code: {devCode}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name (optional for existing users)</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
            <p className="text-sm text-muted-foreground">
              Required for new accounts
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setDevCode(null);
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={verifyOTPMutation.isPending}
            >
              {verifyOTPMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Login"
              )}
            </Button>
          </div>

          <Button
            type="button"
            variant="link"
            onClick={() => sendOTPMutation.mutate({ phoneNumber: formattedPhone, countryCode })}
            disabled={sendOTPMutation.isPending}
            className="w-full"
          >
            Resend Code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
