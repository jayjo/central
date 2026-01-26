import { NextAuthOptions, getServerSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
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
      from: process.env.EMAIL_FROM || 'noreply@nuclioapp.com',
      // Support both magic link and code-based auth
      sendVerificationRequest: async ({ identifier, token, url, provider }) => {
        // Log email attempt for debugging
        console.log('Sending verification email:', {
          identifier,
          from: provider.from,
          isMagicLink: url && (url.includes('callbackUrl') || url.startsWith('http')),
        })
        // Check if this is a magic link request (url contains the full callback URL)
        // Magic links have the full URL, code-based just uses the token
        const isMagicLink = url && (url.includes('callbackUrl') || url.startsWith('http'))
        
        if (isMagicLink) {
          // Send magic link email
          try {
            // Use verified domain email - must be from nuclioapp.com
            const fromEmail = process.env.EMAIL_FROM || provider.from || 'noreply@nuclioapp.com'
            console.log('Attempting to send magic link:', {
              from: fromEmail,
              to: identifier,
              hasApiKey: !!process.env.RESEND_API_KEY,
              emailFromEnv: process.env.EMAIL_FROM,
            })
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
                      <a href="${url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Sign In</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                    <p style="color: #666; font-size: 12px; word-break: break-all;">${url}</p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this link, you can safely ignore this email.</p>
                  </body>
                </html>
              `,
            })
            
            if (result.error) {
              const errorDetails = {
                error: result.error,
                errorMessage: typeof result.error === 'string' ? result.error : result.error?.message,
                errorName: result.error?.name,
                errorType: typeof result.error,
                identifier,
                from: provider.from,
              }
              console.error('Resend API error (magic link):', errorDetails)
              const errorMsg = typeof result.error === 'string' 
                ? result.error 
                : result.error?.message || JSON.stringify(result.error) || 'Failed to send email'
              throw new Error(errorMsg)
            }
          } catch (error: any) {
            console.error('Failed to send magic link email:', {
              error,
              errorMessage: error?.message,
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
          const code = token.slice(0, 6).toUpperCase()
          
          console.log('Sending verification email:', {
            email: identifier,
            fullToken: token,
            code: code,
            tokenLength: token.length,
          })
          
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
              console.log('Stored code in token:', { code, token: mostRecentToken.token.slice(0, 10) + '...' })
            } else {
              console.warn('No token found to store code for:', identifier)
            }
          } catch (error) {
            console.error('Failed to store code:', error)
          }
          
          try {
            const result = await getResend().emails.send({
              from: process.env.EMAIL_FROM || provider.from || 'noreply@nuclioapp.com',
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
              const errorDetails = {
                error: result.error,
                errorMessage: typeof result.error === 'string' ? result.error : result.error?.message,
                errorName: result.error?.name,
                errorType: typeof result.error,
                identifier,
                from: provider.from,
              }
              console.error('Resend API error (code-based):', errorDetails)
              const errorMsg = typeof result.error === 'string' 
                ? result.error 
                : result.error?.message || JSON.stringify(result.error) || 'Failed to send email'
              throw new Error(errorMsg)
            }
          } catch (error: any) {
            console.error('Failed to send verification code email:', {
              error,
              errorMessage: error?.message,
              errorName: error?.name,
              identifier,
              from: provider.from,
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
        } else if (existingUser && !existingUser.orgId) {
          // Assign to default org if no org and no pending invitation
          await prisma.user.update({
            where: { id: user.id },
            data: { orgId: 'default-org' },
          })
        } else if (!existingUser) {
          // This shouldn't happen with PrismaAdapter, but just in case
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email!,
              name: user.name,
              orgId: 'default-org',
            },
          })
        }
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
  },
  events: {
    async createUser({ user }) {
      // Ensure new users get assigned to default org
      if (user && typeof user === 'object' && 'id' in user) {
        const userId = (user as any).id
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, orgId: true },
        })
        if (dbUser && !dbUser.orgId) {
          await prisma.user.update({
            where: { id: userId },
            data: { orgId: 'default-org' },
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
