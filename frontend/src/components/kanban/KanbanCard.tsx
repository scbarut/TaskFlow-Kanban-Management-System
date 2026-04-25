"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useBoardStore } from "@/lib/boardStore";
import { isBefore, isToday, format, parseISO } from "date-fns";
import CardEditModal from "./CardEditModal";

const LABEL_COLORS = [
  "#4CAF50", "#FFC107", "#FF9800", "#EF5350", "#AB47BC",
  "#42A5F5", "#26A69A", "#9E9D24", "#EC407A", "#78909C",
];

interface KanbanCardProps {
  card: CardType;
}

export default function KanbanCard({ card }: KanbanCardProps) {
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

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-primary border-dashed rounded-lg h-24 w-full"
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
        className="group relative cursor-grab touch-manipulation"
      >
        <Card
          className="hover:ring-2 hover:ring-primary/50 transition-all shadow-sm overflow-hidden cursor-pointer"
          style={
            card.color
              ? { borderTop: `3px solid ${card.color}` }
              : undefined
          }
          onClick={() => setIsEditing(true)}
        >
          <div className="p-3 space-y-2">
            {/* Title row with checkbox */}
            <div className="flex items-start gap-2">
              <div
                className="pt-0.5 shrink-0"
                onClick={handleToggleComplete}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={card.is_completed}
                  className={`transition-all duration-300 ${
                    card.is_completed ? "scale-110" : ""
                  }`}
                  tabIndex={-1}
                />
              </div>
              <span
                className={`text-sm font-semibold leading-tight transition-all duration-300 ${
                  card.is_completed
                    ? "line-through text-muted-foreground/60"
                    : ""
                }`}
              >
                {card.title}
              </span>
            </div>

            {/* Description preview */}
            {card.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                {card.description}
              </p>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 pl-6">
                {card.labels.map((label, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{
                      backgroundColor:
                        LABEL_COLORS[i % LABEL_COLORS.length],
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Due date badge */}
            {dueDate && (
              <div className="pl-6">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                    isOverdue
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : isDueToday
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : card.is_completed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Clock className="size-3" />
                  {format(dueDate, "MMM d")}
                </span>
              </div>
            )}
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
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-3 w-full ml-6" />
      <div className="flex gap-1 ml-6">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}
