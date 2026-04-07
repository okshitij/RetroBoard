import { Request, Response } from 'express';
import userModel from '../models/user.model';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { username, email, password } = req.body;

    const isUserExist = await userModel.findOne({ email });

    if (isUserExist) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    const user = await userModel.create({ username, email, password });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string
    );

    res.cookie('token', token);

    return res.status(201).json({
      message: 'User registered successfully',
      user
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      error
    });
  }
};