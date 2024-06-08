const express = require('express')
const cors = require('cors')
const { Request } = require('./utils.js')
const { log } = require('./log.js')
const mongoose = require('mongoose')
const { userModel } = require('./models.js')
const fs = require('fs')
const path = require('path')


mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.jjsuomx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/test`)
    .then(() => {
        log(1, "Successfully connected to DB.")
        // userModel.create({username: 'gipsz_jakab', email: 'gipsz_jakab@teszt.com', password: 'teszt123'})
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

app.post('/api/login', (req, res) => postLogin(req, res))
app.post('/api/register', (req, res) => postRegister(req, res))

app.get('/api/user/:username', (req, res) => getUser(req, res))




const multer = require('multer');
const FileUploader = require('./fileUploader.js');
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/user/:username/editProfile', upload.single('profile'), (req, res) => postProfileImg(req, res))

app.get('/api/image/defaults/:imageName', (req, res) => getImageDefaults(req, res))

async function postLogin(req, res) {
    const request = new Request(req, res)
    const post = request.validatePostFields(["username", "password"])
    if (post === false) return request.respond400MissingPostFields()


    let user = await userModel.findOne({ username: post.username }).exec()
    if (user === null || !(await request.compareHash(post.password, user.password))) return request.respond400Error("Invalid username or password")

    const token = await request.generateToken()
    userModel.findOneAndUpdate({ _id: user._id }, { token: token }).exec()

    request.respond200Success({ token: token, username: user.username })
}

async function postRegister(req, res) {
    const request = new Request(req, res)
    const post = request.validatePostFields(["username", "email", "password"])
    if (post === false) return request.respond400MissingPostFields()

    const password = await request.passwordHash(post.password)
    const token = await request.generateToken()
    userModel.create({ username: post.username, password: password, token: token, email: post.email })
        .then(() => {
            request.respond200Success({ token: token, username: post.username })
        })
        .catch(err => {
            if (err.errorResponse.code == 11000) {
                const duplicate_field = Object.keys(err.errorResponse.keyPattern)[0]
                if (duplicate_field == "username") request.respond400Error('Username already in use.')
                else if (duplicate_field == "email") request.respond400Error('Email already in use.')
                else log(1, err)
            }
            else log(1, err)
        })

}

async function getUser(req, res) {
    const request = new Request(req, res)
    const username = request.params['username']

    const userDetails = await userModel.findOne({ username: username }).select('username profile_img is_artist artist_name -_id').exec()
    request.respond200Success(userDetails)
}

async function getImageDefaults(req, res) {
    const request = new Request(req, res)
    const imagePath = `${__dirname}/images/defaults/${request.params.imageName}`

    if (!fs.existsSync(imagePath)) return request.respond404NotFound()
    request.respond200File(imagePath)
}


const profileImageUploader = new FileUploader({
    fields: [
        { name: 'profile', type: 'image', allowedTypes: ['image/jpeg', 'image/png'], maxWidth: 1024, maxHeight: 1024, maxSize: 5 * 1024 * 1024, cropImage: true } // 5 MB
    ]
});

async function postProfileImg(req, res) {

    const filesToValidate = {
        profile: [req.file]
    };

    try {
        await profileImageUploader.validate(filesToValidate);
        res.json({ message: 'Profile image uploaded successfully' });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(400).send(error.message);
    }
    // const request = new Request(req, res)

    // console.log(req.file)
    // // const outputPath = `${__dirname}/images/profiles/`

    // const post = request.validatePostFields(['token', 'username'], ['artist_name'])
    // if (post === false) return request.respond400MissingPostFields()

    // request.handleUpload(profilePictureUploaderOptions, () => {
    //     request.respond200Success({ message: 'Profile picture uploaded successfully!' });
    // });

    // const imagePath = `/images/profiles/${req.params.username.toLowerCase() + '.' + req.file.mimetype.split('/')[1]}`
    // const options = {
    //     profile: { type: 'image', width: 1024, height: 1024, outputPath }
    // }
    // const results = await request.validatePostFiles(options)
    // if (results.error) return request.respond400Error(results.error)

    // const query = {token: post.token}
    // let values = {$set: {profile_img: imagePath, username: req.params.username, is_artist: false, artist_name: post.artist_name}}
    // if(post.artist_name !== "") values.$set = {...values.$set, is_artist: true, artist_name: post.artist_name}

    // await userModel.updateOne(query, values).then(()=>{
    //     request.respond200File(__dirname + imagePath)
    // }).catch((err => {
    //     if(!err) log(0, err)
    // }))
}


app.post('/api/upload/music-album', upload.fields([{ name: 'albumCover', maxCount: 1 }, { name: 'songs', maxCount: 10 }]), (req, res) => postAlbums(req, res))

const albumUploader = new FileUploader({
    fields: [
        { name: 'albumCover', type: 'image', allowedTypes: ['image/jpeg', 'image/png'], maxWidth: 1024, maxHeight: 1024, maxSize: 5 * 1024 * 1024 }, // 5 MB
        { name: 'songs', type: 'audio', allowedTypes: ['audio/mpeg', 'audio/wav'], maxDuration: 300, maxSize: 50 * 1024 * 1024 } // 50 MB
    ]
});


async function postAlbums(req, res) {
    try {
        const filesToValidate = {
            albumCover: req.files['albumCover'] ? [req.files['albumCover'][0]] : [],
            songs: req.files['songs'] || []
        };
        await albumUploader.validate(filesToValidate);
        res.json({ message: 'Music album uploaded successfully' });
    } catch (error) {
        console.error('Error uploading music album:', error);
        res.status(400).send(error.message);
    }
}
