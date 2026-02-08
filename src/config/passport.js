const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../modules/users/user.model");
const seedUserCategories = require("../utils/seedUserCategories");


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await User.findOne({ where: { email } });

        if (!user) {
          user = await User.create({
            name,
            email,
            authProvider: "google",
            passwordHash: null,
          });
          await seedUserCategories(user.id); // 🔥 IMPORTANT
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
