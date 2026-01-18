import { NextAuthOptions, getServerSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from './db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY || '',
        },
      },
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      // Generate a 6-character code and send it via email
      sendVerificationRequest: async ({ identifier, token, provider }) => {
        // Extract the first 6 characters from the token (NextAuth generates a long alphanumeric token)
        const code = token.slice(0, 6).toUpperCase()
        
        console.log('Sending verification email:', {
          email: identifier,
          fullToken: token,
          code: code,
          tokenLength: token.length,
        })
        
        // Store the code we're sending in the VerificationToken record
        // NextAuth might transform the token, so we find by identifier and update the most recent one
        try {
          // Find the most recent token for this identifier and update it with our code
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
          // Continue anyway - we'll try to match by token prefix as fallback
        }
        
        try {
          const result = await resend.emails.send({
            from: provider.from || 'onboarding@resend.dev',
            to: identifier,
            subject: 'Your Central sign-in code',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">Your sign-in code</h2>
                  <p>Use this code to sign in to Central:</p>
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
            throw new Error(result.error.message)
          }
        } catch (error) {
          console.error('Failed to send email:', error)
          throw error
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
        
        if (existingUser && !existingUser.orgId) {
          // Assign to default org if no org
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
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Ensure new users get assigned to default org
      if (user.id && !user.orgId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { orgId: 'default-org' },
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
