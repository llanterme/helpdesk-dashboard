import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBoardLists, createList, isTrelloConfigured } from '@/lib/trello'

interface RouteParams {
  params: Promise<{ boardId: string }>
}

// GET /api/trello/boards/[boardId]/lists - Get all lists on a board
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { boardId } = await params
    const lists = await getBoardLists(boardId)
    return NextResponse.json(lists)
  } catch (error) {
    console.error('Error fetching Trello lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    )
  }
}

// POST /api/trello/boards/[boardId]/lists - Create a new list
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { boardId } = await params
    const body = await request.json()
    const { name, pos } = body

    if (!name) {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      )
    }

    const list = await createList({ name, idBoard: boardId, pos })
    return NextResponse.json(list, { status: 201 })
  } catch (error) {
    console.error('Error creating Trello list:', error)
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    )
  }
}
