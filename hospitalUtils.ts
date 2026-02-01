import { Hospital, UserLocation } from '@/types/hospital';

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Fetch hospitals from Overpass API (OpenStreetMap)
export async function fetchNearbyHospitals(
  userLocation: UserLocation,
  radiusKm: number = 10
): Promise<Hospital[]> {
  const { latitude, longitude } = userLocation;
  const radiusMeters = radiusKm * 1000;

  // Overpass QL query for hospitals
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      relation["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
    );
    out center;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch hospitals');
    }

    const data = await response.json();
    
    const hospitals: Hospital[] = data.elements.map((element: any) => {
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      const tags = element.tags || {};
      
      // Determine hospital type
      let type: Hospital['type'] = 'Unknown';
      if (tags.operator_type === 'government' || 
          tags.ownership === 'government' ||
          tags.operator?.toLowerCase().includes('government') ||
          tags.operator?.toLowerCase().includes('municipal') ||
          tags.operator?.toLowerCase().includes('state')) {
        type = 'Government';
      } else if (tags.operator_type === 'private' || 
                 tags.ownership === 'private' ||
                 tags.operator?.toLowerCase().includes('private')) {
        type = 'Private';
      }

      const distance = calculateDistance(latitude, longitude, lat, lon);

      return {
        id: String(element.id),
        name: tags.name || tags['name:en'] || 'Unnamed Hospital',
        latitude: lat,
        longitude: lon,
        distance: Math.round(distance * 10) / 10,
        type,
        address: tags['addr:full'] || tags['addr:street'] || undefined,
        phone: tags.phone || tags['contact:phone'] || undefined,
        emergency: tags.emergency === 'yes',
      };
    });

    // Sort by distance
    return hospitals
      .filter(h => h.latitude && h.longitude)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    throw error;
  }
}

export function openGoogleMapsNavigation(
  userLocation: UserLocation,
  destination: { latitude: number; longitude: number }
) {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
  window.open(url, '_blank');
}
