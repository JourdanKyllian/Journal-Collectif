import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // On utilise ta couleur champagne avec une opacité de 20% pour coller à ton thème
      className={cn("animate-pulse rounded-md bg-champagne/20", className)}
      {...props}
    />
  )
}

export { Skeleton }