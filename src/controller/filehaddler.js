const createHttpError = require("http-errors");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const File = require("../models/file"); // Ensure correct model import

const publicDirectory = path.join(__dirname, "..", "..", "public");
const fileDirectory = path.join(publicDirectory, "file");

exports.uploadFile = async (req, res, next) => {
    try {
        const image = req.files.image;
        if (!image) {
            throw createHttpError(404, "Image not found");
        }
        if (!image.mimetype.startsWith("image")) {
            throw createHttpError(400, "Only images are allowed");
        }

        const uniqueId = uuidv4();
        const fileExtension = path.extname(image.name);
        const uniqueFilename = `${uniqueId}${fileExtension}`;
        const filePath = path.join(fileDirectory, uniqueFilename);

        await image.mv(filePath); // Use Promise here

        const dbFilePath = `file/${uniqueFilename}`;

        const newFile = new File({
            name: image.name,
            path: dbFilePath,
            directory: filePath,
            size: image.size
        });

        await newFile.save();
        res.status(201).json(newFile);

    } catch (error) {
        console.error(error);
        next(error);
    }
}

exports.deleteFile = async (req, res, next) => {
    try {
        const { filepath } = req.body;
        if (!filepath) {
            throw createHttpError(400, "File path is required");
        }

        const fileToDeletePath = path.join(publicDirectory, filepath);

        fs.unlink(fileToDeletePath, async (err) => {
            if (err) {
                console.error("Unable to delete local image file:", err);
                throw createHttpError(500, "File deletion failed");
            }

            console.log("Local image file deleted successfully.");

            await File.deleteOne({ path: filepath });

            res.sendStatus(204);
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
}
