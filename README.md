# TaskFlow - Kanban Management System

TaskFlow is a modern, full-stack Kanban board management application designed for speed and simplicity. It allows users to create boards, manage columns, and seamlessly drag-and-drop cards to track their tasks.

## 🚀 Features

- **User Authentication:** Secure JWT-based authentication with bcrypt password hashing.
- **Board Management:** Create, view, and manage multiple Kanban boards. Includes a dashboard with task statistics.
- **Fluid Drag-and-Drop:** Intuitive card and column reordering using `@dnd-kit`.
- **Floating-point Positioning:** Efficient sorting and reordering using midpoint calculations, avoiding heavy database updates.
- **Real-time Optimistic Updates:** The frontend updates instantly while syncing with the backend in the background.
- **Mobile Optimized:** Responsive design with smooth scrolling and touch-friendly drag-and-drop interactions.

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** PostgreSQL with AsyncPG
- **ORM:** SQLAlchemy 2.0 (Async)
- **Migrations:** Alembic
- **Authentication:** JWT (`python-jose`), `bcrypt`

### Frontend
- **Framework:** Next.js (React 19)
- **Styling:** Tailwind CSS (v4) & CSS Variables
- **UI Components:** Shadcn UI, Base UI, Lucide React
- **State Management:** Zustand
- **Drag-and-Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Data Fetching:** Axios

## 📦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database

### 1. Backend Setup

Navigate to the root directory and set up your Python environment:

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the root directory based on your PostgreSQL setup:
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/taskflow
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Run database migrations (if alembic is initialized) or let the app create tables on startup (dev convenience):
```bash
# Start the FastAPI server
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`. You can view the interactive Swagger documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

Navigate to the `frontend` directory:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

## 🏗️ Architecture Notes

### Drag and Drop Ordering
TaskFlow uses a **LexoRank-style floating point position system** for ordering items. 
Instead of updating the `position` of every subsequent card when a card is moved, the moved card is simply assigned a `position` value exactly halfway between the card above it and the card below it. This ensures fast, `O(1)` database updates on drag-and-drop operations.

## 📄 License
This project is licensed under the MIT License.
