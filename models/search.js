const mongoose = require('mongoose');

const recentSearchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});


const mostSearchedSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
    },
    searchCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' 
    }
});





const RecentSearch = mongoose.model('RecentSearch', recentSearchSchema);
const MostSearch = mongoose.model('MostSearch', mostSearchedSchema);

module.exports = {RecentSearch,MostSearch};
