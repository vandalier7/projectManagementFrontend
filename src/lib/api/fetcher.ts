import { apiClient } from './api';

// SWR calls this with the key (the path string) as its only argument.
// useSWR('/projects') → fetcher('/projects') → apiClient('/projects')
export const fetcher = (path: string) => apiClient(path);