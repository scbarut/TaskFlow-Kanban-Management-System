"""
Column routes — create, update, and delete columns within a board.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Board, Column, User
from app.schemas import ColumnCreate, ColumnRead, ColumnUpdate

router = APIRouter(tags=["columns"])


async def _verify_board_ownership(
    board_id: uuid.UUID, user: User, db: AsyncSession
) -> Board:
    """Ensure the board exists and belongs to the current user."""
    result = await db.execute(
        select(Board).where(Board.id == board_id, Board.owner_id == user.id)
    )
    board = result.scalar_one_or_none()
    if board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    return board


async def _next_position(db: AsyncSession, board_id: uuid.UUID) -> float:
    """Calculate the next position value for a new column in the board."""
    result = await db.execute(
        select(func.max(Column.position)).where(Column.board_id == board_id)
    )
    max_pos = result.scalar()
    return (max_pos or 0) + 65536.0


@router.post(
    "/boards/{board_id}/columns",
    response_model=ColumnRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_column(
    board_id: uuid.UUID,
    payload: ColumnCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new column to a board."""
    await _verify_board_ownership(board_id, current_user, db)

    position = payload.position if payload.position is not None else await _next_position(db, board_id)

    column = Column(title=payload.title, board_id=board_id, position=position)
    db.add(column)
    await db.flush()
    await db.refresh(column)
    return column


@router.patch("/columns/{column_id}", response_model=ColumnRead)
async def update_column(
    column_id: uuid.UUID,
    payload: ColumnUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a column's title or position."""
    result = await db.execute(select(Column).where(Column.id == column_id))
    column = result.scalar_one_or_none()
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found")

    # Verify ownership through the parent board
    await _verify_board_ownership(column.board_id, current_user, db)

    if payload.title is not None:
        column.title = payload.title
    if payload.position is not None:
        column.position = payload.position

    await db.flush()
    await db.refresh(column)
    return column


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    column_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a column and all its cards (cascade)."""
    result = await db.execute(select(Column).where(Column.id == column_id))
    column = result.scalar_one_or_none()
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found")

    await _verify_board_ownership(column.board_id, current_user, db)

    await db.delete(column)
    await db.flush()
