const express = require('express');
const router = express.Router();
const passport = require('passport');
const path = require("path");
const multer = require("multer");
const catchAsync = require('../utils/catchAsync');
const FileModel = require('../models/file');
const { isLoggedIn } = require('../middleware');
const fs = require('fs');

const maxSize = 1 * 1000 * 1000 * 1000;

let uploadedFileName = "";
let uploadedFileLocation = "";
let fileUploadName = "";
let size_file = 0;
let curTimestamp = 0;

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads")
    },
    filename: function (req, file, cb) {
        cb(null, fileUploadName);
    }
})

let upload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {

        let filetypes = /jpeg|jpg|png/;
        let mimetype = filetypes.test(file.mimetype);

        let extname = filetypes.test(path.extname(
            file.originalname).toLowerCase());

        uploadedFileName = file.originalname;

        curTimestamp = Date.now();
        fileUploadName = "myimg" + "-" + curTimestamp + ".jpg";

        uploadedFileLocation = `${path.dirname(__dirname)}/uploads/` + fileUploadName;
    
        if (mimetype && extname) {
            return cb(null, true);
        }

        cb("Error: File upload only supports the "
            + "following filetypes - " + filetypes);
    }
}).single("mypic");

router.get('/new', isLoggedIn, (req, res) => {
    res.render('documents/new');
})

async function getFileSize() {
    fs.stat(uploadedFileLocation, (err, stats) => {
        if (err) {
            console.log(`File doesn't exist.`);
        } else {
            const content = stats.size;
            processFile(content); 
        }
    });
}

function processFile(content) {
    size_file = content;
}

router.post("/doc_upload", isLoggedIn, async (req, res, next) => {
    upload(req, res, async function (err) {
        if (err) {
            res.send(err)
        }
        else {
            getFileSize();
            setTimeout(async () => {
                const newEntry = new FileModel({
                    filename : uploadedFileName,
                    status : 'Completed',
                    documentType : req.body.filetype,
                    created_at : curTimestamp,
                    customerId : 1,
                    fileLocation : uploadedFileLocation,
                    fileSize : size_file
                });
                await newEntry.save();
            }, 3000)
            
            req.flash('success', "Success, File Uploaded");
            res.redirect("/")
        }
    })
})

module.exports = router;