import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

/**
 * Custom React hook for managing a Socket.IO client connection.
 * It handles connection, disconnection, and room joining for a given eventId.
 * @param {string | null} eventId - The ID of the event to join. If null, no connection is attempted.
 * @returns {{ socket: Socket | null; isConnected: boolean }} An object containing the Socket.IO client instance and the connection status.
 */
export const useSocket = (eventId: string | null): { socket: Socket | null; isConnected: boolean } => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setIsConnected(false); // Ensure isConnected is false if no valid eventId
      return;
    }

    // Initialize the socket connection
    const socketInitializer = async () => {
      // Disconnect any existing socket before creating a new one
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
      socketRef.current = io(socketUrl, {
        path: '/api/socket',
        transports: ['polling'], // Force polling
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        const roomId = String(eventId); // Ensure eventId is string for room joining
        if (socketRef.current) {
          socketRef.current.emit('join-event', roomId);
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('[useSocket] CONNECTION ERROR for eventId:', eventId, error);
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error for eventId:', eventId, error);
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        setIsConnected(true);
        const roomId = String(eventId);
        if (socketRef.current) {
          socketRef.current.emit('join-event', roomId);
        }
      });

      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      });

      socketRef.current.on('reconnecting', (attemptNumber) => {
      });

      socketRef.current.on('reconnect_error', (error) => {
        console.error('[useSocket] RECONNECT ERROR for eventId:', eventId, error);
      });

      socketRef.current.on('reconnect_failed', () => {
        console.error('[useSocket] RECONNECT FAILED for eventId:', eventId);
      });
    };

    socketInitializer();

    // Cleanup on component unmount or eventId change
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId]);

  return { socket: socketRef.current, isConnected };
};