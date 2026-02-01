import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useShakeDetection } from '@/hooks/useShakeDetection';
import { HospitalMap } from '@/components/HospitalMap';
import { HospitalList } from '@/components/HospitalList';
import { HospitalDetails } from '@/components/HospitalDetails';
import { EmergencyAlert } from '@/components/EmergencyAlert';
import { LoadingState } from '@/components/LoadingState';
import { Hospital } from '@/types/hospital';
import { fetchNearbyHospitals } from '@/utils/hospitalUtils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Map, 
  List, 
  RefreshCw, 
  AlertTriangle, 
  Smartphone,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { latitude, longitude, error: locationError, loading: locationLoading, refresh: refreshLocation } = useGeolocation();
  
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');

  // Shake detection
  const handleEmergencyShake = useCallback(() => {
    setEmergencyOpen(true);
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, []);

  const { isSupported: shakeSupported, permissionGranted: shakePermission, requestPermission: requestShakePermission } = useShakeDetection(handleEmergencyShake, {
    threshold: 15,
    timeout: 1000,
    shakeCount: 3,
  });

  // Request shake permission on mount
  useEffect(() => {
    if (shakeSupported && shakePermission === null) {
      // Auto-request on non-iOS or show toast for iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (!isIOS) {
        requestShakePermission();
      }
    }
  }, [shakeSupported, shakePermission, requestShakePermission]);

  // Fetch hospitals when location is available
  useEffect(() => {
    if (latitude && longitude) {
      fetchHospitals();
    }
  }, [latitude, longitude]);

  const fetchHospitals = async () => {
    if (!latitude || !longitude) return;
    
    setHospitalsLoading(true);
    setHospitalsError(null);
    
    try {
      const data = await fetchNearbyHospitals({ latitude, longitude }, 10);
      setHospitals(data);
      if (data.length === 0) {
        toast.info('No hospitals found within 10 km radius');
      } else {
        toast.success(`Found ${data.length} hospital${data.length !== 1 ? 's' : ''} nearby`);
      }
    } catch (error) {
      setHospitalsError('Failed to fetch hospitals. Please try again.');
      toast.error('Failed to fetch hospitals');
    } finally {
      setHospitalsLoading(false);
    }
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setDetailsOpen(true);
  };

  const handleRefresh = () => {
    refreshLocation();
    if (latitude && longitude) {
      fetchHospitals();
    }
  };

  const handleRequestShakePermission = async () => {
    const granted = await requestShakePermission();
    if (granted) {
      toast.success('Shake detection enabled! Shake your phone 3 times for emergency.');
    } else {
      toast.error('Motion permission denied');
    }
  };

  // Loading state for location
  if (locationLoading) {
    return <LoadingState type="location" />;
  }

  // Error state for location
  if (locationError || !latitude || !longitude) {
    return (
      <LoadingState
        type="error"
        message={locationError || 'Unable to get your location. Please enable location services and try again.'}
        onRetry={refreshLocation}
      />
    );
  }

  const userLocation = { latitude, longitude };
  const nearestHospital = hospitals.length > 0 ? hospitals[0] : null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-foreground">Hospital Navigator</h1>
          <p className="text-xs text-muted-foreground">Emergency Assistance System</p>
        </div>
        <div className="flex items-center gap-2">
          {shakeSupported && shakePermission !== true && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequestShakePermission}
              className="text-xs"
            >
              <Smartphone className="h-3 w-3 mr-1" />
              Enable Shake
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRefresh}
            disabled={hospitalsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${hospitalsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Shake Status Banner */}
      {shakeSupported && shakePermission === true && (
        <div className="px-4 py-2 bg-primary/10 border-b">
          <p className="text-xs text-center text-primary">
            <Smartphone className="h-3 w-3 inline mr-1" />
            Shake your phone 3 times for emergency assistance
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {hospitalsLoading ? (
          <LoadingState type="hospitals" />
        ) : hospitalsError ? (
          <LoadingState
            type="error"
            message={hospitalsError}
            onRetry={fetchHospitals}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsContent value="map" className="flex-1 m-0 data-[state=inactive]:hidden">
              <HospitalMap
                userLocation={userLocation}
                hospitals={hospitals}
                onHospitalSelect={handleHospitalSelect}
                selectedHospital={selectedHospital}
              />
            </TabsContent>
            <TabsContent value="list" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
              <HospitalList
                hospitals={hospitals}
                userLocation={userLocation}
                onHospitalSelect={handleHospitalSelect}
                selectedHospital={selectedHospital}
              />
            </TabsContent>

            {/* Bottom Tab Navigation */}
            <TabsList className="grid w-full grid-cols-2 rounded-none border-t h-14">
              <TabsTrigger value="map" className="flex flex-col gap-1 h-full rounded-none data-[state=active]:bg-primary/10">
                <Map className="h-5 w-5" />
                <span className="text-xs">Map</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex flex-col gap-1 h-full rounded-none data-[state=active]:bg-primary/10">
                <List className="h-5 w-5" />
                <span className="text-xs">List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Emergency FAB */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-destructive hover:bg-destructive/90 z-50"
        onClick={() => setEmergencyOpen(true)}
      >
        <AlertTriangle className="h-6 w-6" />
      </Button>

      {/* Quick Emergency Call FAB */}
      <Button
        size="lg"
        variant="secondary"
        className="fixed bottom-20 left-4 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={() => window.location.href = 'tel:112'}
      >
        <Phone className="h-6 w-6" />
      </Button>

      {/* Hospital Details Drawer */}
      <HospitalDetails
        hospital={selectedHospital}
        userLocation={userLocation}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />

      {/* Emergency Alert Dialog */}
      <EmergencyAlert
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        nearestHospital={nearestHospital}
        userLocation={userLocation}
      />
    </div>
  );
};

export default Index;
