"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import TodoInput from "@/components/todo-input"
import AITodoInput from "@/components/ai-todo-input"
import TodoList from "@/components/todo-list"
import TodoTable from "@/components/todo-table"
import ThemeToggle from "@/components/theme-toggle"
import CompletedToggle from "@/components/completed-toggle"
import ViewToggle from "@/components/view-toggle"
import LoginButton from "@/components/LoginButton"
import FeedbackWidget from "@/components/feedback-widget"
import type { Todo, Comment, Workspace } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "@/lib/auth-client"
import WorkspaceSwitcher from "@/components/workspace-switcher"
import NewWorkspaceDialog from "@/components/new-workspace-dialog"
import { toast } from 'sonner'
import { addTimezoneHeader } from "@/lib/timezone-utils"
import { DropResult } from '@hello-pangea/dnd'

interface HomeClientProps {
  initialTodos: Todo[]
}

const usePersistentState = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue)

  // Load initial value from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      try {
        setValue(JSON.parse(stored))
        console.log(`📥 Loaded ${key} from localStorage:`, JSON.parse(stored))
      } catch (error) {
        console.error(`❌ Failed to parse stored value for key "${key}":`, error)
      }
    }
  }, [key])

  // Save to localStorage whenever value changes
  useEffect(() => {
    console.log(`💾 Saving ${key} to localStorage:`, value)
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// Add a custom hook to detect mobile screen size
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
      };
      
      // Initial check
      checkMobile();
      
      // Add event listener for resize
      window.addEventListener('resize', checkMobile);
      
      // Clean up
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);
  
  return isMobile;
};

export default function HomeClient({ initialTodos }: HomeClientProps) {
  const [todos, setTodos] = usePersistentState<Todo[]>('todos', initialTodos)
  const [showCompleted, setShowCompleted] = usePersistentState('showCompleted', false)
  const [isTableView, setIsTableView] = usePersistentState('isTableView', false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = usePersistentState<string>('currentWorkspace', 'personal')
  const [isNewWorkspaceDialogOpen, setIsNewWorkspaceDialogOpen] = useState(false)
  const { data: session } = useSession()
  const isMobile = useIsMobile();

  // Initialize user settings on first load: if no DB record exists, seed with defaults (browser timezone)
  useEffect(() => {
    if (!session?.user) return
    const initSettings = async () => {
      try {
        const res = await fetch('/api/user/settings', { headers: addTimezoneHeader() })
        if (!res.ok) return
        const data = await res.json() as Record<string, any>
        // If no userId field, the GET returned defaults
        if (!('userId' in data)) {
          await fetch('/api/user/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...addTimezoneHeader() },
            body: JSON.stringify({
              reminderMinutes: data.reminderMinutes,
              aiSuggestedReminders: data.aiSuggestedReminders,
              weeklyReview: data.weeklyReview,
              timezone: data.timezone,
            }),
          })
        }
      } catch (error) {
        console.error('Failed to initialize user settings:', error)
      }
    }
    initSettings()
  }, [session?.user])

  // Clear todos and localStorage on signout
  useEffect(() => {
    if (!session?.user) {
      // Clear todos state
      setTodos([])
      setWorkspaces([])
      setCurrentWorkspace('personal')

      // Clear localStorage
      localStorage.removeItem('todos')
      localStorage.removeItem('currentWorkspace')

      // Optional: Clear other localStorage items if needed
      localStorage.removeItem('showCompleted')
      localStorage.removeItem('isTableView')
    }
  }, [session?.user, setTodos, setCurrentWorkspace])

  // Add keyboard shortcut handler for workspace switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.metaKey && !e.altKey && !e.shiftKey) {
        const num = parseInt(e.key)
        if (!isNaN(num) && num >= 1 && num <= 9) {
          e.preventDefault()
          const targetWorkspace = workspaces[num - 1]
          // Only switch if target workspace exists and is different from current
          if (targetWorkspace && targetWorkspace.id !== currentWorkspace) {
            setCurrentWorkspace(targetWorkspace.id)
            toast.success(`Switched to workspace: ${targetWorkspace.name}`)
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [workspaces, setCurrentWorkspace, currentWorkspace])

  // Define the sync function outside the effects so it can be reused
  const syncWithServer = async () => {
    if (!session?.user) return;
    
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📡 Syncing todos with server...');
      }
      
      const res = await fetch('/api/todos')
      const remoteTodos = await res.json() as Todo[]

      // Helper function to generate a content hash for comparison
      const getContentHash = (todo: Todo) => {
        return `${todo.title?.toLowerCase().trim() || ''}_${todo.dueDate || ''}_${todo.urgency || 1}`
      }

      // Helper function to update a remote todo
      const updateRemoteTodo = async (todoId: string, updates: { completed: boolean }) => {
        try {
          await fetch('/api/todos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: todoId, ...updates }),
          })
        } catch (error) {
          console.error('Failed to update remote todo:', error)
        }
      }

      // Create maps of remote todos
      const remoteMap = new Map(remoteTodos.map((todo: Todo) => [todo.id, todo]))
      const remoteContentMap = new Map(remoteTodos.map((todo: Todo) => [
        getContentHash(todo),
        todo
      ]))

      // Find local-only todos that don't exist on server by content
      const localOnlyTodos = todos.filter(todo => {
        const contentHash = getContentHash(todo)
        const matchingRemoteTodo = remoteContentMap.get(contentHash)

        // If no content match found, or if content matches but completion status differs
        if (!matchingRemoteTodo) {
          return true // Truly new todo
        }

        // If content matches but completion status is different, update the remote todo
        if (matchingRemoteTodo.completed !== todo.completed) {
          updateRemoteTodo(matchingRemoteTodo.id, { completed: todo.completed })
          return false
        }

        return false // Skip if content matches and no updates needed
      })

      // Sync local-only todos to server
      const syncPromises = localOnlyTodos.map(todo =>
        fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: todo.title,
            dueDate: todo.dueDate,
            urgency: todo.urgency,
            completed: todo.completed
          }),
        }).then(res => res.json())
      )

      const syncedTodos = await Promise.all(syncPromises)

      // Fetch the latest state from server after all syncs and updates
      const finalRes = await fetch('/api/todos')
      const finalTodos = (await finalRes.json()) as Todo[]

      // Dedupe todos by content hash before setting state
      const uniqueTodos = Array.from(
        new Map(
          finalTodos.map(todo => [
            getContentHash(todo),
            todo
          ])
        ).values()
      )

      setTodos(uniqueTodos)
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Sync completed successfully');
      }

    } catch (error) {
      console.error('Failed to sync with server:', error)
    }
  }

  // Initial sync with server when logged in
  useEffect(() => {
    if (!session?.user) return;
    syncWithServer();
  }, [session?.user]); // Only re-run when user session changes
  
  // Periodic sync with server every minute when logged in
  useEffect(() => {
    if (!session?.user) return;
    
    // Set up periodic sync
    const syncInterval = setInterval(() => {
      syncWithServer();
    }, 60000); // Sync every minute
    
    // Clean up interval on unmount
    return () => clearInterval(syncInterval);
  }, [session?.user, todos]); // Re-establish interval when todos change

  // Load workspaces when session changes
  useEffect(() => {
    if (!session?.user) return;

    const fetchWorkspaces = async () => {
      try {
        // Ensure we have at least a personal workspace
        await fetch('/api/workspaces/personal', { method: 'POST' });

        // Fetch all workspaces
        const res = await fetch('/api/workspaces');
        if (res.ok) {
          const workspacesData = await res.json();
          setWorkspaces(workspacesData);

          // If no current workspace is selected, or it doesn't exist in fetched workspaces,
          // default to first workspace or 'personal'
          if (
            currentWorkspace === 'personal' ||
            !workspacesData.some((w: Workspace) => w.id === currentWorkspace)
          ) {
            const personalWorkspace = workspacesData.find((w: Workspace) => w.name === 'Personal');
            if (personalWorkspace) {
              setCurrentWorkspace(personalWorkspace.id);
            } else if (workspacesData.length > 0) {
              setCurrentWorkspace(workspacesData[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      }
    };

    fetchWorkspaces();
  }, [session?.user]);

  const addTodo = async (todo: Todo) => {
    // Create a temporary client-side ID for optimistic updates using UUID when available
    const tempId = `temp-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}`;
    
    const newTodo = {
      ...todo,
      id: tempId, // Override with our guaranteed unique temp ID
      comments: [],
      userId: session?.user?.id || 'local',
      workspaceId: currentWorkspace,
    }

    // Optimistic update
    setTodos(prev => [...prev, newTodo])

    if (session?.user) {
      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: todo.title,
            dueDate: todo.dueDate,
            urgency: todo.urgency,
            workspaceId: currentWorkspace
          }),
        })
        const serverTodo = await res.json()
        
        // Replace the temporary todo with the server response
        setTodos(prev => prev.map(t => 
          t.id === tempId ? { ...serverTodo, comments: [] } : t
        ))
      } catch (error) {
        console.error('Failed to add todo:', error)
        // Revert on error
        setTodos(prev => prev.filter(t => t.id !== tempId))
      }
    }
  }

  const toggleTodo = async (id: string) => {
    const todoToUpdate = todos.find(t => t.id === id)
    if (!todoToUpdate) return

    // Optimistic update
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed, updatedAt: new Date() } : todo
    ))

    if (session?.user) {
      try {
        const res = await fetch('/api/todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, completed: !todoToUpdate.completed }),
        })
        const updatedTodo = await res.json()
        setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo))
      } catch (error) {
        console.error('Failed to toggle todo:', error)
        // Revert on error
        setTodos(prev => prev.map(todo =>
          todo.id === id ? { ...todo, completed: todoToUpdate.completed } : todo
        ))
      }
    }
  }

  const rescheduleTodo = async (id: string, newDate: string) => {
    const todoToUpdate = todos.find(t => t.id === id)
    if (!todoToUpdate) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Todo not found:', id)
      }
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('🎯 Starting reschedule flow:', { id, newDate })
      console.log('📅 Previous due date:', todoToUpdate.dueDate)
    }

    // Optimistic update
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Applying optimistic update...')
    }
    
    setTodos(prev => {
      const updated = prev.map(todo =>
        todo.id === id ? { ...todo, dueDate: newDate, updatedAt: new Date() } : todo
      )
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('📝 New todos state after optimistic update:', updated)
      }
      
      return updated
    })

    if (session?.user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('👤 User is logged in, syncing with server...')
      }
      
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('📤 Sending update to server:', { id, dueDate: newDate })
        }
        
        const res = await fetch('/api/todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, dueDate: newDate }),
        })
        const updatedTodo = await res.json()
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('📥 Server response:', updatedTodo)
        }

        // Only update if the server response includes the new date
        if (updatedTodo.dueDate === newDate) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Server update successful, updating state with server response')
          }
          
          setTodos(prev => {
            const updated = prev.map(todo => todo.id === id ? updatedTodo : todo)
            
            if (process.env.NODE_ENV !== 'production') {
              console.log('📝 Final todos state:', updated)
            }
            
            return updated
          })
        } else {
          console.warn('⚠️ Server response dueDate does not match requested date', {
            requested: newDate,
            received: updatedTodo.dueDate
          })
        }
      } catch (error) {
        console.error('❌ Failed to reschedule todo:', error)
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('⏮️ Reverting to previous state...')
        }

        // Revert on error
        setTodos(prev => {
          const reverted = prev.map(todo =>
            todo.id === id ? { ...todo, dueDate: todoToUpdate.dueDate } : todo
          )
          
          if (process.env.NODE_ENV !== 'production') {
            console.log('📝 Reverted todos state:', reverted)
          }
          
          return reverted
        })
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('👤 User not logged in, skipping server sync')
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✨ Reschedule flow complete')
    }
  }

  const deleteTodo = async (id: string) => {
    // Optimistic update
    const deletedTodo = todos.find(t => t.id === id)
    setTodos(prev => prev.filter(todo => todo.id !== id))

    if (session?.user) {
      try {
        await fetch('/api/todos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      } catch (error) {
        console.error('Failed to delete todo:', error)
        // Revert on error
        if (deletedTodo) {
          setTodos(prev => [...prev, deletedTodo])
        }
      }
    }
  }

  const addComment = async (todoId: string, comment: Comment) => {
    const newComment = {
      ...comment,
      user: session?.user ? {
        name: session.user.name || 'User',
        image: null
      } : {
        name: 'Local User',
        image: null
      }
    }

    // Optimistic update
    setTodos(prev =>
      prev.map(todo => todo.id === todoId ? {
        ...todo,
        comments: [...todo.comments, newComment]
      } : todo)
    )

    if (session?.user) {
      try {
        const res = await fetch('/api/todos/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ todoId, text: comment.text }),
        })
        const serverComment = await res.json()
        setTodos(prev =>
          prev.map(todo => todo.id === todoId ? {
            ...todo,
            comments: todo.comments.map(c =>
              c.id === newComment.id ? { ...serverComment, createdAt: new Date(serverComment.createdAt) } : c
            )
          } : todo)
        )
      } catch (error) {
        console.error('Failed to add comment:', error)
        // Revert on error
        setTodos(prev =>
          prev.map(todo => todo.id === todoId ? {
            ...todo,
            comments: todo.comments.filter(c => c.id !== newComment.id)
          } : todo)
        )
      }
    }
  }

  const deleteComment = async (todoId: string, commentId: string) => {
    // Store comment for potential revert
    const todoToUpdate = todos.find(t => t.id === todoId)
    const commentToDelete = todoToUpdate?.comments.find(c => c.id === commentId)

    // Optimistic update
    setTodos(prev =>
      prev.map(todo => todo.id === todoId ? {
        ...todo,
        comments: todo.comments.filter(c => c.id !== commentId)
      } : todo)
    )

    if (session?.user) {
      try {
        await fetch('/api/todos/comments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ todoId, commentId }),
        })
      } catch (error) {
        console.error('Failed to delete comment:', error)
        // Revert on error
        if (commentToDelete) {
          setTodos(prev =>
            prev.map(todo => todo.id === todoId ? {
              ...todo,
              comments: [...todo.comments, commentToDelete]
            } : todo)
          )
        }
      }
    }
  }

  // Filter todos based on showCompleted state and current workspace
  const filteredTodos = todos
    .filter(todo => todo.workspaceId === currentWorkspace || (!todo.workspaceId && currentWorkspace === 'personal'))
    .filter(todo => showCompleted ? true : !todo.completed);

  const deleteWorkspace = async (workspaceId: string) => {
    // Don't delete if there are incomplete todos
    const hasIncompleteTodos = todos.some(todo =>
      todo.workspaceId === workspaceId && !todo.completed
    )
    if (hasIncompleteTodos) {
      toast.error("Cannot delete workspace with incomplete todos")
      return
    }

    // Store workspace for potential revert
    const workspaceToDelete = workspaces.find(w => w.id === workspaceId)
    const workspaceName = workspaceToDelete?.name || 'Workspace'

    // Optimistic update
    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId))

    // If this was the current workspace, switch to another one
    if (workspaceId === currentWorkspace) {
      const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId)
      if (remainingWorkspaces.length > 0) {
        setCurrentWorkspace(remainingWorkspaces[0].id)
      }
    }

    if (session?.user) {
      try {
        const res = await fetch('/api/workspaces', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: workspaceId }),
        })
        if (!res.ok) throw new Error('Failed to delete workspace')

        toast(`${workspaceName} deleted`)
      } catch (error) {
        console.error('Failed to delete workspace:', error)
        toast.error(`Failed to delete ${workspaceName}`)

        // Revert on error
        if (workspaceToDelete) {
          setWorkspaces(prev => [...prev, workspaceToDelete])
          if (workspaceId === currentWorkspace) {
            setCurrentWorkspace(workspaceId)
          }
        }
      }
    } else {
      toast(`${workspaceName} deleted`)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (isMobile) return; // Prevent drag end handling on mobile
    
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped in its original position
    if (!destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)) {
      return;
    }

    // Find the todo that was dragged
    const todo = todos.find(t => t.id === draggableId);
    if (!todo) return;

    // Calculate new due date based on destination column
    // Start with today's date at midnight to ensure consistent dates across timezones
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let newDueDate = today;
    
    if (destination.droppableId.startsWith('desktop')) {
      const columnIndex = Number.parseInt(destination.droppableId.split('-')[2] ?? '', 10);
      if (Number.isNaN(columnIndex)) {
        console.warn('Unhandled droppableId:', destination.droppableId);
        return;
      }
      
      if (columnIndex === 0) {
        // Today's column - set to today
        newDueDate = new Date(today);
      } else if (columnIndex === 1) {
        // Next 7 days column - set to the middle of the range (today + 3 days)
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 3);
        newDueDate = nextWeek;
      } else {
        // Upcoming column - set to beyond next week
        const upcoming = new Date(today);
        upcoming.setDate(today.getDate() + 14);
        newDueDate = upcoming;
      }
    } else if (destination.droppableId.startsWith('tablet')) {
      const columnIndex = Number.parseInt(destination.droppableId.split('-')[2] ?? '', 10);
      if (Number.isNaN(columnIndex)) {
        console.warn('Unhandled droppableId:', destination.droppableId);
        return;
      }
      
      if (columnIndex === 0) {
        // Today's column
        newDueDate = new Date(today);
      } else {
        // Upcoming column - set to the middle of upcoming range (today + 7 days)
        const upcoming = new Date(today);
        upcoming.setDate(today.getDate() + 7);
        newDueDate = upcoming;
      }
    }

    // Format date as YYYY-MM-DD to avoid timezone issues
    const formattedDate = `${newDueDate.getFullYear()}-${String(newDueDate.getMonth() + 1).padStart(2, '0')}-${String(newDueDate.getDate()).padStart(2, '0')}`;
    
    // Update the todo's due date (midnight in local timezone)
    const updatedTodo = {
      ...todo,
      dueDate: `${formattedDate}T00:00:00.000Z`
    };

    // Create new array with updated todo
    const newTodos = todos.filter(t => t.id !== draggableId);
    newTodos.splice(destination.index, 0, updatedTodo);

    // Update state
    setTodos(newTodos);

    // Log the update
    console.log(`Todo "${todo.title}" moved to ${destination.droppableId} at index ${destination.index}`);

    // Update the database after animations finish
    if (session?.user) {
      setTimeout(async () => {
        try {
          const res = await fetch('/api/todos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: draggableId, dueDate: updatedTodo.dueDate }),
          });
          if (!res.ok) throw new Error('Failed to update todo via drag-and-drop');
          const serverTodo = await res.json();
          // Sync state with server response
          setTodos(prev => prev.map(t => t.id === draggableId ? serverTodo : t));
          console.log('✅ Todo dueDate updated on server via drag:', serverTodo);
        } catch (error) {
          console.error('❌ Error updating todo via drag:', error);
        }
      }, 350);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-[#09090B] text-gray-900 dark:text-white p-4 transition-colors duration-200">
      <div className="flex flex-row items-center justify-left relative z-10">
        <Image src="/logo.png" alt="agenda.dev" width={32} height={32} className="mr-2 block" />
        <h1 className="text-xl hidden md:block">agenda.dev</h1>
      </div>
      <div className="absolute top-4 right-4 flex items-center space-x-2 justify-center md:mb-0 md:mx-0 md:justify-start z-20">
        {session?.user && (
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            onSwitch={setCurrentWorkspace}
            onCreateNew={() => setIsNewWorkspaceDialogOpen(true)}
            onDelete={deleteWorkspace}
            todos={todos}
          />
        )}
        <CompletedToggle showCompleted={showCompleted} setShowCompleted={setShowCompleted} />
        {/* <ViewToggle isTableView={isTableView} setIsTableView={setIsTableView} /> */}
        <ThemeToggle />
        <FeedbackWidget />
        <LoginButton />
      </div>

      <motion.div
        layout
        className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Mobile Input (at bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-100 dark:bg-[#09090B] border-t border-gray-200 dark:border-white/10">
          <AITodoInput onAddTodo={addTodo} />
        </div>
        
        {/* Desktop Input (at top) */}
        <motion.div
          initial={false}
          className="w-full mt-1 md:mt-12 hidden md:block"
        >
          <motion.div
            initial={false}
            className="w-full sticky top-4 z-10 mb-8"
          >
            <AITodoInput onAddTodo={addTodo} />
          </motion.div>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {filteredTodos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="md:pb-0 mt-4 md:mt-0" // Adjusted padding and added top margin for mobile
            >
              <TodoList
                todos={filteredTodos}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onAddComment={addComment}
                onDeleteComment={deleteComment}
                onReschedule={rescheduleTodo}
                onDragEnd={handleDragEnd}
                disableDrag={isMobile} // Pass the isMobile flag to disable drag on mobile
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {session?.user && (
        <NewWorkspaceDialog
          isOpen={isNewWorkspaceDialogOpen}
          onClose={() => setIsNewWorkspaceDialogOpen(false)}
          onSubmit={async (name) => {
            try {
              const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
              });
              if (res.ok) {
                const workspace = await res.json();
                setWorkspaces(prev => [...prev, workspace]);
                setCurrentWorkspace(workspace.id);
              }
            } catch (error) {
              console.error('Failed to create workspace:', error);
            }
          }}
        />
      )}

      {/* 
        TODO: Implement command palette feature
        Tracking issue: #123 - Command Palette Implementation
        Priority: Medium - Planned for next sprint
      */}
    </div>
  )
} 