import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
    </div>
  );
}
