import { Resend } from "resend";
import logger from "./logger.js";
import axios from "axios";

const resend = new Resend(process.env.RESEND_API_KEY);


// ─── Send email helper 
const sendEmail = async ({ to, subject, html }) => {
  const { error } = await resend.emails.send({
    from: "LetsGoo <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
  if (error) {
    logger.error("Resend error:", { error });
    throw new Error(error.message);
  }
};

// ─── Auth service se user email fetch karo
const getUserEmail = async (userId) => {
  try {
    const res = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/auth/internal/users/emails`,
      { userIds: [userId] }
    );
    return res.data.data.users[0] || null;
  } catch (err) {
    logger.error("Get user email error:", { message: err.message });
    return null;
  }
};

// ─── Ride Request Received — Driver ko
export const sendRideRequestEmail = async (driverUserId, riderName) => {
  try {
    const driver = await getUserEmail(driverUserId);
    if (!driver) return;

    await sendEmail({
      to: driver.email,
      subject: "New Ride Request — LetsGoo",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h2 style="color:#1e293b;">New Ride Request 🚗</h2>
          <p>Hi <strong>${driver.fullName || driver.username}</strong>,</p>
          <p><strong>${riderName}</strong> wants to join your ride.</p>
          <p>Open the app to accept or reject the request.</p>
          <p style="color:#94a3b8;font-size:13px;">LetsGoo Team</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error("Send ride request email error:", { message: err.message });
  }
};

// ─── Ride Request Accepted — Rider ko
export const sendRideAcceptedEmail = async (riderUserId, driverName, ride) => {
  try {
    const rider = await getUserEmail(riderUserId);
    if (!rider) return;

    await sendEmail({
      to: rider.email,
      subject: "Ride Request Accepted — LetsGoo",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h2 style="color:#16a34a;">Ride Request Accepted ✅</h2>
          <p>Hi <strong>${rider.fullName || rider.username}</strong>,</p>
          <p><strong>${driverName}</strong> accepted your ride request!</p>
          <p>📍 From: <strong>${ride.from.address}</strong></p>
          <p>📍 To: <strong>${ride.to.address}</strong></p>
          <p>🕐 Departure: <strong>${new Date(ride.departureTime).toLocaleString()}</strong></p>
          <p style="color:#94a3b8;font-size:13px;">LetsGoo Team</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error("Send ride accepted email error:", { message: err.message });
  }
};

// ─── Ride Request Rejected — Rider ko
export const sendRideRejectedEmail = async (riderUserId, driverName) => {
  try {
    const rider = await getUserEmail(riderUserId);
    if (!rider) return;

    await sendEmail({
      to: rider.email,
      subject: "Ride Request Update — LetsGoo",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h2 style="color:#dc2626;">Ride Request Rejected</h2>
          <p>Hi <strong>${rider.fullName || rider.username}</strong>,</p>
          <p>Unfortunately <strong>${driverName}</strong> could not accommodate your request.</p>
          <p>You can search for other available rides on LetsGoo.</p>
          <p style="color:#94a3b8;font-size:13px;">LetsGoo Team</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error("Send ride rejected email error:", { message: err.message });
  }
};

// ─── Ride Cancelled — Rider ko
export const sendRideCancelledEmail = async (riderUserId, driverName, ride) => {
  try {
    const rider = await getUserEmail(riderUserId);
    if (!rider) return;

    await sendEmail({
      to: rider.email,
      subject: "Ride Cancelled — LetsGoo",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h2 style="color:#dc2626;">Ride Cancelled ❌</h2>
          <p>Hi <strong>${rider.fullName || rider.username}</strong>,</p>
          <p>Your ride from <strong>${ride.from.address}</strong> to <strong>${ride.to.address}</strong> 
          has been cancelled by <strong>${driverName}</strong>.</p>
          <p>Please search for another ride on LetsGoo.</p>
          <p style="color:#94a3b8;font-size:13px;">LetsGoo Team</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error("Send ride cancelled email error:", { message: err.message });
  }
};
