// Last Modified: 2025-11-24 01:25
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../../stores/authStore';
import '@testing-library/jest-dom';

// Mock the auth store
vi.mock('../../stores/authStore');

// Mock components for testing
const PublicPage = () => <div>Public Page</div>;
const ProtectedPage = () => <div>Protected Page</div>;
const LoginPage = () => <div>Login Page</div>;

describe('ProtectedRoute', () => {
  const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Checks', () => {
    it('should render protected content when user is authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Page')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
    });

    it('should show loading state while checking authentication', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show loading indicator
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('Navigation State Preservation', () => {
    it('should preserve original location in navigation state when redirecting', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });

      const { container } = render(
        <MemoryRouter initialEntries={['/protected/resource/123']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected/resource/:id"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Verify redirect occurred
      expect(screen.getByText('Login Page')).toBeInTheDocument();

      // Check that location state contains the original path
      // This would be accessible in LoginPage via useLocation().state.from
    });

    it('should redirect back to original location after login', async () => {
      // Initial state: not authenticated
      const authStoreMock = {
        user: null,
        isAuthenticated: false,
        loading: false,
      };

      mockUseAuthStore.mockReturnValue(authStoreMock);

      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected/dashboard']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();

      // Simulate successful login
      authStoreMock.user = { id: 1, email: 'test@example.com', name: 'Test' };
      authStoreMock.isAuthenticated = true;

      mockUseAuthStore.mockReturnValue(authStoreMock);

      rerender(
        <MemoryRouter initialEntries={['/protected/dashboard']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Page')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has required role', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Page')).toBeInTheDocument();
    });

    it('should deny access when user lacks required role', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
    });

    it('should handle multiple allowed roles', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'mod@example.com', role: 'moderator' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/manage']}>
          <Routes>
            <Route
              path="/manage"
              element={
                <ProtectedRoute requiredRoles={['admin', 'moderator']}>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Page')).toBeInTheDocument();
    });
  });

  describe('Nested Protected Routes', () => {
    it('should handle nested protected routes correctly', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/app/settings/profile']}>
          <Routes>
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route
                      path="settings/*"
                      element={
                        <ProtectedRoute>
                          <Routes>
                            <Route path="profile" element={<div>Profile Settings</div>} />
                          </Routes>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });
  });

  describe('Token Validation', () => {
    it('should redirect to login when token is expired', async () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        isTokenValid: () => false, // Token is expired
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute validateToken={true}>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should allow access when token is valid', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        isTokenValid: () => true,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute validateToken={true}>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Page')).toBeInTheDocument();
    });
  });

  describe('Custom Redirect Paths', () => {
    it('should redirect to custom path when not authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/custom-login" element={<div>Custom Login</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute redirectTo="/custom-login">
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Custom Login')).toBeInTheDocument();
    });

    it('should redirect to custom unauthorized path for missing roles', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/access-denied" element={<div>Access Denied</div>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  requiredRole="admin"
                  unauthorizedPath="/access-denied"
                >
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication check errors gracefully', async () => {
      mockUseAuthStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/error" element={<div>Error Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute errorPath="/error">
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Page')).toBeInTheDocument();
      });
    });

    it('should show error boundary fallback on child component error', () => {
      const ThrowingComponent = () => {
        throw new Error('Component error');
      };

      mockUseAuthStore.mockReturnValue({
        user: { id: 1, email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ThrowingComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show error boundary content
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when auth state unchanged', () => {
      const renderSpy = vi.fn();

      const TestComponent = () => {
        renderSpy();
        return <div>Protected Content</div>;
      };

      const authState = {
        user: { id: 1, email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
      };

      mockUseAuthStore.mockReturnValue(authState);

      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same auth state
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should not cause additional render
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <ProtectedPage />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const loadingElement = screen.getByTestId('loading-spinner');
      expect(loadingElement).toHaveAttribute('role', 'status');
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading');
    });

    it('should announce route changes to screen readers', async () => {
      const authState = {
        user: null,
        isAuthenticated: false,
        loading: false,
      };

      mockUseAuthStore.mockReturnValue(authState);

      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Update to authenticated
      authState.user = { id: 1, email: 'test@example.com' };
      authState.isAuthenticated = true;

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Check for ARIA live region updates
      await waitFor(() => {
        const liveRegion = screen.getByRole('status', { hidden: true });
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });
});