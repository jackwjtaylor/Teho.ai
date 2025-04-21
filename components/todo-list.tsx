"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { Todo, Comment } from "@/lib/types"
import TodoItem from "./todo-item"

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onAddComment: (todoId: string, comment: Comment) => void
}

export default function TodoList({ todos, onToggle, onDelete, onAddComment }: TodoListProps) {
  if (todos.length === 0) {
    return <div className="text-center text-gray-500 mt-8 text-[15px]">No todos yet. Add one above.</div>
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {todos.map((todo) => (
          <motion.div
            key={todo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TodoItem todo={todo} onToggle={onToggle} onDelete={onDelete} onAddComment={onAddComment} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
