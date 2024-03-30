// app.js
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const feedRoutes = require("./routes/feed")

const app = express()
const PORT = process.env.PORT || 8080

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/event_review_system", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err))

app.use(bodyParser.json())

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  next()
})
// Use feed routes
app.use("/", feedRoutes)

app.use((error, req, res, next) => {
  console.log(error)
  const status = error.statusCode || 500
  const message = error.message
  const data = error.data
  res.status(status).json({ message: message, data: data })
})

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
