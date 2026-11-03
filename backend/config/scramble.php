
<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

return [
    /*
    |--------------------------------------------------------------------------
    | API Documentation Configuration
    |--------------------------------------------------------------------------
    */

    'api_path' => 'api/v1',
    'api_domain' => null,
    'export_path' => 'api.json',

    'cache' => [
        'key' => 'scramble.openapi',
        'store' => 'database',
    ],

    /*
    |--------------------------------------------------------------------------
    | API Information
    |--------------------------------------------------------------------------
    */

    'info' => [
        'version' => '1.0.0',

        'description' => '
        # Smart Business System (SBS)

        A REST API for managing business operations through one centralized
        business management platform.

        ## 1. Identity & Governance

        Manage system users, authentication, and access permissions.

        - User Authentication
        - User Management
        - Role Management
        - Permission Management
        - Role-Based Access Control (RBAC)

        ## 2. Commerce & Sales

        Manage daily sales operations and point-of-sale activities.

        - Real-Time Point of Sale (POS)
        - Sales Management
        - Order Tracking
        - Receipt Management
        - Sales Records

        ## 3. Supply Chain & Inventory

        Manage inventory, stock levels, suppliers, and purchasing operations.

        - Multi-Branch Inventory Tracking
        - Stock Management
        - Stock Alerts
        - Supplier Management
        - Supplier Portal
        - Purchase Orders
        - Purchase Management

        ## 4. Financial Management

        Manage business expenses, payments, and financial reporting.

        - Expense Tracking
        - Payment Recording
        - Financial Records
        - Profit and Loss (P&L) Reporting
        - Automated Financial Reports

        ## 5. Google Authentication

        Support authentication through Google accounts.

        - Google Sign In
        - Google Sign Up
        - Google Account Authentication
        - Secure OAuth Authentication

        ## API Authentication

        Bearer Token Authentication.

        ## API Version

        1.0.0
        ',
    ],

    /*
    |--------------------------------------------------------------------------
    | Documentation UI
    |--------------------------------------------------------------------------
    */

    'ui' => [
        'title' => 'Smart Business System | API Documentation',
    ],

    /*
    |--------------------------------------------------------------------------
    | Developer Tools
    |--------------------------------------------------------------------------
    */

    'dev_tools' => [
        'enabled' => env(
            'SCRAMBLE_DEV_TOOLS',
            env('APP_DEBUG', false)
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Documentation Renderer
    |--------------------------------------------------------------------------
    */

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
            'theme' => 'default',
            'proxyUrl' => 'https://proxy.scalar.com',
            'darkMode' => false,
            'showDeveloperTools' => 'never',

            'agent' => [
                'disabled' => true,
            ],

            'credentials' => 'include',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | API Servers
    |--------------------------------------------------------------------------
    */

    'servers' => null,

    /*
    |--------------------------------------------------------------------------
    | Schema Generation Settings
    |--------------------------------------------------------------------------
    */

    'enum_cases_description_strategy' => 'description',
    'enum_cases_names_strategy' => false,
    'flatten_deep_query_parameters' => true,

    /*
    |--------------------------------------------------------------------------
    | Documentation Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => [
        'web',
        RestrictedDocsAccess::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | OpenAPI Extensions
    |--------------------------------------------------------------------------
    */

    'extensions' => [],

    /*
    |--------------------------------------------------------------------------
    | API Authentication Security
    |--------------------------------------------------------------------------
    */

    'afterOpenApiGenerated' => function (
        Dedoc\Scramble\Support\Generator\OpenApi $openApi
    ) {
        $openApi->secure(
            Dedoc\Scramble\Support\Generator\SecurityScheme::http('bearer')
        );
    },
];
