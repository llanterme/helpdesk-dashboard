import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { microsoftGraph } from '@/lib/email'
import crypto from 'crypto'

// GET /api/email/callback - OAuth callback from Microsoft
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUrl = `${baseUrl}/settings/email`

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent('Missing authorization code or state')}`
      )
    }

    // Find account by state token
    const accounts = await prisma.emailAccount.findMany({
      where: {
        syncError: { contains: state },
      },
    })

    if (accounts.length === 0) {
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent('Invalid OAuth state - session expired')}`
      )
    }

    const account = accounts[0]
    let stateData: { oauthState: string; accountId: string }

    try {
      stateData = JSON.parse(account.syncError || '{}')
    } catch {
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent('Invalid OAuth state data')}`
      )
    }

    if (stateData.oauthState !== state) {
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent('OAuth state mismatch')}`
      )
    }

    // Exchange code for tokens
    const tokens = await microsoftGraph.exchangeCodeForTokens(
      code,
      account.tenantId || 'common'
    )

    // Get user profile to verify email
    const profile = await microsoftGraph.getUserProfile(tokens.access_token)

    // Verify email matches (case-insensitive)
    if (profile.mail?.toLowerCase() !== account.email.toLowerCase() &&
        profile.userPrincipalName?.toLowerCase() !== account.email.toLowerCase()) {
      // Update account email if different
      console.log(
        `Email mismatch: expected ${account.email}, got ${profile.mail || profile.userPrincipalName}`
      )
    }

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex')

    // Create webhook subscription
    const notificationUrl = `${baseUrl}/api/webhooks/email`
    let subscription
    try {
      subscription = await microsoftGraph.createSubscription(
        tokens.access_token,
        notificationUrl,
        webhookSecret
      )
    } catch (subError) {
      console.error('Failed to create webhook subscription:', subError)
      // Continue without webhook - can be set up later
    }

    // Update account with tokens and subscription
    await prisma.emailAccount.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        subscriptionId: subscription?.id,
        subscriptionExpiry: subscription
          ? new Date(subscription.expirationDateTime)
          : null,
        isActive: true,
        syncEnabled: true,
        syncError: null, // Clear the state data
        lastSyncAt: new Date(),
      },
    })

    return NextResponse.redirect(`${redirectUrl}?success=true&account=${account.id}`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during OAuth'
    return NextResponse.redirect(
      `${baseUrl}/settings/email?error=${encodeURIComponent(errorMessage)}`
    )
  }
}
