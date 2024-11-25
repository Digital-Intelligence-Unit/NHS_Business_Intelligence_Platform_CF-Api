// TO-DO: Update model to new format
import { HttpContext } from '@adonisjs/core/http'
import { instance as crossfilter } from '../crossfilter/crossfilter.js'
import UserPolicy from 'diu-data-functions/policies/user_policy';

export default class DatasetController {
    /**
     * @get
     * @paramQuery filter - Filter by type or date - @type(string) 
     * @paramQuery excludeFilter - Filter by date - @type(string) 
     * @description Get crossfilter data
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

    /**
     * @rebuild
     * @description Rebuild crossfilter model
     * @responseBody 200 - Model
     */
    async rebuild({ response }: HttpContext) {
        // Rebuild
        const status = await crossfilter.build();
        if (status) {
            return response.send({ success: true, message: 'Crossfilter rebuilt successfully!'});
        } else {
            return response.internalServerError({ message: 'Crossfilter rebuild failed' })
        }
    }

    /**
     * @compare
     * @requestFormDataBody {"cohorta": {"type":"object"}, "cohortb": {"type":"object"}}
     * @description Compare two cohorts (Object props: username, cohortName, data, createdDT)
     * @responseBody 200 - Model
     */
    async compare({ request, response, bouncer }: HttpContext) {
        // Check permission
        if (
            crossfilter.config?.capability && 
            await bouncer.with(UserPolicy).denies('capability', crossfilter.config?.capability)
        ) {
            return response.forbidden({
                status: 401,
                message: 'You don\'t have permission to access this data'
            })
        }

        // Get filters
        const filters = request.all();
        if(filters.cohorta.data && filters.cohortb.data) {
            // Get comparison
            const results = crossfilter.compare(
                JSON.parse(filters.cohorta.data),
                JSON.parse(filters.cohortb.data)
            );

            return response.send({
                details: results.table,
                baselinePop: results.baseline,
                comparisonPop: results.comparison
            });
        }
    }
}
