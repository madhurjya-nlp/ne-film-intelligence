const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function parseDeadline(raw, referenceDate = new Date()) {
  if (!raw || typeof raw !== 'string') {
    return { deadline_date: null, deadline_status: 'unknown' };
  }

  const text = raw.trim();
  let parsed = null;

  // ISO: 2026-06-18
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) parsed = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);

  // DD/MM/YYYY or DD-MM-YYYY
  if (!parsed) {
    const dmy = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) parsed = new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}T12:00:00`);
  }

  // Month YYYY (e.g. June 2026)
  if (!parsed) {
    const my = text.match(/([A-Za-z]+)\s+(\d{4})/);
    if (my) {
      const m = MONTHS[my[1].toLowerCase()];
      if (m !== undefined) parsed = new Date(Number(my[2]), m, 28);
    }
  }

  // DD Month YYYY
  if (!parsed) {
    const dmy = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (dmy) {
      const m = MONTHS[dmy[2].toLowerCase()];
      if (m !== undefined) parsed = new Date(Number(dmy[3]), m, Number(dmy[1]));
    }
  }

  if (!parsed || isNaN(parsed.getTime())) {
    return { deadline_date: null, deadline_status: 'unknown' };
  }

  const isoDate = parsed.toISOString().slice(0, 10);
  const status = classifyDeadline(parsed, referenceDate);
  return { deadline_date: isoDate, deadline_status: status };
}

function classifyDeadline(date, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const diffMs = d.getTime() - ref.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'closing_soon';
  if (d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()) return 'this_month';
  return 'upcoming';
}

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

module.exports = { parseDeadline, classifyDeadline, toIsoDate };