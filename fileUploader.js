const sharp = require('sharp');

class FileUploader {
    constructor(options) {
        this.options = options;
    }

    log(message) {
        console.log(message);
    }

    async validateFileType(file, allowedTypes) {
        this.log(`Validating file type: ${file.mimetype}`);
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.mimetype}`);
        }
        this.log('File type validated successfully');
    }

    async validateFileSize(file, options) {
        this.log(`Validating file size: ${file.size}`);
        if (file.size > options.maxSize) {
            throw new Error(`File size exceeds the maximum limit of ${options.maxSize} bytes`);
        }
        this.log('File size validated successfully');
    }

    async validateImage(file, options) {
        this.log('Validating image dimensions');
        try {
            const metadata = await sharp(file.buffer).metadata();
            if (metadata.width > options.maxWidth || metadata.height > options.maxHeight) {
                const targetSize = Math.min(options.maxWidth, options.maxHeight);
                await sharp(file.buffer)
                    .resize({
                        width: targetSize,
                        height: targetSize,
                        fit: 'cover'
                    })
                    .toBuffer()
                    .then((resizedBuffer) => {
                        file.buffer = resizedBuffer;
                    });
                this.log('Image cropped to 1:1 aspect ratio');
            }
            this.log('Image dimensions validated successfully');
        } catch (error) {
            throw new Error(`Invalid image file: ${error.message}`);
        }
    }

    async validateAudio(file, options) {
        this.log('Validating audio duration and format');
        try {
            const mm = await import('music-metadata');
            const metadata = await mm.parseBuffer(file.buffer, { duration: true });
            const duration = metadata.format.duration;
            if (duration > options.maxDuration) {
                throw new Error('Audio duration is too long');
            }
            this.log('Audio duration and format validated successfully');
            return true;
        } catch (error) {
            throw new Error(`Invalid audio file: ${error.message}`);
        }
    }

    async validate(filesToValidate) {
        try {
            let hasSongs = false;
    
            for (const fieldName in filesToValidate) {
                const files = filesToValidate[fieldName];
                const fieldOptions = this.options.fields.find(field => field.name === fieldName);
    
                if (!fieldOptions) {
                    throw new Error(`Options not found for field: ${fieldName}`);
                }
    
                for (const file of files) {
                    this.log(`Validating ${fieldName}`);
                    try {
                        await this.validateFileType(file, fieldOptions.allowedTypes);
                        await this.validateFileSize(file, fieldOptions);
    
                        if (fieldOptions.type === 'image') {
                            await this.validateImage(file, fieldOptions);
                        } else if (fieldOptions.type === 'audio') {
                            await this.validateAudio(file, fieldOptions);
                            hasSongs = true;
                        }
                        this.log(`${fieldName} validated successfully`);
                    } catch (error) {
                        this.log(`Validation failed for ${fieldName}: ${error.message}`);
                        throw error;
                    }
                }
            }
    
            if (!hasSongs) {
                throw new Error('At least one song must be uploaded');
            }
    
            this.log('All files validated successfully');
            return true;
        } catch (error) {
            this.log(`Validation failed: ${error.message}`);
            throw error;
        }
    }
    
}

module.exports = FileUploader;
