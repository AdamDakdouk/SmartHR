// middlewares/roleMiddleware.js
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No user found" });
    }

    const hasRole = roles.find((role) => req.user.role === role);
    if (!hasRole) {
      return res.status(403).json({
        message: "You don't have permission to perform this action",
      });
    }

    next();
  };
};
