import { test } from '@japa/runner'
import User from 'diu-data-functions/models/user'
import { getTestUser } from '#tests/functional/_utils/auth.helper'

test.group('Population Health Mini', (group) => {

    let user: User;

    group.setup(async () => {
        user = await getTestUser();
    })

    test('Get Data', async ({ client }) => {
        const response = await client.get('/getCrossfilter');
        const body = response.body();
        
        response.assert?.properties(body, [
            'DDimension', 'AgeDimension', 'WDimension', 'AreaLookup', 'all'
        ]);
    })
})