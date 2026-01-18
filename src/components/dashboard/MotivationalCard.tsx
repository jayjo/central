import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MotivationalMessage {
  message: string
  author: string | null
  category: string | null
}

export function MotivationalCard({ message }: { message: MotivationalMessage | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Inspiration</CardTitle>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="space-y-3">
            <p className="text-sm italic leading-relaxed">"{message.message}"</p>
            {message.author && message.author.trim() && (
              <p className="text-xs font-medium text-muted-foreground text-right mt-2">
                — {message.author}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No message set for today
          </p>
        )}
      </CardContent>
    </Card>
  )
}
