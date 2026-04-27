"""
TaskFlow — Kanban Management System

Entry point for the FastAPI application.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base
from app.routes import auth, boards, cards, columns


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup (dev convenience)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="TaskFlow",
    description="A Trello-like Kanban board management API",
    version="1.0.0",
    lifespan=lifespan,
)

import os

# CORS — open for development; lock down for production
allowed_origins = [
    "http://localhost:3000",
]

# Add production frontend URL if provided
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router)
app.include_router(boards.router)
app.include_router(columns.router)
app.include_router(cards.router)


@app.get("/", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "TaskFlow"}
