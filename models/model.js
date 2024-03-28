const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Users Collection Schema
const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    // Other user information fields can be added here
});

const User = mongoose.model('User', userSchema);

// Events Collection Schema
const eventSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    // Other event information fields can be added here
});

const Event = mongoose.model('Event', eventSchema);

// Organizers Collection Schema
const organizerSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    // Other organizer information fields can be added here
});

const Organizer = mongoose.model('Organizer', organizerSchema);

// Responses Collection Schema
const responseSchema = new Schema({
    review_id: { type: Schema.Types.ObjectId, ref: 'Review', required: true },
    organizer_id: { type: Schema.Types.ObjectId, ref: 'Organizer', required: true },
    content: { type: String, required: true },
});

const Response = mongoose.model('Response', responseSchema);

// Reviews Collection Schema
const reviewSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event_id: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    ratings: {
        registration_experience: { type: Number, required: true },
        event_experience: { type: Number, required: true },
        breakfast_experience: { type: Number, required: true },
        overall_rating: { type: Number, required: true }
    },
    content: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reports: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    organizer_response: { type: Schema.Types.ObjectId, ref: 'Response' },
    flagged: { type: Boolean, default: false }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = { User, Event, Organizer, Response, Review };
