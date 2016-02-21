var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
	title: String,
	link: String,
	author: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
	upvotes: {type: Number, default: 0},
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

// add one to upvote count and save
PostSchema.methods.upvote = function(cb) {
	this.upvotes += 1;
	this.save(cb);
}

mongoose.model('Post', PostSchema);