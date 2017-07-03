<?php
use api\auth\Auth;
use api\user\User;

$app->post('/authenticate', function($request, $response, $args)
{
  $body = $request->getParsedBody();
  $grant_types = array('facebook', 'google', 'guest');

  if( empty($body['grant_type']) || !in_array($body['grant_type'], $grant_types) ){
    $err = new \ApiError('406');
    return $response->withStatus(406)->withJson($err->json());
  }

  $authReq = Auth::authenticate($this->db, $request, $body);
  if(is_error($authReq)){
    return $response->withStatus((int)$authReq->get_code())->withJson($authReq->json());
  }

  //$authReq->data->user = $authUser = User::getUserInfo($this->db, $authReq->data->uid);
  return $response->withJson($authReq);
});


$app->post('/verifyauth', function($request, $response, $args)
{
  $body = $request->getParsedBody();

  if( empty($body['auth']) ){
    $err = new \ApiError('406');
    return $response->withStatus(406)->withJson($err->json());
  }

  $authReq = Auth::checkToken($this->db, $body['auth']);
  if(is_error($authReq)){
    return $response->withStatus((int)$authReq->get_code())->withJson($authReq->json());
  }

  $authUser = User::getUserInfo($this->db, $authReq->data->uid);
  if(is_error($authUser)){
    return $response->withStatus((int)$authUser->get_code())->withJson($authUser->json());
  }

  return $response->withJson($authUser);
});


$app->post('/refresh', function($request, $response, $args)
{
  $body = $request->getParsedBody();
  if( empty($body['grant_type']) || $body['grant_type']!=='refresh' || empty($body['refresh_token']) || empty($body['device_id']) ){
    $err = new \ApiError('406');
    return $response->withStatus(406)->withJson($err->json());
  }
  $device = $body['device_type']=='desktop' ? 'desktop' : 'mobile';
  $authReq = Auth::checkRefresh($this->db, $device, $request, $body);
  if(is_error($authReq)){
    return $response->withStatus((int)$authReq->get_code())->withJson($authReq->json());
  }

  return $response->withJson($authReq);
});
