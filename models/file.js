const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    filename: String,
    status: String,
    documentType: String,
    created_at : String,
    customerId : Number,
    fileLocation : String,
    fileSize : Number
});

module.exports = mongoose.model('FileModel', fileSchema);