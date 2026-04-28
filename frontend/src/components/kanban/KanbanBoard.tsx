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
  TouchSensor,
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent, 
  defaultDropAnimationSideEffects,
  closestCenter,
  CollisionDetection
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronLeft, LayoutGrid, Plus } from "lucide-react";

import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function KanbanBoard({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { isAuthenticated } = useStore();
  const { board, setBoard, setColumns } = useBoardStore();
  
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
  
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires minimum 5px movement to start drag (allows clicking buttons/inputs inside)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Allow scrolling on touch devices without triggering drag
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!boardId || boardId === "undefined") return;
    fetchBoard();
  }, [boardId, isAuthenticated, isHydrated]);

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

  if (!isHydrated || loading || !board) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        <div className="px-6 py-4 flex items-center gap-4 border-b border-border/50 bg-background shrink-0">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex-1 p-6 flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[300px] flex-shrink-0 rounded-xl border border-transparent bg-secondary/20 p-4 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-container_padding min-h-[calc(100vh-56px)] flex flex-col overflow-hidden bg-background">
      {/* Board Header Context */}
      <div className="flex items-center justify-between mb-3 sm:mb-lg shrink-0">
        <div className="flex items-center gap-2 sm:gap-md min-w-0">
          <Link 
            href="/dashboard"
            className="inline-flex items-center justify-center shrink-0 h-10 w-10 min-w-[40px] text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-xl transition-colors duration-300"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>
          <div className="min-w-0">
            <h1 className="font-h1 text-h1 text-on-surface truncate">{board.title}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs hidden sm:block">Manage your tasks and track deliverables seamlessly.</p>
          </div>
        </div>
      </div>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto board-scroll pb-md relative -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-start gap-3 sm:gap-lg h-full flex-nowrap">
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
            {board.columns.map((col) => (
              <KanbanColumn key={col.id} column={col} cards={col.cards} />
            ))}

            {/* Empty state when no columns */}
            {board.columns.length === 0 && !isAddingCol && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="rounded-2xl border border-border/40 bg-card p-10 shadow-xl shadow-primary/5 flex flex-col items-center max-w-[448px] w-full mt-[-4rem]">
                  <div className="bg-primary/10 p-5 rounded-full mb-6">
                    <LayoutGrid className="size-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">No columns yet</h3>
                  <p className="text-sm text-muted-foreground mb-8 text-center px-4">
                    Get started by creating your first column to organize your team's workflow.
                  </p>
                  <Button onClick={() => setIsAddingCol(true)} size="lg" className="rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 px-8">
                    <Plus className="mr-2 size-4" /> Create your first column
                  </Button>
                </div>
              </div>
            )}
          </SortableContext>

          {/* Add Column Button */}
          {(board.columns.length > 0 || isAddingCol) && (
            <div className="w-[85vw] sm:w-[280px] shrink-0 flex flex-col">
              {isAddingCol ? (
                <form onSubmit={handleAddColumn} className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30 shadow-md space-y-3">
                  <Input 
                    autoFocus 
                    value={newColTitle} 
                    onChange={e => setNewColTitle(e.target.value)} 
                    placeholder="Column title..." 
                    className="h-9 shadow-none bg-surface border-outline-variant focus-visible:ring-primary font-body-md text-body-md" 
                  />
                  <div className="flex gap-2">
                    <Button size="sm" type="submit" className="flex-1 h-8 font-label-md text-label-md transition-all duration-300 bg-primary text-[#ffffff]">Add Column</Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingCol(false)} className="flex-1 h-8 font-label-md text-label-md transition-all duration-300 text-on-surface-variant">Cancel</Button>
                  </div>
                </form>
              ) : (
                <button className="flex items-center gap-xs px-md py-sm bg-surface-container-lowest/50 border border-outline-variant border-dashed text-on-surface-variant font-body-md text-body-md font-medium rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors w-full justify-center" onClick={() => setIsAddingCol(true)}>
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Add Column
                </button>
              )}
            </div>
          )}

          {/* Drag Overlay Render */}
          {createPortal(
            <DragOverlay 
              className="z-[9999]"
              dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}
            >
              {activeColumn && <KanbanColumn column={activeColumn} cards={activeColumn.cards} isOverlay />}
              {activeCard && <KanbanCard card={activeCard} isOverlay />}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
        </div>
      </div>
    </div>
  );

  function customCollisionDetection(args: Parameters<CollisionDetection>[0]) {
    const { active, droppableContainers } = args;
    
    // If dragging a column, only detect collisions with other columns
    if (active.data.current?.type === "Column") {
      const columnContainers = droppableContainers.filter(
        (c) => c.data.current?.type === "Column"
      );
      return closestCorners({
        ...args,
        droppableContainers: columnContainers,
      });
    }
    
    // Default to closestCorners for cards
    return closestCorners(args);
  }

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

    // Use fresh state to avoid any stale closures during fast drag-and-drops
    const currentBoard = useBoardStore.getState().board;
    if (!currentBoard) return;

    const isActiveCard = active.data.current?.type === "Card";
    const activeId = active.id as string;
    const overId = over.id as string;

    if (isActiveCard) {
      if (activeId === overId) return;
      
      const newCols = [...currentBoard.columns];
      const overColumnId = over.data.current?.type === "Column" ? overId : over.data.current?.card.column_id;
      
      const targetColIdx = newCols.findIndex(c => c.id === overColumnId);
      if (targetColIdx === -1) return;

      const targetCards = [...newCols[targetColIdx].cards];
      const activeIdx = targetCards.findIndex(c => c.id === activeId);
      let overIdx = targetCards.findIndex(c => c.id === overId);
      
      if (over.data.current?.type === "Column") {
         overIdx = targetCards.length - 1; 
      }

      // If dragging failed to sync to the store yet, safely fallback
      if (activeIdx === -1 || overIdx === -1) return;

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
      
      const targetColId = over.data.current?.type === "Column" ? overId : over.data.current?.card.column_id;
      const oldIndex = currentBoard.columns.findIndex((col) => col.id === activeId);
      const newIndex = currentBoard.columns.findIndex((col) => col.id === targetColId);
      
      if (oldIndex === -1 || newIndex === -1) return;

      const newColumns = arrayMove(currentBoard.columns, oldIndex, newIndex);

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
