const express = require('express')
const cors = require('cors')
const { Request } = require('./utils.js')
const { log } = require('./log.js')
const mongoose = require('mongoose')
const { userModel } = require('./models.js')
const fs = require('fs')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


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

app.get('/api/image/defaults/:imageName', (req, res) => getImageDefaults(req, res))
app.post('/api/upload/profile/:imageName', upload.single('profile'), (req, res) => postProfileImg(req, res))

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

async function postProfileImg(req, res){
    const request = new Request(req, res)
    if(req.file.fieldname !== 'profile') return request.respond400Error('Profile picture is required.')
    
    const outputPath = `${__dirname}/images/profiles/`
    
    const options = {
        profile: { type: 'image', width: 1024, height: 1024, outputPath }
    }

    const results = await request.validatePostFiles(options)
    if (results.error) return request.respond400Error(results.error)

    request.respond200File(results.profile.path)
}