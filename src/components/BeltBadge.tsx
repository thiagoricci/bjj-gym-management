import { Badge } from "@/components/ui/badge";

export enum BeltRank {
  White = "white",
  Blue = "blue",
  Purple = "purple",
  Brown = "brown",
  Black = "black",
}

interface BeltBadgeProps {
  rank: BeltRank;
  className?: string;
}

const beltConfig = {
  white: { label: "White Belt", color: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-400" },
  blue: { label: "Blue Belt", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  purple: { label: "Purple Belt", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-600" },
  brown: { label: "Brown Belt", color: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-700" },
  black: { label: "Black Belt", color: "bg-slate-900 text-white border-slate-900", dot: "bg-white" },
};

export default function BeltBadge({ rank, className }: BeltBadgeProps) {
  const normalizedRank = (rank?.toLowerCase() as BeltRank) || "white";
  const config = beltConfig[normalizedRank] || beltConfig.white;

  return (
    <Badge variant="outline" className={`${config.color} ${className} flex items-center gap-1.5`}>
      <span className={`h-2 w-2 rounded-full shrink-0 ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
