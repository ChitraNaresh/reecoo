const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const Doctor = require("../models/doctorModel");
const Appointments = require("../models/appointmentModel");
const moment = require("moment");

router.post("/register", async (req, res) => {
  console.log(req.body);
  try {
    const userExist = await User.findOne({ email: req.body.email });
    console.log(userExist);
    if (userExist) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }
    console.log(userExist);
    const password = req.body.password;
    console.log(password);
    const hashedPassword = await bcrypt.hash(password, 10);
    req.body.password = hashedPassword;
    const newUser = new User(req.body);
    await newUser.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating by user", success: false, error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exit", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } else {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({ message: "Login successful!", success: true, data: token });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error while login!", success: false, error });
  }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      res.status(200).send({ message: "User does not exist", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error getting user info!", success: false });
  }
});

router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
  try {
    const newDoctor = new Doctor({ ...req.body, status: "pending" });
    await newDoctor.save();
    console.log(23);
    const adminUser = await User.findOne({ isAdmin: true });
    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for doctor account`,
      data: {
        doctorid: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
      },
      onClickPath: "/doctors",
    });
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res
      .status(200)
      .send({ success: true, message: "Doctor account applied successfully" });
  } catch (error) {
    console.log(error);
    s;
    res.status(500).send({
      message: "Error applying doctor account!",
      success: false,
      error,
    });
  }
});

router.post(
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotifications = user.unseenNotifications;
      const seenNotifcations = user.seenNotifcations;
      seenNotifcations.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifcations = seenNotifcations;
      user.seenNotifcations = unseenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying doctor account!",
        success: false,
        error,
      });
    }
  }
);

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.unseenNotifications = [];
    user.seenNotifcations = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications deleted",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account!",
      success: false,
      error,
    });
  }
});

router.get("/get-all-users", authMiddleware, async (req, res) => {
  console.log(32);
  try {
    const users = await User.find({});
    res.status(200).send({
      message: "Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting user data errors!",
      success: false,
      error,
    });
  }
});

router.post("/change-doctor-status", authMiddleware, async (req, res) => {
  console.log(23);
  try {
    const { doctorId, status } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(doctorId, { status });
    const user = await User.findOne({ _id: doctor.userId });
    const unseenNotifications = user.unseenNotifications;
    user.unseenNotifications.push({
      type: "new-doctor-request-changed",
      message: `Your doctor account has been ${status}`,
      onClickPath: "/notifications",
    });
    user.isDoctor = status === "Approved" ? true : false;
    await user.save();
    res.status(200).send({
      message: "Doctor status updated",
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting user data errors!",
      success: false,
      error,
    });
  }
});

router.get("/get-all-doctors", authMiddleware, async (req, res) => {
  console.log(32);
  try {
    const doctors = await Doctor.find({});
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting doctors data errors!",
      success: false,
      error,
    });
  }
});

router.post("/get-doctor-info-by-user-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.body.userId });
    res.status(200).send({
      message: "Doctor info fethed successfully",
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error getting doctor info!", success: false });
  }
});

router.post(
  "/get-doctor-info-by-doctor-id",
  authMiddleware,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ _id: req.body.doctorId });
      console.log(doctor);
      res.status(200).send({
        message: "Doctor info fethed successfully",
        success: true,
        data: doctor,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send({ message: "Error getting doctor info!", success: false });
    }
  }
);

router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    req.body.date = moment(req.body.date, "DD:MM:YYYY").toISOString();
    const newAppointment = new Appointments(req.body);
    await newAppointment.save();
    const user = await User.findOne({ _id: req.body.doctorInfo.userId });
    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request hasbeen made by ${req.body.userInfo.name}`,
      onClickPath: "/doctor/appointments",
    });
    await user.save();
    res.status(200).send({
      message: "Doctor booking successfull",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error getting while booking!", success: false });
  }
});

router.post("/check-booking-availability", authMiddleware, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD:MM-YYYY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toISOString();
    const toTime = moment(req.body.time, "HH:mm")
      .add(1, "hours")
      .toISOString();
      console.log(fromTime,toTime)
    const doctorId = req.body.doctorId;
    const appointments = await Appointments.find({
      doctorId,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });
    if (appointments.length > 0) {
      res.status(200).send({
        message: "Appointments not available",
        success: false,
      });
    } else {
      res.status(200).send({
        message: "Appointments available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error getting while checking bookings!",
      success: false,
    });
  }
});

router.post("/update-doctor-profile", authMiddleware, async (req, res) => {
  console.log(req.body);
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.body.userId },
      req.body
    );
    res.status(200).send({
      message: "Doctor profile updated successfully",
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error getting doctor info!", success: false });
  }
});

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
  console.log(32);
  try {
    const doctors = await Doctor.find({ status: "Approved" });
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting doctors data errors!",
      success: false,
      error,
    });
  }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  console.log(32);
  try {
    const appointments = await Appointments.find({ userId: req.body.userId });
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting appointments data errors!",
      success: false,
      error,
    });
  }
});

router.get(
  "/get-appointments-by-doctor-id",
  authMiddleware,
  async (req, res) => {
    console.log(32);
    try {
      const doctor = await Doctor.findOne({ userId: req.body.userId });
      const appointments = await Appointments.find({ doctorId: doctor._id });
      res.status(200).send({
        message: "Appointments fetched successfully",
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error while getting appointments data errors!",
        success: false,
        error,
      });
    }
  }
);

router.get("/get-all-users", authMiddleware, async (req, res) => {
  console.log(32);
  try {
    const users = await User.find({});
    res.status(200).send({
      message: "Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting user data errors!",
      success: false,
      error,
    });
  }
});

router.post("/change-appointment-status", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const appointment = await Appointments.findByIdAndUpdate(appointmentId, {
      status,
    });
    const user = await User.findOne({ _id: appointment.userId });
    const unseenNotifications = user.unseenNotifications;
    user.unseenNotifications.push({
      type: "appointment-status-changed",
      message: `Your appointment status has been ${status}`,
      onClickPath: "/appointments",
    });
    await user.save();
    res.status(200).send({
      message: "Appointment status updated!",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting user data errors!",
      success: false,
      error,
    });
  }
});

module.exports = router;
