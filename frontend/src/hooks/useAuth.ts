// Last Modified: 2025-11-23 17:30
import { useAuth as useAuthContext } from '../components/providers/AuthProvider';

// Re-export the useAuth hook from the provider
export const useAuth = useAuthContext;