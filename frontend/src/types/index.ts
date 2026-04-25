export interface Card {
  id: string;
  title: string;
  description: string | null;
  column_id: string;
  position: number;
  labels: string[] | null;
  due_date: string | null;
  color: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface Column {
  id: string;
  title: string;
  board_id: string;
  position: number;
  created_at: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
  columns: Column[];
}

export interface BoardWithStats {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
  remaining_tasks: number;
  completion_percent: number;
  column_count: number;
}
