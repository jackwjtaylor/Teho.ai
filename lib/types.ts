export interface Todo {
  id: string
  title: string
  completed: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  comments: Comment[]
  dueDate?: string
  urgency: number
}

export interface Comment {
  id: string
  text: string
  todoId: string
  userId: string
  createdAt: Date
  user?: {
    name: string
    image: string | null
  }
}
