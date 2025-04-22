"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Todo } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { convertRelativeDate } from "@/lib/date-utils"
import { IOSpinner } from "./spinner"
import { ArrowRight } from "lucide-react"

type InputStep = "text" | "date" | "urgency"

export default function TodoInput({ onAddTodo }: { onAddTodo: (todo: Todo) => void }) {
  const [step, setStep] = useState<InputStep>("text")
  const [text, setText] = useState("")
  const [date, setDate] = useState("")
  const [isDateLoading, setIsDateLoading] = useState(false)
  const [urgency, setUrgency] = useState(3)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  const textInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const urgencyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === "text") textInputRef.current?.focus()
    if (step === "date") dateInputRef.current?.focus()
    if (step === "urgency") urgencyInputRef.current?.focus()
  }, [step])

  const handleTextSubmit = () => {
    if (text.trim()) {
      setStep("date")
    }
  }

  const handleDateSubmit = async () => {
    if (date.trim()) {
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

  const handleTextKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && text.trim()) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const handleDateKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && date.trim()) {
      e.preventDefault()
      await handleDateSubmit()
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
      })

      // Reset form
      setText("")
      setDate("")
      setUrgency(3)
      setStep("text")
    }
  }

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-[#131316] rounded-[12px] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.24),0px_0px_0px_1px_rgba(0,0,0,1.00),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] overflow-hidden transition-colors duration-200">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <input
              ref={textInputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder="What needs to be done?"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px] transition-colors duration-200"
              disabled={step !== "text"}
            />
            {step === "text" && text.trim() && (
              <button
                onClick={handleTextSubmit}
                className="md:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <ArrowRight className="w-5 h-5 text-gray-500 dark:text-white/50" />
              </button>
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
                  <span className="text-xs text-gray-500 mr-2">When:</span>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      ref={dateInputRef}
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      onKeyDown={handleDateKeyDown}
                      placeholder="tomorrow, next week, etc."
                      className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px] transition-colors duration-200"
                      disabled={step !== "date" || isDateLoading}
                    />
                    {step === "date" && date.trim() && !isDateLoading && (
                      <button
                        onClick={handleDateSubmit}
                        className="md:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <ArrowRight className="w-5 h-5 text-gray-500 dark:text-white/50" />
                      </button>
                    )}
                    {isDateLoading && <IOSpinner />}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step === "urgency" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10"
              >
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">Urgency:</span>
                  <div className="flex-1 flex items-center">
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
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-500 text-[13px]">
                    {isShiftPressed
                      ? "Fine tune with ↑↓ (0.1 increments)"
                      : "Use ↑↓ to adjust, hold Shift for fine-tuning"}
                  </div>
                  <button
                    onClick={submitTodo}
                    className="md:hidden ml-2 px-3 py-1 bg-[#7c5aff] text-white rounded-full text-sm hover:bg-[#6c47ff] transition-colors"
                  >
                    Add Todo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
