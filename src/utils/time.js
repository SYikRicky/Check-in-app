export const DEFAULT_PAPERS = [
  { id: 'paper1', title: 'Chemistry Paper 1', time: '03-Apr-2025 · 08:30 AM' },
  { id: 'paper2', title: 'Chemistry Paper 2', time: '03-Apr-2025 · 11:00 AM' }
];

export const formatAt = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

export const parseTimeslot = (raw) => {
  if (!raw) return DEFAULT_PAPERS;
  const dateMatch = raw.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/);
  let dateObj = null;
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    dateObj = new Date(Number(y), Number(m) - 1, Number(d)); // dd/mm/yyyy
  }
  const times = raw.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))/g) || [];
  const t1 = times[0] || '08:30 AM';
  const t2 = times[1] || '11:00 AM';
  const dateDisplay = dateObj
    ? dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Date TBD';
  return [
    { id: 'paper1', title: 'Chemistry Paper 1', time: `${dateDisplay} · ${t1}` },
    { id: 'paper2', title: 'Chemistry Paper 2', time: `${dateDisplay} · ${t2}` }
  ];
};
