import authRoute from './auth/auth.route.js';

export const allRoutes = (app) => {
    app.use('/auth', authRoute);
};