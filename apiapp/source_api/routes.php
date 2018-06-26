<?php
// Routes
// [{name}]
use Cartalyst\Sentinel\Native\Facades\Sentinel as Sentinel;
use Illuminate\Database\Capsule\Manager as Capsule;

$app->get('/', function ($request, $response, $args)
{
  // Sample log message
  $this->logger->info("LFG API '/' route");

  // Render index view
  // return $this->renderer->render($response, 'index.phtml', $args);
  return new \ApiError('401', 'Invalid API method.');
});


include_once(__DIR__.'/routes/auth.php');
// POST login

include_once(__DIR__.'/routes/user.php');
//

//include_once(__DIR__.'/routes/tables.lists.php');
// GET tables (list)
// GET tables/:id
// GET tables/search/?params (
// GET tables/

include_once(__DIR__.'/routes/tables.manage.php');
// POST tables
// POST tables/:id

include_once(__DIR__.'/routes/events.manage.php');
// POST events/byday

include_once(__DIR__.'/routes/games.lists.php');
// GET games
// GET games/search/?params
// GET games/:id

include_once(__DIR__.'/routes/library.php');
