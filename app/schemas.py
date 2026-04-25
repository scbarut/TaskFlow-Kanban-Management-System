"""
Pydantic v2 schemas for request validation and response serialization.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    role_title: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Board ─────────────────────────────────────────────────────────────────────


class BoardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class BoardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    owner_id: uuid.UUID
    created_at: datetime
    columns: list["ColumnRead"] = []


class BoardListItem(BaseModel):
    """Lightweight board representation for list endpoints (no nested columns)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    owner_id: uuid.UUID
    created_at: datetime


class BoardWithStats(BaseModel):
    """Board summary with task statistics for dashboard view."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    owner_id: uuid.UUID
    created_at: datetime
    total_tasks: int = 0
    completed_tasks: int = 0
    remaining_tasks: int = 0
    completion_percent: int = 0
    column_count: int = 0


# ── Column ────────────────────────────────────────────────────────────────────


class ColumnCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    position: float | None = None


class ColumnUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    position: float | None = None


class ColumnRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    board_id: uuid.UUID
    position: float
    created_at: datetime
    cards: list["CardRead"] = []


# ── Card ──────────────────────────────────────────────────────────────────────


class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    position: float | None = None
    labels: list[str] | None = None
    due_date: datetime | None = None
    color: str | None = Field(default=None, max_length=7)
    is_completed: bool = False


class CardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    position: float | None = None
    column_id: uuid.UUID | None = None  # allows cross-column moves
    labels: list[str] | None = None
    due_date: datetime | None = None
    color: str | None = Field(default=None, max_length=7)
    is_completed: bool | None = None


class CardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    column_id: uuid.UUID
    position: float
    labels: list[str] | None
    due_date: datetime | None
    color: str | None
    is_completed: bool
    created_at: datetime


# Rebuild forward refs for nested models
BoardRead.model_rebuild()
ColumnRead.model_rebuild()
