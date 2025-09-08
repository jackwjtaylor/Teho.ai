"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, FileText, ListChecks, Loader2, Rocket } from "lucide-react"

interface GoalPlanDialogProps {
  goalId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface GoalDetails {
  goal: { id: string; title: string; description: string | null }
  milestones: { id: string; title: string; summary?: string | null; index: number }[]
  tasks: { id: string; title: string; dueDate?: string | null; completed: boolean }[]
  artifacts: { id: string; name: string; type: string; path?: string | null; externalId?: string | null }[]
}

export default function GoalPlanDialog({ goalId, open, onOpenChange }: GoalPlanDialogProps) {
  const [details, setDetails] = useState<GoalDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const fetchDetails = async () => {
      if (!goalId || !open) return
      setLoading(true)
      try {
        const res = await fetch(`/api/goals/${goalId}`)
        if (!res.ok) throw new Error('Failed to fetch goal')
        const data = await res.json()
        setDetails(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [goalId, open])

  const syncToDrive = async () => {
    if (!goalId) return
    setSyncing(true)
    try {
      const res = await fetch(`/api/goals/${goalId}/sync-storage`, { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      // refresh details
      const d = await fetch(`/api/goals/${goalId}`).then(r => r.json())
      setDetails(d)
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] w-[calc(100%-24px)] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-violet-500" /> Plan Ready
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
            Generating plan…
          </div>
        ) : details ? (
          <div className="px-5 pb-5">
            <Card className="p-4 mb-4 bg-white dark:bg-[#131316] border border-black/5 dark:border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{details.goal.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Auto-drafted steps and docs. Teho assigned itself where possible.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={syncToDrive} disabled={syncing}>
                    {syncing ? 'Syncing…' : 'Sync to Google Drive'}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-white dark:bg-[#131316] border border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-violet-500" />
                    <h3 className="font-medium">Milestones</h3>
                  </div>
                  <Badge variant="secondary">{details.milestones.length}</Badge>
                </div>
                <Separator className="my-2" />
                <ScrollArea className="max-h-72 pr-2">
                  <ol className="space-y-3">
                    {details.milestones.sort((a,b)=>a.index-b.index).map((m, idx) => (
                      <li key={m.id} className="">
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                            {idx+1}
                          </div>
                          <div>
                            <div className="font-medium leading-snug">{m.title}</div>
                            {m.summary ? <div className="text-xs text-muted-foreground mt-0.5">{m.summary}</div> : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </Card>

              <Card className="p-4 bg-white dark:bg-[#131316] border border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-500" />
                    <h3 className="font-medium">Artifacts</h3>
                  </div>
                  <Badge variant="secondary">{details.artifacts.length}</Badge>
                </div>
                <Separator className="my-2" />
                <ScrollArea className="max-h-72 pr-2">
                  <ul className="space-y-3">
                    {details.artifacts.map(a => {
                      const driveUrl = a && (a as any).externalId ? `https://drive.google.com/file/d/${(a as any).externalId}/view?usp=drive_link` : null
                      return (
                        <li key={a.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono uppercase">{a.type}</Badge>
                            <span className="font-medium">{a.name}</span>
                            {driveUrl ? (
                              <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 underline">Open</a>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not synced</span>
                            )}
                            {driveUrl && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </ScrollArea>
              </Card>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">No data</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
