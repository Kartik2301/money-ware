const express = require('express');
const router = express.Router();
const FileModel = require('../models/file');
const { isLoggedIn } = require('../middleware');
const fs = require('fs');
const path = require("path");
let admin = require("firebase-admin");
const uuid = require('uuid-v4');

const serviceAccount = require("/Users/kanema/Downloads/money-ware-firebase-adminsdk-4jqcx-14b8d63be2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "money-ware.appspot.com",
});

let bucket = admin.storage().bucket();

async function uploadFileToFirebase(filename, content_type) {
  const metadata = {
    metadata: {
      firebaseStorageDownloadTokens: uuid()
    },
    contentType: content_type,
    cacheControl: 'public, max-age=31536000',
  };

  await bucket.upload(filename, {
    gzip: true,
    metadata: metadata,
  });
}

function generateIndexFile(doc) {
    let { filename, status, documentType, created_at, customerId, fileLocation, fileSize } = doc;
    
    let content = "";
    content += "COMMENT: INDEX FILE GENERATION\n"
    content += `GROUP_FIELD_TIMESTAMP: ${doc['created_at']}\n`;
    content += `GROUP_FIELD_DOCUMENT_TYPE: ${documentType}\n`
    content += `GROUP_FIELD_FILENAME: ${filename}\n`

    let idx = filename.indexOf(".");

    if(idx != -1) {
        filename = filename.substring(0, idx);
    }

    let indexFileName = "index_" + filename + "_" + doc['created_at'] + ".txt";
    
    const generated_index_file_path = `${path.dirname(__dirname)}/target/${indexFileName}`;
    fs.writeFile(generated_index_file_path, content, function(err) {
        if(err) {
            return console.log(err);
        } else {
            uploadFileToFirebase(generated_index_file_path, 'text/txt').catch(console.error);
        }
    }); 
}

router.get("/", isLoggedIn, async (req, res) => {
    const docs = await FileModel.find({})
    for (let doc of docs) {

        const status = doc['status'].toString().toLowerCase();

        if (status.localeCompare("completed") == 0) {
            const fileSource = doc['fileLocation'];
            const created_at = doc['created_at'];

            console.log(created_at);

            const generated_file_path = path.join(path.dirname(__dirname), 'target/' + `${created_at}` + "_" + doc['filename']);
            fs.copyFile(fileSource, generated_file_path, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    uploadFileToFirebase(generated_file_path, 'image/jpg').catch(console.error);
                    generateIndexFile(doc);
                }
            });
        }
    }
    res.send(docs);
})

router.get("/all", isLoggedIn, async (req, res) => {
    console.log()

    const docs = await FileModel.find({})

    res.render("documents/show", {docs: docs});
})

module.exports = router;