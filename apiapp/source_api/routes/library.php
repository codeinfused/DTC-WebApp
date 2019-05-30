<?php
use api\library\Library;
use api\library\Events;
use api\auth\Auth;

// https://boardgamegeek.com/geeklist/219847/dice-tower-convention-library-2018/page/1?

$app->post('/library/events/import/', function($req, $resp, $args) use ($app)
{
  // $token = Auth::checkAuthorization($this->db, $request);
  // if( is_error($token) ){
  //   return $response->withStatus((int)$token->get_code())->withJson($token->json());
  // }

  $body = $req->getParsedBody();
  $secret = $body['secret'];
  if($secret !== 'dtclfgapp'){ return; }

  $pdo = $this->db;
  $importFilename = $body['filename'];
  Events::parse_csv_import($pdo, $importFilename);
});

$app->post('/library/import/', function($req, $resp, $args) use ($app)
{
  // $token = Auth::checkAuthorization($this->db, $req);
  // if( is_error($token) ){
  //   return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  // }
  ini_set('memory_limit', '2048M');

  $body = $req->getParsedBody();
  $secret = $body['secret'];
  if($secret !== 'dtclfgapp'){ echo 'failed'; return; }

  echo "start\n";
  $games = Library::parse_geeklist_import($this);
  return $resp->withJson($games);
});

$app->post('/library/update/single/', function($req, $resp, $args) use ($app)
{
  $token = Auth::checkAuthorization($this->db, $request);
  if( is_error($token) ){
    return $response->withStatus((int)$token->get_code())->withJson($token->json());
  }

  $body = $req->getParsedBody();
  $secret = $body['secret'];
  $id = $body['id'];
  $bgg_id = $body['bgg_id'];
  $pass = $body['load'];

  if($secret !== 'dtclfgapp'){ return; }
  if($pass !== 'pass'){
    $pdo = $this->db;
    $bggapi = $this->get('bgg_api');

    $dbCheck = $pdo->prepare("UPDATE library_dtc2019 SET bgg_id=:bgg_id WHERE id=:id");
    $dbCheck->execute(array( ':bgg_id'=>$bgg_id, ':id'=>$id ));
    $dbCheck->closeCursor();
  }

  $nextGame = next_library_bgg_single($this);
  return $resp->withJson($nextGame);
});

$app->post('/library/update/', function($req, $resp, $args) use ($app)
{
  $token = Auth::checkAuthorization($this->db, $request);
  if( is_error($token) ){
    return $response->withStatus((int)$token->get_code())->withJson($token->json());
  }

  $body = $req->getParsedBody();
  $secret = $body['secret'];

  if($secret !== 'dtclfgapp'){ return; }

  update_library_bgg_ids($this);
});
