<?php
use api\auth\Auth;
use api\games\GamesDB;
use api\tables\Tables;
use api\tables\Events;

$app->post('/events/byday', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if( empty($body['date']) ){
    return $resp->withStatus(401)->withJson(array('message'=>'Missing date.'));
  }

  $tables = Events::events_byday($this->db, $token->data->uid, $body['date']);
  if( is_error($tables) ){
    return $resp->withStatus((int)$tables->get_code())->withJson($tables->json());
  }

  return $resp->withJson($tables);
});
?>
