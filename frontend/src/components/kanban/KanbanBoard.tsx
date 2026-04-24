"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useBoardStore } from "@/lib/boardStore";
import { useStore } from "@/lib/store";
import { Card as CardType, Column as ColumnType } from "@/types";
import { toast } from "sonner";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent, 
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";

import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function KanbanBoard({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { isAuthenticated } = useStore();
  const { board, setBoard, setColumns } = useBoardStore();
  
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
  
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires minimum 5px movement to start drag (allows clicking buttons/inputs inside)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!boardId || boardId === "undefined") return;
    fetchBoard();
  }, [boardId, isAuthenticated]);

  const fetchBoard = async () => {
    try {
      const res = await api.get(`/boards/${boardId}`);
      setBoard(res.data);
    } catch {
      toast.error("Failed to load board");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    try {
      const res = await api.post(`/boards/${boardId}/columns`, {
        title: newColTitle,
      });
      const newColumns = [...(board?.columns || []), res.data];
      setColumns(newColumns.sort((a,b) => a.position - b.position));
      setNewColTitle("");
      setIsAddingCol(false);
    } catch {
      toast.error("Failed to create column");
    }
  };

  const columnsId = useMemo(() => board?.columns.map(col => col.id) || [], [board?.columns]);

  if (loading || !board) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Board Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b bg-card shrink-0">
        <h1 className="text-2xl font-bold">{board.title}</h1>
      </div>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
            {board.columns.map((col) => (
              <KanbanColumn key={col.id} column={col} cards={col.cards} />
            ))}
          </SortableContext>

          {/* Add Column Button */}
          <div className="w-[300px] flex-shrink-0">
            {isAddingCol ? (
              <form onSubmit={handleAddColumn} className="bg-muted/30 p-2 rounded-xl border space-y-2">
                <Input 
                  autoFocus 
                  value={newColTitle} 
                  onChange={e => setNewColTitle(e.target.value)} 
                  placeholder="Column title..." 
                  className="h-8 shadow-none" 
                />
                <div className="flex gap-2">
                  <Button size="sm" type="submit" className="flex-1 h-8">Add</Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingCol(false)} className="flex-1 h-8">Cancel</Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" className="w-full h-12 border-dashed bg-muted/20 hover:bg-muted/50 transition-colors" onClick={() => setIsAddingCol(true)}>
                + Add another column
              </Button>
            )}
          </div>

          {/* Drag Overlay Render */}
          {createPortal(
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
              {activeColumn && <KanbanColumn column={activeColumn} cards={activeColumn.cards} />}
              {activeCard && <KanbanCard card={activeCard} />}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>
    </div>
  );

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === "Card") {
      setActiveCard(event.active.data.current.card);
      return;
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return;

    const isActiveCard = active.data.current?.type === "Card";
    const isOverCard = over.data.current?.type === "Card";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveCard) return;

    // Moving a card to another column (visually, before drop)
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = active.data.current?.card.column_id;
    let overColumnId = isOverColumn ? overId : over.data.current?.card.column_id;

    if (!overColumnId || activeColumnId === overColumnId) return;

    const newCols = [...board!.columns];
    const activeColIdx = newCols.findIndex(c => c.id === activeColumnId);
    const overColIdx = newCols.findIndex(c => c.id === overColumnId);

    const activeCardData = newCols[activeColIdx].cards.find(c => c.id === activeId);
    if (!activeCardData) return;

    // Remove from source conceptually
    newCols[activeColIdx] = { ...newCols[activeColIdx], cards: newCols[activeColIdx].cards.filter(c => c.id !== activeId) };
    
    // Add to target conceptually
    const overCardIdx = isOverCard ? newCols[overColIdx].cards.findIndex(c => c.id === overId) : newCols[overColIdx].cards.length;
    const newTargetCards = [...newCols[overColIdx].cards];
    newTargetCards.splice(overCardIdx, 0, { ...activeCardData, column_id: overColumnId });
    newCols[overColIdx] = { ...newCols[overColIdx], cards: newTargetCards };

    setColumns(newCols);
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const isActiveCard = active.data.current?.type === "Card";
    const activeId = active.id as string;
    const overId = over.id as string;

    if (isActiveCard) {
      if (activeId === overId) return;
      
      const newCols = [...board!.columns];
      const overColumnId = over.data.current?.type === "Column" ? overId : over.data.current?.card.column_id;
      
      const targetColIdx = newCols.findIndex(c => c.id === overColumnId);
      if (targetColIdx === -1) return;

      const targetCards = [...newCols[targetColIdx].cards];
      const activeIdx = targetCards.findIndex(c => c.id === activeId);
      let overIdx = targetCards.findIndex(c => c.id === overId);
      
      if (over.data.current?.type === "Column") {
         overIdx = targetCards.length - 1; 
      }

      const finalCards = arrayMove(targetCards, activeIdx, overIdx);
      newCols[targetColIdx] = { ...newCols[targetColIdx], cards: finalCards };
      
      // Calculate float mid-point position
      let newPosition = 65536.0;
      if (finalCards.length > 1) {
        if (overIdx === 0) {
          newPosition = finalCards[1].position / 2;
        } else if (overIdx === finalCards.length - 1) {
          newPosition = finalCards[finalCards.length - 2].position + 65536.0;
        } else {
          newPosition = (finalCards[overIdx - 1].position + finalCards[overIdx + 1].position) / 2;
        }
      }

      // Optimistically update
      finalCards[overIdx] = { ...finalCards[overIdx], position: newPosition, column_id: overColumnId };
      setColumns(newCols);

      try {
        await api.patch(`/cards/${activeId}`, { position: newPosition, column_id: overColumnId });
      } catch {
        toast.error("Failed to sync card movement");
        fetchBoard(); // Rollback
      }
    }

    const isActiveColumn = active.data.current?.type === "Column";
    if (isActiveColumn) {
      if (activeId === overId) return;
      const oldIndex = board.columns.findIndex((col) => col.id === activeId);
      const newIndex = board.columns.findIndex((col) => col.id === overId);
      const newColumns = arrayMove(board.columns, oldIndex, newIndex);

      let newPosition = 65536.0;
      if (newColumns.length > 1) {
        if (newIndex === 0) {
          newPosition = newColumns[1].position / 2;
        } else if (newIndex === newColumns.length - 1) {
          newPosition = newColumns[newColumns.length - 2].position + 65536.0;
        } else {
          newPosition = (newColumns[newIndex - 1].position + newColumns[newIndex + 1].position) / 2;
        }
      }
      
      newColumns[newIndex] = { ...newColumns[newIndex], position: newPosition };
      setColumns(newColumns);

      try {
        await api.patch(`/columns/${activeId}`, { position: newPosition });
      } catch {
        toast.error("Failed to sync column movement");
        fetchBoard(); // Rollback
      }
    }
  }
}
