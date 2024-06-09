const express = require('express')
const cors = require('cors')
const { Request } = require('./utils.js')
const { log } = require('./log.js')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')


mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.jjsuomx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/test`)
    .then(() => {
        log(1, "Successfully connected to DB.")
    }
    )
    .catch(err =>
        log(0, `Couldn't connect to DB: ${err}`)
    )

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.listen(process.env.SERVER_PORT);
log(1, `Server stated on port ${process.env.SERVER_PORT}`)



//validation and uploading
const multer = require('multer');
const FileUploader = require('./fileUploader.js');
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/user/:username/editProfile', upload.single('profile'), (req, res) => postUser(req, res))
app.post('/api/upload/music-album', upload.fields([{ name: 'albumCover', maxCount: 1 }, { name: 'songs', maxCount: 10 }]), (req, res) => postAlbums(req, res))

const profileImageUploader = new FileUploader({
    fields: [
        { name: 'profile', type: 'image', allowedTypes: ['image/jpeg', 'image/png'], maxWidth: 1024, maxHeight: 1024, maxSize: 5 * 1024 * 1024/* 5 MB*/, cropImage: true }
    ]
})


const albumUploader = new FileUploader({
    fields: [
        { name: 'albumCover', type: 'image', allowedTypes: ['image/jpeg', 'image/png'], maxWidth: 1024, maxHeight: 1024, maxSize: 5 * 1024 * 1024/* 5 MB*/, cropImage: false },
        { name: 'songs', type: 'audio', allowedTypes: ['audio/mpeg', 'audio/wav'], maxDuration: 300, maxSize: 50 * 1024 * 1024 /* 50 MB*/ }
    ]
})

async function postUser(req, res) {
    const request = new Request(req, res)

    const fileExtension = path.extname(req.file.originalname)
    const outputPath = `${__dirname}/images/profiles/${request.params.username.toLowerCase()}${fileExtension}`
    const existingImagePath = `${__dirname}/images/profiles/${request.params.username.toLowerCase()}${fileExtension}`
    const filesToValidate = {
        profile: [req.file]
    }

    const validation = await profileImageUploader.validate(filesToValidate);
    if (Array.isArray(validation) && validation.length > 0) return request.respond400Error(validation[0].error)

    if (fs.existsSync(existingImagePath)) fs.unlinkSync(existingImagePath)
    fs.writeFileSync(outputPath, req.file.buffer);


    request.respond200File(outputPath)
}

async function postAlbums(req, res) {
    const request = new Request(req, res)

    const requiredFields = ['album_title', 'username', 'created_at', 'artist_name']
    const post = request.validatePostFields(requiredFields)

    if (!post) return request.respond400MissingPostFields()

    const filesToValidate = {
        albumCover: req.files['albumCover'] ? [req.files['albumCover'][0]] : [],
        songs: req.files['songs'] || []
    }

    const validation = await albumUploader.validate(filesToValidate);
    if (Array.isArray(validation) && validation.length > 0) return request.respond400Error(validation)

    const created_at = new Date(post.created_at)
    const sanitizedAlbumTitle = post.album_title.replace(/\W+/g, '_')
    const sanitizedArtistName = post.artist_name.replace(/\W+/g, '_')
    const albumFolder = path.join(__dirname, 'albums', sanitizedArtistName, sanitizedAlbumTitle + '-' + created_at.getFullYear())

    if (!fs.existsSync(albumFolder)) fs.mkdirSync(albumFolder, { recursive: true })

    if (req.files['albumCover']) {
        const coverFile = req.files['albumCover'][0];
        const coverFileName = `${sanitizedAlbumTitle}_cover${path.extname(coverFile.originalname)}`;
        const coverFilePath = path.join(albumFolder, coverFileName);
        fs.writeFileSync(coverFilePath, coverFile.buffer);
    }

    if (req.files['songs']) {
        const songs = req.files['songs'];
        songs.forEach((songFile, index) => {
            const songFileName = `song_${index + 1}${path.extname(songFile.originalname)}`;
            const songFilePath = path.join(albumFolder, songFileName);
            fs.writeFileSync(songFilePath, songFile.buffer);
        });
    }

    request.respond200Success({ message: 'Music album uploaded successfully' });
}