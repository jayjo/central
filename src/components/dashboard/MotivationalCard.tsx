import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MotivationalCard({ message }: { message: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message of the Day</CardTitle>
      </CardHeader>
      <CardContent>
        {message ? (
          <p className="text-sm italic leading-relaxed">"{message}"</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No message set for today
          </p>
        )}
      </CardContent>
    </Card>
  )
}
