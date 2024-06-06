require('dotenv/config')
const {log} = require('./log.js')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const sharp = require('sharp')
const fs = require('fs')

class Request{
    constructor(req, res){
        this.req = req
        this.res = res

        this.body = req.body
        this.headers = req.headers
        this.params = req.params
        this.profile = req.file
        this.album = req.files

        this.didRespond = false

        log(2, `API request: ${this.req.path}`)
    }

    validatePostFields(requiredFields, optionalFields=[]){
        const regex = {
            token: /^[a-f0-9]+$/,
            reset_token: /^[a-f0-9]+$/,
            email: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
            username: /^[a-zA-Z0-9._-]{5,}$/,
            login: /^(([\w-.]+@([\w-]+\.)+[\w-]{2,4})|([a-zA-Z0-9._-]{5,}))$/,
            // password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
            date: /^[0-9]{4}(-[0-9]{1,2}){1,2}$/,
            offset: /^[0-9]+$/,
            id: /^[0-9]+$/,
            image_id: /^[0-9]+$/,
            post_type: /^(image)|(text)$/,
            private: /^(0|1)$/,
        }

        const post = this.body
        const fields = requiredFields.concat(optionalFields)
        let toReturn = {}
        for (const field of fields){
            if (!post.hasOwnProperty(field) && optionalFields.includes(field)) continue
            if (!post.hasOwnProperty(field)) {
                log(0, `Missing required POST field: ${field}`)
                return false
            }
            if (regex.hasOwnProperty(field) && !regex[field].test(post[field])) {
                log(0, `Regex for field [${field}] failed with: ${post[field]}`)
                return false
            }
            toReturn[field] = post[field]
        }
        return toReturn
    }

    async validatePostFiles(options) {
        const results = {}

        for (const fileKey in options) {
            const file = this.profile

            if (!file) return results[fileKey] = { error: 'No file uploaded or invalid file type.' }

            const { type, width, height, outputPath } = options[fileKey]

            if (type === 'image') {
                const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png']
                if (!validMimeTypes.includes(file.mimetype)) return results[fileKey] = { error: 'Invalid file type.' }

                const image = sharp(file.buffer)
                const metadata = await image.metadata()

                if (metadata.width > width || metadata.height > height) return results[fileKey] = { error: 'The image should be maximum 1024x1024' }

                const imagePath = outputPath + this.params.imageName.toLowerCase()
                if (fs.existsSync(imagePath)) fs.unlink(imagePath, (err) => err !== null ? log(0, err) : "")
                await image.toFile(imagePath)

                results[fileKey] = { path: imagePath }
            }
        }
        return results
    }

    randomHash(length){
        return crypto.randomBytes(length).toString('hex');
    }
    async generateToken(length=64){
        return this.randomHash(length)
    }

    async passwordHash(password){
        return bcrypt.hash(password, 10).catch(err => log(1, err))
    }
    async compareHash(password, hash){
        return bcrypt.compare(password, hash).catch(err => log(1, err))
    }
    

    

    respondJson(response_code, json={}){
        if (this.didRespond) return

        this.res.status(response_code).json(json)
        this.didRespond = true
    }
    respond200Success(json={}){
        this.respondJson(200, json)
    }
    respond200File(filePath){
        if (this.didRespond) return
        this.res.status(200).sendFile(filePath)

        this.didRespond = true
    }
    respond400MissingPostFields(){
        this.respondJson(400, {error: 'Missing or invalid POST field(s)'})
    }
    respond400Error(error='Unknown'){
        this.respondJson(400, {error: error})
    }
    respond401MissingToken(){
        this.respondJson(401, {error: 'Missing token'})
    }
    respond403Auth(){
        this.respondJson(403, {error: 'Unauthorized'})
    }
    respond404NotFound(){
        this.respondJson(404, {error: 'Not found'})
    }

}

module.exports = {
    Request: Request
}