/**
 * AsyncHandler — Eliminates try/catch boilerplate from controllers
 * 
 * Wraps an async route handler so that any thrown error is
 * automatically forwarded to Express's error-handling middleware
 * via next(). This is the standard pattern used in production
 * Express applications.
 * 
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => {
 *       const data = await SomeModel.find();
 *       res.json(data);
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
