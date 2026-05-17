require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();

app.use(express.json());
app.use(morgan('dev')); // מתעד ומדפיס כל בקשה שנכנסת לשרת

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: 'Too many requests from this IP, please try again later.' }
}); // מגביל בקשות ל-100 ב-15 דקות לכתובת IP

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB (exam) via ENV successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});