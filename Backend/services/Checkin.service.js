// services/CheckIn.service.js
import CheckIn from "../models/CheckingSchema.js";
import Employee from "../models/Employee.js";
import NotificationService from "./Notification.service.js";

class CheckInService {
  async checkIn(employeeId, location) {
    try {
      const activeCheckIn = await CheckIn.findOne({
        employee: employeeId,
        checkOutTime: null,
      });
      console.log(activeCheckIn);
      if (activeCheckIn) {
        throw new Error("Employee is already checked in");
      }

      // Create a check-in record with the provided location
      const checkIn = await CheckIn.create({
        employee: employeeId,
        checkInTime: new Date(),
        location, // Store original check-in location
      });

      // Find employee
      const employee = await Employee.findById(employeeId);

      // Prepare update data for employee record
      const updateData = {
        status: "checkedIn",
        checkInLocation: {
          ...location,
          updatedAt: new Date(),
        },
      };

      // If this is their first check-in or they don't have a default location yet,
      // set this location as their default check-in location
      if (
        !employee.defaultCheckInLocation ||
        employee.defaultCheckInLocation.latitude === undefined ||
        employee.defaultCheckInLocation.longitude === undefined
      ) {
        updateData.defaultCheckInLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          setAt: new Date(),
        };

        console.log(
          `Setting default location for employee ${employeeId} for the first time`
        );
      }

      // Update employee record
      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        updateData,
        { new: true }
      );

      await NotificationService.createNotificationWithHR({
        employeeId,
        title: "Check In Successful",
        message: `You have successfully checked in at ${new Date().toLocaleTimeString()}`,
        hrTitle: "Employee Check In",
        hrMessage: `${employee.firstName} ${
          employee.lastName
        } has checked in at ${new Date().toLocaleTimeString()}`,
        type: "CHECK_IN_SUCCESS",
        relatedId: checkIn._id,
        relatedModel: "CheckIn",
      });

      return await checkIn.populate("employee");
    } catch (error) {
      throw new Error("Error checking in: " + error.message);
    }
  }

  async checkOut(employeeId) {
    try {
      const activeCheckIn = await CheckIn.findOne({
        employee: employeeId,
        checkOutTime: null,
      });

      if (!activeCheckIn) {
        throw new Error("No active check-in found");
      }

      activeCheckIn.checkOutTime = new Date();
      await activeCheckIn.save();

      const employee = await Employee.findByIdAndUpdate(
        employeeId,
        {
          status: "checkedOut",
          checkInLocation: null, // Clear current location
        },
        { new: true }
      );

      await NotificationService.createNotificationWithHR({
        employeeId,
        title: "Check Out Successful",
        message: `You have successfully checked out at ${new Date().toLocaleTimeString()}`,
        hrTitle: "Employee Check Out",
        hrMessage: `${employee.firstName} ${
          employee.lastName
        } has checked out at ${new Date().toLocaleTimeString()}`,
        type: "CHECK_OUT_SUCCESS",
        relatedId: activeCheckIn._id,
        relatedModel: "CheckIn",
      });

      return await activeCheckIn.populate("employee");
    } catch (error) {
      throw new Error("Error checking out: " + error.message);
    }
  }

  async updateLocation(employeeId, location) {
    try {
      // Check if employee is checked in
      const employee = await Employee.findById(employeeId);

      if (employee.status !== "checkedIn") {
        throw new Error("Employee is not checked in");
      }

      // Update only the employee's current location
      // We don't update the CheckIn record's location as that's the historical record
      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        {
          checkInLocation: {
            ...location,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      return {
        success: true,
        location,
        defaultLocation: updatedEmployee.defaultCheckInLocation,
      };
    } catch (error) {
      throw new Error("Error updating location: " + error.message);
    }
  }

  async monitorLocation(employeeId, currentLocation) {
    try {
      // Check if employee is checked in
      const employee = await Employee.findById(employeeId);

      if (employee.status !== "checkedIn") {
        throw new Error("Employee is not checked in");
      }

      // Update current location in employee record
      await Employee.findByIdAndUpdate(
        employeeId,
        {
          checkInLocation: {
            ...currentLocation,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      // Check if employee has moved significantly from their default check-in location
      if (
        employee.defaultCheckInLocation &&
        employee.defaultCheckInLocation.latitude &&
        employee.defaultCheckInLocation.longitude
      ) {
        const distanceFromDefault = this.calculateDistance(
          employee.defaultCheckInLocation,
          currentLocation
        );

        // If distance is more than 100 meters (0.1 km)
        if (distanceFromDefault > 0.1) {
          // Send notification about location change
          await NotificationService.createNotificationWithHR({
            employeeId,
            title: "Location Change Detected",
            message: `Your current location is ${distanceFromDefault.toFixed(
              2
            )} km from your default work location`,
            hrTitle: "Employee Location Change",
            hrMessage: `${employee.firstName} ${
              employee.lastName
            } has moved ${distanceFromDefault.toFixed(
              2
            )} km from their default work location`,
            type: "SYSTEM",
            relatedId: employee._id,
            relatedModel: "Employee",
          });

          return {
            locationChanged: true,
            currentLocation,
            defaultLocation: employee.defaultCheckInLocation,
            distance: distanceFromDefault,
          };
        }
      }

      return {
        locationChanged: false,
        currentLocation,
      };
    } catch (error) {
      throw new Error("Error monitoring location: " + error.message);
    }
  }

  // Calculate distance using Haversine formula (in kilometers)
  calculateDistance(loc1, loc2) {
    // Earth radius in km
    const R = 6371;
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getStatus(employeeId) {
    try {
      const employee = await Employee.findById(employeeId);
      const activeCheckIn = await CheckIn.findOne({
        employee: employeeId,
        checkOutTime: null,
      });

      return {
        status: employee.status,
        // Current live location (updated in real-time)
        currentLocation: employee.checkInLocation,
        // Base/default work location
        defaultCheckInLocation: employee.defaultCheckInLocation,
        // When they checked in
        lastCheckIn: activeCheckIn ? activeCheckIn.checkInTime : null,
        // Original check-in location for this session
        checkInSessionLocation: activeCheckIn ? activeCheckIn.location : null,
      };
    } catch (error) {
      throw new Error("Error getting status: " + error.message);
    }
  }

  async getHistory(employeeId, startDate, endDate) {
    try {
      const query = { employee: employeeId };

      if (startDate && endDate) {
        query.checkInTime = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      return await CheckIn.find(query)
        .sort({ checkInTime: -1 })
        .populate("employee");
    } catch (error) {
      throw new Error("Error getting history: " + error.message);
    }
  }

  async getTodayDetails(employeeId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCheckins = await CheckIn.find({
        employee: employeeId,
        checkInTime: {
          $gte: today,
          $lt: tomorrow,
        },
      }).sort({ checkInTime: -1 });

      let totalHours = 0;
      todayCheckins.forEach((checkin) => {
        if (checkin.checkOutTime) {
          const duration = checkin.checkOutTime - checkin.checkInTime;
          totalHours += duration / (1000 * 60 * 60); // Convert to hours
        }
      });

      return {
        checkins: todayCheckins,
        totalHours: Math.round(totalHours * 100) / 100,
        currentStatus: await this.getStatus(employeeId),
      };
    } catch (error) {
      throw new Error("Error getting today's details: " + error.message);
    }
  }

  // Allow HR to set or update an employee's default check-in location
  async setDefaultCheckInLocation(employeeId, location) {
    try {
      const employee = await Employee.findByIdAndUpdate(
        employeeId,
        {
          defaultCheckInLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            setAt: new Date(),
          },
        },
        { new: true }
      );

      if (!employee) {
        throw new Error("Employee not found");
      }

      return {
        success: true,
        defaultCheckInLocation: employee.defaultCheckInLocation,
      };
    } catch (error) {
      throw new Error(
        "Error setting default check-in location: " + error.message
      );
    }
  }

  async getTodayStats(employeeId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find today's check-in record
      const checkIn = await CheckIn.findOne({
        employee: employeeId,
        checkInTime: { $gte: today, $lt: tomorrow },
      });

      let hoursToday = 0;
      let isCheckedIn = false;
      let checkInTime = null;

      if (checkIn) {
        isCheckedIn = !checkIn.checkOutTime;
        checkInTime = checkIn.checkInTime;

        if (checkIn.checkOutTime) {
          // If already checked out, calculate hours
          const duration = checkIn.checkOutTime - checkIn.checkInTime;
          hoursToday = duration / (1000 * 60 * 60); // Convert ms to hours
        } else {
          // If still checked in, calculate hours up to now
          const duration = new Date() - checkIn.checkInTime;
          hoursToday = duration / (1000 * 60 * 60); // Convert ms to hours
        }
      }

      return {
        hoursToday: parseFloat(hoursToday.toFixed(1)), // Round to 1 decimal place
        isCheckedIn,
        checkInTime: checkInTime?.toISOString(),
      };
    } catch (error) {
      throw new Error("Error getting check-in stats: " + error.message);
    }
  }
}

export default new CheckInService();
