<?php
use api\auth\Auth;
use api\games\GamesDB;
use api\tables\Tables;


$app->post('/me/plans', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  $table = Tables::my_plans($this->db, $token->data->uid);
  if( is_error($table) ){
    return $resp->withStatus((int)$table->get_code())->withJson($table->json());
  }

  return $resp->withJson($table);
});


$app->post('/tables/mine', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  $table = Tables::my_tables($this->db, $token->data->uid);
  if( is_error($table) ){
    return $resp->withStatus((int)$table->get_code())->withJson($table->json());
  }

  return $resp->withJson($table);
});


$app->post('/tables/edit', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if(empty($body['bgg_id'])){
    return $resp->withStatus(401)->withJson(array('message'=>'No table listed.'));
  }

  $table = Tables::edit_table($this->db, $token->data->uid, $body);
  if( is_error($table) ){
    return $resp->withStatus((int)$table->get_code())->withJson($table->json());
  }

  return $resp->withJson($table);
});


$app->post('/tables/cancel', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if(empty($body['table_id'])){
    return $resp->withStatus(401)->withJson(array('message'=>'No table listed.'));
  }

  $table = Tables::cancel_table($this->db, $token->data->uid, $body);
  if( is_error($table) ){
    return $resp->withStatus((int)$table->get_code())->withJson($table->json());
  }

  return $resp->withJson($table);
});


$app->post('/tables/leave', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if(empty($body['table_id'])){
    return $resp->withStatus(401)->withJson(array('message'=>'No table listed.'));
  }

  $table = Tables::leave_table($this->db, $token->data->uid, $body);
  if( is_error($table) ){
    return $resp->withStatus((int)$table->get_code())->withJson($table->json());
  }

  return $resp->withJson($table);
});


$app->post('/tables/join', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if(empty($body['table_id'])){
    return $resp->withStatus(401)->withJson(array('message'=>'No table listed.'));
  }

  $table = Tables::join_table($this->db, $token->data->uid, $body);
  if( is_error($table) ){
    return $resp->withStatus((int)$table->get_code())->withJson($table->json());
  }

  return $resp->withJson($table);
});


$app->post('/tables/refresh', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if(empty($body['table_id'])){
    return $resp->withStatus(401)->withJson(array('message'=>'No table listed.'));
  }

  $table = Tables::refresh_table($this->db, $token->data->uid, $body);
  if( is_error($table) ){
    return $resp->withStatus((int)$table->get_code())->withJson($table->json());
  }

  return $resp->withJson($table);
});
