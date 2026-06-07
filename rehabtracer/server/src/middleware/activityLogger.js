import ActivityLog from '../models/ActivityLog.model.js';

const activityLogger = (action) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    if (body?.success !== false && req.user?._id) {
      try {
        await ActivityLog.create({
          user: req.user._id,
          action,
          description: `${req.method} ${req.originalUrl}`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: {
            params: req.params,
            query: req.query,
          },
        });
      } catch (_) {}
    }
    return originalJson(body);
  };

  next();
};

export default activityLogger;