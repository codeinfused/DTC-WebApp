<?php
use api\auth\Auth;
use api\games\GamesDB;
use api\tables\Tables;


$app->get('/table_data/[{table_id}]', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $table_id = $args['table_id'];

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if(empty($table_id)){
    return $resp->withStatus(401)->withJson(array('error'=>'No table found.'));
  }

  $table = Tables::get_all_table_data_by_id($this->db, $table_id);
  if( is_error($game) ){
    return $resp->withStatus((int)$table->get_code())->withJson($table->json());
  }

  return $resp->withJson($table);
});


$app->post('/lfp', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  $tables = Tables::list_lfp($this->db);
  if( is_error($tables) ){
    return $resp->withStatus((int)$tables->get_code())->withJson($tables->json());
  }

  return $resp->withJson($tables);
});


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


$app->post('/tables/list', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if(empty($body['bgg_id']) || empty($body['table_type'])){
    return $resp->withStatus(401)->withJson(array('message'=>'Missing search data.'));
  }

  $table = Tables::list_tables($this->db, $body['bgg_id'], $body['table_type'], $token->data->uid);
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
