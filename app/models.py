"""
SQLAlchemy ORM models for TaskFlow.

All primary keys use UUID.  Position fields use Float for midpoint-based reordering.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)
    role_title: Mapped[str] = mapped_column(String(50), default="member", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    boards: Mapped[list["Board"]] = relationship(back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship(back_populates="boards")
    columns: Mapped[list["Column"]] = relationship(
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="Column.position",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Board {self.title}>"


class Column(Base):
    __tablename__ = "columns"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    board_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[float] = mapped_column(Float, default=65536.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    board: Mapped["Board"] = relationship(back_populates="columns")
    cards: Mapped[list["Card"]] = relationship(
        back_populates="column",
        cascade="all, delete-orphan",
        order_by="Card.position",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Column {self.title}>"


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    column_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("columns.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[float] = mapped_column(Float, default=65536.0, nullable=False)
    labels: Mapped[list[str] | None] = mapped_column(ARRAY(String(50)), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    column: Mapped["Column"] = relationship(back_populates="cards")

    def __repr__(self) -> str:
        return f"<Card {self.title}>"
