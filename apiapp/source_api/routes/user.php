<?php
use api\auth\Auth;
use api\user\User;
use api\games\GamesDB;


$app->post('/user/myalertgames', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  $alerts = User::getMyAlertSettings($this->db, $token->data->uid);
  return $resp->withJson($alerts);
});

$app->post('/user/getallmyalerts', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  $alerts = User::getAllMyNotifications($this->db, $token->data->uid);
  return $resp->withJson($alerts);
});

$app->post('/user/getalerts', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req, true);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  $alerts = User::getNotifications($this->db, $token->data->uid);
  return $resp->withJson($alerts);
});

$app->post('/user/cancelalert', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $alert_id = $body['alert_id'];

  if(empty($alert_id)){
    $err = new \ApiError('406');
    return $resp->withStatus(406)->withJson($err->json());
  }

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  User::dismissNotification($this->db, $token->data->uid, $alert_id);

  return $resp->withJson(array('success'=>true));
});





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

// WTP
// ---
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

// NOTIFY
// ---
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


// DO NOT SHOW (DNS)
// ---
$app->post('/user/me/dns', function($req, $resp, $args) use ($app)
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

  User::addDNS($this->db, $token->data->uid, $bgg_id);

  return $resp->withJson(array('success'=>true));
});

$app->post('/user/me/dns/delete', function($req, $resp, $args) use ($app)
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

  User::deleteDNS($this->db, $token->data->uid, $bgg_id);

  return $resp->withJson(array('success'=>true));
});

// IGNORE A HOST (ignore)
// ---
$app->post('/user/me/ignore', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $bad_player_id = $body['bad_player_id'];

  if(empty($bad_player_id)){
    $err = new \ApiError('406');
    return $resp->withStatus(406)->withJson($err->json());
  }

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  User::addIgnore($this->db, $token->data->uid, $bad_player_id);

  return $resp->withJson(array('success'=>true));
});

$app->post('/user/me/ignore/delete', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $bad_player_id = $body['bad_player_id'];

  if(empty($bad_player_id)){
    $err = new \ApiError('406');
    return $resp->withStatus(406)->withJson($err->json());
  }

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  User::deleteIgnore($this->db, $token->data->uid, $bad_player_id);

  return $resp->withJson(array('success'=>true));
});

?>
