/**
 * Sends a standardised JSON response.
 *
 * Success shape: { success: true, message, data }
 * Error shape  : { success: false, message }  ← handled by error.middleware.js
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {*} data  — the payload (use null for deletes / actions with no body)
 * @param {string} [message]
 */
const sendResponse = (res, statusCode, data, message = "Success") => {
  res.status(statusCode).json({ success: true, message, data });
};

export default sendResponse;
