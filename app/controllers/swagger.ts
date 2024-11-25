import { HttpContext } from '@adonisjs/core/http';
import router from '@adonisjs/core/services/router'
import { createReadStream } from 'fs'

import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'
import env from '#start/env'

export default class Swagger {
    async json({ response } : HttpContext) {
        if(env.get('NODE_ENV') == 'local') {
            // Generate on the fly
            return AutoSwagger.default.docs(router.toJSON(), swagger)
        } else {
            // Use json from build
            return response.stream(
                createReadStream('/app/swagger.json')
            )
        }
    }

    async docs() {
        // Customise UI to include interceptor
        const url = '/swagger';
        const persistAuthString = swagger.persistAuthorization ? "persistAuthorization: true," : "";
        return `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="ie=edge">
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui-standalone-preset.js"></script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui-bundle.js"></script>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui.css" />
                    <title>Documentation</title>
                </head>
                <body>
                    <div id="swagger-ui"></div>
                    <script>
                            function getCookie(name) {
                                var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                                if (match) return match[2];
                            }
                            window.onload = function() {
                                SwaggerUIBundle({
                                    url: "${url}",
                                    dom_id: '#swagger-ui',
                                    presets: [
                                        SwaggerUIBundle.presets.apis,
                                        SwaggerUIStandalonePreset
                                    ],
                                    layout: "BaseLayout",
                                    ${persistAuthString}
                                    requestInterceptor: (request) => { request.headers['X-XSRF-TOKEN'] = getCookie('XSRF-TOKEN'); return request; }
                                })
                            }
                    </script>
                </body>
            </html>`;
    }
}
