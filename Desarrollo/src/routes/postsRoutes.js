const { Router } = require("express");
const postsService = require("../services/postsService");

const router = Router();

router.get("/", async (request, response, next) => {
    try {
        const posts = await postsService.getPosts();
        response.status(200).json(posts);
    } catch (error) {
        next(error);
    }
});

router.get("/author/:authorId", async (request, response, next) => {
    try {
        const posts = await postsService.getPostsByAuthor(
            request.params.authorId
        );

        response.status(200).json(posts);
    } catch (error) {
        next(error);
    }
});

router.get("/:id", async (request, response, next) => {
    try {
        const post = await postsService.getPostById(request.params.id);
        response.status(200).json(post);
    } catch (error) {
        next(error);
    }
});

router.post("/", async (request, response, next) => {
    try {
        const post = await postsService.createPost(request.body);

        response.status(201)
            .location(`/posts/${post.id}`)
            .json(post);
    } catch (error) {
        next(error);
    }
});

router.put("/:id", async (request, response, next) => {
    try {
        const post = await postsService.updatePost(
            request.params.id,
            request.body
        );

        response.status(200).json(post);
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", async (request, response, next) => {
    try {
        await postsService.deletePost(request.params.id);
        response.status(204).end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;