<?php
// DIC configuration
use Cartalyst\Sentinel\Native\Facades\Sentinel as Sentinel;
use Illuminate\Database\Capsule\Manager as Capsule;

$container = $app->getContainer();

$capsule = new Capsule;

$capsule->addConnection([
  'driver'    => 'mysql',
  'host'      => $LFGCONFIG['settings']['db']['host'],
  'database'  => $LFGCONFIG['settings']['db']['dbname'],
  'username'  => $LFGCONFIG['settings']['db']['user'],
  'password'  => $LFGCONFIG['settings']['db']['pass'],
  'charset'   => $LFGCONFIG['settings']['db']['charset'],
  'collation' => $LFGCONFIG['settings']['db']['collation'],
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();


// view renderer
$container['renderer'] = function($c)
{
  $settings = $c->get('settings')['renderer'];
  return new Slim\Views\PhpRenderer($settings['template_path']);
};

// monolog
$container['logger'] = function($c)
{
  $settings = $c->get('settings')['logger'];
  $logger = new Monolog\Logger($settings['name']);
  $logger->pushProcessor(new Monolog\Processor\UidProcessor());
  $logger->pushHandler(new Monolog\Handler\StreamHandler($settings['path'], $settings['level']));
  return $logger;
};

// db connection
$container['db'] = function($c)
{
  $settings = $c->get('settings')['db'];
  $pdo = new PDO("mysql:host=" . $settings['host'] . ";charset=utf8;dbname=" . $settings['dbname'], $settings['user'], $settings['pass']);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

  return $pdo;
};

$container['auth'] = function($c)
{
  $sentinel = (new \Cartalyst\Sentinel\Native\Facades\Sentinel())->getSentinel();
  return $sentinel;
};

$container['curl'] = function($c)
{
  $curl = new Curl(array(
  	"cookieFile" => false,
  	"defaultRefer" => "https://boardgamegeek.com"
  ));

  return $curl;
};
