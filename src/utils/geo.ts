
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Raio da Terra em km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distância em km

  return parseFloat(d.toFixed(1)); // Retorna com 1 casa decimal (ex: 2.5)
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
  return `${distance}km`;
};
