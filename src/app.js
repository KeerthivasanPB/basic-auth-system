import express from 'express'
import cors from 'cors'

const app = express()
app.use(cookieParser())

app.get('/',(req,res) => {
    res.send('welcome to lolbro')
})

//base config
app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true,limit: '16kb'}))
app.use(express.static('public'))

//cors config
app.use(
  cors({
    oringin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ['Authorization', "Content-Type"],
  }),
);

//import routes

import healthCheckRouter from './routes/healthcheck.routes.js'

app.use('/api/v1/healthcheck',healthCheckRouter)

import authRouter from './routes/auth.routes.js'
import cookieParser from 'cookie-parser'

app.use("/api/v1/auth", authRouter);

export default app