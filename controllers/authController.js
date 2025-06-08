const { signupSchema, signinSchema, changePasswordSchema, acceptCodeSchema, accpetFPCodeSchema } = require("../middlewares/validator");
const User = require('../models/usersModel')
const {doHash, doHashValidator, hmacProcess, compareHmac} = require('../utils/hashing')
const jwt = require('jsonwebtoken')
const transport = require("../middlewares/sendMail");
require('dotenv').config();

exports.signup = async (req, res) => {
    const {email, password} = req.body;
    try {
        const {error, value} = signupSchema.validate({email, password});
        if (error){
            return res.status(401).json({success:false, message: error.details[0].message})
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(402).json({success:false, message: 'user already exist'});
        }

        const hashedPassword = await doHash(password, 12);

        const newUser = new User({
            email,
            password: hashedPassword
        })

        const result = await newUser.save();
        result.password = undefined; // because mongo db will return email and password , and i want not to see the pass
        res.status(201).json({
            success: true,
            message: 'Your Account Has Been Created Successfully',
            result
        });
    }catch(error){
        console.log(error);
    }
}

exports.signin = async (req, res) => {
    const {email, password} = req.body;
    try{
        const {error, value} = await signinSchema.validate({email, password})

        if(error){
            return res.status(401).json({success:false, message: error.details[0].message})
        }

        const existingUser = await User.findOne({email}).select('+password');

        if(!existingUser){
            return res.status(400).json({success: false, message: "user doesnot exists"});
        }

        const result = await doHashValidator(password, existingUser.password);

        if(!result){
            return res.status(401).json({success:false, message: "invalid Crudentiel!"})
        }

        const token = jwt.sign({
            userId: existingUser._id, //so id becomes primary key, ObjectId("643b29f1123abc4567890def") for exemple , it selcet it
            email: existingUser.email,
            verified: existingUser.verified
        },process.env.TOKEN_SECRET,
        {
            expiresIn: '8h',
        })

        res.cookie('Authorization',
            `Bearer ${token}` , 
            {
                expires: new Date(Date.now() + 8 * 3600000), 
                httpOnly: process.env.NODE_ENV === "production",
                secure: process.env.NODE_ENV === "production"
            }).status(200).json({
                success: true,
                token, 
                message: "logged successfuly"
            })
    }catch(err){
        console.log(err)
    }
}

exports.signout = async (req, res) => {
    res.clearCookie('Authorization').status(200).json({success: true, message :'logged out succesfully'});

};

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try{
        const existingUser = await User.findOne({email});
        if(!existingUser) {
            return res.status(404).json({success:false, message: "User does not exist"});
        }

        if(existingUser.verified) {
            return res.status(400).json({success: false, message : "User already verified"});
        }

        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"verification code",
            html: '<h1>' + codeValue + '<h1>',
        })
        
        if(info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({success:true, message: "code sent!"})
        }

        return res.status(400).json({success:false, message: "code sent failed!"})
    }catch(err) {
        console.log(err);
    }
}

exports.verifyVerificationCode = async(req, res) => {
    const { email, providedCode } = req.body;
    try{
        const { error, value } = acceptCodeSchema.validate({email, providedCode});
        if(error){
            return res.status(400).json({success: false, message: error.details[0].message});
        }

        const codeValue = providedCode.toString();

        const existingUser = await User.findOne({email}).select('+verificationCode +verificationCodeValidation');
        if(!existingUser){
            return res.status(400).json({success: false, message: "user does not exists"});
        }
        
        if(existingUser.verified){
            return res.status(400).json({success: false, message: "you are already verified!"});
        }

        if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
            return res.status(400).json({success: false, message: "something is wrong with the code!"});
        }

        if(Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) { //before 5 min
            return res.status(400).json({success: false, message: "code has been expired!"});
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

        if(hashedCodeValue === existingUser.verificationCode){
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save()
            return res.status(200).json({success: true, message: "your account has been verified!"})
        }

        return res.status(400).json({success: false, message: "unexpected has occured"});

    }catch(err){
        console.log(err);
    }
}

exports.changePassword = async (req, res) => {
    const {userId, verified} = req.user;
    const {oldPassword, newPassword} = req.body;
    try{
        const {error, value} = changePasswordSchema.validate({newPassword, oldPassword});
        if(error){
            res.status(410).json({success: false, message: error.details[0].message});
        }

        if(!verified){
            res.status(410).json({success: false, message: "You are not verified user!"});
        }
        const existingUser = await User.findOne({_id: userId}).select("+password");
        if(!existingUser){
            return res.status(400).json({success: false, message: "user does not exists"});
        }

        const  result = await doHashValidator(oldPassword, existingUser.password);
        if(!result){
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }

        const hashedPassword = await doHash(newPassword, 12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res.status(200).json({success: true, message: "Password updated!"});
    }catch(error){
        console.log(error);
    }
}

exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;
    try{
        const existingUser = await User.findOne({email});
        if(!existingUser) {
            return res.status(404).json({success:false, message: "User does not exist"});
        }

        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"Forgot Password code",
            html: `
                <header>
                    <h1>Forgot Password Code</h1>
                    <h1>${codeValue}</h1>
                </header>
            `,
        })
        
        if(info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({success:true, message: "code sent!"})
        }

        return res.status(400).json({success:false, message: "code sent failed!"})
    }catch(err) {
        console.log(err);
    }
}

exports.verifyPasswordCode = async(req, res) => {
    const { email, providedCode, newPassword} = req.body;
    try{
        const { error, value } = accpetFPCodeSchema.validate({email, newPassword, providedCode});
        if(error){
            return res.status(400).json({success: false, message: error.details[0].message});
        }

        const codeValue = providedCode.toString();

        const existingUser = await User.findOne({email}).select('+forgotPasswordCode +forgotPasswordCodeValidation');
        if(!existingUser){
            return res.status(400).json({success: false, message: "user does not exists"});
        }

        if(!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation){
            return res.status(400).json({success: false, message: "something is wrong with the code!"});
        }

        if(Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) { //before 5 min
            return res.status(400).json({success: false, message: "code has been expired!"});
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        const hashedPassword = doHash(newPassword, 12);

        if(hashedCodeValue === existingUser.forgotPasswordCode){
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;
            existingUser.password = await hashedPassword;
            await existingUser.save()
            return res.status(200).json({success: true, message: "Password updated!"})
        }

        return res.status(400).json({success: false, message: "unexpected has occured"});

    }catch(err){
        console.log(err);
    }
}
/* exports.changePassword = async (req, res) => {
    const {email , oldPass, newPass} = req.body;
    try{
        const existingUser = await User.findOne({email}).select('+password');

        if(!existingUser){
            return res.status(400).json({success: false, message: "user doesnot exists"});
        }

        const match = await doHashValidator(oldPass, existingUser.password);
        if(!match){
            return res.status(400).json({success: false, message: "invalid Credential!"});
        }

        const {error, value} = changePasswordSchema.validate({newPass});

        if(error){
            return res.status(400).json({success: false, message: "invalid new Password"});
        }

        const hashedPassword = await doHash(newPass, 12);
        existingUser.password = hashedPassword;
        const result = await existingUser.save();
        result.password = undefined;
        return res.status(200).json({success: true , message: "password changed successfully", result});
    }catch(err){
        console.log(err);
    }
} */