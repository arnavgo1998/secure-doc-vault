
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
import { supabase } from "@/integrations/supabase/client";

const phoneSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  age: z.string().refine(val => !val || !isNaN(Number(val)), {
    message: "Age must be a number",
  }).optional(),
});

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be at least 6 characters"),
});

const Auth = () => {
  const { signIn, signUp, verifyOtp } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userInfo, setUserInfo] = useState<{
    fullName?: string;
    email?: string;
    age?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
      fullName: "",
      email: "",
      age: "",
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
    
    // Save additional user info for later
    setUserInfo({
      fullName: values.fullName,
      email: values.email,
      age: values.age,
    });

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
        // If this is a signup and we have additional user info, store it in the database
        if (authMode === "signup" && (userInfo.fullName || userInfo.email || userInfo.age)) {
          const user = (await supabase.auth.getUser()).data.user;
          
          if (user) {
            await supabase.from('profiles').update({
              full_name: userInfo.fullName,
              email: userInfo.email,
              age: userInfo.age ? parseInt(userInfo.age) : null,
            }).eq('id', user.id);
          }
        }
        
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
                <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
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
                  
                  {authMode === "signup" && (
                    <>
                      <FormField
                        control={phoneForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                {...field} 
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={phoneForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="john@example.com" 
                                type="email"
                                {...field} 
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={phoneForm.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="30" 
                                type="number"
                                {...field} 
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
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
          <p className="text-xs text-center text-gray-500">
            For testing, use any phone number like +11234567890 and OTP code 123456
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
