import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Hospital, UserLocation } from '@/types/hospital';
import { AlertTriangle, Phone, Navigation, X } from 'lucide-react';
import { openGoogleMapsNavigation } from '@/utils/hospitalUtils';

interface EmergencyAlertProps {
  open: boolean;
  onClose: () => void;
  nearestHospital: Hospital | null;
  userLocation: UserLocation | null;
}

export function EmergencyAlert({
  open,
  onClose,
  nearestHospital,
  userLocation,
}: EmergencyAlertProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (open) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open]);

  const handleNavigateToNearest = () => {
    if (nearestHospital && userLocation) {
      openGoogleMapsNavigation(userLocation, nearestHospital);
    }
    onClose();
  };

  const handleCallEmergency = () => {
    window.location.href = 'tel:112';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-destructive text-destructive-foreground border-destructive">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="animate-pulse">
              <AlertTriangle className="h-16 w-16" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Emergency Alert!
          </DialogTitle>
          <DialogDescription className="text-center text-destructive-foreground/90">
            Shake detected! Do you need emergency assistance?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {nearestHospital && (
            <div className="bg-background/10 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Nearest Hospital:</p>
              <p className="font-bold">{nearestHospital.name}</p>
              <p className="text-sm">{nearestHospital.distance} km away</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={handleCallEmergency}
            >
              <Phone className="h-5 w-5 mr-2" />
              Call Emergency (112)
            </Button>

            {nearestHospital && userLocation && (
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={handleNavigateToNearest}
              >
                <Navigation className="h-5 w-5 mr-2" />
                Navigate to Nearest Hospital
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="w-full text-destructive-foreground/70 hover:text-destructive-foreground hover:bg-background/10"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel ({countdown}s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
