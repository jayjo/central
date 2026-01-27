import { NextAuthOptions, getServerSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

// Wrap PrismaAdapter to handle delete errors gracefully
function createSafeAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma) as Adapter
  
  return {
    ...baseAdapter,
    async deleteSession(sessionToken: string) {
      try {
        return await baseAdapter.deleteSession!(sessionToken)
      } catch (error: any) {
        // Ignore "record not found" errors - session might already be deleted
        if (error?.code === 'P2025' || error?.message?.includes('Record to delete does not exist')) {
          return null
        }
        throw error
      }
    },
    async deleteVerificationToken(identifier_token: { identifier: string; token: string }) {
      try {
        return await baseAdapter.deleteVerificationToken!(identifier_token)
      } catch (error: any) {
        // Ignore "record not found" errors - token might already be deleted
        if (error?.code === 'P2025' || error?.message?.includes('Record to delete does not exist')) {
          return null
        }
        throw error
      }
    },
  } as Adapter
}

export const authOptions: NextAuthOptions = {
  adapter: createSafeAdapter(),
  trustHost: true, // Allow any host for callback URLs (needed for magic links)
  // Explicitly set the base URL to avoid callback URL validation issues
  ...(process.env.NEXTAUTH_URL && { 
    url: process.env.NEXTAUTH_URL 
  }),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY || '',
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@notifications.nuclioapp.com',
      // Support both magic link and code-based auth
      sendVerificationRequest: async ({ identifier, token, url, provider }) => {
        // Check if this is a magic link request
        // Magic links have the full URL with /api/auth/callback/email, code-based uses /verify
        const isMagicLink = url && (url.includes('/api/auth/callback/email') || url.includes('callbackUrl') || url.startsWith('http'))
        
        if (isMagicLink) {
          // Reconstruct the URL without the callbackUrl parameter to avoid encoding issues
          // NextAuth will use the default redirect from our redirect callback
          try {
            const urlObj = new URL(url)
            // Remove the callbackUrl parameter - our redirect callback will handle the redirect
            urlObj.searchParams.delete('callbackUrl')
            
            // Remove any existing email parameter to avoid double-encoding
            urlObj.searchParams.delete('email')
            
            // Set email parameter using the raw identifier (URLSearchParams will encode it once)
            // This ensures it's only encoded once, not double-encoded by email clients
            urlObj.searchParams.set('email', identifier)
            
            const cleanUrl = urlObj.toString()
            
            // Validate environment variables
            if (!process.env.RESEND_API_KEY) {
              throw new Error('Email service is not configured. Please contact support.')
            }
            
            // Use verified domain email - must be from notifications.nuclioapp.com
            const fromEmail = process.env.EMAIL_FROM || provider.from || 'noreply@notifications.nuclioapp.com'
            const result = await getResend().emails.send({
              from: fromEmail,
              to: identifier,
              subject: 'Sign in to Nuclio',
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Sign in to Nuclio</h2>
                    <p>Click the button below to sign in to your account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${cleanUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Sign In</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                    <p style="color: #666; font-size: 12px; word-break: break-all;">${cleanUrl}</p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this link, you can safely ignore this email.</p>
                  </body>
                </html>
              `,
            })
            
            if (result.error) {
              const errorMsg = typeof result.error === 'string' 
                ? result.error 
                : result.error?.message || JSON.stringify(result.error) || 'Failed to send email'
              throw new Error(errorMsg)
            }
          } catch (error: any) {
            // Error sending magic link email
              errorName: error?.name,
              errorStack: error?.stack,
              identifier,
              from: provider.from,
            })
            // Re-throw with more context
            throw new Error(
              error?.message || 
              'Failed to send email. Please check your email address and try again.'
            )
          }
        } else {
          // Send code-based email (existing behavior)
          // Validate environment variables
          if (!process.env.RESEND_API_KEY) {
            throw new Error('Email service is not configured. Please contact support.')
          }
          
          const code = token.slice(0, 6).toUpperCase()
          
          // Store the code we're sending in the VerificationToken record
          try {
            const mostRecentToken = await prisma.verificationToken.findFirst({
              where: {
                identifier: identifier,
              },
              orderBy: {
                expires: 'desc',
              },
            })
            
            if (mostRecentToken) {
              await prisma.verificationToken.update({
                where: {
                  token: mostRecentToken.token,
                },
                data: {
                  code: code,
                },
              })
              // Code stored successfully
            } else {
              // No token found to store code
            }
          } catch (error) {
            // Failed to store code - continue anyway
          }
          
          try {
            const result = await getResend().emails.send({
              from: process.env.EMAIL_FROM || provider.from || 'noreply@notifications.nuclioapp.com',
              to: identifier,
              subject: 'Your Nuclio sign-in code',
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Your sign-in code</h2>
                    <p>Use this code to sign in to Nuclio:</p>
                    <div style="background-color: #f3f4f6; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; margin: 0;">${code}</p>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this code, you can safely ignore this email.</p>
                  </body>
                </html>
              `,
            })
            
            if (result.error) {
              const errorMsg = typeof result.error === 'string' 
                ? result.error 
                : result.error?.message || JSON.stringify(result.error) || 'Failed to send email'
              throw new Error(errorMsg)
            }
          } catch (error: any) {
            // Error sending verification code email
            })
            throw new Error(
              error?.message || 
              'Failed to send email. Please check your email address and try again.'
            )
          }
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Ensure user has an org assigned
      if (user.id) {
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { org: true },
        })
        
        // Check for pending invitation
        const pendingInvitation = await prisma.orgInvitation.findFirst({
          where: {
            email: user.email!.toLowerCase(),
            accepted: false,
            expires: {
              gt: new Date(),
            },
          },
        })

        if (pendingInvitation) {
          // Accept the invitation
          await prisma.orgInvitation.update({
            where: { id: pendingInvitation.id },
            data: { accepted: true },
          })
          
          // Update user's org
          await prisma.user.update({
            where: { id: user.id },
            data: { orgId: pendingInvitation.orgId },
          })
        } else if (existingUser) {
          // Existing user - ensure they have an org
          if (!existingUser.orgId || !existingUser.org) {
            // Create a new org for this user
            const newOrg = await prisma.org.create({
              data: {
                name: `${existingUser.name || existingUser.email}'s Organization`,
                slug: existingUser.id, // Use user ID as slug for uniqueness
              },
            })
            await prisma.user.update({
              where: { id: user.id },
              data: { orgId: newOrg.id },
            })
          }
        }
        // Note: New users are created by PrismaAdapter, handled in createUser event
      }
      return true
    },
    async session({ session, user }) {
      if (session.user && user) {
        // Type assertion: PrismaAdapter provides user with id
        const userWithId = user as { id: string; email?: string; name?: string | null; image?: string | null }
        if (userWithId.id) {
          (session.user as any).id = userWithId.id
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Try to get email from callback URL to look up org slug
      try {
        const urlObj = new URL(url, baseUrl)
        const emailParam = urlObj.searchParams.get('email')
        
        if (emailParam) {
          // Handle potential double-encoding
          let email = emailParam
          if (email.includes('%25')) {
            try {
              let decoded = decodeURIComponent(email)
              if (decoded.includes('%40')) {
                decoded = decodeURIComponent(decoded)
              }
              email = decoded
            } catch (e) {
              // Use original if decoding fails
            }
          }
          
          // Look up user's org slug
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { org: true },
          })
          
          if (user?.org?.slug) {
            return `${baseUrl}/${user.org.slug}`
          }
        }
      } catch (error) {
        // If anything fails, fall back to root
      }
      
      // Fallback to root - DashboardPage will handle org redirect
      return `${baseUrl}/`
    },
  },
  events: {
    async createUser({ user }) {
      // Create a new org for each new user
      if (user && typeof user === 'object' && 'id' in user) {
        const userId = (user as any).id
        const userEmail = (user as any).email
        const userName = (user as any).name
        
        // Create a new org for this user
        const newOrg = await prisma.org.create({
          data: {
            name: `${userName || userEmail || 'User'}'s Organization`,
            slug: userId, // Use user ID as slug for uniqueness
          },
        })
        
        // Update user to belong to their new org
        await prisma.user.update({
          where: { id: userId },
          data: { orgId: newOrg.id },
        })
      }
    },
  },
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getSession() {
  return await getServerSession(authOptions)
}
