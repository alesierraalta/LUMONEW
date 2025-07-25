import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  )
}