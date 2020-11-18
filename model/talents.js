const mongoose = require('mongoose')

const talentSchema = mongoose.Schema({
    firstName: String,
    lastName:String,
    email: String,
    password: String,
    token: String,
    salt: String, 
    phone: String,
    avatar: String,
    lookingForJob:Boolean,
    working:Boolean,
    speakLangage : Array,
    adress : String,
    adresselgtlat:Object,
    perimetre:Array,
    polygone: Object,
    countFave:Number,
    lookingJob : Array,
    typeofContract:Array,
    wishlistTalent:[{type: mongoose.Schema.Types.ObjectId, ref: 'restaurant'}],
    experience: [{type: mongoose.Schema.Types.ObjectId, ref: 'experience' }],
    formation: [{type: mongoose.Schema.Types.ObjectId, ref: 'formation'}],
    chatRoom: [{type: mongoose.Schema.Types.ObjectId, ref: 'chatRoom' }]
})

const talentModel = mongoose.model('talent', talentSchema)


module.exports = talentModel