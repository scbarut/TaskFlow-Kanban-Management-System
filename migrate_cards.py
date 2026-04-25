"""One-time migration: add metadata columns to the cards table."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/kanban_v2"

async def migrate():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE cards ADD COLUMN IF NOT EXISTS labels TEXT[]"))
        await conn.execute(text("ALTER TABLE cards ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ"))
        await conn.execute(text("ALTER TABLE cards ADD COLUMN IF NOT EXISTS color VARCHAR(7)"))
        await conn.execute(text("ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE NOT NULL"))
    await engine.dispose()
    print("Migration complete!")

asyncio.run(migrate())
