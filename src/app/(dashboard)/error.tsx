'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/login"
            className="px-4 py-2 border border-input bg-background rounded-md hover:bg-accent"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}
