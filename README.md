# Question Management System

A full-stack application for managing questions with user authentication.

## Project Structure

- `frontend/`: React frontend application
- `server/`: Node.js server that handles authentication and proxies requests to FastAPI
- `database.py`, `models.py`, `main.py`: FastAPI backend for database interactions

## Features

- User authentication (login/register)
- CRUD operations for questions
- Responsive UI design
- Secure API endpoints

## Prerequisites

- Node.js and npm
- Python 3.7+
- MySQL database

## Environment Variables

Create a `.env` file in the project root with the following:

```
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
```

Create a `.env` file in the `server/` directory with:

```
PORT=5000
FASTAPI_URL=http://localhost:8000
JWT_SECRET=your_jwt_secret
```

## Setup and Installation

### Database Setup

1. Create a MySQL database called `tryfast` (or your preferred name)
2. Update the `.env` file with your database credentials

### FastAPI Backend

1. Create a virtual environment and activate it:
   ```
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install fastapi uvicorn sqlalchemy pymysql python-dotenv
   ```

3. Start the FastAPI server:
   ```
   uvicorn main:app --reload --port 8000
   ```

### Node.js Server

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the Node.js server:
   ```
   npm run dev
   ```

### React Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```

## Usage

1. Visit `http://localhost:3000` in your browser
2. Register a new user or login with existing credentials
3. Navigate to Questions page to view, add, edit, or delete questions

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with credentials

### Questions
- `GET /api/questions`: Get all questions
- `GET /api/questions/:id`: Get question by ID
- `POST /api/questions`: Create a new question
- `PUT /api/questions/:id`: Update an existing question
- `DELETE /api/questions/:id`: Delete a question

## License

MIT 