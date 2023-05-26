require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const router = require('./routes');
const cors = require('cors');
const Sentry = require('@sentry/node')

const {
    SENTRY_DSN,
    ENVIRONMENT
} = process.env

Sentry.init({
    environment: ENVIRONMENT,
    dsn: "https://44094fbea2e54ad5aa123108aa178bc5@o4505210792706048.ingest.sentry.io/4505210803519488",
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    tracesSampleRate: 1.0,
  });

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// const {
//     HTTP_PORT = 3000
// } = process.env;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(router);

// Sentry error handler
app.use(Sentry.Handlers.errorHandler());

// 500
app.use((err, req, res, next) => {
    console.log(err);
    return res.status(500).json({
        status: false,
        message: err.message,
        data: null
    });
});

module.exports = app;