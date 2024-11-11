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
    .prefix('/v2/swagger')

/*
| Import all other routes from app/routes
*/
import '../app/routes/user.js'
import '../app/routes/dataset.js'
import '../app/routes/access_logs.js'
import '../app/routes/mail.js'
import '../app/routes/pbi.js'
import '../app/routes/rbac.js'
import '../app/routes/admin.js'