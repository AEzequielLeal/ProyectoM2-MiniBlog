const { Router } = require("express");
const authorsService = require("../services/authorsService");

const router = Router();

router.get("/", async (request, response, next) => {
    try {
        const authors = await authorsService.getAuthors();
        response.status(200).json(authors);
    } catch (error) {
        next(error);
    }
});

router.get("/:id", async (request, response, next) => {
    try {
        const author = await authorsService.getAuthorById(request.params.id);
        response.status(200).json(author);
    } catch (error) {
        next(error);
    }
});

router.post("/", async (request, response, next) => {
    try {
        const author = await authorsService.createAuthor(request.body);

        response.status(201)
            .location(`/authors/${author.id}`)
            .json(author);
    } catch (error) {
        next(error);
    }
});

router.put("/:id", async (request, response, next) => {
    try {
        const author = await authorsService.updateAuthor(
            request.params.id,
            request.body
        );

        response.status(200).json(author);
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", async (request, response, next) => {
    try {
        await authorsService.deleteAuthor(request.params.id);
        response.status(204).end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;