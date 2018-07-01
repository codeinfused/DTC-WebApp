<?php
$slim_app_settings = [
  'settings' => [
    'displayErrorDetails' => true, // set to false in production
    'addContentLengthHeader' => false, // Allow the web server to send the content-length header

    // Renderer settings
    'renderer' => [
      'template_path' => __DIR__ . '/../templates/',
    ],

    // Monolog settings
    'logger' => [
      'name' => 'slim-app',
      'path' => __DIR__ . '/../logs/app.log',
      'level' => \Monolog\Logger::DEBUG,
    ],
  ],
  'bgg_api' => [
    'search' => 'https://www.boardgamegeek.com/xmlapi2/search',
    'game' => 'https://www.boardgamegeek.com/xmlapi2/thing',
    'collection' => 'https://www.boardgamegeek.com/xmlapi2/collection',
    'hot' => 'https://www.boardgamegeek.com/xmlapi2/hot',
    'geeklist' => 'https://www.boardgamegeek.com/xmlapi/geeklist'
  ]
];

/*
search: "search?type=boardgame&query=",
collection: "collection?subtype=boardgame&excludesubtype=boardgameexpansion&own=1&username=", // http code must be 200 back
game: "thing?type=boardgame&id=",
hot: "hot?type=boardgame"
*/

$slim_app_settings['settings']['db'] = require_once __DIR__ .'/../db.php';

return $slim_app_settings;
