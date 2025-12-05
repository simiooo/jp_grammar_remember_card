import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ContributionGridProps {
  /** Array of item data */
  data: Array<{
    id: string; // unique identifier
    value: number; // 0-100 for mastery, or any number
    label?: string; // optional display label
  }>;
  /** Color palette for intensity levels (default mastery colors) */
  colors?: string[];
  /** Number of columns (default auto-calculated) */
  columns?: number;
  /** Whether to show tooltip on hover (default true) */
  showTooltip?: boolean;
  /** Callback when a cell is clicked */
  onCellClick?: (id: string, value: number) => void;
  /** Custom class name for the grid container */
  className?: string;
  /** Size of each cell in pixels (default 20) */
  cellSize?: number;
}

const DEFAULT_COLORS = [
  "bg-gray-100", // level 0 (0%)
  "bg-emerald-300", // level 1 (1-25%)
  "bg-emerald-500", // level 2 (26-50%)
  "bg-emerald-700", // level 3 (51-75%)
  "bg-emerald-900", // level 4 (76-100%)
];

/**
 * ContributionGrid component that displays a GitHub-like grid of items.
 * Time-agnostic, each cell represents an item (e.g., grammar point).
 */
export function ContributionGrid({
  data,
  colors = DEFAULT_COLORS,
  columns = 10,
  showTooltip = true,
  onCellClick,
  className,
  cellSize = 20,
}: ContributionGridProps) {
  // Determine color index based on value (assuming value 0-100)
  const getColorIndex = (value: number) => {
    if (value <= 0) return 0;
    if (value <= 25) return 1;
    if (value <= 50) return 2;
    if (value <= 75) return 3;
    return 4;
  };

  // Arrange items into rows
  const rows = React.useMemo(() => {
    const rowCount = Math.ceil(data.length / columns);
    const rowsArray = [];
    for (let i = 0; i < rowCount; i++) {
      rowsArray.push(data.slice(i * columns, (i + 1) * columns));
    }
    return rowsArray;
  }, [data, columns]);

  const handleCellClick = (id: string, value: number) => {
    onCellClick?.(id, value);
  };

  // Generate column headers (optional)
  const columnHeaders = Array.from({ length: columns }, (_, i) => i + 1);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Column headers (optional) */}
      <div className="flex gap-1 pl-6">
        {columnHeaders.map((col) => (
          <div
            key={col}
            className="text-xs text-muted-foreground text-center"
            style={{ width: cellSize }}
          >
            {col}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {/* Row labels (optional) */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground mr-2">
          {rows.map((_, idx) => (
            <div
              key={idx}
              className="h-4 flex items-center justify-end"
              style={{ height: cellSize }}
            >
              {idx + 1}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex flex-col gap-1">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {row.map((item) => {
                const colorIndex = getColorIndex(item.value);
                const colorClass = colors[colorIndex] || colors[0];
                const cellElement = (
                  <button
                    key={item.id}
                    className={cn(
                      "rounded-sm border border-border hover:scale-110 transition-transform",
                      colorClass,
                      item.value > 0 && "cursor-pointer"
                    )}
                    style={{
                      width: cellSize,
                      height: cellSize,
                    }}
                    onClick={() => handleCellClick(item.id, item.value)}
                    aria-label={`${item.label || item.id}: ${item.value}% mastery`}
                  />
                );

                if (showTooltip) {
                  return (
                    <TooltipProvider key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>{cellElement}</TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="font-medium">{item.label || item.id}</p>
                          <p className="text-xs text-muted-foreground">
                            掌握程度: {item.value}%
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
                return cellElement;
              })}
              {/* Fill empty cells if row is incomplete */}
              {row.length < columns &&
                Array.from({ length: columns - row.length }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="rounded-sm border border-transparent"
                    style={{ width: cellSize, height: cellSize }}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}