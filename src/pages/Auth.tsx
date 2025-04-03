
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const phoneSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be at least 6 characters"),
});

const Auth = () => {
  const { signIn, signUp, verifyOtp } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handlePhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setLoading(true);
    const formattedPhone = formatPhoneNumber(values.phone);
    setPhoneNumber(formattedPhone);

    try {
      const { error, success } = authMode === "signin" 
        ? await signIn(formattedPhone)
        : await signUp(formattedPhone);

      if (success) {
        setStep("otp");
        toast({
          title: "OTP Sent",
          description: "Check your phone for the verification code",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    setLoading(true);
    try {
      const { error, success } = await verifyOtp(phoneNumber, values.otp);

      if (success) {
        toast({
          title: "Success",
          description: "You have been successfully authenticated",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Invalid OTP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Ensure phone number is in E.164 format (e.g., +14155552671)
    if (!phone.startsWith("+")) {
      return `+${phone.replace(/\D/g, "")}`;
    }
    return phone.replace(/\D/g, "");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            {step === "phone" ? "Sign in or create an account" : "Verify your phone number"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-6">
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1234567890" 
                            {...field} 
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Continue"}
                  </Button>
                </form>
              </Form>
            </Tabs>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          {...field} 
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {step === "otp" && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setStep("phone")}
              disabled={loading}
            >
              Back
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
