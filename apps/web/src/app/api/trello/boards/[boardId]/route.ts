import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBoard, getBoardLists, getBoardCards, getBoardMembers, getBoardLabels, isTrelloConfigured } from '@/lib/trello'

interface RouteParams {
  params: Promise<{ boardId: string }>
}

// GET /api/trello/boards/[boardId] - Get board with lists and cards
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
    const { searchParams } = new URL(request.url)
    const includeCards = searchParams.get('cards') !== 'false'
    const includeMembers = searchParams.get('members') === 'true'
    const includeLabels = searchParams.get('labels') === 'true'

    // Fetch board and lists in parallel
    const [board, lists] = await Promise.all([
      getBoard(boardId),
      getBoardLists(boardId),
    ])

    const result: Record<string, unknown> = { board, lists }

    // Optionally fetch cards, members, and labels
    const additionalFetches: Promise<unknown>[] = []
    const fetchKeys: string[] = []

    if (includeCards) {
      additionalFetches.push(getBoardCards(boardId))
      fetchKeys.push('cards')
    }
    if (includeMembers) {
      additionalFetches.push(getBoardMembers(boardId))
      fetchKeys.push('members')
    }
    if (includeLabels) {
      additionalFetches.push(getBoardLabels(boardId))
      fetchKeys.push('labels')
    }

    if (additionalFetches.length > 0) {
      const additionalResults = await Promise.all(additionalFetches)
      fetchKeys.forEach((key, index) => {
        result[key] = additionalResults[index]
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching Trello board:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board' },
      { status: 500 }
    )
  }
}
