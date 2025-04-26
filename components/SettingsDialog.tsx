"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    reminderMinutes: 30,
    aiSuggestedReminders: false,
    weeklyReview: false
  })

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70%] sm:h-[80%] overflow-y-auto bg-background">
        <DialogHeader className="px-6 pt-4 pb-3 border-b">
          <DialogTitle className="text-2xl font-semibold tracking-tight">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-6 space-y-8">
          {/* Email Alerts Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight">Email Alerts</h2>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between py-3 border-t">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Reminder notification time</Label>
                  <p className="text-sm text-muted-foreground">
                    Minutes before a todo is due
                  </p>
                </div>
                <Input
                  id="reminderMinutes"
                  type="number"
                  min={1}
                  value={settings.reminderMinutes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    reminderMinutes: parseInt(e.target.value) || 30
                  }))}
                  className="w-20 h-10 text-right"
                />
              </div>

              <div className="flex items-start justify-between py-3 border-t">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">AI-suggested todo reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive AI-powered suggestions for new todos based on your patterns
                  </p>
                </div>
                <Switch
                  checked={settings.aiSuggestedReminders}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    aiSuggestedReminders: checked
                  }))}
                />
              </div>

              <div className="flex items-start justify-between py-3 border-t">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Weekly todo review</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of completed todos and productivity insights
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyReview}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    weeklyReview: checked
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Subscription</h2>
            <div className="rounded-lg border bg-muted/5 p-4">
              <p className="text-sm text-muted-foreground">
                Premium features coming soon! Stay tuned for enhanced productivity tools and advanced AI capabilities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 px-6 py-3 border-t bg-muted/5">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 