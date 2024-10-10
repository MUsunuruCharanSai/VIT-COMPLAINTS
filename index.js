const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const { MongoClient, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://Charan:vitcomplaints@cluster0.cwwnj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.get("/", async (req, res) => {
  const client = new MongoClient(uri);
  await client.connect();
  const storage = client.db("mydb").collection("mycollection");

  const fetchedComplaints = await storage.find().toArray();

  const sortedList = fetchedComplaints.sort((a, b) => {
    if (a.likes < b.likes) {
      return 1;
    } else if (a.likes > b.likes) {
      return -1;
    } else {
      return 0;
    }
  });
  console.log(sortedList);

  res.render("home", { data: sortedList });
});

app.get("/complaints", (req, res) => {
  res.render("form");
});

app.post("/complaints", async (req, res) => {
  const data = req.body;
  //const name=req.body.name;
  console.log("Received form data:", data);
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const storage = client.db("mydb").collection("mycollection");
    console.log("Connected to the database");

    await storage.insertOne(data);

    res.render('success.ejs');
  } catch (err) {
    console.log(err);
  }
});

app.post("/likes", async (req, res) => {
  const likedId = req.body.thumbsup;

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const storage = client.db("mydb").collection("mycollection");

    await storage.updateOne(
      { _id: new ObjectId(likedId) },
      { $inc: { likes: 1 } },
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.get("/posts/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const storage = client.db("mydb").collection("mycollection");
    const fetchedData = await storage.findOne({ _id: new ObjectId(id) });
    res.render("post", { data: fetchedData });
  } catch (err) {
    console.log(err);
  }
});

app.post("/comment", async (req, res) => {
  const id = req.body.postid;
  const comment = req.body;
  console.log(comment);
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const storage = client.db("mydb").collection("mycollection");
    const insertComment = await storage.updateOne(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } },
    );
    console.log(insertComment);
    res.redirect("/posts/" + id);
  } catch (err) {
    console.log(err.message);
  }
});

app.post("/delete", async (req, res) => {
  const postidvalue = req.body.postId;
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const storage = client.db("mydb").collection("mycollection");

    await storage.deleteOne({ _id: new ObjectId(postidvalue) });
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/filter", async (req, res) => {
  const filter = req.body.filterValue;
  console.log(filter);

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const storage = client.db("mydb").collection("mycollection");
    const fetchedData = await storage.find().toArray();

    let filteredData;

    if (filter === "all") {
      filteredData = fetchedData;
    } else {
      filteredData = fetchedData.filter((data) => data.dept === filter);
    }

    console.log("this is filtered data:",filteredData);
    res.render("home", { data: filteredData });
  } catch (error) {
    console.log(error);
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const storage = client.db("mydb").collection("users");
    const hashedPassword = await bcrypt.hash(password, 10);
    await storage.insertOne({
      Email: email,
      password: hashedPassword,
      username: username,
    });
    res.send("User registered successfully");
  } catch {
    res.redirect("/register");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
