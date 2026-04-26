"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-colors duration-300">
      <div className="flex h-14 sm:h-16 items-center px-3 sm:px-6 container mx-auto justify-between">
        <Link href={"/"} className="font-bold text-lg sm:text-xl tracking-tight text-primary hover:opacity-80 transition-opacity">
          TaskFlow
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm font-medium text-muted-foreground mr-2 hidden md:inline-block">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full transition-all duration-300 h-10 px-4 sm:h-9 sm:px-3 min-w-[44px]">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-full transition-all duration-300 h-10 px-4 sm:h-9 sm:px-5 font-medium min-w-[44px]" })}>
                Login
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm", className: "rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-10 px-4 sm:h-9 sm:px-5 font-medium min-w-[44px]" })}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
