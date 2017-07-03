<?php
use api\library\Library;
use api\auth\Auth;

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

    $dbCheck = $pdo->prepare("UPDATE library_dtc2017 SET bgg_id=:bgg_id WHERE id=:id");
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
