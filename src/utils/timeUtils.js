export const formatiereZeit = (sekunden) => {
  if (sekunden === undefined || sekunden === null || isNaN(sekunden)) return "00:00";
  const min = Math.floor(sekunden / 60);
  const sek = Math.floor(sekunden % 60);
  return `${min.toString().padStart(2, '0')}:${sek.toString().padStart(2, '0')}`;
};

export const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
};
