<?php

return [
    'routes' => [
        // Page
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],

        // Health
        ['name' => 'tag#health', 'url' => '/api/health', 'verb' => 'GET'],

        // Tags
        ['name' => 'tag#index',   'url' => '/api/tags',      'verb' => 'GET'],
        ['name' => 'tag#create',  'url' => '/api/tags',      'verb' => 'POST'],
        ['name' => 'tag#update',  'url' => '/api/tags/{id}', 'verb' => 'PATCH'],
        ['name' => 'tag#destroy', 'url' => '/api/tags/{id}', 'verb' => 'DELETE'],

        // Todos
        ['name' => 'todo#index',   'url' => '/api/todos',      'verb' => 'GET'],
        ['name' => 'todo#create',  'url' => '/api/todos',      'verb' => 'POST'],
        ['name' => 'todo#update',  'url' => '/api/todos/{id}', 'verb' => 'PATCH'],
        ['name' => 'todo#destroy', 'url' => '/api/todos/{id}', 'verb' => 'DELETE'],

        // Settings
        ['name' => 'settings#index',  'url' => '/api/settings', 'verb' => 'GET'],
        ['name' => 'settings#update', 'url' => '/api/settings', 'verb' => 'PATCH'],
    ],
];
