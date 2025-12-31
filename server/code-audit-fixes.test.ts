import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Code Audit Fixes', () => {
  describe('Error Boundary Implementation', () => {
    it('should have ErrorBoundary component', () => {
      const errorBoundaryPath = join(__dirname, '../client/src/components/ErrorBoundary.tsx');
      const content = readFileSync(errorBoundaryPath, 'utf-8');
      
      expect(content).toContain('class ErrorBoundary');
      expect(content).toContain('componentDidCatch');
      expect(content).toContain('getDerivedStateFromError');
    });

    it('should wrap the app with ErrorBoundary', () => {
      const appPath = join(__dirname, '../client/src/App.tsx');
      const content = readFileSync(appPath, 'utf-8');
      
      expect(content).toContain('import ErrorBoundary');
      expect(content).toContain('<ErrorBoundary>');
    });
  });

  describe('Admin Route Protection', () => {
    it('should have ProtectedRoute component with role checking', () => {
      const protectedRoutePath = join(__dirname, '../client/src/components/ProtectedRoute.tsx');
      const content = readFileSync(protectedRoutePath, 'utf-8');
      
      expect(content).toContain('requiredRole');
      expect(content).toContain('user?.role');
      expect(content).toContain('isAuthenticated');
    });

    it('should protect admin routes in App.tsx', () => {
      const appPath = join(__dirname, '../client/src/App.tsx');
      const content = readFileSync(appPath, 'utf-8');
      
      expect(content).toContain('ProtectedRoute');
      expect(content).toContain('requiredRole="admin"');
    });
  });

  describe('Request Timeout Configuration', () => {
    it('should configure query timeout in main.tsx', () => {
      const mainPath = join(__dirname, '../client/src/main.tsx');
      const content = readFileSync(mainPath, 'utf-8');
      
      expect(content).toContain('QueryClient');
      expect(content).toContain('defaultOptions');
      expect(content).toContain('staleTime');
      expect(content).toContain('gcTime');
    });

    it('should have retry configuration', () => {
      const mainPath = join(__dirname, '../client/src/main.tsx');
      const content = readFileSync(mainPath, 'utf-8');
      
      expect(content).toContain('retry');
      expect(content).toContain('failureCount');
    });
  });

  describe('Offline State Handling', () => {
    it('should have useOnlineStatus hook', () => {
      const hookPath = join(__dirname, '../client/src/hooks/useOnlineStatus.ts');
      const content = readFileSync(hookPath, 'utf-8');
      
      expect(content).toContain('useOnlineStatus');
      expect(content).toContain('navigator.onLine');
      expect(content).toContain("addEventListener('online'");
      expect(content).toContain("addEventListener('offline'");
    });

    it('should have OfflineIndicator component', () => {
      const indicatorPath = join(__dirname, '../client/src/components/OfflineIndicator.tsx');
      const content = readFileSync(indicatorPath, 'utf-8');
      
      expect(content).toContain('OfflineIndicator');
      expect(content).toContain('useOnlineStatus');
      expect(content).toContain('No internet connection');
    });

    it('should render OfflineIndicator in App', () => {
      const appPath = join(__dirname, '../client/src/App.tsx');
      const content = readFileSync(appPath, 'utf-8');
      
      expect(content).toContain('import { OfflineIndicator }');
      expect(content).toContain('<OfflineIndicator />');
    });
  });

  describe('Loading States', () => {
    it('should have PageLoader component', () => {
      const appPath = join(__dirname, '../client/src/App.tsx');
      const content = readFileSync(appPath, 'utf-8');
      
      expect(content).toContain('PageLoader');
      expect(content).toContain('animate-spin');
    });

    it('should use Suspense with fallback', () => {
      const appPath = join(__dirname, '../client/src/App.tsx');
      const content = readFileSync(appPath, 'utf-8');
      
      expect(content).toContain('Suspense');
      expect(content).toContain('fallback');
    });
  });

  describe('Input Validation', () => {
    it('should have Zod validation in routers', () => {
      const routersPath = join(__dirname, './routers.ts');
      const content = readFileSync(routersPath, 'utf-8');
      
      // Check for Zod usage (z.object, z.string, etc.)
      expect(content).toMatch(/z\.(object|string|number|boolean|array)/);
    });
  });
});
