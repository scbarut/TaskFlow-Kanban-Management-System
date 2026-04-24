"""
Card routes — create, update, and delete cards within a column.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Board, Card, Column, User
from app.schemas import CardCreate, CardRead, CardUpdate

router = APIRouter(tags=["cards"])


async def _verify_column_ownership(
    column_id: uuid.UUID, user: User, db: AsyncSession
) -> Column:
    """Ensure the column exists and its parent board belongs to the current user."""
    result = await db.execute(select(Column).where(Column.id == column_id))
    column = result.scalar_one_or_none()
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found")

    # Verify board ownership
    board_result = await db.execute(
        select(Board).where(Board.id == column.board_id, Board.owner_id == user.id)
    )
    if board_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found")

    return column


async def _next_card_position(db: AsyncSession, column_id: uuid.UUID) -> float:
    """Calculate the next position value for a new card in the column."""
    result = await db.execute(
        select(func.max(Card.position)).where(Card.column_id == column_id)
    )
    max_pos = result.scalar()
    return (max_pos or 0) + 65536.0


@router.post(
    "/columns/{column_id}/cards",
    response_model=CardRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_card(
    column_id: uuid.UUID,
    payload: CardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new card to a column."""
    await _verify_column_ownership(column_id, current_user, db)

    position = payload.position if payload.position is not None else await _next_card_position(db, column_id)

    card = Card(
        title=payload.title,
        description=payload.description,
        column_id=column_id,
        position=position,
    )
    db.add(card)
    await db.flush()
    await db.refresh(card)
    return card


@router.patch("/cards/{card_id}", response_model=CardRead)
async def update_card(
    card_id: uuid.UUID,
    payload: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a card's title, description, position, or move it to another column.
    To move a card to a different column, pass `column_id` with the target column's UUID.
    """
    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.scalar_one_or_none()
    if card is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    # Verify ownership through current column → board chain
    await _verify_column_ownership(card.column_id, current_user, db)

    # If moving to a new column, verify ownership of the target column too
    if payload.column_id is not None and payload.column_id != card.column_id:
        await _verify_column_ownership(payload.column_id, current_user, db)
        card.column_id = payload.column_id

    if payload.title is not None:
        card.title = payload.title
    if payload.description is not None:
        card.description = payload.description
    if payload.position is not None:
        card.position = payload.position

    await db.flush()
    await db.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
    card_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a card."""
    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.scalar_one_or_none()
    if card is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    await _verify_column_ownership(card.column_id, current_user, db)

    await db.delete(card)
    await db.flush()
