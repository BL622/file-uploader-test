const mongoose = require('mongoose')

const PlaylistSchema = new mongoose.Schema({
    _id: {
        type: String,
        primary: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    is_public: {
        type: Boolean,
        required: true,
    },
    songs: [{
        song_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song',
        }
    }],
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String
    },
    description: {
        type: String
    },
    cover_img: {
        type: String,
        default: "/defaults/default_playlist.png",
    },
    created: {
        type: Date,
        default: Date.now(),
    },
    like_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Like'
    },
})

module.exports = mongoose.model('Playlist', PlaylistSchema)