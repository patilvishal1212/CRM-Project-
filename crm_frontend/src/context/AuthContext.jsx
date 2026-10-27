import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = authService.getCurrentUser();
        
        if (token && savedUser) {
          setUser(savedUser);
          
          // Verify with backend
          try {
            const profile = await authService.getProfile();
            const updatedUser = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (profileError) {
            console.error('Profile check failed, using stored session:', profileError);
          }
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    isQA: user?.role === 'qa',
    isHR: user?.role === 'hr',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
