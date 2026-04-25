"use client";

import { useState } from "react";
import { Column as ColumnType, Card as CardType } from "@/types";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import KanbanCard from "./KanbanCard";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useBoardStore } from "@/lib/boardStore";
import { toast } from "sonner";
import { Plus, GripVertical } from "lucide-react";

interface KanbanColumnProps {
  column: ColumnType;
  cards: CardType[];
  isOverlay?: boolean;
}

export default function KanbanColumn({ column, cards, isOverlay }: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const addCardStore = useBoardStore((state) => state.addCard);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    
    try {
      const res = await api.post(`/columns/${column.id}/cards`, {
        title: newCardTitle,
      });
      addCardStore(res.data);
      setNewCardTitle("");
      setIsAddingCard(false);
    } catch {
      toast.error("Failed to add card");
    }
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-primary border-dashed rounded-xl w-[300px] flex-shrink-0 bg-muted/50 h-[500px]"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-muted/30 w-[300px] flex-shrink-0 rounded-xl flex flex-col max-h-full border border-border/50 shadow-sm">
      {/* Column Header (Draggable) */}
      <div 
        {...attributes} 
        {...listeners} 
        className="p-4 font-semibold text-sm flex items-center justify-between hover:bg-muted/50 rounded-t-xl transition-colors group cursor-grab active:cursor-grabbing touch-manipulation"
      >
        <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
          <div className="text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity">
            <GripVertical className="size-4 shrink-0" />
          </div>
          <span className="truncate">{column.title}</span>
        </div>
        <span className="rounded-full bg-background/80 text-xs px-2 py-0.5 text-muted-foreground border shrink-0 ml-2">
          {cards.length}
        </span>
      </div>

      {/* Column Body (Droppable for Cards) */}
      <div className="p-2 flex-1 overflow-y-auto flex flex-col gap-2 min-h-[100px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs">No cards yet</span>
          </div>
        )}
      </div>

      {/* Column Footer */}
      <div className="p-2 pt-0 mt-auto">
        {isAddingCard ? (
          <form onSubmit={handleAddCard} className="space-y-2 mt-2">
            <Input
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Card title..."
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="w-full h-8 text-xs">Add</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingCard(false)} className="w-full h-8 text-xs">Cancel</Button>
            </div>
          </form>
        ) : (
          <Button variant="ghost" className="w-full justify-start text-muted-foreground text-sm h-8" onClick={() => setIsAddingCard(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add a card
          </Button>
        )}
      </div>
    </div>
  );
}
