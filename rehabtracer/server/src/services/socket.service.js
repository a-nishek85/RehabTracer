import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import User from '../models/User.model.js';

let io;
const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select('name role');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    socket.join(userId);

    console.log(`🔌 Socket connected: ${socket.user.name} (${userId})`);

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId });

    // Chat — join room
    socket.on('join_chat', ({ chatId }) => {
      socket.join(`chat_${chatId}`);
    });

    // Chat — send message
    socket.on('send_message', ({ chatId, message }) => {
      io.to(`chat_${chatId}`).emit('receive_message', message);
    });

    // Typing indicator
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(`chat_${chatId}`).emit('typing', { userId, isTyping });
    });

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user_offline', { userId });
      console.log(`❌ Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(userId.toString()).emit('notification', notification);
  }
};

export const emitToRoom = (room, event, data) => {
  if (io) io.to(room).emit(event, data);
};

export const isUserOnline = (userId) => onlineUsers.has(userId.toString());

export const getIO = () => io;