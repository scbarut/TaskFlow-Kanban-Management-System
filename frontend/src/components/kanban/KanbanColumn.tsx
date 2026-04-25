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
import { Plus, MoreHorizontal } from "lucide-react";

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
        className="border-2 border-primary/30 border-dashed rounded-xl w-[300px] flex-shrink-0 bg-primary/5 h-[500px]"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`w-[300px] flex-shrink-0 rounded-xl flex flex-col max-h-full ${
        isOverlay ? 'z-40 rotate-1 scale-105 shadow-2xl bg-background/95 backdrop-blur-sm border-primary/20' : 'bg-secondary/40 border-transparent shadow-sm'
      } border transition-all duration-300`}
    >
      {/* Column Header (Draggable Handle) */}
      <div 
        {...attributes} 
        {...listeners} 
        className="p-4 flex items-center justify-between group cursor-grab active:cursor-grabbing touch-manipulation rounded-t-xl hover:bg-secondary/60 transition-colors duration-300"
      >
        <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
          <span className="font-semibold text-sm text-foreground truncate">{column.title}</span>
          <span className="rounded-full bg-background/80 text-xs px-2 py-0.5 text-muted-foreground font-medium shrink-0 ml-1">
            {cards.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>

      {/* Column Body (Droppable for Cards) */}
      <div className="px-3 pb-2 flex-1 overflow-y-auto flex flex-col gap-2.5 min-h-[150px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40 border-2 border-dashed border-border/50 rounded-xl mx-1 my-2">
            <span className="text-sm font-medium">Empty column</span>
          </div>
        )}
      </div>

      {/* Column Footer */}
      <div className="p-3 pt-1 mt-auto">
        {isAddingCard ? (
          <form onSubmit={handleAddCard} className="space-y-2">
            <Input
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="h-9 text-sm bg-background border-border/50 focus-visible:ring-1"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="w-full h-8 text-xs font-medium transition-all duration-300">Add Card</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingCard(false)} className="w-full h-8 text-xs transition-all duration-300">Cancel</Button>
            </div>
          </form>
        ) : (
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground text-sm h-9 hover:bg-secondary/60 transition-all duration-300" 
            onClick={() => setIsAddingCard(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add a card
          </Button>
        )}
      </div>
    </div>
  );
}
