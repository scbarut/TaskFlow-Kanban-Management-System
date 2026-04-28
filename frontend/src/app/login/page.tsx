"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";



const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      // Backend expects Application/x-www-form-urlencoded for login now per Swagger fix
      const formData = new URLSearchParams();
      formData.append("username", values.email);
      formData.append("password", values.password);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = response.data.access_token;
      
      // Decoded token to get basic info if we wanted, but we also can fetch the user details or mock it for now since the backend /auth/login only returns token.
      // In Taskflow step 1, /auth/login returns { access_token, token_type }. We can mock the user details from email or create a /users/me endpoint.
      // For now, we will store the email in the store directly to show in navbar.
      login(token, { id: "0", email: values.email, role_title: "member", created_at: "" });
      
      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error("An error occurred. Please check your server connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-surface-container text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Translucent Brand Icon Background Element */}
      <div className="absolute -bottom-32 -left-32 text-primary opacity-[0.03] select-none pointer-events-none z-0 transform rotate-12">
        <span className="material-symbols-outlined text-[600px] leading-none block" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
      </div>
      <div className="absolute -top-40 -right-40 text-primary opacity-[0.02] select-none pointer-events-none z-0 transform -rotate-12">
        <span className="material-symbols-outlined text-[500px] leading-none block" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
      </div>

      <main className="flex-grow flex items-center justify-center p-lg relative z-10 w-full">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] w-full max-w-[448px] transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-fixed text-primary mb-md">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            </div>
            <h1 className="font-h1 text-h1 text-on-surface mb-xs tracking-tight">TaskFlow</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Log in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg">
            {/* Email Input */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email address</label>
              <input 
                id="email" 
                type="email"
                placeholder="name@company.com" 
                className="w-full bg-transparent border border-outline rounded-DEFAULT px-md py-[10px] font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                {...register("email")}
              />
              {errors.email && (
                <p className="font-label-md text-label-md text-error mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
              <input 
                id="password" 
                type="password"
                placeholder="••••••••" 
                className="w-full bg-transparent border border-outline rounded-DEFAULT px-md py-[10px] font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                {...register("password")}
              />
              {errors.password && (
                <p className="font-label-md text-label-md text-error mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Primary Action */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-on-primary font-label-md text-label-md py-md px-lg rounded-DEFAULT hover:bg-on-primary-fixed-variant active:scale-[0.98] transition-all flex justify-center items-center gap-xs mt-sm shadow-sm disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>



          {/* Footer Link */}
          <p className="font-body-md text-body-md text-on-surface-variant text-center mt-xl">
            Don't have an account? <a href="/register" className="text-primary hover:text-on-primary-fixed-variant font-medium hover:underline transition-colors">Sign up</a>
          </p>
        </div>
      </main>
    </div>
  );
}
