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

const COLOR_PALETTE = [
  { name: "Green", hex: "#4CAF50" },
  { name: "Gold", hex: "#FFC107" },
  { name: "Orange", hex: "#FF9800" },
  { name: "Red", hex: "#EF5350" },
  { name: "Purple", hex: "#AB47BC" },
  { name: "Blue", hex: "#42A5F5" },
  { name: "Teal", hex: "#26A69A" },
  { name: "Olive", hex: "#9E9D24" },
  { name: "Pink", hex: "#EC407A" },
  { name: "Gray", hex: "#78909C" },
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
        <div
          className={`bg-surface-container-lowest p-3 pt-4 rounded-xl transition-all duration-300 border border-outline-variant shadow-sm hover:border-primary cursor-pointer group flex flex-col gap-2 overflow-hidden relative ${
            isOverlay ? "ring-2 ring-primary/50 shadow-xl scale-105 rotate-2" : "hover:-translate-y-0.5"
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

          <div className="flex flex-col gap-2 w-full">
            {/* Labels Top Row */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-xs">
                {card.labels.map((label, i) => {
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full px-2 py-0 text-[10px] font-medium text-white shadow-sm"
                      style={{ backgroundColor: COLOR_PALETTE[i % COLOR_PALETTE.length].hex }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className={`font-body-md text-body-md font-medium leading-tight transition-all duration-300 ${
                  card.is_completed ? "line-through text-on-surface-variant" : "text-on-surface"
                }`}
              >
                {card.title}
              </h3>
              {card.description && (
                <p className="text-[11px] text-on-surface-variant line-clamp-2">
                  {card.description}
                </p>
              )}
            </div>

            {/* Bottom Metadata Row */}
            <div className="flex items-center justify-between mt-1 pt-1 mt-auto">
              {/* Checkmark aligned bottom left */}
              <div className="flex items-center gap-1 text-on-surface-variant">
                <button
                  type="button"
                  onClick={handleToggleComplete}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="hover:text-primary transition-colors duration-300 focus:outline-none flex items-center"
                >
                  {card.is_completed ? (
                    <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
                  )}
                </button>
              </div>

              {/* Due Date aligned bottom right */}
              {dueDate && (
                <span
                  className={`inline-flex items-center gap-1 rounded-DEFAULT px-1.5 py-0 font-label-md text-[10px] transition-colors duration-300 ${
                    isOverdue
                      ? "bg-error-container text-on-error-container"
                      : isDueToday
                        ? "bg-tertiary-fixed text-on-tertiary-fixed"
                        : card.is_completed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {format(dueDate, "MMM d")}
                </span>
              )}
            </div>
          </div>
        </div>
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

