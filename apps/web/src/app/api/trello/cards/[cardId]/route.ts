import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getCard,
  updateCard,
  deleteCard,
  moveCard,
  isTrelloConfigured,
} from '@/lib/trello'

interface RouteParams {
  params: Promise<{ cardId: string }>
}

// GET /api/trello/cards/[cardId] - Get a specific card
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

    const { cardId } = await params
    const card = await getCard(cardId)
    return NextResponse.json(card)
  } catch (error) {
    console.error('Error fetching Trello card:', error)
    return NextResponse.json(
      { error: 'Failed to fetch card' },
      { status: 500 }
    )
  }
}

// PUT /api/trello/cards/[cardId] - Update a card
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { cardId } = await params
    const body = await request.json()

    const card = await updateCard(cardId, body)
    return NextResponse.json(card)
  } catch (error) {
    console.error('Error updating Trello card:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

// PATCH /api/trello/cards/[cardId] - Move a card to a different list
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { cardId } = await params
    const body = await request.json()
    const { idList, pos } = body

    if (!idList) {
      return NextResponse.json(
        { error: 'idList is required to move a card' },
        { status: 400 }
      )
    }

    const card = await moveCard(cardId, idList, pos)
    return NextResponse.json(card)
  } catch (error) {
    console.error('Error moving Trello card:', error)
    return NextResponse.json(
      { error: 'Failed to move card' },
      { status: 500 }
    )
  }
}

// DELETE /api/trello/cards/[cardId] - Delete a card
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { cardId } = await params
    await deleteCard(cardId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Trello card:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}
