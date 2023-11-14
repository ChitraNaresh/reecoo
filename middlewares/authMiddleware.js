const jwt = require("jsonwebtoken");
module.exports = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    jwt.verify(token, "BOOKING", (error, decoded) => {
      if (error) {
        return res.status({ message: "Auth failed!", success: false });
      } else {
        req.body.userId = decoded.id;
        next();
      }
    });
  } catch (error) {
    console.log(error);
    res.status(401).send({ message: "Auth failed", success: false });
  }
};
