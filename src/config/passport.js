const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('../models/user.model');

console.log('[Passport Config] Initializing Strategies...');
console.log('[Passport Config] Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'LOADED' : 'MISSING');
console.log('[Passport Config] Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'LOADED' : 'MISSING');
console.log('[Passport Config] Facebook App ID:', process.env.FACEBOOK_APP_ID ? 'LOADED' : 'MISSING');
console.log('[Passport Config] X Consumer Key:', process.env.X_CONSUMER_KEY ? 'LOADED' : 'MISSING');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();

// RENDER env var is automatically injected by Render on all web services.
const RENDER_ORIGIN = process.env.RENDER_EXTERNAL_URL
    ? process.env.RENDER_EXTERNAL_URL.trim().replace(/\/$/, '')
    : process.env.RENDER
        ? 'https://ecombackend-tcey.onrender.com'
        : null;

const SERVER_URL = (
    process.env.SERVER_URL ||
    RENDER_ORIGIN ||
    ''
).trim().replace(/\/$/, '');

const buildCallbackUrl = (path, explicitUrl) => {
    if (explicitUrl && explicitUrl.trim()) {
        return explicitUrl.trim();
    }
    if (!SERVER_URL) {
        // Local dev: relative path, Passport resolves against incoming request host.
        return path;
    }
    return `${SERVER_URL}${path}`;
};

const GOOGLE_CALLBACK_URL = buildCallbackUrl('/api/auth/google/callback', process.env.GOOGLE_CALLBACK_URL);
const FACEBOOK_CALLBACK_URL = buildCallbackUrl('/api/auth/facebook/callback', process.env.FACEBOOK_CALLBACK_URL);

console.log('[Passport Debug] GOOGLE_CLIENT_ID Length:', GOOGLE_CLIENT_ID?.length);
console.log('[Passport Debug] GOOGLE_CLIENT_SECRET Length:', GOOGLE_CLIENT_SECRET?.length);
console.log('[Passport Debug] Google Callback URL:', GOOGLE_CALLBACK_URL);

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_CALLBACK_URL,
            scope: ['profile', 'email'],
            proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                let user = await User.findOne({
                    $or: [{ googleId: profile.id }, { email: email }]
                });

                if (user) {
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.avatar = user.avatar || profile.photos[0].value;
                        await user.save();
                    }
                    return done(null, user);
                }

                user = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: email,
                    avatar: profile.photos[0].value,
                    provider: 'google'
                });

                return done(null, user);
            } catch (err) {
                console.error('Passport Google Strategy Internal Error:', err);
                return done(err, null);
            }
        }
    )
);

// Facebook Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: FACEBOOK_CALLBACK_URL,
            profileFields: ['id', 'displayName', 'emails', 'photos'],
            proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
                let user = await User.findOne({
                    $or: [{ facebookId: profile.id }, { email: email }]
                });

                if (user) {
                    if (!user.facebookId) {
                        user.facebookId = profile.id;
                        user.avatar = user.avatar || (profile.photos ? profile.photos[0].value : null);
                        await user.save();
                    }
                    return done(null, user);
                }

                user = await User.create({
                    facebookId: profile.id,
                    name: profile.displayName,
                    email: email,
                    avatar: profile.photos ? profile.photos[0].value : null,
                    provider: 'facebook'
                });

                return done(null, user);
            } catch (err) {
                console.error('Passport Facebook Strategy Error:', err);
                return done(err, null);
            }
        }
    )
);

// Twitter (X) Strategy
/*
passport.use(
    new TwitterStrategy(
        {
            consumerKey: process.env.X_CONSUMER_KEY,
            consumerSecret: process.env.X_CONSUMER_SECRET,
            callbackURL: 'http://localhost:5000/auth/x/callback',
            includeEmail: true,
            proxy: true
        },
        async (token, tokenSecret, profile, done) => {
            try {
                const email = profile.emails ? profile.emails[0].value : `${profile.username}@x.com`;
                let user = await User.findOne({
                    $or: [{ twitterId: profile.id }, { email: email }]
                });

                if (user) {
                    if (!user.twitterId) {
                        user.twitterId = profile.id;
                        user.avatar = user.avatar || (profile.photos ? profile.photos[0].value : null);
                        await user.save();
                    }
                    return done(null, user);
                }

                user = await User.create({
                    twitterId: profile.id,
                    name: profile.displayName,
                    email: email,
                    avatar: profile.photos ? profile.photos[0].value : null,
                    provider: 'x'
                });

                return done(null, user);
            } catch (err) {
                console.error('Passport X Strategy Error:', err);
                return done(err, null);
            }
        }
    )
);
*/

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

