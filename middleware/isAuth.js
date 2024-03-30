const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  const token = req.get("Authorization")
  let decodedToken
  try {
    decodedToken = jwt.verify(token, "somesupersecrettoken")
  } catch (err) {
    err.statusCode = 500
    return next(err)
  }
  if (!decodedToken) {
    const error = new Error("Not Authenticated.")
    error.statusCode = 401
    return next(error)
  }
  req.userId = decodedToken.userId
  next()
}
