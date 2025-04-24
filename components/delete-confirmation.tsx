import * as React from 'react'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteConfirmation({ isOpen, onClose, onConfirm }: DeleteConfirmationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 bg-[#131316] border-0 shadow-[0px_32px_64px_-16px_rgba(0,0,0,0.30)] shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.30)] shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.24)] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24)] shadow-[0px_-8px_16px_-1px_rgba(0,0,0,0.16)] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.24)] shadow-[0px_0px_0px_1px_rgba(0,0,0,1.00)] shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.20)]">
        <div className="flex flex-col p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-0.5 bg-red-500/25 rounded-[99px] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] shadow-[0px_1px_2px_-0.5px_rgba(0,0,0,0.06)] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.16)] border border-red-500/25 justify-center items-center gap-1.5 flex overflow-hidden">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </div>
            <DialogTitle className="text-white text-[13px] font-normal font-['Geist'] leading-tight">Delete this todo?</DialogTitle>
          </div>
          
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              className="h-8 px-4 bg-transparent hover:bg-white/[0.08] rounded-[6px] justify-center items-center inline-flex transition-colors"
            >
              <div className="text-white text-[13px] font-normal font-['Geist'] leading-tight">Cancel</div>
            </button>
            <button
              onClick={onConfirm}
              className="h-8 px-4 bg-gradient-to-b from-red-500 to-red-600 rounded-[6px] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.16),0px_1px_2px_0px_rgba(0,0,0,0.20)] justify-center items-center inline-flex overflow-hidden cursor-pointer hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 transition-all duration-200"
            >
              <div className="text-white text-[13px] font-medium font-['Geist'] leading-tight">Delete</div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 