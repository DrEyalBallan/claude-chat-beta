import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: message }],
    })

    const textContent = response.content.find(block => block.type === 'text')
    
    return NextResponse.json({ 
      message: textContent ? textContent.text : 'No response available'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}