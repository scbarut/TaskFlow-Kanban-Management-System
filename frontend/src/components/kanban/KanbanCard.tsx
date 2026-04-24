import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardType } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings2, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useBoardStore } from "@/lib/boardStore";

interface KanbanCardProps {
  card: CardType;
}

export default function KanbanCard({ card }: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description || "");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { board, setBoard } = useBoardStore();

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: isEditing, // Disable dragging while editing
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleUpdate = async () => {
    try {
      const res = await api.patch(`/cards/${card.id}`, {
        title: editTitle,
        description: editDesc,
      });
      
      // Update store locally
      if (board) {
        const newCols = board.columns.map(col => {
          if (col.id === card.column_id) {
            return {
              ...col,
              cards: col.cards.map(c => c.id === card.id ? res.data : c)
            };
          }
          return col;
        });
        setBoard({ ...board, columns: newCols });
      }
      
      setIsEditing(false);
      toast.success("Card updated");
    } catch {
      toast.error("Failed to update card");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/cards/${card.id}`);
      
      // Update store locally
      if (board) {
        const newCols = board.columns.map(col => {
          if (col.id === card.column_id) {
            return {
              ...col,
              cards: col.cards.filter(c => c.id !== card.id)
            };
          }
          return col;
        });
        setBoard({ ...board, columns: newCols });
      }
      
      toast.success("Card deleted");
    } catch {
      toast.error("Failed to delete card");
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div ref={setNodeRef} style={style} className="group relative">
      <Card className="hover:ring-2 hover:ring-primary/50 transition-all shadow-sm">
        {/* Drag handle covers the card but sits behind interactive elements */}
        <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab touch-manipulation rounded-[inherit]" />
        <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0 relative">
          <CardTitle className="text-sm font-semibold truncate pr-6">{card.title}</CardTitle>
          
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTitle(card.title);
                    setEditDesc(card.description || "");
                  }}
                >
                  <Settings2 className="size-3.5" />
                </Button>
              }
            />
            <DialogContent onPointerDown={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Edit Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} />
                </div>
              </div>
              <DialogFooter className="flex justify-between items-center sm:justify-between">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="size-4 mr-2" /> Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleUpdate}>Save Changes</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        {card.description && (
          <CardContent className="p-3 pt-1 text-xs text-muted-foreground line-clamp-2 relative">
            {card.description}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
