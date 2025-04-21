import type { Todo } from "@/lib/types"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  // This is a simple function that could be enhanced with a date parsing library
  // For now, we'll just return the string as is
  return dateString
}

interface OldTodoFormat {
  id: string
  text: string
  date: string
  urgency: number
  completed: boolean
  createdAt: string
  comments: any[]
}

export function convertOldTodoFormat(oldTodo: OldTodoFormat): Todo {
  return {
    id: oldTodo.id,
    title: oldTodo.text,
    completed: oldTodo.completed,
    userId: 'local', // Default to local for old todos
    createdAt: new Date(oldTodo.createdAt),
    updatedAt: new Date(oldTodo.createdAt), // Use createdAt as updatedAt since it wasn't tracked before
    comments: oldTodo.comments,
    dueDate: oldTodo.date,
    urgency: oldTodo.urgency
  }
}
