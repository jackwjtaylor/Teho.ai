"use client"

import { useState, useEffect } from "react"
import TodoInput from "@/components/todo-input"
import TodoList from "@/components/todo-list"
import ThemeToggle from "@/components/theme-toggle"
import CompletedToggle from "@/components/completed-toggle"
import LoginButton from "@/components/LoginButton"
import type { Todo, Comment } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "@/lib/auth-client"

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [showCompleted, setShowCompleted] = useState(true)
  const { data: session } = useSession()

  // Load todos from localStorage first, then sync with server if logged in
  useEffect(() => {
    const localTodos = localStorage.getItem('todos')
    if (localTodos) {
      setTodos(JSON.parse(localTodos))
    }

    if (session?.user) {
      fetch('/api/todos')
        .then(res => res.json())
        .then(data => {
          setTodos(data)
          localStorage.setItem('todos', JSON.stringify(data))
        })
        .catch(error => console.error('Failed to fetch todos:', error))
    }
  }, [session])

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = async (todo: Todo) => {
    const newTodo = {
      ...todo,
      comments: [],
      userId: session?.user?.id || 'local',
    }

    setTodos(prev => [...prev, newTodo])

    if (session?.user) {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: todo.title,
          dueDate: todo.dueDate,
          urgency: todo.urgency
        }),
      })
        const serverTodo = await res.json()
        setTodos(prev => prev.map(t => t.id === newTodo.id ? { ...serverTodo, comments: [] } : t))
    } catch (error) {
      console.error('Failed to add todo:', error)
      }
    }
  }

  const toggleTodo = async (id: string) => {
    const todoToUpdate = todos.find(t => t.id === id)
    if (!todoToUpdate) return

    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed, updatedAt: new Date() } : todo
    ))

    if (session?.user) {
    try {
      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !todoToUpdate.completed }),
      })
      const updatedTodo = await res.json()
      setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo))
    } catch (error) {
      console.error('Failed to toggle todo:', error)
      }
    }
  }

  const deleteTodo = async (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))

    if (session?.user) {
    try {
      await fetch('/api/todos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch (error) {
      console.error('Failed to delete todo:', error)
      }
    }
  }

  const addComment = async (todoId: string, comment: Comment) => {
    const newComment = {
      ...comment,
      user: session?.user ? {
        name: session.user.name || 'User',
        image: null
      } : {
        name: 'Local User',
        image: null
      }
    }

    setTodos(prev =>
      prev.map(todo => todo.id === todoId ? {
        ...todo,
        comments: [...todo.comments, newComment]
      } : todo)
    )

    if (session?.user) {
    try {
      const res = await fetch('/api/todos/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, text: comment.text }),
      })
        const serverComment = await res.json()
      setTodos(prev =>
        prev.map(todo => todo.id === todoId ? {
          ...todo,
            comments: todo.comments.map(c => 
              c.id === newComment.id ? { ...serverComment, createdAt: new Date(serverComment.createdAt) } : c
            )
        } : todo)
      )
    } catch (error) {
      console.error('Failed to add comment:', error)
      }
    }
  }

  const deleteComment = async (todoId: string, commentId: string) => {
    setTodos(prev =>
      prev.map(todo => todo.id === todoId ? {
        ...todo,
        comments: todo.comments.filter(c => c.id !== commentId)
      } : todo)
    )

    if (session?.user) {
      try {
        await fetch('/api/todos/comments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ todoId, commentId }),
        })
      } catch (error) {
        console.error('Failed to delete comment:', error)
      }
    }
  }

  // Filter todos based on showCompleted state
  const filteredTodos = showCompleted ? todos : todos.filter(todo => !todo.completed)

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-[#09090B] text-gray-900 dark:text-white p-4 transition-colors duration-200">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <CompletedToggle showCompleted={showCompleted} setShowCompleted={setShowCompleted} />
        <ThemeToggle />
        <LoginButton />
      </div>

      <motion.div
        layout
        className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div
          layout="position"
          className={`w-full ${filteredTodos.length === 0 ? 'flex-1 flex items-center justify-center' : 'mt-8'}`}
        >
          <motion.div
            layout="preserve-aspect"
            className={`${filteredTodos.length === 0 ? 'w-full max-w-md' : 'w-full sticky top-4 z-10 mb-8'}`}
          >
            <TodoInput onAddTodo={addTodo} />
          </motion.div>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {filteredTodos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TodoList 
                todos={filteredTodos} 
                onToggle={toggleTodo} 
                onDelete={deleteTodo} 
                onAddComment={addComment}
                onDeleteComment={deleteComment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
