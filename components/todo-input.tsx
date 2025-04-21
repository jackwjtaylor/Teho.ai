"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Todo } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { convertRelativeDate } from "@/lib/date-utils"
import { IOSpinner } from "./spinner"
import { FaTags } from "react-icons/fa"

type InputStep = "text" | "date" | "urgency"

interface TodoInputProps {
  onAddTodo: (todo: Todo) => void
  existingTags: string[]
}

export default function TodoInput({ onAddTodo, existingTags }: TodoInputProps) {
  const [step, setStep] = useState<InputStep>("text")
  const [text, setText] = useState("")
  const [date, setDate] = useState("")
  const [isDateLoading, setIsDateLoading] = useState(false)
  const [urgency, setUrgency] = useState(3)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [isTagMode, setIsTagMode] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [tagPositionX, setTagPositionX] = useState(0)
  const [flyingTag, setFlyingTag] = useState<string | null>(null)

  const textInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const urgencyInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const tagBadgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step === "text" && !isTagMode) textInputRef.current?.focus()
    if (step === "date") dateInputRef.current?.focus()
    if (step === "urgency") urgencyInputRef.current?.focus()
    if (isTagMode) tagInputRef.current?.focus()
  }, [step, isTagMode])

  useEffect(() => {
    if (tagInput) {
      const suggestions = existingTags.filter(tag => 
        tag.toLowerCase().includes(tagInput.toLowerCase()) && 
        !tags.includes(tag)
      )
      setTagSuggestions(suggestions)
      setShowTagSuggestions(suggestions.length > 0)
    } else {
      setShowTagSuggestions(false)
    }
  }, [tagInput, existingTags, tags])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.endsWith("!t") || value.endsWith("!tag")) {
      const trimLength = value.endsWith("!t") ? 2 : 4;
      const textBeforeTrigger = value.slice(0, -trimLength);
      setIsTagMode(true)
      setText(textBeforeTrigger)
      setTagInput("")
      
      // Calculate position for the tag badge
      const inputEl = textInputRef.current;
      if (inputEl) {
        if (textBeforeTrigger.length === 0) {
          // Position at start if input was empty, slight offset for placeholder
          setTagPositionX(0); 
        } else {
          // Get the cursor position in pixels
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            const computedStyle = window.getComputedStyle(inputEl);
            context.font = computedStyle.font;
            const textWidth = context.measureText(textBeforeTrigger).width;
            setTagPositionX(textWidth);
          }
        }
      }
      
      setTimeout(() => tagInputRef.current?.focus(), 0)
    } else {
      setText(value)
    }
  }

  const handleTextKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && text.trim()) {
      e.preventDefault()
      setStep("date")
    }
  }

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === " " || e.key === "Escape") && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput.trim())
    } else if (e.key === "Backspace" && !tagInput) {
      e.preventDefault()
      setIsTagMode(false)
      textInputRef.current?.focus()
    }
  }

  const handleDateKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && date.trim()) {
      e.preventDefault()
      setIsDateLoading(true)
      try {
        const result = await convertRelativeDate(date.trim())
        setDate(result.formattedDateTime)
        setStep("urgency")
      } catch (error) {
        console.error("Failed to convert date:", error)
      } finally {
        setIsDateLoading(false)
      }
    }
  }

  const handleUrgencyKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      submitTodo()
      return
    }

    if (e.key === "Shift") {
      setIsShiftPressed(true)
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (isShiftPressed) {
        setUrgency((prev) => Math.min(5, +(prev + 0.1).toFixed(1)))
      } else {
        setUrgency((prev) => Math.min(5, Math.floor(prev) + 1))
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (isShiftPressed) {
        setUrgency((prev) => Math.max(1, +(prev - 0.1).toFixed(1)))
      } else {
        setUrgency((prev) => Math.max(1, Math.floor(prev) - 1))
      }
    }
  }

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setFlyingTag(tag);
      
      // Get badge position for animation
      const badgeEl = tagBadgeRef.current;
      if (badgeEl) {
        const rect = badgeEl.getBoundingClientRect();
        setTimeout(() => {
          setTags(prev => [...prev, tag]);
          setTagInput("");
          setIsTagMode(false);
          textInputRef.current?.focus();
          
          // Reset flying tag after animation completes
          setTimeout(() => {
            setFlyingTag(null);
          }, 500);
        }, 300); // Wait for animation to get halfway
      } else {
        // Fallback if no element reference
        setTags(prev => [...prev, tag]);
        setTagInput("");
        setIsTagMode(false);
        setFlyingTag(null);
        textInputRef.current?.focus();
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleUrgencyKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Shift") {
      setIsShiftPressed(false)
    }
  }

  const submitTodo = () => {
    if (text.trim()) {
      onAddTodo({
        id: uuidv4(),
        title: text,
        dueDate: date || undefined,
        urgency: Number(urgency.toFixed(1)),
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '', // This will be set by the API
        comments: [],
        tags: tags,
      })

      // Reset form
      setText("")
      setDate("")
      setUrgency(3)
      setTags([])
      setIsTagMode(false)
      setStep("text")
    }
  }

  const handleTagSuggestionClick = (suggestion: string) => {
    setTagInput(suggestion);
    tagInputRef.current?.focus();
  }

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-[#131316] rounded-[12px] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.24),0px_0px_0px_1px_rgba(0,0,0,1.00),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] overflow-hidden transition-colors duration-200">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center relative" style={{ minHeight: "24px" }}>
                  <input
                    ref={textInputRef}
                    type="text"
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleTextKeyDown}
                    placeholder="What needs to be done? (Type !t or !tag for tags)"
                    className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px] transition-colors duration-200"
                    disabled={step !== "text" || isTagMode}
                  />
                  
                  {/* Inline tag badge */}
                  <AnimatePresence>
                    {isTagMode && (
                      <motion.div
                        ref={tagBadgeRef}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute rounded-full bg-[#7c5aff]/20 border border-[#7c5aff]/30 dark:border-white/30 text-[#7c5aff] dark:text-white flex items-center gap-1 pl-1.5 overflow-hidden z-10"
                        style={{ left: `${tagPositionX}px` }}
                      >
                        <FaTags className="w-3 h-3 mr-1" />
                        <input
                          ref={tagInputRef}
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          className="bg-transparent border-none outline-none text-[#7c5aff] dark:text-white text-[13px] w-auto min-w-[30px] max-w-[120px] p-0.5 pr-1.5"
                          placeholder="tag"
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Flying tag animation */}
                  <AnimatePresence>
                    {flyingTag && (
                      <motion.div
                        initial={{ 
                          scale: 1, 
                          opacity: 1,
                          x: tagPositionX,
                          y: 0
                        }}
                        animate={{ 
                          scale: 1,
                          opacity: 1,
                          x: "calc(100% - 20px)",
                          y: 0
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25
                        }}
                        className="absolute px-2 py-0.5 rounded-full bg-[#7c5aff]/20 text-[#7c5aff] dark:text-white text-xs flex items-center gap-1 pointer-events-none"
                      >
                        <FaTags className="w-3 h-3" />
                        <span>{flyingTag}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Tag suggestions */}
              <AnimatePresence>
                {showTagSuggestions && isTagMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1c1c1f] rounded-lg shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden z-10"
                  >
                    {tagSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleTagSuggestionClick(suggestion)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/5 text-sm transition-colors duration-150"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Tag display on the right */}
            {tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-1">
                {tags.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-2 py-0.5 rounded-full bg-[#7c5aff]/20 text-[#7c5aff] dark:text-white text-xs flex items-center gap-1"
                  >
                    <FaTags className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-white/80"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {step !== "text" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10"
              >
                <div className="flex items-center">
                  <div className="flex-1 flex items-center gap-2">
                    {step === "date" && (
                      <>
                        <input
                          ref={dateInputRef}
                          type="text"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          onKeyDown={handleDateKeyDown}
                          placeholder="tomorrow, next week, etc."
                          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px] transition-colors duration-200"
                          disabled={isDateLoading}
                        />
                        {isDateLoading && <IOSpinner />}
                      </>
                    )}
                    {step === "urgency" && (
                      <div className="flex-1 flex items-center">
                        <span className="text-xs text-gray-500 mr-2">Urgency:</span>
                        <input
                          ref={urgencyInputRef}
                          type="text"
                          value={urgency.toFixed(1)}
                          readOnly
                          onKeyDown={handleUrgencyKeyDown}
                          onKeyUp={handleUrgencyKeyUp}
                          className="w-12 bg-transparent border-none outline-none text-gray-900 dark:text-white text-[15px] transition-colors duration-200"
                        />
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden ml-2">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#7c5aff] to-[#6c47ff]"
                            style={{ width: `${(urgency / 5) * 100}%` }}
                            initial={false}
                            animate={{ width: `${(urgency / 5) * 100}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {step === "urgency" && (
                  <div className="mt-1 text-xs text-gray-500 text-right text-[13px]">
                    {isShiftPressed
                      ? "Fine tune with ↑↓ (0.1 increments)"
                      : "Use ↑↓ to adjust, hold Shift for fine-tuning"}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {isTagMode && (
        <div className="mt-1 text-xs text-gray-500 text-[13px]">
          Press Enter, Space, or Escape to add tag, or Backspace when empty to cancel
        </div>
      )}
    </div>
  )
}
