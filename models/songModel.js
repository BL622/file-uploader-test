const mongoose = require('mongoose')

const SongSchema = new mongoose.Schema({
    _id: {
        type: String,
        primary: true,
    },
    album_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        required: true,
    },
    song_number: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    length: {
        type: Number,
        required: true,
    },
    filename: {
        type: String,
        required: true,
    },
    creators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    comment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    like_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Like'
    },
})

module.exports = mongoose.model('Song', SongSchema)