import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos, comments, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userTodos = await db.select({
      todos: todos,
      comments: comments,
      commentUser: users
    })
    .from(todos)
    .where(eq(todos.userId, session.user.id))
    .leftJoin(comments, eq(comments.todoId, todos.id))
    .leftJoin(users, eq(users.id, comments.userId));

    // Group comments by todo
    const groupedTodos = userTodos.reduce((acc: any[], row) => {
      const todo = acc.find(t => t.id === row.todos.id);
      if (todo) {
        if (row.comments) {
          todo.comments.push({
            ...row.comments,
            user: row.commentUser ? {
              name: row.commentUser.name,
              image: row.commentUser.image
            } : null
          });
        }
      } else {
        acc.push({
          ...row.todos,
          comments: row.comments ? [{
            ...row.comments,
            user: row.commentUser ? {
              name: row.commentUser.name,
              image: row.commentUser.image
            } : null
          }] : []
        });
      }
      return acc;
    }, []);

    return NextResponse.json(groupedTodos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, dueDate, urgency = 1 } = await req.json();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const todo = await db.insert(todos).values({
    id: uuidv4(),
    title,
    userId: session.user.id,
    completed: false,
    dueDate: dueDate || null,
    urgency,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return NextResponse.json({ ...todo[0], comments: [] });
}

export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, completed } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
  }

  // Update the todo
  await db.update(todos)
    .set({ 
      completed, 
      updatedAt: new Date() 
    })
    .where(
      and(
        eq(todos.id, id),
        eq(todos.userId, session.user.id)
      )
    );

  // Fetch the updated todo with its comments
  const updatedTodo = await db.select({
    todos: todos,
    comments: comments,
    commentUser: users
  })
  .from(todos)
  .where(and(eq(todos.id, id), eq(todos.userId, session.user.id)))
  .leftJoin(comments, eq(comments.todoId, todos.id))
  .leftJoin(users, eq(users.id, comments.userId));

  // Format the response similar to GET route
  const formattedTodo = updatedTodo.reduce((acc: any, row) => {
    if (!acc.id) {
      acc = {
        ...row.todos,
        comments: []
      };
    }
    if (row.comments) {
      acc.comments.push({
        ...row.comments,
        user: row.commentUser ? {
          name: row.commentUser.name,
          image: row.commentUser.image
        } : null
      });
    }
    return acc;
  }, {});

  return NextResponse.json(formattedTodo);
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
  }

  await db.delete(todos)
    .where(
      and(
        eq(todos.id, id),
        eq(todos.userId, session.user.id)
      )
    );

  return NextResponse.json({ success: true });
} 