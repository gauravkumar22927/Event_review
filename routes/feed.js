const express = require("express")
const router = express.Router()
const { User, Organizer, Admin, Review, Event } = require("../models/model")
const { body, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const isAuth = require("../middleware/isAuth")

// MongoDB Connection in app.js

// GET request for fetching all users
router.get("/users", isAuth, async (req, res, next) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for creating a new user
router.post(
  "/users",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((obj) => {
          if (obj) {
            return Promise.reject("E-mail already exists!")
          }
        })
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }).withMessage("Password must be at least 5 characters long."),
    body("username").trim().not().isEmpty().withMessage("Username cannot be empty."),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.")
      error.statusCode = 422
      error.data = errors.array()
      return next(error)
    }
    try {
      const password = req.body.password
      const email = req.body.email
      const username = req.body.username

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create new user with hashed password
      const newUser = new User({
        email: email,
        password: hashedPassword,
        username: username,
      })

      // Save user
      const savedUser = await newUser.save()
      res.status(201).json(savedUser)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
)

//login and generate jwt token
router.post("/userlogin", async (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  let loadedUser
  await User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("A User with this email couldnot be found.")
        error.statusCode = 401
        return next(error)
      }
      loadedUser = user
      return bcrypt.compare(password, user.password)
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password!")
        error.statusCode = 401
        return next(error)
      }
    })
  const token = jwt.sign(
    {
      email: loadedUser.email,
      userId: loadedUser._id.toString(),
    },
    "somesupersecrettoken",
    { expiresIn: "1h" }
  )
  res.status(200).json({ token: token, userId: loadedUser._id.toString() })
})

// GET request for fetching all events
router.get("/events", async (req, res, next) => {
  try {
    const events = await Event.find()
    res.json(events)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for creating a new event
router.post("/events", async (req, res, next) => {
  const newEvent = new Event(req.body)
  try {
    const savedEvent = await newEvent.save()
    res.status(201).json(savedEvent)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// GET request for fetching all organizers
router.get("/organizers", async (req, res, next) => {
  try {
    const organizers = await Organizer.find()
    res.json(organizers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for creating a new organizer
router.post("/organizers", async (req, res, next) => {
  const newOrganizer = new Organizer(req.body)
  try {
    const savedOrganizer = await newOrganizer.save()
    res.status(201).json(savedOrganizer)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// GET request for fetching all responses for a specific review
router.get("/reviews/:reviewId/responses", async (req, res, next) => {
  const { reviewId } = req.params
  try {
    const responses = await Response.find({ review_id: reviewId })
    res.json(responses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for creating a new response for a specific review
router.post("/reviews/:reviewId/responses", async (req, res, next) => {
  const { reviewId } = req.params
  const newResponse = new Response({ ...req.body, review_id: reviewId })
  try {
    const savedResponse = await newResponse.save()
    res.status(201).json(savedResponse)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// GET request for fetching all reviews for a specific event
router.get("/events/:eventId/reviews", async (req, res, next) => {
  const { eventId } = req.params
  try {
    const reviews = await Review.find({ event_id: eventId }).populate({
      path: "organizer_response",
      populate: {
        path: "organizer_id",
        select: "name", // Specify the fields you want to include from the Organizer schema
      },
    })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for creating a new review for a specific event
router.post("/events/:eventId/reviews", async (req, res, next) => {
  const { eventId } = req.params
  const newReview = new Review({ ...req.body, event_id: eventId })
  try {
    const savedReview = await newReview.save()
    res.status(201).json(savedReview)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// POST request for liking a review
router.post("/reviews/:reviewId/like", async (req, res, next) => {
  const { reviewId } = req.params
  const userId = req.body.userId // Assuming userId is sent in the request body
  try {
    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }
    // Check if the user already liked the review
    if (review.likes.includes(userId)) {
      return res.status(400).json({ message: "You have already liked this review" })
    }
    review.likes.push(userId)
    await review.save()
    res.status(200).json({ message: "Review liked successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for reporting a review
router.post("/reviews/:reviewId/report", async (req, res, next) => {
  const { reviewId } = req.params
  const userId = req.body.userId // Assuming userId is sent in the request body
  try {
    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }
    // Check if the user already reported the review
    if (review.reports.includes(userId)) {
      return res.status(400).json({ message: "You have already reported this review" })
    }
    review.reports.push(userId)
    // Flag the review if reported more than five times
    if (review.reports.length > 5) {
      review.flagged = true
    }
    await review.save()
    res.status(200).json({ message: "Review reported successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for organizer response to a review
router.post("/reviews/:reviewId/response", async (req, res, next) => {
  const { reviewId } = req.params
  const { content } = req.body // Assuming content of organizer response is sent in the request body
  try {
    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }
    const newResponse = new Response({ review_id: reviewId, content })
    const savedResponse = await newResponse.save()
    // Update the review document with the organizer_response field
    review.organizer_response = savedResponse._id
    await review.save()
    res.status(201).json({ message: "Organizer response added successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Middleware for organizer authentication
const authenticateOrganizer = async (req, res, next) => {
  // Check if organizer token exists in headers or session
  const organizerToken = req.headers.authorization // Assuming token is sent in the Authorization header
  if (!organizerToken) {
    return res.status(401).json({ message: "Organizer token is required" })
  }
  // Validate organizer token
  // You can implement your authentication logic here, such as decoding the token and verifying it against a database
  // For simplicity, let's assume organizer is authenticated if token exists
  next()
}

// Middleware for admin authentication
const authenticateAdmin = async (req, res, next) => {
  // Check if admin token exists in headers or session
  const adminToken = req.headers.authorization // Assuming token is sent in the Authorization header
  if (!adminToken) {
    return res.status(401).json({ message: "Admin token is required" })
  }
  // Validate admin token
  // You can implement your authentication logic here, such as decoding the token and verifying it against a database
  // For simplicity, let's assume admin is authenticated if token exists
  next()
}

// POST request for organizer login
router.post("/organizers/login", async (req, res, next) => {
  // Implement organizer login logic here
})

// POST request for admin login
router.post("/admin/login", async (req, res, next) => {
  // Implement admin login logic here
})

// Middleware for organizer validation by admin
const validateOrganizerByAdmin = async (req, res, next) => {
  // Implement validation logic here
}

// GET request for fetching reviews associated with events an organizer is associated with
router.get("/organizers/:organizerId/reviews", authenticateOrganizer, async (req, res, next) => {
  const { organizerId } = req.params
  try {
    // Fetch events associated with the organizer
    const organizer = await Organizer.findById(organizerId)
    const events = organizer.events
    // Fetch reviews for those events
    const reviews = await Review.find({ event_id: { $in: events } })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for organizer response to a review
router.post("/reviews/:reviewId/response", authenticateOrganizer, validateOrganizerByAdmin, async (req, res, next) => {
  // Implement response creation logic here
})

// Admin routes

// POST request for validating an organizer
router.post("/admin/organizers/:organizerId/validate", authenticateAdmin, async (req, res, next) => {
  // Implement organizer validation logic here
})

// POST request for revoking organizer validation
router.post("/admin/organizers/:organizerId/revoke", authenticateAdmin, async (req, res, next) => {
  // Implement organizer validation revocation logic here
})

module.exports = router
