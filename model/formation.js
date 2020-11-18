const mongoose = require('mongoose')

const formationSchema = mongoose.Schema({
		school:String,
		city:String,
		diploma:String,
		endingDate:String,
})

const formationModel = mongoose.model('formation', formationSchema)

module.exports = formationModel
