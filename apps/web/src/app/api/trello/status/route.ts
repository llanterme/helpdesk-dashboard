import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isTrelloConfigured, getBoards } from '@/lib/trello'

// GET /api/trello/status - Check Trello integration status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configured = isTrelloConfigured()

    if (!configured) {
      return NextResponse.json({
        configured: false,
        connected: false,
        message: 'Trello integration not configured. Set TRELLO_API_KEY and TRELLO_TOKEN.',
      })
    }

    // Test the connection by fetching boards
    try {
      const boards = await getBoards()
      return NextResponse.json({
        configured: true,
        connected: true,
        boardCount: boards.length,
        message: `Connected to Trello. ${boards.length} board(s) accessible.`,
      })
    } catch (error) {
      return NextResponse.json({
        configured: true,
        connected: false,
        message: 'Trello credentials configured but connection failed. Check your API key and token.',
      })
    }
  } catch (error) {
    console.error('Error checking Trello status:', error)
    return NextResponse.json(
      { error: 'Failed to check Trello status' },
      { status: 500 }
    )
  }
}
