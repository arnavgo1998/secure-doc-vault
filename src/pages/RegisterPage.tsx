
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parse, isValid } from "date-fns";

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
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

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

const formSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    birthdate: z.date({
      required_error: "Birthdate is required",
    }).refine((date) => {
      const today = new Date();
      const birthDate = new Date(date);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18;
    }, "You must be at least 18 years old"),
    birthdateInput: z.string().optional(),
    countryCode: z.string().default("+1"),
    phoneNumber: z.string().min(6, "Phone number must be at least 6 digits"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

const RegisterPage: React.FC = () => {
  const { register, sendOTP, verifyOTP, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [formValues, setFormValues] = useState<FormValues | null>(null);
  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      countryCode: "+1",
      phoneNumber: "",
      birthdateInput: "",
    },
  });

  // Function to parse date from different formats
  const parseDate = (dateString: string): Date | null => {
    // Try DD/MM/YYYY format
    let date = parse(dateString, "dd/MM/yyyy", new Date());
    if (isValid(date)) return date;
    
    // Try MM/DD/YYYY format
    date = parse(dateString, "MM/dd/yyyy", new Date());
    if (isValid(date)) return date;
    
    // Try YYYY-MM-DD format
    date = parse(dateString, "yyyy-MM-dd", new Date());
    if (isValid(date)) return date;
    
    return null;
  };

  // Handle manual date input
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>, onChange: (date: Date) => void) => {
    const value = e.target.value;
    form.setValue("birthdateInput", value);
    
    if (value) {
      const parsedDate = parseDate(value);
      if (parsedDate) {
        onChange(parsedDate);
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    setAuthError(null);
    setFormValues(values);
    
    try {
      // Combine country code and phone number
      const fullPhoneNumber = values.countryCode + values.phoneNumber;
      // Send OTP first
      await sendOTP(fullPhoneNumber);
      setOtpDialogOpen(true);
    } catch (error) {
      console.error(error);
      setAuthError("Failed to send verification code. Please try again.");
    }
  };

  const completeRegistration = async () => {
    if (!formValues) return;
    
    try {
      // Combine country code and phone number
      const fullPhoneNumber = formValues.countryCode + formValues.phoneNumber;
      const verified = await verifyOTP(fullPhoneNumber, otp);
      if (verified) {
        // Calculate age from birthdate
        const today = new Date();
        const birthDate = new Date(formValues.birthdate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        await register(
          formValues.email, 
          formValues.password, 
          formValues.name, 
          age,
          fullPhoneNumber
        );
      }
    } catch (error) {
      console.error(error);
      setAuthError("Registration failed. Please try again.");
    } finally {
      setOtpDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 mobile-container py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Register to start managing your insurance documents
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <div className="flex flex-col space-y-2">
                        <Input 
                          placeholder="DD/MM/YYYY" 
                          name="birthdateInput"
                          value={form.watch("birthdateInput")}
                          onChange={(e) => handleDateInput(e, field.onChange)}
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Or pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-popover" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                if (date) {
                                  form.setValue("birthdateInput", format(date, "dd/MM/yyyy"));
                                }
                              }}
                              disabled={(date) => {
                                const today = new Date();
                                const minDate = new Date();
                                minDate.setFullYear(today.getFullYear() - 100);
                                return date > today || date < minDate;
                              }}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              </div>
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {authError && (
                <div className="text-destructive text-sm">{authError}</div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
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
              <Button onClick={completeRegistration} disabled={otp.length !== 6}>
                Verify & Register
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterPage;
