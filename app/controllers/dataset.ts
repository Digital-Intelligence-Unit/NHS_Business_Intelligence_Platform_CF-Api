// TO-DO: Update model to new format
import { HttpContext } from '@adonisjs/core/http'
import { instance as crossfilter } from '../crossfilter/crossfilter.js'
import UserPolicy from 'diu-data-functions/policies/user_policy';

export default class DatasetController {
    /**
     * @index
     * @paramQuery type - Filter by type or date - @type(string) 
     * @paramQuery date - Filter by date - @type(string) 
     * @paramQuery pageKey - DDB Start key - @type(string) 
     * @paramQuery limit - Query result limit - @type(number) 
     * @description Get a list of all logs
     * @responseBody 200 - Model
     */
    async get({ request, response, bouncer }: HttpContext) {
        // Clone crossfilter
        const crossfilterInstance = crossfilter.clone();
        if(!crossfilterInstance) { return response.internalServerError({ message: 'Crossfilter not configured' }) }

        // Check permission
        if (
            crossfilterInstance.config?.capability && 
            await bouncer.with(UserPolicy).denies('capability', crossfilterInstance.config?.capability)
        ) {
            return response.forbidden({
                status: 401,
                message: 'You don\'t have permission to access this data'
            })
        }

        // Filter instance
        const data = crossfilterInstance.filter(
            JSON.parse(request.input('filter', '{}')), 
            JSON.parse(request.input('excludeFilter', '{}'))
        );

        // Return
        if (data) {
            return response.send(data);
        } else {
            return response.internalServerError({ message: 'An error occurred, please try again' })
        }
    }
}
