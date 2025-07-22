import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../../lib/db'

interface MessageRow {
  id: string;
  role: string;
  content: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  let client: any = null;

  try {
    const { conversationId, userId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversation ID' }, { status: 400 })
    }

    // Get conversation history from database
    client = await pool.connect()
    
    const result = await client.query(
      'SELECT id, role, content, timestamp FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC',
      [conversationId]
    )

    const messages = result.rows.map((row: MessageRow) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp
    }))

    return NextResponse.json({
      messages: messages,
      conversationId: conversationId,
      count: messages.length
    })

  } catch (error) {
    console.error('Error fetching conversation history:', error)
    return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 })
  } finally {
    if (client) {
      try {
        client.release()
      } catch (releaseError) {
        console.error('Error releasing database client:', releaseError)
      }
    }
  }
}