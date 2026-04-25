"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isAuthenticated } = useStore();

  return (
    <div className="flex-1 flex flex-col w-full text-on-background font-body-md text-body-md">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface-container-low py-20 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="z-10 flex flex-col gap-6">
            <span className="font-semibold text-xs text-primary uppercase tracking-widest bg-primary/10 w-max px-3 py-1.5 rounded-full">
              Work Smarter
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Manage tasks with ease.
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              TaskFlow is the minimalist, high-velocity project management tool designed for teams that prioritize focus and efficiency. Build boards, track progress, and ship faster.
            </p>
            <div className="flex items-center gap-4 mt-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 px-8 font-medium">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 px-8 font-medium">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" size="lg" className="rounded-full hover:bg-secondary transition-all duration-300 px-8 font-medium">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="relative z-10 w-full rounded-xl bg-surface-container-lowest border border-surface-container-highest shadow-sm p-md transform rotate-1 hover:rotate-0 transition-transform duration-500 hidden md:block">
            {/* Abstract Kanban Visual */}
            <div className="flex gap-md h-[400px]">
              {/* Column 1 */}
              <div className="flex-1 bg-surface-container rounded-lg p-sm flex flex-col gap-sm">
                <div className="font-label-sm text-label-sm text-on-surface-variant px-xs">To Do</div>
                <div className="bg-surface-container-lowest border border-outline-variant p-sm rounded-DEFAULT shadow-sm cursor-grab hover:border-primary transition-colors">
                  <div className="w-1/2 h-2 bg-primary-fixed rounded-sm mb-2"></div>
                  <div className="w-3/4 h-3 bg-surface-variant rounded-sm mb-1"></div>
                  <div className="w-1/2 h-3 bg-surface-variant rounded-sm"></div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant p-sm rounded-DEFAULT shadow-sm cursor-grab hover:border-primary transition-colors">
                  <div className="w-1/3 h-2 bg-error-container rounded-sm mb-2"></div>
                  <div className="w-5/6 h-3 bg-surface-variant rounded-sm mb-1"></div>
                  <div className="w-2/3 h-3 bg-surface-variant rounded-sm"></div>
                </div>
              </div>
              {/* Column 2 */}
              <div className="flex-1 bg-surface-container rounded-lg p-sm flex flex-col gap-sm">
                <div className="font-label-sm text-label-sm text-on-surface-variant px-xs">In Progress</div>
                <div className="bg-surface-container-lowest border border-primary p-sm rounded-DEFAULT shadow-md transform -rotate-2 scale-[1.02] cursor-grabbing z-10">
                  <div className="w-2/3 h-2 bg-secondary-fixed rounded-sm mb-2"></div>
                  <div className="w-full h-3 bg-surface-variant rounded-sm mb-1"></div>
                  <div className="w-3/4 h-3 bg-surface-variant rounded-sm"></div>
                </div>
              </div>
              {/* Column 3 */}
              <div className="flex-1 bg-surface-container rounded-lg p-sm flex flex-col gap-sm border-2 border-dashed border-outline-variant opacity-70">
                <div className="font-label-sm text-label-sm text-on-surface-variant px-xs">Done</div>
              </div>
            </div>
          </div>
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 -mr-[20%] -mt-[10%] w-[80%] h-[120%] bg-gradient-to-bl from-primary-fixed/40 to-transparent rounded-full blur-3xl z-0 pointer-events-none"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-xl lg:py-32 px-container_padding bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-xl lg:mb-32">
            <h2 className="font-h2 text-h2 text-on-surface mb-sm">Everything you need, nothing you don't.</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Engineered for speed and cognitive clarity, TaskFlow removes friction from your daily workflow.</p>
          </div>
          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md auto-rows-[300px]">
            {/* Feature 1: Drag and Drop */}
            <div className="md:col-span-2 bg-surface-container-low rounded-xl border border-surface-container-high p-lg flex flex-col justify-between group overflow-hidden relative">
              <div className="z-10 relative">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined">drag_indicator</span>
                </div>
                <h3 className="font-h3 text-h3 text-on-surface mb-xs">Fluid Drag-and-Drop</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-[28rem]">Effortlessly organize tasks with a physics-based drag-and-drop system that feels tactile and responsive.</p>
              </div>
              {/* Abstract visual */}
              <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-64 h-64 bg-surface-container-high rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
            </div>
            {/* Feature 2: Real-time */}
            <div className="bg-surface-container-low rounded-xl border border-surface-container-high p-lg flex flex-col justify-between group overflow-hidden relative">
              <div className="z-10 relative">
                <div className="w-12 h-12 bg-secondary-fixed text-on-secondary-fixed rounded-lg flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined">sync</span>
                </div>
                <h3 className="font-h3 text-h3 text-on-surface mb-xs">Real-Time Sync</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Changes reflect instantly across all your team's devices.</p>
              </div>
            </div>
            {/* Feature 3: Mobile Support */}
            <div className="bg-surface-container-low rounded-xl border border-surface-container-high p-lg flex flex-col justify-between group overflow-hidden relative">
              <div className="z-10 relative">
                <div className="w-12 h-12 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined">smartphone</span>
                </div>
                <h3 className="font-h3 text-h3 text-on-surface mb-xs">Mobile Optimized</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">A first-class mobile experience for managing tasks on the go.</p>
              </div>
            </div>
            {/* Feature 4: Analytics */}
            <div className="md:col-span-2 bg-surface-container-low rounded-xl border border-surface-container-high p-lg flex flex-col justify-between group overflow-hidden relative">
              <div className="z-10 relative">
                <div className="w-12 h-12 bg-surface-variant text-on-surface-variant rounded-lg flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined">insert_chart</span>
                </div>
                <h3 className="font-h3 text-h3 text-on-surface mb-xs">Actionable Insights</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-[28rem]">Minimalist reporting that highlights bottlenecks without overwhelming you with data.</p>
              </div>
              {/* Abstract visual */}
              <div className="absolute right-lg bottom-lg flex items-end gap-sm opacity-50">
                <div className="w-8 h-16 bg-outline-variant rounded-t-sm"></div>
                <div className="w-8 h-24 bg-outline-variant rounded-t-sm"></div>
                <div className="w-8 h-32 bg-primary rounded-t-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-surface-container-high py-xl px-container_padding mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-sm">
            <span className="text-lg font-black tracking-tight text-primary">TaskFlow</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">© 2024 TaskFlow Inc.</span>
          </div>
          <div className="flex gap-lg">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
