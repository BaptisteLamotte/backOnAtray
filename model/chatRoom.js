const mongoose = require('mongoose')

var messageSchema  = mongoose.Schema({
    content : String,
    expediteur : String,
    destinataire : String, 
    tokenExpe : String,
    tokenDesti : String,
})


var chatRoomSchema = mongoose.Schema({
    name: String,
    expediteurName:String,
    destinataireName:String,
    message : [messageSchema],
   });
   
   const chatRoomModel = mongoose.model('chatRoom', chatRoomSchema)

module.exports = chatRoomModel