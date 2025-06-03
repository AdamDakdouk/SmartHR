// controllers/RequestController.js
import RequestService from "../services/Request.service.js";

class RequestController {
  async createRequest(req, res) {
    try {
      const { employeeId, ...requestData } = req.body;

      if (!employeeId || !requestData.type) {
        return res
          .status(400)
          .json({ message: "Employee ID and request type are required" });
      }

      const request = await RequestService.createRequest(
        employeeId,
        requestData
      );
      return res.status(201).json(request);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAllRequests(req, res) {
    try {
      const requests = await RequestService.getAllRequests();
      return res.status(200).json(requests);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getRequestsByType(req, res) {
    try {
      const { type } = req.params;
      const requests = await RequestService.getRequestsByType(type);
      return res.status(200).json(requests);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getEmployeeRequests(req, res) {
    try {
      const { employeeId } = req.params;
      const requests = await RequestService.getEmployeeRequests(employeeId);
      return res.status(200).json(requests);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getEmployeeRequestsByType(req, res) {
    try {
      const { employeeId, type } = req.params;
      const requests = await RequestService.getEmployeeRequestsByType(
        employeeId,
        type
      );
      return res.status(200).json(requests);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateRequestStatus(req, res) {
    try {
      const { requestId, status, reviewerId, comments } = req.body;

      if (!requestId || !status) {
        return res
          .status(400)
          .json({ message: "Request ID and status are required" });
      }

      const request = await RequestService.updateRequestStatus(
        requestId,
        status,
        reviewerId,
        comments
      );
      return res.status(200).json(request);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getRequestById(req, res) {
    try {
      const { requestId } = req.params;
      const request = await RequestService.getRequestById(requestId);

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      return res.status(200).json(request);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getPendingRequestsCount(req, res) {
    try {
      const count = await RequestService.getPendingRequestsCount();
      return res.status(200).json({ count });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new RequestController();
