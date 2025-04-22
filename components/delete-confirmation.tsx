import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const springConfig = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1
}

export default function DeleteConfirmation({ isOpen, onClose, onConfirm }: DeleteConfirmationProps) {
  const commonClasses = "h-10 bg-[#131316] rounded-[99px] shadow-[0px_32px_64px_-16px_rgba(0,0,0,0.30)] shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.30)] shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.24)] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24)] shadow-[0px_-8px_16px_-1px_rgba(0,0,0,0.16)] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.24)] shadow-[0px_0px_0px_1px_rgba(0,0,0,1.00)] shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.20)] justify-center items-center inline-flex overflow-hidden"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={commonClasses}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={springConfig}
        >
          <div className="flex items-center justify-between h-full px-3">
            <div className="flex items-center gap-2">
              <div className="p-0.5 bg-red-500/25 rounded-[99px] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] shadow-[0px_1px_2px_-0.5px_rgba(0,0,0,0.06)] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.16)] border border-red-500/25 justify-center items-center gap-1.5 flex overflow-hidden">
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div className="text-white text-[13px] font-normal font-['Geist'] leading-tight whitespace-nowrap">Delete this todo?</div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={onClose}
                className="px-3 rounded-[99px] justify-center items-center flex hover:bg-white/[0.08] transition-colors"
              >
                <div className="text-white text-[13px] font-normal font-['Geist'] leading-tight p-1">Cancel</div>
              </button>
              <div 
                onClick={onConfirm}
                className="h-7 px-3 bg-gradient-to-b from-red-500 to-red-600 rounded-[99px] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.16),0px_1px_2px_0px_rgba(0,0,0,0.20)] justify-center items-center inline-flex overflow-hidden cursor-pointer hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 transition-all duration-200"
              >
                <div className="text-white text-[13px] font-medium font-['Geist'] leading-tight">Delete</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 