const mongoose = require('mongoose')

const LikeSchema = new mongoose.Schema({
    _id: {
        type: String,
        primary: true,
    },
    count: {
        type: Number,
        required: true,
    },
    likes: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    }]
})

module.exports = mongoose.model('Like', LikeSchema)