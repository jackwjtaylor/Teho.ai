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

  // Sort helper: by due date (earliest first), tasks without dueDate go last
  const sortByDueDate = (a: Todo, b: Todo) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aTime - bTime;
  };
  
  // Group todos into columns by due date:
  // columnCount === 1: sort all
  // columnCount === 2: 0=overdue or today, 1=rest
  // columnCount === 3: 0=overdue/today, 1=next 7 days, 2=rest
  const getColumnTodos = (columnIndex: number, columnCount: number) => {
    if (columnCount === 1) {
      return [...todos].sort(sortByDueDate);
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // map todos to include diffDays and group
    const enriched = todos.map(todo => {
      let diffDays: number;
      if (todo.dueDate) {
        const due = new Date(todo.dueDate);
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        diffDays = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        diffDays = Infinity;
      }
      let group = columnCount - 1;
      if (diffDays <= 0) group = 0;
      else if (columnCount === 3 && diffDays >= 1 && diffDays <= 7) group = 1;
      return { todo, diffDays, group };
    });
    // filter by column group
    const bucket = enriched.filter(x => x.group === columnIndex);
    // for first column (overdue/today), show today's tasks above overdue
    if (columnIndex === 0 && columnCount >= 2) {
      const todayTasks = bucket
        .filter(x => x.diffDays === 0)
        .map(x => x.todo)
        .sort(sortByDueDate);
      const overdueTasks = bucket
        .filter(x => x.diffDays < 0)
        .map(x => x.todo)
        .sort(sortByDueDate);
      return [...todayTasks, ...overdueTasks];
    }
    // otherwise, just sort by dueDate
    return bucket.map(x => x.todo).sort(sortByDueDate);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Mobile: Single Column */}
      <div className="flex flex-col gap-2 w-full md:hidden overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* Mobile header */}
        <div className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          All Tasks ({getColumnTodos(0, 1).length})
        </div>
        <AnimatePresence mode="popLayout">
          {getColumnTodos(0, 1).map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
        {([0, 1] as const).map((columnIndex) => {
          const colTodos = getColumnTodos(columnIndex, 2);
          const label = columnIndex === 0 ? `Due Today & Overdue (${colTodos.length})` : `Upcoming (${colTodos.length})`;
          return (
            <div key={columnIndex} className="flex-1 flex flex-col gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              <div className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                {label}
              </div>
              <AnimatePresence mode="popLayout">
                {colTodos.map(todo => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
          )
        })}
      </div>

      {/* Desktop: Three Columns */}
      <div className="hidden lg:flex gap-4 w-full">
        {([0, 1, 2] as const).map((columnIndex) => {
          const colTodos = getColumnTodos(columnIndex, 3);
          const label = columnIndex === 0
            ? `Today & Overdue (${colTodos.length})`
            : columnIndex === 1
              ? `Next 7 Days (${colTodos.length})`
              : `Upcoming (${colTodos.length})`;
          return (
            <div key={columnIndex} className="flex-1 flex flex-col gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              <div className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                {label}
              </div>
              <AnimatePresence mode="popLayout">
                {colTodos.map(todo => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
          )
        })}
      </div>
    </div>
  );
}
