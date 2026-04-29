import { useQuery } from '@tanstack/react-query';
import { MODES_CONFIG, FLAVOR_OPTIONS } from '@/config/categories';

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? '';

export function useModesConfig() {
  const { data } = useQuery({
    queryKey: ['config-modes'],
    queryFn: async () => {
      const res = await fetch(`${WORKER_URL}/api/config/modes`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: MODES_CONFIG,
  });
  return data ?? MODES_CONFIG;
}

export function useFlavorOptions() {
  const { data } = useQuery({
    queryKey: ['config-flavors'],
    queryFn: async () => {
      const res = await fetch(`${WORKER_URL}/api/config/flavors`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: FLAVOR_OPTIONS,
  });
  return data ?? FLAVOR_OPTIONS;
}
