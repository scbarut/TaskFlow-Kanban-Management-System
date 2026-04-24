"use client";

import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Board } from "@/types";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const boardSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export default function DashboardPage() {
  const { isAuthenticated } = useStore();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset } = useForm<z.infer<typeof boardSchema>>({
    resolver: zodResolver(boardSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchBoards();
  }, [isAuthenticated, router]);

  const fetchBoards = async () => {
    try {
      const res = await api.get("/boards");
      setBoards(res.data);
    } catch {
      toast.error("Failed to fetch boards");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof boardSchema>) => {
    try {
      const res = await api.post("/boards", values);
      setBoards([...boards, res.data]);
      reset();
      toast.success("Board created");
    } catch {
      toast.error("Failed to create board");
    }
  };

  if (!isAuthenticated || loading) return null;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Your Boards</h1>
      
      <div className="mb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 max-w-md">
          <Input placeholder="New board title..." {...register("title")} />
          <Button type="submit">Create Board</Button>
        </form>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <Link key={board.id} href={`/dashboard/${board.id}`}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-32 flex items-center justify-center">
              <CardTitle>{board.title}</CardTitle>
            </Card>
          </Link>
        ))}
        {boards.length === 0 && (
          <div className="text-muted-foreground italic col-span-full">No boards found. Create one above!</div>
        )}
      </div>
    </div>
  );
}
