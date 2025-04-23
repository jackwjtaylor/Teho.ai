# Workspace Implementation Plan

## Overview
Add workspace support to todo-exon while maintaining the current minimal, beautiful UI design. This implementation will be done in phases to ensure stability.

## Phase 1: Database Schema

### 1. Create New Migration
```sql
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workspace_members (
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE todos ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
```

### 2. Update Schema Types (lib/db/schema.ts)
```typescript
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "member"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey(t.workspaceId, t.userId),
}));

// Update todos table
export const todos = pgTable("todos", {
  // ... existing fields ...
  workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
});
```

## Phase 2: Types and API

### 1. Update Types (lib/types.ts)
```typescript
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'member';
  user?: {
    name: string;
    image?: string;
  };
}

// Update existing Todo interface
export interface Todo {
  // ... existing fields ...
  workspaceId: string;
}
```

### 2. Add Workspace API Routes

#### app/api/workspaces/route.ts
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth.api.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userWorkspaces = await db
    .select()
    .from(workspaces)
    .leftJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, session.user.id));

  return NextResponse.json(userWorkspaces);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  const workspaceId = uuidv4();

  // Create workspace
  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({
      id: workspaceId,
      name,
      ownerId: session.user.id,
    });

    // Add owner as member
    await tx.insert(workspaceMembers).values({
      workspaceId,
      userId: session.user.id,
      role: 'owner',
    });
  });

  return NextResponse.json({ id: workspaceId });
}
```

## Phase 3: UI Components

### 1. Create Workspace Switcher (components/workspace-switcher.tsx)
```typescript
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus } from "lucide-react"
import type { Workspace } from "@/lib/types"

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  currentWorkspace: string
  onSwitch: (id: string) => void
  onCreateNew: () => void
}

export default function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  onSwitch,
  onCreateNew
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const current = workspaces.find(w => w.id === currentWorkspace)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 rounded-full bg-white dark:bg-[#131316] flex items-center gap-2 shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24),0px_0px_0px_1px_rgba(0,0,0,1.00),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] transition-colors duration-200"
      >
        <span className="text-sm text-gray-900 dark:text-white">{current?.name || "Personal"}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 mt-2 w-48 py-1 bg-white dark:bg-[#131316] rounded-lg shadow-lg dark:shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.24),0px_0px_0px_1px_rgba(0,0,0,1.00),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] z-50"
          >
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  onSwitch(workspace.id)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white transition-colors duration-200"
              >
                {workspace.name}
              </button>
            ))}
            <button
              onClick={() => {
                onCreateNew()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Workspace</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 2. Create New Workspace Dialog (components/new-workspace-dialog.tsx)
```typescript
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="w-full max-w-md bg-white dark:bg-[#131316] rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">New Workspace</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
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
                  className="px-4 py-2 text-sm bg-gradient-to-b from-[#7c5aff] to-[#6c47ff] text-white rounded-lg hover:from-[#8f71ff] hover:to-[#7c5aff] transition-all duration-200"
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
```

### 3. Update Page Component (app/page.tsx)
```typescript
// Add new state
const [currentWorkspace, setCurrentWorkspace] = usePersistentState<string>('currentWorkspace', 'personal');
const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
const [isNewWorkspaceDialogOpen, setIsNewWorkspaceDialogOpen] = useState(false);

// Add to the header section
<div className="relative mx-auto mb-4 flex items-center space-x-2 justify-center md:absolute md:top-4 md:right-4 md:mb-0 md:mx-0 md:justify-start">
  <WorkspaceSwitcher
    workspaces={workspaces}
    currentWorkspace={currentWorkspace}
    onSwitch={setCurrentWorkspace}
    onCreateNew={() => setIsNewWorkspaceDialogOpen(true)}
  />
  <CompletedToggle showCompleted={showCompleted} setShowCompleted={setShowCompleted} />
  {/* ... existing buttons ... */}
</div>

<NewWorkspaceDialog
  isOpen={isNewWorkspaceDialogOpen}
  onClose={() => setIsNewWorkspaceDialogOpen(false)}
  onSubmit={async (name) => {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const { id } = await res.json();
    setWorkspaces(prev => [...prev, { id, name, ownerId: session?.user?.id || '', createdAt: new Date(), updatedAt: new Date() }]);
    setCurrentWorkspace(id);
  }}
/>
```

## Implementation Order

1. Database Changes
   - Run migration to add workspace tables and update todos table
   - Update schema types

2. API Implementation
   - Add workspace API endpoints
   - Modify todo endpoints to filter by workspace

3. UI Components
   - Add WorkspaceSwitcher component
   - Add NewWorkspaceDialog component
   - Update page component with workspace state

4. Testing & Polish
   - Test workspace switching
   - Test todo isolation between workspaces
   - Ensure UI transitions are smooth
   - Verify dark/light mode compatibility

## Notes

- This implementation maintains the existing UI design language
- Uses the same shadow and color patterns as existing components
- Keeps animations consistent with the rest of the app
- Preserves the dark/light mode support
- Follows the minimal design aesthetic 