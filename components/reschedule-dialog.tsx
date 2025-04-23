import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import { convertRelativeDate } from "@/lib/date-utils"
import { IOSpinner } from "./spinner"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface RescheduleDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (newDate: string) => void
  currentDate?: string
}

export default function RescheduleDialog({ isOpen, onClose, onConfirm, currentDate }: RescheduleDialogProps) {
  const [dateInput, setDateInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      setDateInput('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!dateInput.trim()) return
    
    setIsLoading(true)
    try {
      const result = await convertRelativeDate(dateInput.trim())
      onConfirm(result.formattedDateTime)
    } catch (error) {
      console.error("Failed to convert date:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && dateInput.trim()) {
      e.preventDefault()
      await handleSubmit()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 bg-[#131316] border-0 shadow-[0px_32px_64px_-16px_rgba(0,0,0,0.30)] shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.30)] shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.24)] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24)] shadow-[0px_-8px_16px_-1px_rgba(0,0,0,0.16)] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.24)] shadow-[0px_0px_0px_1px_rgba(0,0,0,1.00)] shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.20)]">
        <div className="flex flex-col p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-0.5 bg-[#7c5aff]/25 rounded-[99px] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] shadow-[0px_1px_2px_-0.5px_rgba(0,0,0,0.06)] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.16)] border border-[#7c5aff]/25 justify-center items-center gap-1.5 flex overflow-hidden">
              <RotateCcw className="w-3.5 h-3.5 text-[#7c5aff]" />
            </div>
            <DialogTitle className="text-white text-[13px] font-normal font-['Geist'] leading-tight">Reschedule to:</DialogTitle>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="tomorrow, next week, etc."
              className="flex-1 bg-transparent border border-white/10 rounded-[6px] px-3 h-8 text-white text-[13px] font-normal font-['Geist'] leading-tight placeholder-gray-500 focus:outline-none focus:border-[#7c5aff]/50"
              disabled={isLoading}
            />
            {isLoading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <IOSpinner />
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!dateInput.trim()}
                className="h-8 px-4 bg-gradient-to-b from-[#7c5aff] to-[#6c47ff] rounded-[6px] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.16),0px_1px_2px_0px_rgba(0,0,0,0.20)] justify-center items-center inline-flex overflow-hidden cursor-pointer hover:from-[#8f71ff] hover:to-[#7c5aff] active:from-[#6c47ff] active:to-[#5835ff] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#7c5aff] disabled:hover:to-[#6c47ff]"
              >
                <div className="text-white text-[13px] font-medium font-['Geist'] leading-tight">Set</div>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 