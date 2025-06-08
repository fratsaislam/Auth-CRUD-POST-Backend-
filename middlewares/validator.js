const Joi = require('joi');

exports.signupSchema = Joi.object({
    email: Joi.string().min(6).max(60).required().email({
        tlds: {allow:['com', 'net', 'dz']}
    }),
    password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
})

exports.signinSchema = Joi.object({
    email: Joi.string().min(6).max(60).required().email({
        tlds: {allow:['com', 'net', 'dz']}
    }),
    password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
})

exports.acceptCodeSchema = Joi.object({
    email:Joi.string().min(6).max(60).required().email({
        tlds: {allow:['com', 'net', 'dz']}
    }),
    providedCode: Joi.number().required()
})

exports.changePasswordSchema = Joi.object({
    newPassword: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
    oldPassword: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
})

exports.accpetFPCodeSchema = Joi.object({
    email:Joi.string().min(6).max(60).required().email({
        tlds: {allow:['com', 'net', 'dz']}
    }),
    newPassword: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
    providedCode: Joi.number().required(),
})

exports.createPostSchema = Joi.object({
    title:Joi.string().min(6).max(60).required(),
    description:Joi.string().min(6).max(600).required(),
    userId: Joi.string().required()
})

exports.deletePostSchema = Joi.object({
    userId: Joi.string().required(),
})