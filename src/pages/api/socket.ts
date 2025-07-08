import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

// Extend the global object to include our Socket.IO server instance
declare global {
  var io: Server;
}

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: {
      io?: Server;
    };
  };
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    try {
      const io = new Server(res.socket.server as any, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });
      res.socket.server.io = io;
      // Store the io instance globally to prevent multiple instances on hot reload
      // @ts-ignore
      global.io = io;

      io.on('connection', (socket) => {
        socket.on('join-event', (eventId) => {
          const roomId = String(eventId);
          socket.join(roomId);
        });

        socket.on('open-question', (question) => {
          if (question && question.event_id) {
            const roomId = String(question.event_id);
            io.to(roomId).emit('open-question', question);
          }
        });

        socket.on('close-question', ({ questionId, eventId }) => {
          const roomId = String(eventId);
          io.to(roomId).emit('close-question', questionId);
        });

        socket.on('delete-question', ({ questionId, eventId }) => {
          const roomId = String(eventId);
          io.to(roomId).emit('delete-question', questionId);
        });

        socket.on('new-answer', ({ questionId, eventId }) => {
          const roomId = String(eventId);
          io.to(roomId).emit('update-results', { questionId });
        });

        socket.on('display-question', ({ questionId, eventId }) => {
          const roomId = String(eventId);
          io.to(roomId).emit('display-question', { questionId, eventId });
        });

        socket.on('hide-results', ({ eventId }) => {
          const roomId = String(eventId);
          io.to(roomId).emit('hide-results', { eventId });
        });

        socket.on('pick-answer', ({ eventId, questionId, answerId, isPicked }) => {
          const roomId = String(eventId);
          io.to(roomId).emit('answer-picked', { questionId, answerId, isPicked });
        });

        socket.on('hide-answer', ({ eventId, questionId, answerId, isHidden }) => {
          const roomId = String(eventId);
          io.to(roomId).emit('answer-hidden', { questionId, answerId, isHidden });
        });

        

        socket.on('disconnect', (reason) => {
        });

        socket.on('error', (error) => {
          console.error(`[Server] Socket error for ${socket.id}:`, error);
        });
      });
    } catch (e) {
      console.error('[Server] Error initializing Socket.IO server:', e);
      res.status(500).end('Error initializing Socket.IO server');
      return;
    }
  } else {
    // @ts-ignore
    if (!global.io) {
      // @ts-ignore
      global.io = res.socket.server.io;
    }
  }
  res.end();
};

export default SocketHandler;

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};