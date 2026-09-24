import { flagUrl } from '../data/flags';
import type { Country } from '../types';

interface Props {
  country: Country;
  className?: string;
}

export function Flag({ country, className = 'flag' }: Props) {
  const src = flagUrl(country.code);
  if (!src) return null;
  return <img className={className} src={src} alt={`Flag of ${country.name}`} width={96} height={72} />;
}
