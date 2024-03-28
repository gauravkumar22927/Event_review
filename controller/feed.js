//get method
exports.getPosts = (req, res, next) => {
  res.json({ posts: [{ title: "first Post", content: "This is the first post" }] })
}

//post method
exports.createPost = (req, res, next) => {
  const title = req.body.title
  const content = req.body.content

  res.status(201).json({
    message: "post created successfully",
    post: { id: new Date.toString(), title: title, content: content },
  })
}
