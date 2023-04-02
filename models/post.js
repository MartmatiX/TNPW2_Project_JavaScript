const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    header: String,
    text: String,
    username: String,
    user_id: String,
});

module.exports = mongoose.model('Post', PostSchema);