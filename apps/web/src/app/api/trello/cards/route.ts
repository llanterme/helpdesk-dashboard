import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCard, isTrelloConfigured } from '@/lib/trello'

// POST /api/trello/cards - Create a new card
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
    const { name, desc, idList, pos, due, idMembers, idLabels } = body

    if (!name || !idList) {
      return NextResponse.json(
        { error: 'Card name and idList are required' },
        { status: 400 }
      )
    }

    const card = await createCard({
      name,
      desc,
      idList,
      pos,
      due,
      idMembers,
      idLabels,
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error('Error creating Trello card:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
}
