import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { getTokens } from '../utils/tokens';
import { useAuth } from './AuthContext';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  lastConnectionError: string | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  lastConnectionError: null,
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastConnectionError, setLastConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let activeSocket: Socket | null = null;

    if (!isAuthenticated) {
      setSocket((current) => {
        if (current) {
          current.disconnect();
        }
        return null;
      });
      setIsConnected(false);
      return;
    }

    const tokens = getTokens();
    const authToken = tokens?.accessToken;
    const baseUrl = (API_CONFIG.BASE_URL || window.location.origin).replace(/\/$/, '');

    activeSocket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      auth: authToken ? { token: authToken } : undefined,
    });

    const handleConnect = () => {
      setIsConnected(true);
      setLastConnectionError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('WebSocket connection error', error);
      setLastConnectionError(error.message);
    };

    activeSocket.on('connect', handleConnect);
    activeSocket.on('disconnect', handleDisconnect);
    activeSocket.on('connect_error', handleConnectError);

    setSocket(activeSocket);

    return () => {
      if (activeSocket) {
        activeSocket.off('connect', handleConnect);
        activeSocket.off('disconnect', handleDisconnect);
        activeSocket.off('connect_error', handleConnectError);
        activeSocket.disconnect();
      }
      setIsConnected(false);
      setSocket((current) => (current === activeSocket ? null : current));
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastConnectionError }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = (): SocketContextValue => {
  return useContext(SocketContext);
};

export const useSocket = (): Socket | null => {
  const { socket } = useSocketContext();
  return socket;
};

