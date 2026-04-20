import multer from 'multer';

const storage = multer.memoryStorage(); 
const mimeTypes = ['image/jpeg', 'image/png'];

const fileFilter = (req, file, cb) => {
    if (mimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG allowed.'), false);
    }
};

const upload = multer({ storage, fileFilter });

export default upload;