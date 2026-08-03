import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { SectionHeader } from "@/components/utility/SectionHeader"
import { cn } from "@/lib/utils"
import type { UbitsCarouselProps } from "./mediaTypes"

/**
 * UbitsCarousel - Enterprise wrapper for shadcn Carousel.
 * Provides a consistent layout with titles, controls, and dot indicators.
 */
export function UbitsCarousel({
  children,
  title,
  description,
  actions,
  showControls = true,
  showDots = false,
  loop = false,
  orientation = "horizontal",
  className,
  contentClassName,
  itemClassName,
  ariaLabel,
}: UbitsCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const scrollTo = React.useCallback(
    (index: number) => api?.scrollTo(index),
    [api]
  )

  const items = React.Children.toArray(children)

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <SectionHeader 
          title={title} 
          description={description} 
          actions={actions} 
        />
      )}

      <Carousel
        setApi={setApi}
        orientation={orientation}
        opts={{
          loop,
          align: "start",
        }}
        className="w-full"
        aria-label={ariaLabel || title}
      >
        <CarouselContent className={contentClassName}>
          {items.map((item, index) => (
            <CarouselItem key={index} className={itemClassName}>
              {item}
            </CarouselItem>
          ))}
        </CarouselContent>

        {showControls && (
          <>
            <CarouselPrevious className="hidden md:inline-flex" />
            <CarouselNext className="hidden md:inline-flex" />
          </>
        )}
      </Carousel>

      {showDots && count > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                i === current 
                  ? "w-6 bg-primary" 
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
