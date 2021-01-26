require('dotenv').config({
    path: './config/config.env'
});

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());

const connectDB = require('./config/db');

// body parser
app.use(bodyParser.json({
    json: {limit: '200mb', extended: true},
  urlencoded: {limit: '200mb', extended: true}
}
));

// Dev Login Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: process.env.CLIENT_URL
    }));
    app.use(morgan('dev'));
}

// Load all routes
const authRouter = require('./routes/auth.route');
app.use('/api', authRouter);

const treeRouter = require('./routes/tree.route');
app.use('/tree', treeRouter);

const transRouter = require('./routes/trans.route');
app.use('/trans', transRouter);

const profileRouter = require('./routes/profile.route');
app.use('/profile', profileRouter);

const adminRouter = require('./routes/admin.route');
app.use('/admin', adminRouter);

// Connect to database
connectDB();

app.use((req, res) => {
    res.status(404).json({
        success: false,
        msg: "Page not founded"
    })
})

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
