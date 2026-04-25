"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardType } from "@/types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2, Circle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useBoardStore } from "@/lib/boardStore";
import { isBefore, isToday, format, parseISO } from "date-fns";
import CardEditModal from "./CardEditModal";

const LABEL_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400" },
];

interface KanbanCardProps {
  card: CardType;
  isOverlay?: boolean;
}

export default function KanbanCard({ card, isOverlay }: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateCard } = useBoardStore();

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: isEditing,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !card.is_completed;
    updateCard(card.id, { is_completed: newValue });
    try {
      await api.patch(`/cards/${card.id}`, { is_completed: newValue });
    } catch {
      updateCard(card.id, { is_completed: !newValue });
      toast.error("Failed to update status");
    }
  };

  const dueDate = card.due_date ? parseISO(card.due_date) : null;
  const isOverdue =
    dueDate &&
    !card.is_completed &&
    isBefore(dueDate, new Date()) &&
    !isToday(dueDate);
  const isDueToday = dueDate && !card.is_completed && isToday(dueDate);

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border-2 border-primary/50 border-dashed rounded-xl h-28 w-full bg-primary/5"
      />
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group relative cursor-grab active:cursor-grabbing touch-manipulation ${isOverlay ? 'z-50' : ''}`}
      >
        <Card
          className={`relative overflow-hidden transition-all duration-300 border-border/60 bg-card hover:border-primary/30 hover:shadow-md ${
            isOverlay ? "ring-2 ring-primary/50 shadow-xl scale-105 rotate-2" : "shadow-sm hover:-translate-y-0.5"
          }`}
          onClick={() => setIsEditing(true)}
        >
          {/* Top color strip */}
          {card.color && (
            <div 
              className="absolute top-0 left-0 right-0 h-2" 
              style={{ backgroundColor: card.color }} 
            />
          )}

          <div className="p-4 pt-6 flex flex-col gap-3">
            {/* Labels Top Row */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {card.labels.map((label, i) => {
                  const colorTheme = LABEL_COLORS[i % LABEL_COLORS.length];
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium ${colorTheme.text} ${colorTheme.bg}`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h4 className={`text-sm font-semibold leading-tight text-foreground transition-all duration-300 ${
                  card.is_completed ? "line-through text-muted-foreground/50" : ""
                }`}
              >
                {card.title}
              </h4>
              {card.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {card.description}
                </p>
              )}
            </div>

            {/* Bottom Metadata Row */}
            <div className="flex items-center justify-between pt-1 mt-auto">
              {/* Checkmark aligned bottom left */}
              <button
                type="button"
                onClick={handleToggleComplete}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary transition-colors duration-300 focus:outline-none"
              >
                {card.is_completed ? (
                  <CheckCircle2 className="size-5 text-primary fill-primary/10" />
                ) : (
                  <Circle className="size-5 hover:fill-muted transition-colors duration-300" />
                )}
              </button>

              {/* Due Date aligned bottom right */}
              {dueDate && (
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors duration-300 ${
                    isOverdue
                      ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      : isDueToday
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                        : card.is_completed
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Clock className="size-3" />
                  {format(dueDate, "MMM d")}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      <CardEditModal
        card={card}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </>
  );
}

export function KanbanCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-12 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
    </div>
  );
}

