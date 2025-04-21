export interface Todo {
  id: string
  text: string
  date: string
  urgency: number
  completed: boolean
  createdAt: Date
  comments: Comment[]
}

export interface Comment {
  id: string
  text: string
  createdAt: Date
}
