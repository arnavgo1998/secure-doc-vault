
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Country codes for dropdown
const countryCodes = [
  { value: "+1", label: "United States (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+91", label: "India (+91)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+86", label: "China (+86)" },
  { value: "+49", label: "Germany (+49)" },
  { value: "+33", label: "France (+33)" },
  { value: "+81", label: "Japan (+81)" },
  { value: "+7", label: "Russia (+7)" },
  { value: "+55", label: "Brazil (+55)" },
  { value: "+34", label: "Spain (+34)" },
  { value: "+39", label: "Italy (+39)" },
  { value: "+52", label: "Mexico (+52)" },
  { value: "+82", label: "South Korea (+82)" },
  { value: "+31", label: "Netherlands (+31)" },
];

const phoneFormSchema = z.object({
  countryCode: z.string().default("+1"),
  phoneNumber: z.string().min(6, "Phone number is required"),
  rememberMe: z.boolean().default(false),
});

type PhoneFormValues = z.infer<typeof phoneFormSchema>;

const LoginPage: React.FC = () => {
  const { loginWithPhone, sendOTP, verifyOTP, loading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [authError, setAuthError] = useState<string | null>(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);
  const navigate = useNavigate();

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      countryCode: "+1",
      phoneNumber: "",
      rememberMe: false,
    },
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: PhoneFormValues) => {
    setAuthError(null);
    try {
      // Combine country code and phone number
      const fullPhoneNumber = values.countryCode + values.phoneNumber;
      console.log("Sending OTP to:", fullPhoneNumber);
      
      // Send OTP
      await sendOTP(fullPhoneNumber);
      
      // Open dialog for OTP verification
      setOtpDialogOpen(true);
    } catch (error) {
      console.error("Login form error:", error);
      setAuthError("Failed to send verification code");
      toast({
        title: "Login failed",
        description: "Could not send verification code",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const fullPhoneNumber = form.getValues("countryCode") + form.getValues("phoneNumber");
      const rememberMe = form.getValues("rememberMe");
      
      const verified = await verifyOTP(fullPhoneNumber, otp);
      if (verified) {
        await loginWithPhone(fullPhoneNumber, rememberMe);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        setOtpDialogOpen(false);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification failed",
        description: "Invalid verification code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 mobile-container py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Log in to your account</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your phone number to receive a verification code
            </p>
          </div>

          {authError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col space-y-2">
                <FormLabel>Phone Number</FormLabel>
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem className="flex-shrink-0 w-[120px]">
                        <Popover open={isCountryCodeOpen} onOpenChange={setIsCountryCodeOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isCountryCodeOpen}
                                className="justify-between"
                              >
                                {field.value}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 bg-popover w-[200px]">
                            <Command>
                              <CommandInput placeholder="Search country code..." />
                              <CommandEmpty>No country code found.</CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-y-auto">
                                {countryCodes.map((code) => (
                                  <CommandItem
                                    key={code.value}
                                    value={code.label}
                                    onSelect={() => {
                                      field.onChange(code.value);
                                      setIsCountryCodeOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === code.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {code.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Remember me
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending code..." : "Send verification code"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phone Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your phone number
            </p>
            <div className="flex justify-center">
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setOtpDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerifyOTP} disabled={otp.length !== 6 || loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
