import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { goals, milestones as milestonesTable, todos as todosTable, artifacts as artifactsTable, provenanceEvents, comments as commentsTable } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const planSchema = z.object({
  goal: z.object({ title: z.string(), summary: z.string().optional() }).strict(),
  milestones: z.array(
    z.object({
      title: z.string().min(1),
      summary: z.string().optional(),
      tasks: z.array(
        z.object({
          title: z.string().min(1),
          due: z.string().optional(),
          urgency: z.number().min(1).max(5).optional(),
          artifact: z
            .object({ type: z.string().default('doc'), filename: z.string().optional(), suggestedContent: z.string().optional() })
            .optional(),
        })
      ).default([]),
    })
  ).default([]),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const goalId = params.id;
    const goal = await db.query.goals.findFirst({ where: and(eq(goals.id, goalId), eq(goals.ownerId, session.user.id)) });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const modelName: string = body?.model || 'gpt-4o-mini';

    const system = `You are a planner. Given a goal title and context, produce strict JSON with { goal: {title, summary?}, milestones: [{title, summary?, tasks: [{title, due?, urgency?, artifact?:{type, filename?, suggestedContent?}}]}] }.
NO extra explanation. Respond JSON only.`;

    const userPrompt = `Goal: ${goal.title}\nDescription: ${goal.description ?? ''}`;
    const { text } = await generateText({ model: openai(modelName), system, prompt: userPrompt, temperature: 0.2, maxTokens: 1000 });

    // Be tolerant to fence/extra text; attempt to extract JSON
    const tryExtractJson = (s: string): any | null => {
      try { return JSON.parse(s); } catch {}
      // code fence ```json ... ``` or ``` ... ```
      const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fence) { try { return JSON.parse(fence[1]!.trim()); } catch {} }
      // first { ... last }
      const first = s.indexOf('{');
      const last = s.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        const sub = s.slice(first, last + 1);
        try { return JSON.parse(sub); } catch {}
      }
      return null;
    };

    const maybeJson = tryExtractJson(text);
    if (!maybeJson) {
      console.error('Planner returned non-JSON:', text);
      return NextResponse.json({ error: 'Planner returned invalid output' }, { status: 502 });
    }
    let parsed;
    try {
      parsed = planSchema.parse(maybeJson);
    } catch (err) {
      console.error('Planner JSON validation failed:', err, 'Output:', maybeJson);
      return NextResponse.json({ error: 'Planner output failed validation' }, { status: 502 });
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      // Update goal status
      await tx.update(goals).set({ status: 'active', updatedAt: now }).where(eq(goals.id, goalId));

      // Insert milestones and tasks
      for (let i = 0; i < parsed.milestones.length; i++) {
        const m = parsed.milestones[i]!;
        const milestoneId = uuidv4();
        await tx.insert(milestonesTable).values({ id: milestoneId, goalId, title: m.title, index: i, summary: m.summary ?? null, createdAt: now, updatedAt: now });

        for (const t of m.tasks) {
          // Determine if AI can execute (has suggested content for an artifact)
          const isAIExecutable = !!t.artifact?.suggestedContent;
          let artifactId: string | null = null;

          if (isAIExecutable) {
            artifactId = uuidv4();
            await tx.insert(artifactsTable).values({
              id: artifactId,
              goalId,
              milestoneId,
              type: t.artifact!.type || 'doc',
              name: t.artifact!.filename || `${t.title}.md`,
              path: null,
              externalId: null,
              content: t.artifact!.suggestedContent!,
              createdBy: 'ai',
              createdAt: now,
              updatedAt: now,
            });
          }

          const todoId = uuidv4();
          await tx.insert(todosTable).values({
            id: todoId,
            title: t.title,
            completed: false,
            userId: session.user.id,
            workspaceId: goal.workspaceId!,
            createdAt: now,
            updatedAt: now,
            dueDate: t.due ?? null,
            urgency: Math.round((t.urgency ?? 3) as number),
            goalId,
            milestoneId,
            assignee: isAIExecutable ? 'Teho' : null,
            artifactId: artifactId,
            status: isAIExecutable ? 'review' : 'pending',
          });

          if (isAIExecutable && artifactId) {
            // Leave a comment noting the draft creation
            await tx.insert(commentsTable).values({
              id: uuidv4(),
              text: `Draft created by Teho: ${t.artifact!.filename || `${t.title}.md`}`,
              todoId,
              userId: session.user.id, // attribute to current user for now
              createdAt: now,
            });
          }
        }
      }

      // Create plan.md and tasks.md artifacts
      const planMd = `# ${parsed.goal.title}\n\n${parsed.goal.summary ?? ''}`.trim();
      await tx.insert(artifactsTable).values({ id: uuidv4(), goalId, milestoneId: null, type: 'plan', name: 'plan.md', path: null, externalId: null, content: planMd, createdBy: 'ai', createdAt: now, updatedAt: now });

      const lines: string[] = [];
      parsed.milestones.forEach((m, idx) => {
        lines.push(`## ${idx + 1}. ${m.title}`);
        if (m.summary) lines.push(m.summary);
        m.tasks.forEach((t) => lines.push(`- [ ] ${t.title}${t.due ? ` (due: ${t.due})` : ''}`));
        lines.push('');
      });
      await tx.insert(artifactsTable).values({ id: uuidv4(), goalId, milestoneId: null, type: 'tasks', name: 'tasks.md', path: null, externalId: null, content: lines.join('\n'), createdBy: 'ai', createdAt: now, updatedAt: now });

      // provenance
      await tx.insert(provenanceEvents).values({
        id: uuidv4(),
        subjectType: 'goal',
        subjectId: goalId,
        eventType: 'plan_generated',
        payload: JSON.stringify({ model: modelName }),
        actor: 'ai',
        createdAt: now,
      });
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to generate plan';
    console.error('Failed to generate plan:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
