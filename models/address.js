const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    pincode: {
        type: String,
        required: false,
        trim: true,
        maxLength: 6
    },
    city: {
        type: String,
        required: false,
        trim: true,
        maxLength: 100
    },
    state: {
        type: String,
        required: false,
        trim: true,
        maxLength: 100
    },
    streetAddress: {
        type: String,
        required: false,
        trim: true,
        maxLength: 200
    },
    area: {
        type: String,
        required: false,
        trim: true,
        maxLength: 150
    },
    landmark: {
        type: String,
        trim: true,
        maxLength: 150,
        default: ''
    },
    saveAddressAs: {
        type: String,
        enum: ['home', 'office', 'other'],
        default: 'home'
    }
}); 

const address = mongoose.model("address", addressSchema);

module.exports = address;
