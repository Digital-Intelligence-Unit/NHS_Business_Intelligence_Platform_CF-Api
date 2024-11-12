/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'

/*
| Setup swagger documentation
*/
router
    .group(() => {
        router.get('/', '#controllers/swagger.json')
        router.get('/docs', '#controllers/swagger.docs')
    })
    .prefix('/swagger')

/*
| Import all other routes from app/routes
*/
import '../app/routes/dataset.js'