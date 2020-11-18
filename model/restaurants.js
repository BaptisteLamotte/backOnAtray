const mongoose = require('mongoose')

const restaurantSchema = mongoose.Schema({
		name: String,
		email : String,
		salt:String,
		password:String,
		token :String,
		siret : String,
		photo: String,
		website : String,
		phone: String,
		adress:String,
		clientele:Array,
		pricing:Number,
		typeOfRestaurant:Array,
		typeOfFood:Array,
		wishlistRestaurant:[{ type: mongoose.Schema.Types.ObjectId, ref: 'talent' }],
		experience: [{ type: mongoose.Schema.Types.ObjectId, ref: 'experience' }],
		adresselgtlat:Object, 
		chatRoom: [{type: mongoose.Schema.Types.ObjectId, ref: 'chatRoom' }]
    
})

const restaurantModel = mongoose.model('restaurant', restaurantSchema)

module.exports = restaurantModel
