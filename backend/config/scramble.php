<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

return [
    'api_path' => 'api/v1',
    'api_domain' => null,
    'export_path' => 'api.json',
    'cache' => [
        'key' => 'scramble.openapi',
        'store' => 'database',
    ],
    'info' => [
        'version' => '1.0.0',
        'description' => 'Smart Business System REST API — Multi-tenant POS, inventory, and analytics platform.',
    ],
    'ui' => [
        'title' => 'SBS API Documentation',
    ],
    'dev_tools' => [
        'enabled' => env('SCRAMBLE_DEV_TOOLS', env('APP_DEBUG', false)),
    ],
    'renderer' => 'elements',
    'renderers' => [
        'elements' => [
            'view' => 'scramble::docs',
            'theme' => 'light',
            'hideTryIt' => false,
            'hideSchemas' => false,
            'logo' => '',
            'tryItCredentialsPolicy' => 'include',
            'layout' => 'responsive',
            'router' => 'hash',
        ],
        'scalar' => [
            'view' => 'scramble::scalar',
            'cdn' => 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
            'theme' => 'laravel',
            'proxyUrl' => 'https://proxy.scalar.com',
            'darkMode' => false,
            'showDeveloperTools' => 'never',
            'agent' => ['disabled' => true],
            'credentials' => 'include',
        ],
    ],
    'servers' => null,
    'enum_cases_description_strategy' => 'description',
    'enum_cases_names_strategy' => false,
    'flatten_deep_query_parameters' => true,
    'middleware' => [
        'web',
        RestrictedDocsAccess::class,
    ],
    'extensions' => [],
    'afterOpenApiGenerated' => function (Dedoc\Scramble\Support\Generator\OpenApi $openApi) {
        $openApi->secure(
            Dedoc\Scramble\Support\Generator\SecurityScheme::http('bearer')
        );
    },
];
