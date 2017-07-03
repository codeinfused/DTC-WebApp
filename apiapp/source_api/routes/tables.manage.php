<?php
use api\auth\Auth;
use api\games\GamesDB;
use api\tables\Tables;

// $app->get('/import_bgg_process_next', function($req, $resp, $args) use ($app)
// {
//   return;
//   Games::bgg_clone__process_next($this);
// });
//
// $app->get('/import_bgg_sitemap/[{pagenum}]', function($req, $resp, $args) use ($app)
// {
//   return;
//   Games::bgg_clone__convert_sitemap_page($this, "https://boardgamegeek.com/sitemap_geekitems_boardgame_page_".$args['pagenum']);
// });

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
