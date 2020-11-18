const mongoose = require('mongoose')

const experienceSchema = mongoose.Schema({
        
		startingDate:String,
		endingDate:String,
		job:String,
		firm : String, 
		city :String
		    
})

const experienceModel = mongoose.model('experience', experienceSchema)

module.exports = experienceModel