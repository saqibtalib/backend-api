import mongoose from 'mongoose'
import { Router } from 'express';
import passport from "passport";
import isEmpty from 'lodash/isEmpty';

import authenticate from '../middlewares/authenticate';
import { signup, login } from '../validations/auth'

import { createNewUser, updateUserById, getUserById } from '../db/controllers/user';
import { decodToken } from '../helper';
// import { findUser, userValidator } from '../validators/userValidator';

const router = Router();
const User = mongoose.model('User');



router.post('/signup', async (req, res, next) => {
    try {
        const { errors, isValid } = await signup(req.body)
        if (!isValid) { return res.status(500).json({ errors }) }

        let user = await createNewUser(req.body)
        return res.status(200).json({ user: user.toAuthJSON() })
    } catch (error) {
        return res.status(500).json({ errors: error.toString(), message: 'Oops, something happen bad while proccessing your requset.' })
    }
})


router.post('/login-via-local', (req, res, next) => {
    try {
        const { errors, isValid } = login(req.body)
        if (!isValid) { return res.status(500).json({ errors }) }

        passport.authenticate('local', (err, user, info) => {
            if (err) { return res.status(500).json({ errors: error.toString(), message: 'Oops, something happen bad while proccessing your requset.' }) };
            if (info) { return res.status(500).json({ errors: info }) };
            return res.status(200).json({ user });
        })(req, res, next)
    } catch (error) {
        return res.status(500).json({ errors: error.toString(), message: 'Oops, something happen bad while proccessing your requset.' })
    }

})

router.get('/refresh-token', authenticate, async (req, res, next) => {
    const { id } = req.currentUser

    try {
        let user = await getUserById(id)
        if (!user) { return res.status(500).json({ errors: { message: 'Invalid User Token.' } }) };

        return res.status(200).json({ user: user.toAuthJSON() })
    } catch (error) {
        return res.status(500).json({ errors: error.toString(), message: 'Oops, something happen bad while proccessing your requset.' })
    }
});

router.get('/confirm-email/:token', async (req, res) => {
    const { token } = req.params;

    try {
        let decodedToken = await decodToken(token, process.env.CONFIRMATION_EMAIL_SECRET)
        let { id } = decodedToken;
        await updateUserById(id, { isVerified: true })
        return res.status(200).json({ message: 'Your email verifed successfully.' })

    } catch (error) {
        return res.status(500).json({ errors: error.toString(), message: 'Oops, something happen bad while proccessing your requset.' })
    }
});

router.get('/reset-password/:identifier', (req, res) => {
    const { identifier } = req.params;

    User.findOne({ $or: [{ username: identifier.toLowerCase() }, { email: identifier.toLowerCase() }] }, (err, user) => {
        if (err) { return res.status(400).json({ errors: { error: err, message: 'Internal Server Error. Contact Administrator for more information.' } }) };

        if (!user) return res.status(404).json({ errors: { message: 'User with such email/username doesn\'t exist in system.' } });

        return res.status(200).json({ message: 'Send reset email is not implimented yet it is still inporgress...' })
    });
});

router.get('/currentUser', authenticate, async (req, res) => {
    const { id } = req.currentUser

    try {
        let user = await getUserById(id)
        if (!user) { return res.status(500).json({ errors: { message: 'Invalid User Token.' } }) };

        return res.status(200).json({ user: user.toJSON() })
    } catch (error) {
        return res.status(500).json({ errors: error.toString(), message: 'Oops, something happen bad while proccessing your requset.' })
    }
});

export default router;