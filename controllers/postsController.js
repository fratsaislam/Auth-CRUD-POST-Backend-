const { createPostSchema, deletePostSchema } = require("../middlewares/validator");
const Post = require("../models/postsModel");

exports.getPosts = async (req, res) => {
    const {page} = req.query;
    const postsPerPage = 10;

    try{
        let pageNum = 0;
        if(page <= 1){
            pageNum = 0;
        }else{
            pageNum = page - 1;
        }
        
        const result = await Post.find().sort({createdAt: -1}).skip(pageNum * postsPerPage).limit(postsPerPage).populate({path: 'userId', select: 'email'}); //The .populate() method replaces a referenced ObjectId with the actual document data
        res.status(200).json({success: true, message: 'posts', data: result});
    }catch(err){
        console.log(err)
    }
}

exports.singlePost = async (req, res) => {
    const {_id} = req.query;
    try{
        const existingPost = await Post.findOne({_id}).populate({path: 'userId', select: 'email'});
        if(!existingPost){
            return res.status(404).json({success: false, message: 'post does not exist'});
        }

        return res.status(200).json({success: true, message: 'single post!', data: result})
    }catch(err){
        console.log(err);
    }
}

exports.createPost = async (req, res) => {
    const {title, description} = req.body;
    const {userId} = req.user;
    
    try{
        const {error, value} = createPostSchema.validate({title, description, userId});
        if(error){
            return res.status(400).json({success: false, message: error.details[0].message});
        }
        /* const result = new Post({
            title,
            description,
            userId
        })
        await result.save(); */
        const result = await Post.create({
            title, 
            description,
            userId
        })
        return res.status(201).json({success: true, message: "post created!", data: result});
    }catch(error){
        console.log(error);
    }
    console.log(userId);
}

exports.updatePost = async (req, res) => {
    const {title, description} = req.body;
    const {userId} = req.user;
    const {_id} = req.query;
    try{
        const {error, value} = createPostSchema.validate({title, description, userId});
        if(error){
            return res.status(400).json({success: false, message: error.details[0].message});
        }
        const existingPost = await Post.findOne({ _id })
        if(!existingPost){
            return res.status(404).json({success: false, message: 'post does not exist'});
        }

        if(existingPost.userId.toString() !== userId) { // post.userId is object not string
            return res.status(400).json({success: false, message: "unauthorized"});
        }

        existingPost.title = title;
        existingPost.description = description;
        const result = await existingPost.save();

        return res.status(201).json({success: true, message: "post updated!", data: result});
    }catch(error){
        console.log(error);
    }
    console.log(userId);
}

exports.deletePost = async (req, res) => {
    const {userId} = req.user;
    const {_id} = req.query;
    try{
        const {error, value} = deletePostSchema.validate({userId});
        if(error){
            return res.status(400).json({success: false, message: error.details[0].message});
        }
        const existingPost = await Post.findOne({ _id })
        if(!existingPost){
            return res.status(404).json({success: false, message: 'post does not exist'});
        }
        if(existingPost.userId.toString() !== userId) {
            return res.status(400).json({success: false, message: "Unauthorized"});
        }
        
        await existingPost.deleteOne();
        // await Post.deleteOne({_id})
        return res.status(201).json({success: true, message: "post deleted!"});
    }catch(error){
        console.log(error);
    }
    console.log(userId);
}