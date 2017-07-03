<?php
// AUTOLOADER FOR CLASS FILES
// --------------
spl_autoload_register(function ($className)
{
  $ds = DIRECTORY_SEPARATOR;
  $dir = __DIR__;

  // replace namespace separator with directory separator
  $className = str_replace('\\', $ds, $className);
  $file = "{$dir}{$ds}{$className}.php";

  // get file if readable
  if (is_readable($file)) require_once $file;
});


define('APP_ENV', 'LOCAL');

// LOAD SLIM API APP
// ---------------
require __DIR__ . '/../conf.php';
require __DIR__ . '/../vendor/autoload.php';

session_start();

$LFGCONFIG = require __DIR__ . '/settings.php';
$app = new \Slim\App($LFGCONFIG);

require __DIR__ . '/api/ApiError.php';
require __DIR__ . '/opencurl.php';
require __DIR__ . '/cacher.php';

require __DIR__ . '/dependencies.php';
require __DIR__ . '/middleware.php';
require __DIR__ . '/routes.php';

$app->run();  // init slim
