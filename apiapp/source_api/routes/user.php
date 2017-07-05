<?php
use api\auth\Auth;
use api\user\User;
use api\games\GamesDB;


$app->post('/user/setnotify', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $allow = $body['allow_notifications'];

  if(empty($allow)){
    $allow = false;
  }

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  User::setNotifications($this->db, $token->data->uid, $allow);

  return $resp->withJson(array('success'=>true));
});


$app->post('/user/me/wtp', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $bgg_id = $body['bgg_id'];

  if(empty($bgg_id)){
    $err = new \ApiError('406');
    return $resp->withStatus(406)->withJson($err->json());
  }

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  User::addWTP($this->db, $token->data->uid, $bgg_id);

  return $resp->withJson(array('success'=>true));
});


$app->post('/user/me/notify', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $bgg_id = $body['bgg_id'];

  if(empty($bgg_id)){
    $err = new \ApiError('406');
    return $resp->withStatus(406)->withJson($err->json());
  }

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  User::addNotify($this->db, $token->data->uid, $bgg_id);

  return $resp->withJson(array('success'=>true));
});


$app->post('/user/me/wtp/delete', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $bgg_id = $body['bgg_id'];

  if(empty($bgg_id)){
    $err = new \ApiError('406');
    return $resp->withStatus(406)->withJson($err->json());
  }

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  User::deleteWTP($this->db, $token->data->uid, $bgg_id);

  return $resp->withJson(array('success'=>true));
});


$app->post('/user/me/notify/delete', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $bgg_id = $body['bgg_id'];

  if(empty($bgg_id)){
    $err = new \ApiError('406');
    return $resp->withStatus(406)->withJson($err->json());
  }

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  User::deleteNotify($this->db, $token->data->uid, $bgg_id);

  return $resp->withJson(array('success'=>true));
});

?>
