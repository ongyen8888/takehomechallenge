# Express TypeScript CRUD API

A simple CRUD backend built with ExpressJS + TypeScript + SQLite.

## Features

- Create a task
- List tasks (filter by completed)
- Get task by ID
- Update task
- Delete task
- SQLite persistence

---

## Installation

```bash
git clone <repo>
cd express-ts-crud
npm install
```

---

## Run in Development

```bash
npm run dev
```

Server runs at:

```
http://localhost:3000
```

---

## Build for Production

```bash
npm run build
npm start
```

---

## API Endpoints

### Create Task
POST /tasks

```json
{
  "title": "Learn TypeScript",
  "description": "Study advanced types"
}
```

### List Tasks
GET /tasks  
Optional filter:
```
GET /tasks?completed=true
```

### Get Task
GET /tasks/:id

### Update Task
PUT /tasks/:id

```json
{
  "title": "Updated title",
  "description": "Updated desc",
  "completed": true
}
```

### Delete Task
DELETE /tasks/:id

---

## Database

- SQLite file: `database.sqlite`
- Automatically created on first run.

---

## Tech Stack

- Node.js
- ExpressJS
- TypeScript
- SQLite