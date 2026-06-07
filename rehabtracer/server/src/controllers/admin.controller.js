import ActivityLog from "../models/ActivityLog.model.js";
import Appointment from "../models/Appointment.model.js";
import Doctor from "../models/Doctor.model.js";
import Notification from "../models/Notification.model.js";
import Patient from "../models/Patient.model.js";
import RehabPlan from "../models/RehabPlan.model.js";
import User from "../models/User.model.js";

// ================= PLATFORM STATS =================
export const getPlatformStats = async (
  req,
  res,
  next
) => {
  try {
    const totalUsers =
      await User.countDocuments();

    const totalDoctors =
      await Doctor.countDocuments();

    const totalPatients =
      await Patient.countDocuments();

    const totalAppointments =
      await Appointment.countDocuments();

    const totalRehabPlans =
      await RehabPlan.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
        totalRehabPlans,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ALL USERS =================
export const getAllUsers = async (
  req,
  res,
  next
) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ACTIVITY LOGS =================
export const getActivityLogs = async (
  req,
  res,
  next
) => {
  try {
    const logs =
      await ActivityLog.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ================= APPROVE DOCTOR =================
export const approveDoctor = async (
  req,
  res,
  next
) => {
  try {
    const doctor =
      await Doctor.findByIdAndUpdate(
        req.params.id,
        {
          isApproved: true,
        },
        {
          new: true,
        }
      );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Doctor approved successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

// ================= DEACTIVATE USER =================
export const deactivateUser = async (
  req,
  res,
  next
) => {
  try {
    const user =
      await User.findByIdAndUpdate(
        req.params.id,
        {
          isActive: false,
        },
        {
          new: true,
        }
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ================= ACTIVATE USER =================
export const activateUser = async (
  req,
  res,
  next
) => {
  try {
    const user =
      await User.findByIdAndUpdate(
        req.params.id,
        {
          isActive: true,
        },
        {
          new: true,
        }
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "User activated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ================= SEND GLOBAL NOTIFICATION =================
export const sendGlobalNotification = async (
  req,
  res,
  next
) => {
  try {
    const { title, message } = req.body;

    const users = await User.find();

    const notifications = users.map(
      (user) => ({
        user: user._id,
        title,
        message,
        type: "announcement",
      })
    );

    await Notification.insertMany(
      notifications
    );

    res.status(200).json({
      success: true,
      message:
        "Global notification sent successfully",
    });
  } catch (error) {
    next(error);
  }
};