const isHongKong = (value) =>
  value && /hong\s*kong/i.test(String(value).trim());

export function normalizeLocationFields(fields) {
  let country = fields.country?.trim() || '';
  const city = fields.city?.trim() || '';

  if (isHongKong(country)) {
    country = 'China';
  }

  return {
    ...fields,
    area: fields.area?.trim() || '',
    city,
    country,
  };
}