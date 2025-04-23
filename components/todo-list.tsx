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
  onReschedule: (id: string, newDate: string) => void
}

export default function TodoList({ todos, onToggle, onDelete, onAddComment, onDeleteComment, onReschedule }: TodoListProps) {
  if (todos.length === 0) {
    return null;
  }

  // Split todos into columns
  const getColumnTodos = (columnIndex: number, columnCount: number) => {
    return todos.filter((_, index) => index % columnCount === columnIndex);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Mobile: Single Column */}
      <div className="flex flex-col gap-4 w-full md:hidden">
        <AnimatePresence mode="popLayout">
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TodoItem 
                todo={todo} 
                onToggle={onToggle} 
                onDelete={onDelete} 
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onReschedule={onReschedule}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Tablet: Two Columns */}
      <div className="hidden md:flex lg:hidden gap-4 w-full">
        {[0, 1].map((columnIndex) => (
          <div key={columnIndex} className="flex-1 flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {getColumnTodos(columnIndex, 2).map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TodoItem 
                    todo={todo} 
                    onToggle={onToggle} 
                    onDelete={onDelete} 
                    onAddComment={onAddComment}
                    onDeleteComment={onDeleteComment}
                    onReschedule={onReschedule}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Desktop: Three Columns */}
      <div className="hidden lg:flex gap-4 w-full">
        {[0, 1, 2].map((columnIndex) => (
          <div key={columnIndex} className="flex-1 flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {getColumnTodos(columnIndex, 3).map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TodoItem 
                    todo={todo} 
                    onToggle={onToggle} 
                    onDelete={onDelete} 
                    onAddComment={onAddComment}
                    onDeleteComment={onDeleteComment}
                    onReschedule={onReschedule}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
