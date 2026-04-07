import dotenv from 'dotenv';
import app from './src/app';
import connectDB from './src/config/db';
dotenv.config();

const PORT = 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});