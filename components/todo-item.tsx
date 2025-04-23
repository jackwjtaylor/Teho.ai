"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Trash2, ChevronDown, ChevronUp, MessageSquare, User, ArrowRight, RotateCcw } from "lucide-react"
import type { Todo, Comment } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import DeleteConfirmation from "./delete-confirmation"
import RescheduleDialog from "./reschedule-dialog"

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onAddComment: (todoId: string, comment: Comment) => void
  onDeleteComment: (todoId: string, commentId: string) => void
  onReschedule: (id: string, newDate: string) => void
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

const isPastDue = (dateStr: string): boolean => {
  const dueDate = new Date(dateStr);
  const now = new Date();
  return dueDate.getTime() < now.getTime();
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

export default function TodoItem({ todo, onToggle, onDelete, onAddComment, onDeleteComment, onReschedule }: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
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
      className={`bg-[#131316] rounded-[12px] shadow-[0px_32px_64px_-16px_rgba(0,0,0,0.30)] shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.30)] shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.24)] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24)] shadow-[0px_-8px_16px_-1px_rgba(0,0,0,0.16)] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.24)] shadow-[0px_0px_0px_1px_rgba(0,0,0,1.00)] shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.20)] overflow-hidden transition-colors duration-200 ${
        todo.dueDate && isPastDue(todo.dueDate) 
          ? "bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(255,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(255,0,0,0.15)_50%,rgba(255,0,0,0.15)_75%,transparent_75%,transparent)]"
          : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        className="flex flex-col relative"
      >
        <div className="absolute top-2 right-2 z-10">
          <DeleteConfirmation 
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={() => {
              onDelete(todo.id)
              setShowDeleteConfirm(false)
            }}
          />
          <RescheduleDialog
            isOpen={showRescheduleDialog}
            onClose={() => setShowRescheduleDialog(false)}
            onConfirm={(newDate) => {
              onReschedule(todo.id, newDate)
              setShowRescheduleDialog(false)
            }}
            currentDate={todo.dueDate}
          />
        </div>

        <div className="p-5 cursor-pointer" onClick={toggleExpand}>
          <div className="flex items-start gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle(todo.id)
              }}
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border ${
                todo.completed ? "bg-[#7c5aff]/20 border-[#7c5aff]/30" : "border-white/30"
              } flex items-center justify-center transition-colors`}
            >
              {todo.completed && <Check className="w-3 h-3 text-[#7c5aff]" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center w-[85%]">
                  <p
                    className={`text-[15px] font-normal ${
                      todo.completed ? "line-through text-white/50" : "text-white"
                    }`}
                  >
                    {todo.title}
                  </p>

                  {todo.comments.length > 0 && (
                    <div className="ml-2 flex items-center text-white/50">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="ml-1 text-xs">{todo.comments.length}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center relative">
                  <AnimatePresence mode="popLayout">
                    {isHovered && (
                      <motion.button
                        key="reschedule-button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowRescheduleDialog(true)
                        }}
                        className="absolute right-12 text-[#7c5aff] hover:text-[#8f71ff] transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </motion.button>
                    )}
                    {isHovered && (
                      <motion.button
                        key="delete-button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(true)
                        }}
                        className="absolute right-6 text-white/50 hover:text-white/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/50" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/50" />
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
                  <span className="mr-1 text-white/50">Urgency:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-white/50">{todo.urgency.toFixed(1)}</span>
                    <div className="w-8 h-1.5 bg-white/10 rounded-full overflow-hidden">
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
              key="expanded-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 40,
                opacity: { duration: 0.2 }
              }}
              className="border-t border-white/10 overflow-hidden"
            >
              <motion.div 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="p-5"
              >
                {/* Comments list */}
                {todo.comments.length > 0 && (
                  <motion.div 
                    className="mb-6 space-y-4"
                    layout
                  >
                    {todo.comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        onMouseEnter={() => setHoveredCommentId(comment.id)}
                        onMouseLeave={() => setHoveredCommentId(null)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4 text-white/40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="group flex items-start justify-between gap-4">
                              <div>
                                <div className="text-[15px] text-white/80 whitespace-pre-wrap break-words">
                                  {comment.text}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="text-xs text-white/40">
                                    {comment.user?.name || 'Local User'}
                                  </div>
                                  <div className="text-xs text-white/40">•</div>
                                  <div className="text-xs text-white/40">
                                    {formatCommentDate(comment.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <AnimatePresence>
                                {hoveredCommentId === comment.id && (
                                  <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={() => onDeleteComment(todo.id, comment.id)}
                                    className="text-white/40 hover:text-white/60 transition-colors flex-shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </motion.button>
                                )}
                              </AnimatePresence>
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
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={handleTextareaInput}
                      onKeyDown={handleAddComment}
                      placeholder="Add a comment... (Shift+Enter for new line)"
                      rows={1}
                      className="w-full bg-transparent border-none outline-none text-white placeholder-white/40 text-[15px] transition-colors duration-200 resize-none overflow-hidden min-h-[24px] py-0"
                    />
                  </div>
                  {commentText.trim() && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (commentText.trim()) {
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
                      }}
                      className="md:hidden flex-shrink-0 mt-0.5"
                    >
                      <ArrowRight className="w-4 h-4 text-white/40 hover:text-white/60 transition-colors" />
                    </button>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
