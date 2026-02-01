import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  type: 'location' | 'hospitals' | 'error';
  message?: string;
  onRetry?: () => void;
}

export function LoadingState({ type, message, onRetry }: LoadingStateProps) {
  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-background">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {message || 'An error occurred. Please try again.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-background">
      {type === 'location' ? (
        <>
          <div className="relative mb-6">
            <MapPin className="h-16 w-16 text-primary animate-bounce" />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          </div>
          <h2 className="text-xl font-bold mb-2">Finding your location...</h2>
          <p className="text-muted-foreground">
            Please allow location access when prompted
          </p>
        </>
      ) : (
        <>
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
          <h2 className="text-xl font-bold mb-2">Finding nearby hospitals...</h2>
          <p className="text-muted-foreground">
            Searching within 10 km radius
          </p>
        </>
      )}
    </div>
  );
}
