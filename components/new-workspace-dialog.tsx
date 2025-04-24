"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface NewWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export default function NewWorkspaceDialog({
  isOpen,
  onClose,
  onSubmit
}: NewWorkspaceDialogProps) {
  const [name, setName] = useState("")

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 dark:bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-white dark:bg-[#131316] rounded-[12px] overflow-hidden shadow-[0px_32px_64px_-16px_rgba(0,0,0,0.30)] dark:shadow-[0px_32px_64px_-16px_rgba(0,0,0,0.30)] dark:shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.30)] dark:shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.24)] dark:shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24)] dark:shadow-[0px_-8px_16px_-1px_rgba(0,0,0,0.16)] dark:shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.24)] dark:shadow-[0px_0px_0px_1px_rgba(0,0,0,1.00)] dark:shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] dark:shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.20)]"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-medium text-gray-900 dark:text-white">New Workspace</h2>
                <button 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-[6px] text-[13px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-transparent dark:border-white/[0.08] focus:border-[#7c5aff] dark:focus:border-[#7c5aff] focus:ring-0 outline-none transition-colors"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-[13px] text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (name.trim()) {
                      onSubmit(name.trim())
                      setName("")
                      onClose()
                    }
                  }}
                  className="px-3 py-1.5 text-[13px] font-medium bg-gradient-to-b from-[#7c5aff] to-[#6c47ff] text-white rounded-[6px] hover:from-[#8f71ff] hover:to-[#7c5aff] transition-all duration-200 shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.16),0px_1px_2px_0px_rgba(0,0,0,0.20)]"
                >
                  Create Workspace
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 