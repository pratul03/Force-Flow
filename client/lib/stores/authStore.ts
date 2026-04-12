'use client';

import { create } from 'zustand';
import { User, AuthState } from '../types';
import {
  setJsonCookie,
  getJsonCookie,
  removeCookie,
  setCookie,
  getCookie,
} from '../cookies';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  initializeFromCookies: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AUTH_USER_COOKIE = 'auth_user';
const AUTH_EXPIRY_COOKIE = 'auth_expiry';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user,
    })),

  setToken: (token) =>
    set({
      token,
    }),

  setRefreshToken: (refreshToken) =>
    set({
      refreshToken,
    }),

  login: (user) => {
    // Persist non-sensitive session metadata only.
    const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

    setJsonCookie(AUTH_USER_COOKIE, user, { maxAge: 7 * 24 * 60 * 60 });
    setCookie(AUTH_EXPIRY_COOKIE, expiryTime.toString(), {
      maxAge: 7 * 24 * 60 * 60,
    });

    set({
      user,
      token: null,
      refreshToken: null,
      isAuthenticated: true,
    });
  },

  logout: () => {
    removeCookie(AUTH_USER_COOKIE);
    removeCookie(AUTH_EXPIRY_COOKIE);

    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  initializeFromCookies: () => {
    const user = getJsonCookie<User>(AUTH_USER_COOKIE);
    const expiryStr = getCookie(AUTH_EXPIRY_COOKIE);

    // Check if session is expired
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        // Session expired
        removeCookie(AUTH_USER_COOKIE);
        removeCookie(AUTH_EXPIRY_COOKIE);
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        return;
      }
    }

    if (user) {
      set({
        user,
        token: null,
        refreshToken: null,
        isAuthenticated: true,
      });
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setJsonCookie(AUTH_USER_COOKIE, updatedUser, {
        maxAge: 7 * 24 * 60 * 60,
      });
      set({
        user: updatedUser,
      });
    }
  },
}));
