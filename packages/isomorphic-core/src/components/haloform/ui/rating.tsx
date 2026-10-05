import * as React from "react";
import { cn } from "@haloform/lib/utils";
import { Star, Smile } from "lucide-react";

export interface RatingProps {
  max?: number;
  value?: number;
  onChange?: (value: number) => void;
  type?: "star" | "emoji";
  readOnly?: boolean;
  className?: string;
}

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      max = 5,
      value = 0,
      onChange,
      type = "star",
      readOnly = false,
      className,
    },
    ref
  ) => {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);

    const handleMouseEnter = (index: number) => {
      if (readOnly) return;
      setHoverValue(index);
    };

    const handleMouseLeave = () => {
      if (readOnly) return;
      setHoverValue(null);
    };

    const handleClick = (index: number) => {
      if (readOnly) return;
      onChange?.(index);
    };

    const renderStar = (index: number) => {
      const filled = hoverValue !== null ? hoverValue >= index : value >= index;

      if (type === "star") {
        return (
          <Star
            key={index}
            size={24}
            className={cn(
              "transition-colors cursor-pointer",
              filled
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground",
              readOnly && "cursor-default"
            )}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          />
        );
      } else {
        // Emoji rating
        return (
          <div
            key={index}
            className={cn(
              "text-xl transition-all cursor-pointer",
              filled ? "opacity-100 scale-110" : "opacity-50 scale-95",
              readOnly && "cursor-default"
            )}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}>
            {index === 1
              ? "😞"
              : index === 2
                ? "😕"
                : index === 3
                  ? "😐"
                  : index === 4
                    ? "🙂"
                    : index === 5
                      ? "😄"
                      : "🤩"}
          </div>
        );
      }
    };

    return (
      <div ref={ref} className={cn("flex items-center gap-1", className)}>
        {Array.from({ length: max }, (_, i) => renderStar(i + 1))}
      </div>
    );
  }
);

Rating.displayName = "Rating";
