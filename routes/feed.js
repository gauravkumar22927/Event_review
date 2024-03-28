const express = require("express")
const router = express.Router()
const { User, Event } = require("../models/model")

// MongoDB Connection in app.js

// GET request for fetching all users
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST request for creating a new user
router.post("/users", async (req, res, next) => {
  const newUser = new User(req.body)
  try {
    const savedUser = await newUser.save()
    res.status(201).json(savedUser)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
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

module.exports = router
