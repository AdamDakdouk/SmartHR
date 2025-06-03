import AuthService from "../services/Auth.service.js";

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    try {
      const { tokens, employee } = await AuthService.login(email, password);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken, // You might want to remove this if using cookies
          },
          employee,
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  async refresh(req, res) {
    console.log(req.params);
    const refreshToken = req.params.refreshToken || req.body.refreshToken;
    console.log("Here");
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    try {
      const tokens = await AuthService.refreshToken(refreshToken);

      // Update refresh token cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Tokens refreshed successfully",
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken, // Optional if using cookies
          },
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  }

  async logout(req, res) {
    try {
      await AuthService.logout(req.employee.id);

      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async signUp(req, res) {
    const { firstName, lastName, email, password } = req.body;
    console.log("Here", req.body);
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const response = await AuthService.signUp({
        firstName,
        lastName,
        email,
        password,
      });
      return res.status(201).json(response);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async activateAccount(req, res) {
    const { email, otp } = req.body;
    console.log(req.body);
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    try {
      const response = await AuthService.activateAccount(email, Number(otp));
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async sendResetPasswordCode(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      const response = await AuthService.sendResetPasswordCode(email);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async resetPassword(req, res) {
    const { email, code, newPassword } = req.body;
    console.log("Here");
    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }

    try {
      const response = await AuthService.resetPassword(
        email,
        code,
        newPassword
      );
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async resendOTP(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      const response = await AuthService.resendOTP(email);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

export default new AuthController();
