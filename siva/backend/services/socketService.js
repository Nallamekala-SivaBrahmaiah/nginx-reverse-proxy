import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import Notification from '../models/Notification.js';

let io = null;
const userSockets = new Map(); // maps userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join', (userId) => {
      if (userId) {
        userSockets.set(userId.toString(), socket.id);
        socket.join(userId.toString());
        logger.info(`User ${userId} joined their socket room: ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      for (const [uId, sId] of userSockets.entries()) {
        if (sId === socket.id) {
          userSockets.delete(uId);
          break;
        }
      }
    });
  });
};

export const sendNotification = async (userId, title, message, type = 'info') => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
    });

    if (io) {
      io.to(userId.toString()).emit('notification', notification);
      logger.info(`Real-time notification emitted to user ${userId}`);
    }
    return notification;
  } catch (error) {
    logger.error(`Error sending notification: ${error.message}`);
  }
};
