"use client"

import { useState, useEffect } from "react"
import TodoInput from "@/components/todo-input"
import TodoList from "@/components/todo-list"
import ThemeToggle from "@/components/theme-toggle"
import CompletedToggle from "@/components/completed-toggle"
import type { Todo, Comment } from "@/lib/types"

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [showCompleted, setShowCompleted] = useState(true)

  // Load todos from localStorage on initial render
  useEffect(() => {
    const storedTodos = localStorage.getItem("todos")
    if (storedTodos) {
      try {
        const parsedTodos = JSON.parse(storedTodos)
        // Convert string dates back to Date objects
        const todosWithDates = parsedTodos.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          comments: todo.comments.map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
          })),
        }))
        setTodos(todosWithDates)
      } catch (error) {
        console.error("Failed to parse todos from localStorage", error)
      }
    }
  }, [])

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])

  const addTodo = (todo: Todo) => {
    setTodos((prev) => [...prev, todo])
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  const addComment = (todoId: string, comment: Comment) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === todoId ? { ...todo, comments: [...todo.comments, comment] } : todo)),
    )
  }

  // Filter todos based on showCompleted state
  const filteredTodos = showCompleted ? todos : todos.filter((todo) => !todo.completed)

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-[#09090B] text-gray-900 dark:text-white p-4 transition-colors duration-200">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <CompletedToggle showCompleted={showCompleted} setShowCompleted={setShowCompleted} />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md mt-8">
        <TodoInput onAddTodo={addTodo} />
        <TodoList todos={filteredTodos} onToggle={toggleTodo} onDelete={deleteTodo} onAddComment={addComment} />
      </div>
    </div>
  )
}
