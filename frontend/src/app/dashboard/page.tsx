"use client";

import { useStore } from "@/lib/store";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { BoardWithStats } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";

const boardSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export default function DashboardPage() {
  const { isAuthenticated } = useStore();
  const router = useRouter();
  const [boards, setBoards] = useState<BoardWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, reset } = useForm<z.infer<typeof boardSchema>>({
    resolver: zodResolver(boardSchema),
  });

  useEffect(() => {
    const token = useStore.getState().token;
    if (!isAuthenticated || !token) {
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

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const q = searchQuery.toLowerCase();
    return boards.filter((b) => b.title.toLowerCase().includes(q));
  }, [boards, searchQuery]);

  const onSubmit = async (values: z.infer<typeof boardSchema>) => {
    try {
      const res = await api.post("/boards", values);
      // The create endpoint returns BoardListItem, enrich it with default stats
      const newBoard: BoardWithStats = {
        ...res.data,
        total_tasks: 0,
        completed_tasks: 0,
        remaining_tasks: 0,
        completion_percent: 0,
        column_count: 0,
      };
      setBoards([...boards, newBoard]);
      reset();
      setIsCreating(false);
      toast.success("Board created");
    } catch {
      toast.error("Failed to create board");
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this board?")) return;
    try {
      await api.delete(`/boards/${boardId}`);
      setBoards(boards.filter((b) => b.id !== boardId));
      toast.success("Board deleted");
    } catch {
      toast.error("Failed to delete board");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 p-3 sm:p-container_padding min-h-[calc(100vh-56px)] bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-lg gap-3">
          <h1 className="font-h1 text-h1 text-on-surface">Your Boards</h1>
          <div className="flex items-center gap-sm flex-wrap sm:flex-nowrap">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 w-full sm:w-[240px] rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300"
              />
            </div>
            {/* New Board Button */}
            {isCreating ? (
              <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-xs">
                <Input
                  autoFocus
                  placeholder="Board name..."
                  {...register("title")}
                  className="h-10 w-[200px] rounded-xl border-outline-variant bg-surface-container-lowest font-body-md text-body-md focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  className="h-10 rounded-xl bg-primary text-[#ffffff] font-label-md text-label-md px-md"
                >
                  Create
                </Button>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); reset(); }}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </form>
            ) : (
              <Button
                onClick={() => setIsCreating(true)}
                className="h-10 rounded-xl bg-primary text-[#ffffff] font-label-md text-label-md px-md gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Board
              </Button>
            )}
          </div>
        </div>

        {/* Board Grid */}
        {loading ? (
          <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg space-y-md">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredBoards.length === 0 && boards.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-md opacity-40">search_off</span>
            <p className="font-body-md text-body-md">No boards match &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-primary/10 p-xl rounded-full mb-lg">
              <span className="material-symbols-outlined text-[48px] text-primary">dashboard</span>
            </div>
            <h3 className="font-h3 text-h3 text-on-surface mb-sm">No boards yet</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg text-center max-w-[384px]">
              Get started by creating your first board to organize your projects.
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="h-10 rounded-xl bg-primary text-[#ffffff] font-label-md text-label-md px-lg gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create your first board
            </Button>
          </div>
        ) : (
          <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
            {filteredBoards.map((board) => (
              <Link key={board.id} href={`/dashboard/${board.id}`}>
                <div className="group rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col gap-md">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <h2 className="font-h3 text-h3 text-on-surface truncate pr-sm">{board.title}</h2>
                    <button
                      onClick={(e) => handleDeleteBoard(e, board.id)}
                      className="shrink-0 p-xs rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete board"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                  </div>

                  {/* Mini Chart Placeholder */}
                  <div className="bg-surface-container-low rounded-xl p-sm h-[72px] flex flex-col justify-end">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Tasks</span>
                    <div className="flex items-end gap-[3px] h-8">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const heights = [40, 60, 30, 80, 50, 70, 45];
                        const pct = board.total_tasks > 0 ? heights[i % heights.length] : 15;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm transition-all duration-500"
                            style={{
                              height: `${pct}%`,
                              backgroundColor: i === 3 ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                              opacity: board.total_tasks > 0 ? (i === 3 ? 1 : 0.4) : 0.15,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {board.remaining_tasks} tasks remaining
                    </span>
                    <span className="font-label-md text-label-md text-on-surface">
                      {board.completion_percent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-[6px] bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${board.completion_percent}%` }}
                    />
                  </div>

                  {/* Column count footer */}
                  <div className="flex items-center gap-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">view_column</span>
                    <span className="font-label-sm text-label-sm">
                      {board.column_count} {board.column_count === 1 ? 'column' : 'columns'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
