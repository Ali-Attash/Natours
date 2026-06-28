const fs = require('fs');
const mongoose = require('mongoose');
const importingData = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`))
const Tour = require('./../../database/toursDB')

const runner = async (dbUrl) => {
    try {
        await Tour.create(importingData)
        console.log('The Tour Data Has been Imported Successfully')
    } catch (error) {
        console.log(error.message)
    }
}


runner('mongodb://localhost:27017/natours')

