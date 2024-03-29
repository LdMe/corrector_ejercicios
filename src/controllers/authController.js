import Jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();


const register = async (req, res) => {
    try {
        const { name, email, password, passwordConfirm } = req.body;
        const oldUser = await User.findOne({ email });
        if (oldUser) {
            res.status(409).json({ error: "User already exists" });
            return;
        }
        if (password !== passwordConfirm) {
            res.status(401).json({ error: "Passwords do not match" });
            return;
        }

        const user = new User({ name, email, password });
        await user.save();
        res.json({ data: user });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error registering user" });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
            res.status(404).json({ error: "User does not exist" });
            return;
        }
        const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);
        if (!isPasswordCorrect) {
            res.status(400).json({ error: "Invalid credentials" });
            return;
        }
        const token = Jwt.sign({ name: oldUser.name, email: oldUser.email, id: oldUser._id, role: oldUser.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        /* send token in a cookie */
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 3600000

        });

        res.status(200).json({
            data: {
                user:
                {
                    name: oldUser.name,
                    email: oldUser.email,
                    id: oldUser._id,
                    role: oldUser.role
                },
                token
            }
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error loggin user" })
    }

}

const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ data: "Logged out" });
}

const refresh = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        if (!cookie) {
            res.status(401).json({ error: "Unauthorized: No cookie provided" });
            return;
        }
        const token = cookie.split("=")[1];

        if (!token) {
            res.status(401).json({ error: "Unauthorized: No token provided" });
            return;
        }
        const decoded = Jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401).json({ error: "Unauthorized: Invalid token" });
            return;
        }
        const newToken = Jwt.sign({ name: user.name, email: user.email, id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", newToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 3600000
        });
        res.status(200).json({
            data: {
                user:
                {
                    name: user.name,
                    email: user.email,
                    id: user._id,
                    role: user.role
                },
                token: newToken
            }
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: "Unauthorized: Invalid token" });
        return;
    }
}


export default { register, login, logout, refresh };