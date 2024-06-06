const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
    _id: {
        type: String,
        primary: true,
    },
    count: {
        type: Number,
        required: true,
    },
    comments: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        comment: {
            type: String,
            required: true,
        },
        commented_at: {
            type: Date,
            default: Date.now(),
        }
    }]
})

module.exports = mongoose.model('Comment', CommentSchema)