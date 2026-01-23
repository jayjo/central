import { NextAuthOptions, getServerSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

const resend = new Resend(process.env.RESEND_API_KEY)

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
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      // Support both magic link and code-based auth
      sendVerificationRequest: async ({ identifier, token, url, provider }) => {
        // Check if this is a magic link request (url contains the full callback URL)
        // Magic links have the full URL, code-based just uses the token
        const isMagicLink = url && (url.includes('callbackUrl') || url.startsWith('http'))
        
        if (isMagicLink) {
          // Send magic link email
          try {
            const result = await resend.emails.send({
              from: provider.from || 'onboarding@resend.dev',
              to: identifier,
              subject: 'Sign in to Central',
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Sign in to Central</h2>
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
              throw new Error(result.error.message)
            }
          } catch (error) {
            console.error('Failed to send magic link email:', error)
            throw error
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
