import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserModel , ContentModel, LinkModel } from "./db.js";
import { JWT_PASSWORD } from "./config.js";
import { userMiddleware } from "./middlewere.js";
import { random } from "./utils.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/v1/signup", async (req, res) => {
    // zod validation , hash the password
    const username = req.body.username;
    const password = req.body.password;

    try {
        await UserModel.create({
            username: username,
            password: password
        }) 

        res.json({
            message: "User signed up"
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists"
        })
    }
})

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const existingUser = await UserModel.findOne({
        username,
        password
    })

    if(existingUser){
        const token = jwt.sign({
            id: existingUser._id
        }, JWT_PASSWORD)

        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect credentials"
        })
    }
})

app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const { title, link, type, text, pin, tags } = req.body;
    console.log("POST /api/v1/content - Received:", { title, link, type, text, pin, tags });
    
    try {
        if (!title) {
            return res.status(400).json({
                message: "Title is required"
            });
        }

        const content = await ContentModel.create({
            title,
            link,
            type,
            text,
            pin: !!pin,
            //@ts-ignore
            userId: req.userId,
            tags: tags && Array.isArray(tags) ? tags : []
        });
        console.log("Content created successfully:", content);
        res.json({
            message: "content added",
            content
        });
    } catch (error) {
        console.error("Error creating content:", error);
        res.status(500).json({
            message: "Error creating content"
        });
    }
});

app.get("/api/v1/content" , userMiddleware, async (req, res) => {

    //@ts-ignore
    const userId = req.userId;
    // Show pinned notes first
    const content = await ContentModel.find({
        userId: userId
    }).sort({ pin: -1, createdAt: -1 }).populate("userId", "username");
    res.json({ content });
});

// Get all unique tags for a user
app.get("/api/v1/tags", userMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const content = await ContentModel.find({
        userId: userId
    });
    
    const tagsSet = new Set<string>();
    content.forEach((item: any) => {
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach((tag: string) => tagsSet.add(tag));
        }
    });
    
    const tags = Array.from(tagsSet).sort();
    res.json({ tags });
});

// Pin or unpin a note
app.put("/api/v1/content/:id/pin", userMiddleware, async (req, res) => {
    const contentId = req.params.id;
    const { pin } = req.body;
    //@ts-ignore
    const userId = req.userId;
    const result = await ContentModel.updateOne({ _id: contentId, userId }, { $set: { pin: !!pin } });
    if (result.modifiedCount === 1) {
        res.json({ message: pin ? "Pinned" : "Unpinned" });
    } else {
        res.status(404).json({ message: "Content not found or not updated" });
    }
});

app.delete("/api/v1/content/:id", userMiddleware, async (req, res) => {
    const contentId = req.params.id;
    //@ts-ignore
    const userId = req.userId;
    const result = await ContentModel.deleteOne({
        _id: contentId,
        userId: userId
    });
    if (result.deletedCount === 1) {
        res.json({ message: "Deleted" });
    } else {
        res.status(404).json({ message: "Content not found or not deleted" });
    }
});

app.post("/api/v1/brain/share",userMiddleware, async (req, res) => {
    const share = req.body.share;
    console.log("POST /api/v1/brain/share - share:", share, "userId:", (req as any).userId);
    
    if(share){

        const existingLink = await LinkModel.findOne({
            // @ts-ignore
            userId: req.userId
        });

        if(existingLink){
            console.log("Using existing link:", existingLink.hash);
            res.json({
                hash: existingLink.hash
            })
            return;
        }
        const hash = random(10);
        console.log("Creating new link with hash:", hash);
        await LinkModel.create({
            // @ts-ignore
            userId: req.userId,
            hash: hash
        })

        res.json({
            hash: hash
        })
    } else {
        await LinkModel.deleteOne({
            // @ts-ignore
            userId: req.userId
        });

        res.json({
            message: "deleted link"
        })
    }
})

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink

    const link = await LinkModel.findOne({
        hash
    })

    if (!link) {
        res.json({
            message: "Share link not found"
        })
        return;
    }

    const content = await ContentModel.find({
        userId: link.userId
    })

    const user = await UserModel.findOne({
        _id: link.userId
    })

    
    if(!user) {
        res.json({
            message: "User not found"
        })
        return;
    }

    res.json({
        username: user.username,
        content: content
    })
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});