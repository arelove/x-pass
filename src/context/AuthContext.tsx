/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

import React, { createContext, useState, PropsWithChildren } from 'react';

interface Auth {
  username: string;
  user_id: number;
  encKey: string;
}

export const AuthContext = createContext<{
  auth: Auth | null;
  setAuth: (auth: Auth | null) => void;
}>({
  auth: null,
  setAuth: () => {},
});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [auth, setAuth] = useState<Auth | null>(null);
  return <AuthContext.Provider value={{ auth, setAuth }}>{children}</AuthContext.Provider>;
};
