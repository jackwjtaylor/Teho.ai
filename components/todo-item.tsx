"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Trash2, ChevronDown, ChevronUp, MessageSquare, User } from "lucide-react"
import type { Todo, Comment } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onAddComment: (todoId: string, comment: Comment) => void
  onDeleteComment: (todoId: string, commentId: string) => void
}

const getTimeColor = (dateStr: string) => {
  const dueDate = new Date(dateStr);
  const now = new Date();
  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 6) {
    return "text-red-500 dark:text-red-400"; // Red for within 6 hours
  } else if (diffHours <= 24) {
    return "text-yellow-500 dark:text-yellow-400"; // Yellow for within 24 hours
  } else {
    return "text-green-500 dark:text-green-400"; // Green for more than 24 hours
  }
};

const formatCommentDate = (dateInput: Date | string) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(date.toISOString());
};

export default function TodoItem({ todo, onToggle, onDelete, onAddComment, onDeleteComment }: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  const handleAddComment = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && commentText.trim()) {
      e.preventDefault()
      const newComment: Comment = {
        id: uuidv4(),
        text: commentText.trim(),
        todoId: todo.id,
        userId: todo.userId,
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

  // Auto-resize textarea as content grows
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setCommentText(textarea.value);
  };

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
                  {todo.title}
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

            <div className="flex items-center mt-1 text-[13px] space-x-2">
              {todo.dueDate && (
                <span className={`${getTimeColor(todo.dueDate)} font-medium`}>
                  {formatDate(todo.dueDate)}
                </span>
              )}

              <div className="flex items-center">
                <span className="mr-1 text-gray-500 dark:text-white/50">Urgency:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-500 dark:text-white/50">{todo.urgency.toFixed(1)}</span>
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
            transition={{ 
              type: "spring",
              stiffness: 500,
              damping: 40,
              opacity: { duration: 0.2 }
            }}
            className="border-t border-gray-200 dark:border-white/10 overflow-hidden"
          >
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="p-4"
            >
              {/* Comments list */}
              {todo.comments.length > 0 && (
                <motion.div 
                  className="mb-4 space-y-3"
                  layout
                >
                  {todo.comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1"
                      onMouseEnter={() => setHoveredCommentId(comment.id)}
                      onMouseLeave={() => setHoveredCommentId(null)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0">
                          <User className="w-5 h-5 text-gray-400 dark:text-white/50" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                          {comment.user?.name && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm font-medium text-gray-700 dark:text-white/90 mb-0.5"
                            >
                              {comment.user.name}
                            </motion.div>
                          )}
                            </div>
                            <AnimatePresence>
                              {hoveredCommentId === comment.id && (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.15 }}
                                  onClick={() => onDeleteComment(todo.id, comment.id)}
                                  className="text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white/80 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="text-[15px] text-gray-700 dark:text-white/80 whitespace-pre-wrap break-words">
                            {comment.text}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-white/40 mt-1">
                            {formatCommentDate(comment.createdAt)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Add comment input */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-start relative"
              >
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={handleTextareaInput}
                  onKeyDown={handleAddComment}
                  placeholder="Add a comment... (Shift+Enter for new line)"
                  rows={1}
                  className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px] transition-colors duration-200 resize-none overflow-hidden min-h-[24px] py-0"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
