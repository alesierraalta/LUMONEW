import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <Image 
          src="/logo.png" 
          alt="LUMO Logo" 
          width={48} 
          height={48} 
          className="h-12 w-12 object-contain dark:invert"
        />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  )
}