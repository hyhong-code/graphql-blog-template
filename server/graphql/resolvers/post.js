const Post = require("../../models/Post");
const User = require("../../models/User");
const auth = require("../../middlewares/auth");

let NUM_LIMIT = 6;
let NUM_PAGE = 1;

// Constants for pubSub event trigger
const POST_CREATED = "POST_CREATED";
const POST_UPDATED = "POST_UPDATED";
const POST_DELETED = "POST_DELETED";

const listPosts = async (_, { numPage, numLimit }, { req, res }) => {
  try {
    if ((numLimit && !numPage) || (!numLimit && numPage)) {
      throw new Error(
        "Must provide a page number and a limit number for pagination."
      );
    }

    const query = Post.find()
      .skip(((numPage || NUM_PAGE) - 1) * (numLimit || NUM_LIMIT))
      .limit(numLimit || NUM_LIMIT)
      .sort({ createdAt: -1 });

    const posts = await query;
    return posts;
  } catch (error) {
    throw error;
  }
};

const listPostsByUser = async (_, { username }, ctx) => {
  try {
    const postedBy = await User.findOne({ username });
    const posts = await Post.find({ postedBy }).sort({ createdAt: -1 });
    return posts;
  } catch (error) {
    throw error;
  }
};

const createPost = async (_, { input }, { req, res, pubSub }) => {
  try {
    const currentUser = await auth(req, res);
    const user = await User.findOne({ email: currentUser.email });
    let post = await Post.create({ ...input, postedBy: user._id });
    post = await Post.findById(post._id);

    // Publish new posts to onPostCreated subscripton
    pubSub.publish(POST_CREATED, { onPostCreated: post });
    return post;
  } catch (error) {
    throw error;
  }
};

const updatePost = async (_, { input }, { req, res, pubSub }) => {
  try {
    const currentUser = await auth(req, res);

    let post = await Post.findById(input.id);

    // Handle post not exits
    if (!post) {
      throw new Error("Post not found.");
    }

    // Handle user not owner of post
    if (post.postedBy.email !== currentUser.email) {
      throw new Error("User not authorized to delte this post.");
    }

    // Update post
    post = await Post.findByIdAndUpdate(
      post._id,
      { ...input },
      { runValidators: true, new: true }
    );

    pubSub.publish(POST_UPDATED, { onPostUpdated: post });
    return post;
  } catch (error) {
    throw error;
  }
};

const deletePost = async (_, { id }, { req, res, pubSub }) => {
  try {
    const currentUser = await auth(req, res);
    let post = await Post.findById(id);

    // Handle post not exits
    if (!post) {
      throw new Error("Post not found.");
    }

    // Handle user not owner of post
    if (post.postedBy.email !== currentUser.email) {
      throw new Error("User not authorized to delte this post.");
    }

    // Delete post
    post = await Post.findByIdAndDelete(post._id);

    pubSub.publish(POST_DELETED, { onPostDeleted: post });
    return post;
  } catch (error) {
    throw error;
  }
};

const getPost = async (_, { id }) => {
  try {
    const post = await Post.findById(id);
    return post;
  } catch (error) {
    throw error;
  }
};

const countPosts = async (_, args, ctx) => {
  try {
    return await Post.countDocuments();
  } catch (error) {
    throw error;
  }
};

const searchPosts = async (_, { term }, ctx) => {
  try {
    const posts = await Post.find({ $text: { $search: term } });
    return posts;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  Query: {
    listPosts,
    listPostsByUser,
    getPost,
    countPosts,
    searchPosts,
  },
  Mutation: {
    createPost,
    updatePost,
    deletePost,
  },
  Subscription: {
    onPostCreated: {
      subscribe: (_, args, { pubSub }) => pubSub.asyncIterator([POST_CREATED]),
    },
    onPostUpdated: {
      subscribe: (_, args, { pubSub }) => pubSub.asyncIterator([POST_UPDATED]),
    },
    onPostDeleted: {
      subscribe: (_, args, { pubSub }) => pubSub.asyncIterator([POST_DELETED]),
    },
  },
};
