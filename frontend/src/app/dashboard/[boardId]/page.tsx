import KanbanBoard from "@/components/kanban/KanbanBoard";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return <KanbanBoard boardId={boardId} />;
}
