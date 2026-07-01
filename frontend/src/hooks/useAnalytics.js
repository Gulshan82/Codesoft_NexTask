import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useAnalytics = (enabled = true) => {
  const analyticsQuery = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard');
      return data;
    },
    enabled,
  });

  return {
    stats: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    isError: analyticsQuery.isError,
    refetch: analyticsQuery.refetch,
  };
};
