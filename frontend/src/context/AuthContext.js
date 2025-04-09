import { createContext } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {}
});

export default AuthContext; 