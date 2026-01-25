# Nuclio - Shared Todo Hub

A shared todo app to keep people and families' digital lives centralized and together.

## Features

- **Personal & Shared Todos**: Create private todos or share them with your org or specific users
- **Task-Scoped Messaging**: Send messages tied to specific todos for contextual communication
- **Dashboard**: View weather, motivational messages, and recent todos
- **AI Integration**: (Coming soon) Use AI to extract and rationalize todos from natural language

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (email-based magic links)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Email**: Resend
- **Weather**: OpenWeatherMap API
- **AI**: OpenAI (for future features)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- API keys for:
  - OpenWeatherMap (free tier available)
  - Resend (for email)
  - OpenAI (optional, for AI features)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your actual values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your app URL (e.g., `http://localhost:3000`)
   - `OPENWEATHER_API_KEY`: Get from [OpenWeatherMap](https://openweathermap.org/api)
   - `RESEND_API_KEY`: Get from [Resend](https://resend.com)
   - `OPENAI_API_KEY`: Get from [OpenAI](https://platform.openai.com) (optional)

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Create your first org and user:**
   
   You'll need to create an organization and user in the database. You can do this via Prisma Studio:
   ```bash
   npx prisma studio
   ```
   
   Or use a seed script (create `prisma/seed.ts` if needed).

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Project Structure

```
central/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Auth routes
│   │   ├── (dashboard)/      # Protected dashboard routes
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboard/        # Dashboard widgets
│   │   ├── todos/            # Todo components
│   │   └── auth/             # Auth components
│   ├── lib/                  # Utility functions
│   │   ├── db.ts             # Prisma client
│   │   ├── auth.ts           # NextAuth config
│   │   ├── email.ts          # Email utilities
│   │   ├── weather.ts        # Weather API
│   │   └── ai.ts             # AI integration
│   └── types/                # TypeScript types
└── public/                   # Static assets
```

## Database Schema

The app uses Prisma with PostgreSQL. Key models:

- **User**: Users with email auth, belong to one org
- **Org**: Lightweight organization grouping
- **Todo**: Tasks with owner, visibility, status, priority
- **Message**: Task-scoped messages
- **MotivationalMessage**: Daily motivational messages
- **AIInteraction**: AI processing history

## Development

- **Generate Prisma client**: `npm run db:generate`
- **Push schema changes**: `npm run db:push`
- **Create migration**: `npm run db:migrate`
- **Open Prisma Studio**: `npm run db:studio`

## Deployment

This app is optimized for Vercel deployment:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables in Vercel dashboard
4. Set up Vercel Postgres (or use your own PostgreSQL)
5. Deploy!

## Future Features (V1+)

- Mobile app (React Native/Expo)
- Third-party integrations
- Automation rules
- Search functionality
- Bulk editing
- File uploads
- Public sharing links

## License

See LICENSE file for details.
