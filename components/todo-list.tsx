"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { Todo, Comment } from "@/lib/types"
import TodoItem from "./todo-item"

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onAddComment: (todoId: string, comment: Comment) => void
  onDeleteComment: (todoId: string, commentId: string) => void
}

export default function TodoList({ todos, onToggle, onDelete, onAddComment, onDeleteComment }: TodoListProps) {
  if (todos.length === 0) {
    return null; // We're handling the empty state in the parent component now
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
      <AnimatePresence>
        {todos.map((todo) => (
          <motion.div
            key={todo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TodoItem 
              todo={todo} 
              onToggle={onToggle} 
              onDelete={onDelete} 
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
