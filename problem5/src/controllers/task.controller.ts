import { Request, Response } from "express";
import { db } from "../db";
import { Task } from "../models/task.model";

/**
 * CREATE
 */
export const createTask = async (req: Request, res: Response) => {
  const { title, description } = req.body;

  const result = await db.run(
    "INSERT INTO tasks (title, description) VALUES (?, ?)",
    [title, description]
  );

  const task = await db.get<Task>(
    "SELECT * FROM tasks WHERE id = ?",
    result.lastID
  );

  res.status(201).json(task);
};

/**
 * LIST with basic filters
 */
export const listTasks = async (req: Request, res: Response) => {
  const { completed } = req.query;

  let query = "SELECT * FROM tasks";
  const params: any[] = [];

  if (completed !== undefined) {
    query += " WHERE completed = ?";
    params.push(completed === "true" ? 1 : 0);
  }

  const tasks = await db.all<Task[]>(query, params);
  res.json(tasks);
};

/**
 * GET by ID
 */
export const getTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  const task = await db.get<Task>(
    "SELECT * FROM tasks WHERE id = ?",
    id
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(task);
};

/**
 * UPDATE
 */
export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;

  await db.run(
    `UPDATE tasks
     SET title = ?, description = ?, completed = ?
     WHERE id = ?`,
    [title, description, completed ? 1 : 0, id]
  );

  const updatedTask = await db.get<Task>(
    "SELECT * FROM tasks WHERE id = ?",
    id
  );

  res.json(updatedTask);
};

/**
 * DELETE
 */
export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  await db.run("DELETE FROM tasks WHERE id = ?", id);

  res.status(204).send();
};