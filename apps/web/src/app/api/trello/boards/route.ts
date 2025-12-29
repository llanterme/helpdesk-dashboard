import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBoards, createBoard, isTrelloConfigured } from '@/lib/trello'

// GET /api/trello/boards - List all boards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isTrelloConfigured()) {
      return NextResponse.json(
        { error: 'Trello integration not configured' },
        { status: 503 }
      )
    }

    const boards = await getBoards()
    return NextResponse.json(boards)
  } catch (error) {
    console.error('Error fetching Trello boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    )
  }
}

// POST /api/trello/boards - Create a new board
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isTrelloConfigured()) {
      return NextResponse.json(
        { error: 'Trello integration not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { name, desc, defaultLists } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      )
    }

    const board = await createBoard({ name, desc, defaultLists })
    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    console.error('Error creating Trello board:', error)
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    )
  }
}
