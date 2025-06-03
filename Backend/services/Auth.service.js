import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOTP } from "../utils/otpUtils.js";
import { StandardEmailSender } from "../utils/emails.util.js";
import dotenv from "dotenv";
dotenv.config();
import { capitalizeEachWord } from "../utils/emails.util.js";

class AuthService {
  generateTokens(employeeData) {
    // Access token - short lived (15 mins to 1 hour)
    const accessToken = jwt.sign(
      {
        id: employeeData._id,
        role: employeeData.role,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "60m" }
    );

    // Refresh token - longer lived (7 days to 30 days)
    const refreshToken = jwt.sign(
      {
        id: employeeData._id,
        version: employeeData.tokenVersion, // For invalidating all refresh tokens
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
  }

  async login(email, password) {
    try {
      const employee = await Employee.findOne({ email });
      if (!employee) {
        throw new Error("Employee not found");
      }

      if (!employee.isVerified) {
        throw new Error("Please activate your account first");
      }

      const isMatch = await bcrypt.compare(password, employee.password);
      if (!isMatch) {
        throw new Error("Invalid credentials");
      }

      const { accessToken, refreshToken } = this.generateTokens(employee);

      // Store refresh token hash in the database
      employee.refreshToken = await bcrypt.hash(refreshToken, 10);
      employee.lastLogin = new Date();
      await employee.save();

      // Remove sensitive data before sending
      const employeeData = employee.toObject();
      delete employeeData.password;
      delete employeeData.refreshToken;

      return {
        tokens: { accessToken, refreshToken },
        employee: employeeData,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Find employee and check token version
      const employee = await Employee.findById(payload.id);
      if (!employee || payload.version !== employee.tokenVersion) {
        throw new Error("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = this.generateTokens(employee);

      // Update refresh token in database
      employee.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
      await employee.save();

      return tokens;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  async logout(employeeId) {
    try {
      // Invalidate refresh token by incrementing version
      const employee = await Employee.findById(employeeId);
      if (employee) {
        employee.tokenVersion += 1;
        employee.refreshToken = null;
        await employee.save();
      }
      return true;
    } catch (error) {
      throw new Error("Logout failed");
    }
  }

  async signUp({ firstName, lastName, email, password }) {
    try {
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        throw new Error("Employee already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = await generateOTP();

      const employee = new Employee({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        otp,
        otpGeneratedAt: new Date(),
        isVerified: false,
      });
      await employee.save();

      const emailContent = `
        <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Activate Your Account</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
            <p>Dear ${firstName} ${lastName},</p>
            <p>Thank you for signing up for our service. To activate your account, please use the following activation code:</p>
            <p style="font-size: 24px; font-weight: bold;">${otp}</p>
            <p>The activation code is valid for 15 minutes.</p>

            <p>If you have any questions or need assistance, please contact us at ${process.env.SENDER_EMAIL}.</p>
            <p>Thank you,</p>
            <p>The SmartHR Team</p>
          </body>
          </html>
        `;

      // Create instance of StandardEmailSender and send the email
      const emailSender = new StandardEmailSender();
      await emailSender.sendEmail(
        "SmartHR",
        process.env.SENDER_EMAIL,
        email,
        "Account Activation",
        emailContent
      );

      return { message: "User created, activation code sent to email" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async activateAccount(email, otp) {
    try {
      const employee = await Employee.findOne({ email });
      if (!employee) {
        throw new Error("Employee not found");
      }

      const otpAgeMinutes =
        (new Date() - new Date(employee.otpGeneratedAt)) / 60000;
      if (otpAgeMinutes > 15) {
        throw new Error("OTP expired");
      }

      if (employee.otp !== otp) {
        console.log(employee, " otp:", otp);
        throw new Error("Invalid OTP");
      }

      employee.isVerified = true;
      employee.otp = undefined; // Clear OTP after activation
      employee.otpGeneratedAt = undefined;
      await employee.save();

      return { message: "Account activated successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async sendResetPasswordCode(email) {
    try {
      const employee = await Employee.findOne({ email });
      if (!employee) {
        throw new Error("Employee not found");
      }

      const otp = await generateOTP();
      employee.otp = otp;
      employee.otpGeneratedAt = new Date();
      await employee.save();

      const emailContent = `
       <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Password Reset Request</title>
          </head>
          <body>
            <p>Dear ${capitalizeEachWord(
              employee?.first_name
            )} ${capitalizeEachWord(employee?.last_name)},</p>

            <p>We received a request to reset your password. To proceed, please use the following password reset code:</p>

            <h2 style="font-size: 24px; font-weight: bold; color: #3F3F3F;">${otp}</h2>

            <p>The password reset code is valid for 15 minutes.</p>

            <p>If you did not make this request, please ignore this email and contact us immediately at <a href="mailto: ${
              process.env.SENDER_EMAIL
            }"> ${
        process.env.SENDER_EMAIL
      }</a> if you suspect any unauthorized activity on your account.</p>

            <p>Thank you,</p>
            <p>The SmartHR Team</p>
          </body>
          </html>
          `;

      // Create instance of StandardEmailSender and send the email
      const emailSender = new StandardEmailSender();
      await emailSender.sendEmail(
        "SmartHR",
        process.env.SENDER_EMAIL,
        email,
        "Password Reset Code",
        emailContent
      );

      return { message: "Reset code sent to email" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async resetPassword(email, otp, newPassword) {
    try {
      const employee = await Employee.findOne({ email });
      if (!employee) {
        throw new Error("Employee not found");
      }

      const otpAgeMinutes =
        (new Date() - new Date(employee.otpGeneratedAt)) / 60000;
      if (otpAgeMinutes > 15) {
        throw new Error("OTP expired");
      }

      if (employee.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      employee.password = await bcrypt.hash(newPassword, 10);
      employee.otp = undefined; // Clear OTP after password reset
      employee.otpGeneratedAt = undefined;
      await employee.save();

      return { message: "Password reset successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async resendOTP(email) {
    try {
      const employee = await Employee.findOne({ email });
      if (!employee) {
        throw new Error("Employee not found");
      }
      const newOtp = await generateOTP();
      employee.otp = newOtp;
      await employee.save();

      const emailContent = `
        <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Activate Your Account</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
            <p>Dear ${firstName} ${lastName},</p>
            <p>Thank you for signing up for our service. To activate your account, please use the following activation code:</p>
            <p style="font-size: 24px; font-weight: bold;">${otp}</p>
            <p>The activation code is valid for 15 minutes.</p>

            <p>If you have any questions or need assistance, please contact us at ${process.env.SENDER_EMAIL}.</p>
            <p>Thank you,</p>
            <p>The SmartHR Team</p>
          </body>
          </html>
        `;

      // Create instance of StandardEmailSender and send the email
      const emailSender = new StandardEmailSender();
      await emailSender.sendEmail(
        "SmartHR",
        process.env.SENDER_EMAIL,
        email,
        "Account Activation",
        emailContent
      );

      return { message: "OTP sent to email" };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new AuthService();
