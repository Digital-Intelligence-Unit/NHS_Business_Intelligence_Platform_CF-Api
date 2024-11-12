import User from 'diu-data-functions/models/user'
import app from '@adonisjs/core/services/app'

export async function getTestUser(): Promise<User>  {
    const cache = await app.container.make('cache');
    const userValues = await cache.getOrSet('testing.test_user', async () => {
        return (await User.find('noreply.lscsis@nhs.net#Collaborative Partners'))?.toJSON();
    }, { ttl: '3m' });
    return new User(userValues);
}