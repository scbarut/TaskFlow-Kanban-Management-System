"use client";

import Link from "next/link";
import { buttonVariants, Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isAuthenticated, logout } = useStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 mt-16">
      <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-primary">
        TaskFlow
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        A seamless Kanban board experience built with FastAPI and Next.js.
      </p>
      <div className="flex gap-4">
        {isAuthenticated ? (
          <>
            <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
              Go to Dashboard
            </Link>
            <Button variant="secondary" size="lg" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Get Started
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
