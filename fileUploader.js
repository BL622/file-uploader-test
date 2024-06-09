const sharp = require('sharp')
const { log } = require('./log')

class FileUploader {
    constructor(options) {
        this.options = options
    }

    async validateFileType(file, allowedTypes) {
        log(2, `Validating file type: ${file.mimetype}`);
        if (!allowedTypes.includes(file.mimetype)) return { error: `Invalid file type: ${file.mimetype}` }

        log(2, 'File type validated successfully');
        return true
    }

    async validateFileSize(file, options) {
        log(2, `Validating file size: ${file.size}`)
        if (file.size > options.maxSize) return { error: `File size exceeds the maximum limit of ${options.maxSize} bytes` }

        log(2, 'File size validated successfully')
        return true
    }

    async validateImage(file, options) {
        log(2, 'Validating image dimensions')

        try {

            const metadata = await sharp(file.buffer).metadata()
            if (options.cropImage && (metadata.width > options.maxWidth || metadata.height > options.maxHeight)) {
                const targetSize = Math.min(options.maxWidth, options.maxHeight)
                const sharpInstance = sharp(file.buffer).resize({
                    width: targetSize,
                    height: targetSize,
                    fit: 'cover'
                })

                const croppedBuffer = await sharpInstance.toBuffer()
                file.buffer = croppedBuffer
                log(2, 'Image cropped to 1:1 aspect ratio')
            } 
            
            else if (!options.cropImage && (metadata.width > options.maxWidth || metadata.height > options.maxHeight)) return { error: 'Image dimensions exceed maximum allowed dimensions. CropImage option is false. Image cannot be uploaded.' }
            
            else log(2, 'Image dimensions within maximum allowed dimensions. No need for cropping')

            log(2, 'Image dimensions validated successfully');
            return true;
        } catch (error) {
            return { error: `Invalid image file: ${error.message}` }
        }
    }




    async validateAudio(file, options) {
        log(2, 'Validating audio duration and format')

        try {
            const mm = await import('music-metadata')
            const metadata = await mm.parseBuffer(file.buffer, { duration: true })
            const duration = metadata.format.duration

            if (duration > options.maxDuration) return { error: 'Audio duration is too long' }

            log(2, 'Audio duration and format validated successfully')
            return true;
        } catch (error) {
            return { error: `Invalid audio file: ${error.message}` };
        }
    }

    async validate(filesToValidate) {
        let validationErrors = []

        const requiresSongs = this.options.fields.some(field => field.type === 'audio' && field.album)

        for (const fieldName in filesToValidate) {
            const files = filesToValidate[fieldName]
            const fieldOptions = this.options.fields.find(field => field.name === fieldName)

            if (!fieldOptions) {
                validationErrors.push({ error: `Options not found for field: ${fieldName}` })
                continue
            }

            for (const file of files) {
                log(2, `Validating ${fieldName}`)

                const fileTypeValidation = await this.validateFileType(file, fieldOptions.allowedTypes)
                if (fileTypeValidation.error) {
                    validationErrors.push(fileTypeValidation)
                    continue
                }

                const fileSizeValidation = await this.validateFileSize(file, fieldOptions)
                if (fileSizeValidation.error) {
                    validationErrors.push(fileSizeValidation)
                    continue
                }

                if (fieldOptions.type === 'image') {

                    const imageValidation = await this.validateImage(file, fieldOptions)
                    if (imageValidation.error) validationErrors.push(imageValidation)

                }
                else if (fieldOptions.type === 'audio') {

                    const audioValidation = await this.validateAudio(file, fieldOptions)
                    if (audioValidation.error) validationErrors.push(audioValidation)

                }
                log(2, `${fieldName} validated successfully`)
            }
        }

        if (requiresSongs && !filesToValidate['songs'])validationErrors.push({ error: 'At least one song must be uploaded for the album' })

        if (validationErrors.length > 0) return validationErrors

        log(2, 'All files validated successfully')
        return true
    }
}

module.exports = FileUploader;
