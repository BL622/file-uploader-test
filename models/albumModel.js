const mongoose = require('mongoose')

const AlbumSchema = new mongoose.Schema({
    _id: {
        type: String,
        primary: true,
    },
    creators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    songs: [{
        song_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song',
            required: true,
        }
    }],
    cover_img: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now(),
    },
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
    },
    description: {
        type: String,
    },
    genre: [{
        type: String,
        required: true,
    }],
    like_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Like'
    }
})

module.exports = mongoose.model('Album', AlbumSchema)