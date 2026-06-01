const TranslatorService = require('../services/translatorService');

/**
 * Controller to handle incoming HTTP requests related to translation.
 */
class TranslateController {
  /**
   * Handles the POST /api/translate endpoint.
   * Validates input parameters and calls translator service.
   * 
   * @param {Object} req - Express Request object
   * @param {Object} res - Express Response object
   * @param {Function} next - Express Next function for middleware error forward
   */
  static async translateText(req, res, next) {
    try {
      const { text, source, target } = req.body;

      // 1. Validate request body
      if (text === undefined || text === null) {
        const error = new Error('The "text" field is required.');
        res.statusCode = 400;
        return next(error);
      }

      if (typeof text !== 'string') {
        const error = new Error('The "text" field must be a string.');
        res.statusCode = 400;
        return next(error);
      }

      if (!text.trim()) {
        const error = new Error('The "text" field cannot be empty or contain only whitespace.');
        res.statusCode = 400;
        return next(error);
      }

      if (!source || typeof source !== 'string' || !source.trim()) {
        const error = new Error('A valid "source" language code is required.');
        res.statusCode = 400;
        return next(error);
      }

      if (!target || typeof target !== 'string' || !target.trim()) {
        const error = new Error('A valid "target" language code is required.');
        res.statusCode = 400;
        return next(error);
      }

      const trimmedText = text.trim();
      const cleanSource = source.trim().toLowerCase();
      const cleanTarget = target.trim().toLowerCase();

      // 2. Edge Case: Same source and target language
      if (cleanSource === cleanTarget) {
        return res.status(200).json({
          translatedText: trimmedText
        });
      }

      // 3. Delegate to the service to perform the API call
      const translatedText = await TranslatorService.translate(trimmedText, cleanSource, cleanTarget);

      // 4. Return success response
      return res.status(200).json({
        translatedText: translatedText
      });

    } catch (err) {
      // Forward any service errors to the global error handling middleware
      next(err);
    }
  }
}

module.exports = TranslateController;
