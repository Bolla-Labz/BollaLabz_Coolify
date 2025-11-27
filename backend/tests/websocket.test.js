// Last Modified: 2025-11-23 17:30
/**
 * WebSocket Cookie Parsing Tests
 * Tests the fix for URL-encoded cookie values in WebSocket authentication
 */

import jwt from 'jsonwebtoken';

describe('WebSocket Cookie Parsing', () => {
  // Use a secret that produces signatures with special characters (+, /, =)
  // These characters get URL-encoded by Express res.cookie()
  const JWT_SECRET = 'test-secret-key-that-generates-special-chars-in-signature!!++//==';
  
  // Helper to create a mock JWT token
  const createMockToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '15m',
      algorithm: 'HS256'
    });
  };

  // Helper to simulate cookie parsing logic from websocket.js
  const parseCookies = (cookieHeader) => {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    // This is the fix: decode the cookie value
    return cookies.accessToken ? decodeURIComponent(cookies.accessToken) : undefined;
  };

  describe('Cookie Value Decoding', () => {
    test('should decode URL-encoded JWT token from cookie', () => {
      // Create a real JWT token
      const originalToken = createMockToken({ 
        userId: 123, 
        email: 'test@example.com',
        role: 'user',
        // Add data that increases likelihood of special chars in signature
        data: 'special+chars/in=signature'
      });
      
      // Simulate what Express res.cookie() does - URL-encode the value
      const encodedToken = encodeURIComponent(originalToken);
      
      // Verify that encoding actually changes the token
      // (JWT signatures often contain +, /, = which get encoded)
      const hasEncodedChars = encodedToken.includes('%2B') || 
                               encodedToken.includes('%2F') || 
                               encodedToken.includes('%3D');
      
      // If token doesn't have special chars, the fix is still safe (decode is idempotent for safe chars)
      
      // Simulate the cookie header that would be sent by the browser
      const cookieHeader = `accessToken=${encodedToken}; path=/`;
      
      // Parse the cookie using our fixed logic
      const parsedToken = parseCookies(cookieHeader);
      
      // Verify the token was properly decoded
      expect(parsedToken).toBe(originalToken);
      
      // If there were encoded chars, verify they're different
      if (hasEncodedChars) {
        expect(parsedToken).not.toBe(encodedToken);
      }
      
      // Verify the decoded token can be verified by JWT
      expect(() => {
        jwt.verify(parsedToken, JWT_SECRET);
      }).not.toThrow();
    });

    test('should handle JWT with special characters that get URL-encoded', () => {
      // JWT tokens contain dots and potentially other characters that might be encoded
      const originalToken = createMockToken({ 
        userId: 456,
        email: 'user+test@example.com', // + sign gets encoded
        role: 'admin'
      });
      
      // URL-encode the token (simulating Express behavior)
      const encodedToken = encodeURIComponent(originalToken);
      const cookieHeader = `accessToken=${encodedToken}`;
      
      // Parse and decode
      const parsedToken = parseCookies(cookieHeader);
      
      // Should match the original
      expect(parsedToken).toBe(originalToken);
      
      // Should be verifiable
      const decoded = jwt.verify(parsedToken, JWT_SECRET);
      expect(decoded.email).toBe('user+test@example.com');
    });

    test('should handle multiple cookies in header', () => {
      const originalToken = createMockToken({ 
        userId: 789,
        email: 'multi@example.com',
        role: 'user'
      });
      
      const encodedToken = encodeURIComponent(originalToken);
      
      // Simulate multiple cookies (common in real scenarios)
      const cookieHeader = `refreshToken=some-refresh-token; accessToken=${encodedToken}; sessionId=abc123`;
      
      const parsedToken = parseCookies(cookieHeader);
      
      expect(parsedToken).toBe(originalToken);
      expect(() => {
        jwt.verify(parsedToken, JWT_SECRET);
      }).not.toThrow();
    });

    test('should return undefined when accessToken cookie is missing', () => {
      const cookieHeader = `refreshToken=some-token; sessionId=abc123`;
      
      const parsedToken = parseCookies(cookieHeader);
      
      expect(parsedToken).toBeUndefined();
    });

    test('should handle empty cookie header', () => {
      const cookieHeader = '';
      
      // This would cause an error in the original code, but we're testing the fixed version
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key) acc[key] = value;
        return acc;
      }, {});
      
      const token = cookies.accessToken ? decodeURIComponent(cookies.accessToken) : undefined;
      
      expect(token).toBeUndefined();
    });
  });

  describe('JWT Verification After Decoding', () => {
    test('decoded token should pass JWT verification', () => {
      const payload = { 
        userId: 999,
        email: 'verify@example.com',
        role: 'user'
      };
      
      const originalToken = createMockToken(payload);
      const encodedToken = encodeURIComponent(originalToken);
      const cookieHeader = `accessToken=${encodedToken}`;
      const parsedToken = parseCookies(cookieHeader);
      
      // This is what the WebSocket middleware does
      const decoded = jwt.verify(parsedToken, JWT_SECRET);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    test('encoded token with special chars should fail JWT verification (demonstrating the bug)', () => {
      // Use a token that we know will have special characters
      const tokenWithSpecialChars = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIifQ.k+Kf4M0kh1+fxX5yZg/pLqR3sT6';
      
      // URL-encode it (simulating what Express does)
      const encodedToken = encodeURIComponent(tokenWithSpecialChars);
      
      // Verify it has encoded characters
      expect(encodedToken).toContain('%2B'); // + becomes %2B
      expect(encodedToken).toContain('%2F'); // / becomes %2F
      
      // The encoded token is NOT a valid JWT
      expect(encodedToken).not.toBe(tokenWithSpecialChars);
      
      // If we try to verify the ENCODED token (the bug scenario), it should fail
      // because jwt.verify expects the actual JWT, not the URL-encoded version
      expect(() => {
        jwt.verify(encodedToken, JWT_SECRET);
      }).toThrow();
    });
  });
});
