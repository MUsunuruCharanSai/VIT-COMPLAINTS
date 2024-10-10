const LocalStrategy = require("passport-local").Strategy;
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

// Your MongoDB URI
const uri =
  "mongodb+srv://Charan:vitcomplaints@cluster0.cwwnj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db("mydb");
      const users = db.collection("users");

      const user = await users.findOne({ email });

      if (user == null) {
        return done(null, false, { message: "No user with that email" });
      }

      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Password incorrect" });
      }
    } catch (e) {
      return done(e);
    } finally {
      await client.close();
    }
  };

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));

  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id, done) => {
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    try {
      await client.connect();
      const db = client.db("mydb");
      const users = db.collection("users");
      const user = await users.findOne({ _id: new ObjectId(id) });

      done(null, user);
    } catch (e) {
      done(e, null);
    } finally {
      await client.close();
    }
  });
}

module.exports = initialize;
