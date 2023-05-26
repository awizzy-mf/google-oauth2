const {User} = require('../db/models');
const bcryp = require('bcrypt');
const jwt = require('jsonwebtoken');
const {JWT_SECRET_KEY} = process.env;
const oauth2 = require('../utils/oauth2');

module.exports = {
    register: async (req, res) => {
        try {
            const {name, email, password} = req.body;

            const exist = await User.findOne({where: {email}});
            if (exist) {
                return res.status(400).json({
                    status: false,
                    message: 'email already used!',
                    data: null
                });
            }

            const hashPassword = await bcryp.hash(password, 10);

            const user = await User.create({
                name, email, password: hashPassword, user_type: "basic"
            });

            return res.status(201).json({
                status: true,
                message: 'user created!',
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        } catch (error) {
            throw error;
        }
    },

    login: async (req, res) => {
        try {
            const {email, password} = req.body;

            const user = await User.findOne({where: {email}});
            if (!user) {
                return res.status(400).json({
                    status: false,
                    message: 'credential is not valid!',
                    data: null
                });
            }

            if (user.user_type == "google" && !user.password){
                return res.status(400).json({
                    status: false,
                    message: 'your account is registered with google oauth, you need to login with google oauth',
                    data: null
                });
            }

            const passwordCorrect = await bcryp.compare(password, user.password);
            if (!passwordCorrect) {
                return res.status(400).json({
                    status: false,
                    message: 'credential is not valid!',
                    data: null
                });
            }

            const payload = {
                id: user.id,
                name: user.name,
                email: user.email
            };

            const token = await jwt.sign(payload, JWT_SECRET_KEY);
            return res.status(200).json({
                status: true,
                message: 'login success!',
                data: {
                    token: token
                }
            });

        } catch (error) {
            throw error;
        }
    },

    whoami: async (req, res) => {
        try {
            return res.status(200).json({
                status: true,
                message: 'fetch user success!',
                data: req.user
            });
        } catch (error) {
            throw error;
        }
    },

    googleOauth2: async (req, res) => {
        // user hit endpoint login oauth2 (http://localhost:3000/auth/oauth)
        // generate url google login
        // redirect url ke login google
        // google redirect ke halaman login dengan query code (http://localhost:3000/auth/oauth?code=...)
        // get data user
        // register user
        // return token
        const {code} = req.query;
        if (!code) {
            const googleLoginUrl = oauth2.generateAuthUrl();
            return res.redirect(googleLoginUrl);
        }

        await oauth2.setCredentials(code);

        const {data} = await oauth2.getUserData();

        let user = await User.findOne({where: {email: data.email}})
        if(!user){
            user = await User.create({
                name: data.name,
                email: data.email,
                user_type: "google"
            })
        }
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        const token = await jwt.sign(payload, JWT_SECRET_KEY);
        return res.status(200).json({
            status: true,
            message: 'login success!',
            data: {
                token: token
            }
        });
        // return res.json(data);
    }
};