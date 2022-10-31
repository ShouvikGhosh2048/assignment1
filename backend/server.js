const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const letterSchema = new mongoose.Schema({
    letter: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: Number,
        required: true,
    }
})

const Letter = mongoose.model('Letter', letterSchema)

const app = express()

app.get('/api/:letter', async (req, res) => {
    try {
        const letter = await Letter.findOne({ letter: req.params.letter })

        if (!letter) {
            return res.status(404)
                        .json({
                            error: 'Letter not found'
                        })
        }
    
        return res.status(200)
                    .json(letter)
    } catch (err) {
        return res.status(500)
                .json({
                    error: 'Server error'
                })
    }
})

mongoose.connect(process.env.DB_URL, async () => {
    app.listen(5000, () => {
        console.log('Listening on port 5000')
    })
}, (err) => {
    console.log(err)
})