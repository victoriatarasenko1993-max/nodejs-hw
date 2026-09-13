import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import { isValidObjectId } from 'mongoose';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import {
  clearSessionCookies,
  createSession,
  setSessionCookies,
} from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

const SALT_ROUNDS = 10;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESET_PASSWORD_TEMPLATE_PATH = path.join(
  __dirname,
  '../templates/reset-password-email.html',
);

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw createHttpError(400, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      email,
      password: hashedPassword,
    });
    const session = await createSession(user._id);

    setSessionCookies(res, session);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid credentials');
    }

    await Session.deleteMany({ userId: user._id });

    const session = await createSession(user._id);

    setSessionCookies(res, session);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;
    const session =
      sessionId && refreshToken && isValidObjectId(sessionId)
        ? await Session.findOne({ _id: sessionId, refreshToken })
        : null;

    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    if (session.refreshTokenValidUntil <= new Date()) {
      await Session.findByIdAndDelete(session._id);
      clearSessionCookies(res);
      throw createHttpError(401, 'Session token expired');
    }

    await Session.findByIdAndDelete(session._id);

    const newSession = await createSession(session.userId);

    setSessionCookies(res, newSession);

    res.status(200).json({
      message: 'Session refreshed',
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId && isValidObjectId(sessionId)) {
      await Session.findByIdAndDelete(sessionId);
    }

    clearSessionCookies(res);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    }

    const token = jwt.sign(
      { sub: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    const frontendDomain = (process.env.FRONTEND_DOMAIN || '').replace(
      /\/+$/,
      '',
    );
    const resetLink = `${frontendDomain}/reset-password?token=${token}`;

    const templateSource = await fs.readFile(
      RESET_PASSWORD_TEMPLATE_PATH,
      'utf-8',
    );
    const template = handlebars.compile(templateSource);
    const html = template({
      name: user.username,
      resetLink,
    });

    try {
      await sendEmail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Reset your password',
        html,
      });
    } catch (error) {
      throw createHttpError(
        500,
        'Failed to send the email, please try again later.',
        { cause: error },
      );
    }

    res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw createHttpError(401, 'Invalid or expired token', {
        cause: error,
      });
    }

    const { sub, email } = payload;

    if (!sub || !email || !isValidObjectId(sub)) {
      throw createHttpError(401, 'Invalid or expired token');
    }

    const user = await User.findOne({ _id: sub, email });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    user.password = hashedPassword;
    await user.save();

    await Session.deleteMany({ userId: user._id });

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
