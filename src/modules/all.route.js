import authRoute from './auth/auth.route.js';

const allRoutes = (app) => {
    app.use('/auth', authRoute);
};

export default allRoutes;