"use client";

import { useState, useEffect } from "react";
import { Card as CardType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, CalendarIcon, X, Check, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useBoardStore } from "@/lib/boardStore";
import { format, parseISO } from "date-fns";

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

interface CardEditModalProps {
  card: CardType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardEditModal({
  card,
  open,
  onOpenChange,
}: CardEditModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [color, setColor] = useState<string | null>(card.color);
  const [labels, setLabels] = useState<string[]>(card.labels || []);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    card.due_date ? parseISO(card.due_date) : undefined
  );
  const [isCompleted, setIsCompleted] = useState(card.is_completed);
  const [newLabel, setNewLabel] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { board, updateCard, setBoard } = useBoardStore();

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description || "");
      setColor(card.color);
      setLabels(card.labels || []);
      setDueDate(card.due_date ? parseISO(card.due_date) : undefined);
      setIsCompleted(card.is_completed);
      setNewLabel("");
    }
  }, [open, card]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description: description || null,
        color: color || "",
        labels,
        is_completed: isCompleted,
      };
      if (dueDate) {
        payload.due_date = dueDate.toISOString();
      }

      const res = await api.patch(`/cards/${card.id}`, payload);
      updateCard(card.id, res.data);
      onOpenChange(false);
      toast.success("Card updated");
    } catch {
      toast.error("Failed to update card");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/cards/${card.id}`);
      if (board) {
        const newCols = board.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== card.id),
        }));
        setBoard({ ...board, columns: newCols });
      }
      onOpenChange(false);
      toast.success("Card deleted");
    } catch {
      toast.error("Failed to delete card");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (labels.includes(trimmed)) {
      toast.error("Label already exists");
      return;
    }
    setLabels([...labels, trimmed]);
    setNewLabel("");
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[512px] p-3 sm:p-4"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 py-2 px-0 sm:px-1 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title..."
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Card Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setColor(color === c.hex ? null : c.hex)}
                  className="relative size-7 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: color === c.hex ? "white" : "transparent",
                    boxShadow:
                      color === c.hex
                        ? `0 0 0 2px ${c.hex}`
                        : "0 1px 2px rgba(0,0,0,0.15)",
                  }}
                >
                  {color === c.hex && (
                    <Check className="absolute inset-0 m-auto size-3.5 text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
              {color && (
                <button
                  type="button"
                  onClick={() => setColor(null)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="size-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Labels</label>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {labels.map((label, i) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{
                      backgroundColor:
                        COLOR_PALETTE[i % COLOR_PALETTE.length].hex,
                    }}
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(label)}
                      className="ml-0.5 rounded-full hover:bg-white/20 p-0.5 transition-colors"
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add a label..."
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLabel();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0"
                onClick={handleAddLabel}
              >
                <Plus className="size-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Due Date</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9 overflow-hidden"
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {dueDate ? (
                        format(dueDate, "PPP")
                      ) : (
                        <span className="text-muted-foreground">Pick a date</span>
                      )}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date || undefined);
                        setCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={() => setDueDate(undefined)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => setIsCompleted(checked === true)}
            />
            <label className="text-sm font-medium cursor-pointer" onClick={() => setIsCompleted(!isCompleted)}>
              Mark as completed
            </label>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center sm:justify-between gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="size-4 mr-2" /> Delete
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
