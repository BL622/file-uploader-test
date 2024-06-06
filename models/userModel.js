const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        maxLength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    profile_img: {
        type: String,
        default: "/defaults/default_profile.png",
    },
    token:{
        type: String,
    },
    playlists: [{
        playlist_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Playlist',
            required: true,
        }
    }],
    is_artist: Boolean,
    artist_name:{
        type:String,
        maxLength: 50,
        default: "",
    }

})

module.exports = mongoose.model('User', UserSchema)