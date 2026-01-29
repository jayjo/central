import { NextAuthOptions, getServerSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import type { Adapter, AdapterUser } from 'next-auth/adapters'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

// Wrap PrismaAdapter to handle delete errors and ensure new users get a valid org
function createSafeAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma) as Adapter

  return {
    ...baseAdapter,
    async createUser(user: Omit<AdapterUser, 'id'>) {
      // Create an org first so User's orgId foreign key is satisfied (no "default-org" dependency)
      const newOrg = await prisma.org.create({
        data: {
          name: `${user.name || user.email || 'User'}'s Organization`,
          slug: `org-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        },
      })
      const created = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.name ?? null,
          emailVerified: user.emailVerified ?? null,
          image: user.image ?? null,
          orgId: newOrg.id,
        },
      })
      return {
        id: created.id,
        email: created.email,
        name: created.name,
        emailVerified: created.emailVerified,
        image: created.image,
      }
    },
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
  } as Adapter
}

export const authOptions: NextAuthOptions = {
  adapter: createSafeAdapter(),
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
              
              // Remove email parameter - we'll get it from the session in the redirect callback
              // This makes the URL cleaner and less likely to trigger security warnings
              urlObj.searchParams.delete('email')
              
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
      // Redirect to root - DashboardPage will handle org redirect based on session
      // This avoids needing email in the URL, making links cleaner and less likely to trigger security warnings
      return `${baseUrl}/`
    },
  },
  events: {
    async createUser({ user }) {
      // Only fix users that still have the schema default org (e.g. from another adapter path or legacy)
      if (user && typeof user === 'object' && 'id' in user) {
        const userId = (user as any).id
        const existing = await prisma.user.findUnique({
          where: { id: userId },
          include: { org: true },
        })
        if (existing?.orgId === 'default-org' || !existing?.org) {
          const userEmail = (existing?.email ?? (user as any).email) as string
          const userName = (existing?.name ?? (user as any).name) as string | null
          const newOrg = await prisma.org.create({
            data: {
              name: `${userName || userEmail || 'User'}'s Organization`,
              slug: `org-${userId}`,
            },
          })
          await prisma.user.update({
            where: { id: userId },
            data: { orgId: newOrg.id },
          })
        }
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
