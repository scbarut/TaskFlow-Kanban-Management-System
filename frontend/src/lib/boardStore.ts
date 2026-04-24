import { create } from "zustand";
import { Board, Column, Card } from "@/types";

interface BoardState {
  board: Board | null;
  setBoard: (board: Board) => void;
  // Replaces the whole columns array (easier to compute in the component and pass here)
  setColumns: (columns: Column[]) => void;
  addColumn: (column: Column) => void;
  addCard: (card: Card) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  setBoard: (board) => set({ board }),
  setColumns: (columns) =>
    set((state) => {
      if (!state.board) return state;
      return { board: { ...state.board, columns } };
    }),
  addColumn: (column) =>
    set((state) => {
      if (!state.board) return state;
      const columns = [...state.board.columns, column].sort(
        (a, b) => a.position - b.position
      );
      return { board: { ...state.board, columns } };
    }),
  addCard: (card) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => {
        if (col.id === card.column_id) {
          return {
            ...col,
            cards: [...col.cards, card].sort((a, b) => a.position - b.position),
          };
        }
        return col;
      });
      return { board: { ...state.board, columns } };
    }),
}));
