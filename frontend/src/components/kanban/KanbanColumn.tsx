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
    transform: CSS.Translate.toString(transform),
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

  const isPlaceholder = isDragging && !isOverlay;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`w-[85vw] min-w-[280px] sm:w-[240px] sm:min-w-0 shrink-0 flex flex-col p-sm rounded-2xl border max-h-full transition-colors duration-300 ${
        isOverlay 
          ? 'z-40 rotate-1 scale-105 shadow-2xl bg-surface border-primary' 
          : isPlaceholder
            ? 'border-2 border-primary/40 border-dashed bg-primary/5 opacity-40'
            : 'bg-surface-container-low border-outline-variant/30'
      }`}
    >
      <div className={isPlaceholder ? "opacity-0 pointer-events-none flex flex-col h-full" : "flex flex-col h-full"}>
        {/* Column Header (Draggable Handle) */}
        <div 
          {...attributes} 
          {...listeners} 
          className="flex items-center justify-between px-sm py-2 sm:py-xs mb-sm shrink-0 group cursor-grab active:cursor-grabbing rounded-xl hover:bg-surface-container transition-colors duration-300"
          style={{ touchAction: 'none' }}
        >
          <h2 className="font-h3 text-h3 text-on-surface flex items-center gap-xs overflow-hidden pointer-events-none">
            <span className="truncate">{column.title}</span>
            <span className="bg-surface-variant text-on-surface-variant font-label-md text-label-md px-2 py-0.5 rounded-full shrink-0">
              {cards.length}
            </span>
          </h2>
        </div>

        {/* Column Body (Droppable for Cards) */}
        <div className="flex flex-col gap-card_gap overflow-y-auto px-1 pt-1 pb-sm min-h-[150px] -mx-1">
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </SortableContext>
          {cards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant/40 border-2 border-dashed border-outline-variant/50 rounded-xl mx-1 my-2">
              <span className="font-label-md text-label-md">Empty column</span>
            </div>
          )}
        </div>

        {/* Column Footer */}
        <div className="mt-auto pt-sm">
          {isAddingCard ? (
            <form onSubmit={handleAddCard} className="space-y-2 bg-surface-container-lowest p-sm rounded-xl border border-outline-variant/50 shadow-sm">
              <Input
                autoFocus
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="h-9 text-body-md bg-surface border-outline-variant/50 focus-visible:ring-primary"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1 h-8 font-label-md text-label-md bg-primary text-[#ffffff] rounded-lg">Add</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingCard(false)} className="flex-1 h-8 font-label-md text-label-md rounded-lg">Cancel</Button>
              </div>
            </form>
          ) : (
            <button 
              className="flex items-center gap-xs p-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-xl transition-colors font-body-md text-body-md w-full justify-start shrink-0"
              onClick={() => setIsAddingCard(true)}
            >
              <span className="material-symbols-outlined text-[18px]">add</span> Add a card
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
