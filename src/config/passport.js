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
        // 🛡 SAFE guards
        if (!profile.emails || !profile.emails.length) {
          return done(new Error("No email received from Google"), null);
        }

        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await User.findOne({ where: { email } });

        if (!user) {
          user = await User.create({
            name,
            email,
            authProvider: "google",
            passwordHash: null,
            preferredCurrency: "INR", // ✅ default
          });

          // 🔥 seed default categories for new Google user
          await seedUserCategories(user.id);
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
