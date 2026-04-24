"""
Board routes — list, create, and detail (with nested columns/cards).
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Board, User
from app.schemas import BoardCreate, BoardListItem, BoardRead

router = APIRouter(prefix="/boards", tags=["boards"])


@router.get("", response_model=list[BoardListItem])
async def list_boards(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all boards owned by the authenticated user."""
    result = await db.execute(
        select(Board).where(Board.owner_id == current_user.id).order_by(Board.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=BoardListItem, status_code=status.HTTP_201_CREATED)
async def create_board(
    payload: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new board for the authenticated user."""
    board = Board(title=payload.title, owner_id=current_user.id)
    db.add(board)
    await db.flush()
    await db.refresh(board)
    return board


@router.get("/{board_id}", response_model=BoardRead)
async def get_board(
    board_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return a single board with all its columns and cards.
    Columns are sorted by position; cards within each column are sorted by position.
    (Ordering is handled by the ORM relationship `order_by`.)
    """
    result = await db.execute(
        select(Board).where(Board.id == board_id, Board.owner_id == current_user.id)
    )
    board = result.scalar_one_or_none()
    if board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    return board
