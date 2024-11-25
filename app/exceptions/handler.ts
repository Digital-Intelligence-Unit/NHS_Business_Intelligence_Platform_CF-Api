import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { HttpError } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'
import { errors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
    /**
     * In debug mode, the exception handler will display verbose errors
     * with pretty printed stack traces.
     */
    protected debug = !app.inProduction

    /**
     * The method is used for handling errors and returning
     * response to the client
     */
    async handle(error: Exception, ctx: HttpContext) {
        
        // Handle validation errors
        if(error instanceof errors.E_VALIDATION_ERROR) {
            return this.renderValidationErrorAsJSON(error, ctx);
        }
        
        // Handle all other errors
        ctx.response.status(error.status || 500).send({
            success: false, // To be deprecated
            code: error.code,
            message: error.message,
        })
    }

    /**
     * The method is used to report error to the logging service or
     * the third party error monitoring service.
     *
     * @note You should not attempt to send a response from this method.
     */
    async report(error: unknown, ctx: HttpContext) {
        return super.report(error, ctx)
    }

    // Custom validation error report
    async renderValidationErrorAsJSON(error: HttpError, ctx: HttpContext) {
        ctx.response.status(400).send({
            success: false,
            message: error.messages[0].message,
            errors: error.messages,
        })
    }
}
