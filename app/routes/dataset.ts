import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

// Route controllers
const DatasetController = () => import('#controllers/dataset')

// Default view
router.on('/').render('welcome')
router.group(() => {
    // Main routes (Names to be normalised)
    router.get('/getCrossfilter', [DatasetController, 'get'])
    router.get('/rebuildCrossfilter', [DatasetController, 'rebuild'])
    router.get('/getComparison', [DatasetController, 'compare'])
}).prefix('dataset').use(middleware.auth())