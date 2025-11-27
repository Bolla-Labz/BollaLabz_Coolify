// Last Modified: 2025-11-23 17:30
import { useTheme as useThemeContext } from '../components/providers/ThemeProvider';

// Re-export the useTheme hook from the provider
export const useTheme = useThemeContext;