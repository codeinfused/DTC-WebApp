<?php
use api\auth\Auth;
use api\games\Games;
use api\games\GamesDB;


$app->get('/import_bgg_process_next', function($req, $resp, $args) use ($app)
{
  //return;
  Games::bgg_clone__process_next($this);
});

$app->get('/import_bgg_sitemap/[{pagenum}]', function($req, $resp, $args) use ($app)
{
  //return;
  Games::bgg_clone__convert_sitemap_page($this, "https://boardgamegeek.com/sitemap_geekitems_boardgame_page_".$args['pagenum']);
});

$app->get('/games/[{bgg_id}]', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $bgg_id = $args['bgg_id'];

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }
  if(empty($bgg_id)){
    return $resp->withStatus(401)->withJson(array('error'=>'No game listed.'));
  }

  $game = GamesDB::get_game_by_id($this->db, $bgg_id);
  if( is_error($game) ){
    return $resp->withStatus((int)$game->get_code())->withJson($game->json());
  }

  return $resp->withJson($game);
});


$app->post('/games/search/', function($req, $resp, $args) use ($app)
{
  $body = $req->getParsedBody();
  $term = $body['term'];
  $table = $body['db'];
  //$page = $body['page'] ? intval($body['page']) : 0;

  $token = Auth::checkAuthorization($this->db, $req);
  if( is_error($token) ){
    return $resp->withStatus((int)$token->get_code())->withJson($token->json());
  }

  if(empty($table)){ $table = 'bgg'; }

  if($table==='library'){
    $games_list = GamesDB::search_library_games($this, $body);
  }else if($table==='bgg'){
    $games_list = GamesDB::search_games_by_term($this, $body);
  }

  if(empty($games_list['games'])){ return $resp->withStatus(401)->withJson(array('message'=>'No games found for search '.$term.'.')); }
  return $resp->withJson($games_list);
});


$app->get('/collections/[{username}]', function($req, $resp, $args) use($app)
{
  $bggapi = $this->get('bgg_api');
  $collection_repeats = 0;
  while($collection_repeats < 4)
  {
    $collection_repeats++;
    $listobj = Games::curl_get_user_collection($this, $args['username']);

    // if error or empty list returned
    if(is_string($listobj)){
      return $listobj;
    }

    if( isset($listobj->message) && strpos($listobj->message->{0}, 'try again later')!==false ){
      sleep(1);
    }else{
      $collection_repeats = 100;
    }
  }

  // get actual game data from collection's IDs
  // -------
  $games_list_ids = array();
  if(!is_array($listobj->item)){ $listobj->item = array($listobj->item); }

  foreach($listobj->item as $listgame){ $games_list_ids[] = $listgame->{'@attributes'}->objectid; }
  $games_list = Games::get_games_by_ids($this, $games_list_ids);

  //return json_encode(array('games'=>$games_list), JSON_UNESCAPED_SLASHES);
  return $resp->withJson(array('games'=>$games_list));
});

?>
