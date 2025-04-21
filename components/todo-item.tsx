"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Trash2, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import type { Todo, Comment } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onAddComment: (todoId: string, comment: Comment) => void
}

export default function TodoItem({ todo, onToggle, onDelete, onAddComment }: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [commentText, setCommentText] = useState("")
  const commentInputRef = useRef<HTMLInputElement>(null)

  const handleAddComment = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && commentText.trim()) {
      e.preventDefault()
      const newComment: Comment = {
        id: uuidv4(),
        text: commentText.trim(),
        createdAt: new Date(),
      }
      onAddComment(todo.id, newComment)
      setCommentText("")
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
    // Focus the comment input when expanding
    if (!isExpanded) {
      setTimeout(() => {
        commentInputRef.current?.focus()
      }, 100)
    }
  }

  return (
    <div
      className="bg-white dark:bg-[#131316] rounded-[12px] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24),0px_0px_0px_1px_rgba(0,0,0,1.00),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] overflow-hidden transition-colors duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 cursor-pointer" onClick={toggleExpand}>
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent expanding when clicking the checkbox
              onToggle(todo.id)
            }}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border ${
              todo.completed ? "bg-[#7c5aff]/20 border-[#7c5aff]/30" : "border-gray-300 dark:border-white/30"
            } flex items-center justify-center transition-colors`}
          >
            {todo.completed && <Check className="w-3 h-3 text-[#7c5aff] dark:text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p
                  className={`text-[15px] font-normal ${
                    todo.completed ? "line-through text-gray-400 dark:text-white/50" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {todo.text}
                </p>

                {todo.comments.length > 0 && (
                  <div className="ml-2 flex items-center text-gray-400 dark:text-white/50">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="ml-1 text-xs">{todo.comments.length}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <AnimatePresence>
                  {isHovered && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => {
                        e.stopPropagation() // Prevent expanding when clicking delete
                        onDelete(todo.id)
                      }}
                      className="ml-2 text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-2 text-gray-400 dark:text-white/50" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-400 dark:text-white/50" />
                )}
              </div>
            </div>

            <div className="flex items-center mt-1 text-[13px] text-gray-500 dark:text-white/50 space-x-2">
              {todo.date && <span>{formatDate(todo.date)}</span>}

              <div className="flex items-center">
                <span className="mr-1">Urgency:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{todo.urgency.toFixed(1)}</span>
                  <div className="w-8 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7c5aff] to-[#6c47ff]"
                      style={{ width: `${(todo.urgency / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-white/10"
          >
            <div className="p-4">
              {/* Comments list */}
              {todo.comments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {todo.comments.map((comment) => (
                    <div key={comment.id} className="text-[15px] text-gray-700 dark:text-white/80">
                      <p>{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment input */}
              <div className="flex items-center">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={handleAddComment}
                  placeholder="Add a comment..."
                  className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px] transition-colors duration-200"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
