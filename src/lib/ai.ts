import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIExtractedTodo {
  title: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
}

export interface AIRationalization {
  summary: string
  suggestedTodos: AIExtractedTodo[]
  suggestedActions: string[]
}

export async function extractTodosFromText(
  text: string
): Promise<AIExtractedTodo[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const prompt = `Extract actionable todo items from the following text. Return a JSON object with a "todos" array. Each todo should have "title" (required), optional "priority" (LOW/MEDIUM/HIGH), and optional "dueDate" (YYYY-MM-DD format).

Text: "${text}"

Return only valid JSON in this format: {"todos": [{"title": "...", "priority": "MEDIUM", "dueDate": "2024-01-15"}]}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0].message.content || '{"todos": []}')
  return response.todos || []
}

export async function rationalizeRequest(
  request: string,
  context?: { todos?: any[]; messages?: any[] }
): Promise<AIRationalization> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const contextStr = context
    ? `\n\nContext:\nTodos: ${JSON.stringify(context.todos)}\nMessages: ${JSON.stringify(context.messages)}`
    : ''

  const prompt = `Analyze this request and provide:
1. A brief summary
2. Suggested todo items (JSON array with title, optional priority, optional dueDate)
3. Suggested actions

Request: "${request}"${contextStr}

Return JSON: {"summary": "...", "suggestedTodos": [...], "suggestedActions": [...]}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  return {
    summary: result.summary || '',
    suggestedTodos: result.suggestedTodos || [],
    suggestedActions: result.suggestedActions || [],
  }
}
