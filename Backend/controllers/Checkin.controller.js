// controllers/CheckIn.controller.js
import CheckInService from "../services/CheckIn.service.js";

class CheckInController {
  async checkIn(req, res) {
    const { latitude, longitude } = req.body;
    const employeeId = req.user.id; // From JWT token

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location data is required" });
    }

    try {
      const checkIn = await CheckInService.checkIn(employeeId, {
        latitude,
        longitude,
      });
      return res.status(201).json(checkIn);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async checkOut(req, res) {
    const employeeId = req.user.id;

    try {
      const checkOut = await CheckInService.checkOut(employeeId);
      return res.status(200).json(checkOut);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateLocation(req, res) {
    const { latitude, longitude } = req.body;
    const employeeId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location data is required" });
    }

    try {
      const updatedLocation = await CheckInService.updateLocation(employeeId, {
        latitude,
        longitude,
      });
      return res.status(200).json(updatedLocation);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async monitorLocation(req, res) {
    const { latitude, longitude } = req.body;
    const employeeId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location data is required" });
    }

    try {
      const result = await CheckInService.monitorLocation(employeeId, {
        latitude,
        longitude,
      });
      console.log("here", result);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in monitorLocation:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  async getStatus(req, res) {
    const employeeId = req.user.id;

    try {
      const status = await CheckInService.getStatus(employeeId);
      return res.status(200).json(status);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getHistory(req, res) {
    const employeeId = req.user.id;
    const { startDate, endDate } = req.query;

    try {
      const history = await CheckInService.getHistory(
        employeeId,
        startDate,
        endDate
      );
      return res.status(200).json(history);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getTodayDetails(req, res) {
    const employeeId = req.user.id;

    try {
      const details = await CheckInService.getTodayDetails(employeeId);
      return res.status(200).json(details);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // HR-only endpoint to set a default check-in location for an employee
  async setDefaultCheckInLocation(req, res) {
    const { employeeId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location data is required" });
    }

    try {
      const result = await CheckInService.setDefaultCheckInLocation(
        employeeId,
        {
          latitude,
          longitude,
        }
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new CheckInController();
