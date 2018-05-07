<?php
namespace api\games;

abstract class Games
{

  static function check_default($val, $def=null)
  {
    if(is_object($val)){
      return $def;
    }else if(!empty($val) || $val==='0' || $val===0){
      return $val;
    }else{
      return $def;
    }
  }

  static function check_object_default($obj, $prop, $def=null)
  {
    if(property_exists($obj, $prop)){
      return $obj->$prop;
    }else{
      return $def;
    }
  }

  static function bgg_clone__process_next($context, $iter=0)
  {
    set_time_limit(0);

    $iter++;
    //if($iter > 1000){  // || $iter===0){

      //$dbCheck = $context->db->query("SELECT max(bgg_id) FROM bgg_game_db WHERE update_queue=0");
      //$game_max_unset = $dbCheck->fetchColumn();
      /*
      $dbCheck = $context->db->query("UPDATE bgg_game_db SET title='EXPANSION' WHERE title IS NULL AND bgg_id < ".$game_max_unset);
      */
      // die('done, ended at ID: '.$game_max_unset);
    //}

    $dbCheck = $context->db->query("UPDATE bgg_game_db SET update_queue=0 WHERE update_queue=2");
    $dbCheck->closeCursor();

    $dbCheck = $context->db->query("SELECT bgg_id FROM bgg_game_db WHERE update_queue=1 LIMIT 50");
    $game_rows = $dbCheck->fetchAll();
    $dbCheck->closeCursor();

    $dbCheck = $context->db->query("UPDATE bgg_game_db SET update_queue=2 WHERE update_queue=1 LIMIT 50");
    $dbCheck->closeCursor();

    $game_ids = array();
    foreach($game_rows as $row){ $game_ids[] = $row['bgg_id']; }

    //print_r($game_ids);
    //echo "\n";

    $full_games = self::get_games_by_ids($context, $game_ids);

    //print_r($full_games);
    //echo "\n";

    if(!$full_games){
      error_log("Unknown error :: get_games_by_ids return");
      die();
    }

    foreach($full_games as $game)
    {
      try{
        $dbCheck = $context->db->prepare(
          "UPDATE bgg_game_db SET title=:title, description=:description, year=:year, thumb=:thumb, image=:image, minplayers=:minplayers, maxplayers=:maxplayers, minplaytime=:minplaytime, maxplaytime=:maxplaytime, rating=:rating, bggrate=:bggrate, tags=:tags, update_queue=:update_queue WHERE bgg_id=:bgg_id"
        );
        $dbCheck->execute(array(
          ':title'=> $game['title'],
          ':description'=>self::check_default($game['desc']),
          ':year'=>self::check_default($game['year']),
          ':thumb'=>self::check_default($game['thumb']),
          ':image'=>self::check_default($game['image']),
          ':minplayers'=>self::check_default($game['players'][0]),
          ':maxplayers'=>self::check_default($game['players'][1]),
          ':minplaytime'=>self::check_default($game['playtime'][0]),
          ':maxplaytime'=>self::check_default($game['playtime'][1]),
          ':rating'=>self::check_default($game['rating']),
          ':bggrate'=>self::check_default($game['bggrate']),
          ':tags'=> (is_array($game['tags']) ? implode(',', $game['tags']) : ''),
          ':bgg_id'=>$game['id'],
          ':update_queue'=>0
        ));
        $dbCheck->closeCursor();
      //}catch(PDOException $e){
      }catch(Exception $e){
        print_r($e);
      }
    }

    sleep(2);

    $full_games = null;
    $game_ids = null;
    $game_rows = null;

    self::bgg_clone__process_next($context, $iter);
  }

  static function bgg_clone__convert_sitemap_page($context, $sitemapurl)
  {
    //return;

    $context->curl->get(array(
      "url" => $sitemapurl,
      "showHeaders" => false,
      "autofollow" => true,
      "data" => array()
    ));

    $listxml = simplexml_load_string($context->curl->html);
    $listobj = json_decode(json_encode($listxml));

    foreach($listobj->url as $listgame){
      //$games_list[] = self::game_xml_to_json($listgame);
      $gameurl = $listgame->loc;
      preg_match("/\/([0-9]{1,})\//", $gameurl, $matched);
      // $matched[1];

      if(!empty($matched[1])){
        try{
          $dbCheck = $context->db->prepare("INSERT INTO bgg_game_db SET bgg_id = :bggid");
          $dbCheck->execute(array(':bggid'=>$matched[1]));
          $dbCheck->closeCursor();
        }catch(PDOException $e){

        }
      }
    }

    //$games_list = array();
    //if(!is_array($listobj->item)){ $listobj->item = array($listobj->item); }
  }

  static function sort_list_by($gamelist, $sortbykey)
  {
    usort($gamelist, function($a, $b) use ($sortbykey)
    {
      if($a[$sortbykey] === $b[$sortbykey]){ return 0; }
      return ($a[$sortbykey] > $b[$sortbykey]) ? -1 : +1;
    });
    return $gamelist;
  }

  static function game_xml_to_json($node)
  {
    $game = array();

    $game['id'] = $node->{'@attributes'}->id;
    $game['title'] = ( is_array($node->name) ? $node->name[0]->{'@attributes'}->value : $node->name->{'@attributes'}->value );
    $game['thumb'] = self::check_object_default($node, 'thumbnail');
    $game['image'] = self::check_object_default($node, 'image');
    $game['desc'] = self::check_object_default($node, 'description');
    $game['year'] = $node->yearpublished->{'@attributes'}->value;
    $game['players'] = [
      $node->minplayers->{'@attributes'}->value,
      $node->maxplayers->{'@attributes'}->value
    ];
    $game['playtime'] = [
      $node->minplaytime->{'@attributes'}->value,
      $node->maxplaytime->{'@attributes'}->value
    ];
    if(property_exists($node, 'statistics')){
      $game['rating'] = $node->statistics->ratings->average->{'@attributes'}->value;
      $game['bggrate'] = $node->statistics->ratings->bayesaverage->{'@attributes'}->value;
    }else{
      $game['rating'] = '';
      $game['bggrate'] = '';
    }
    $game['tags'] = array();
    foreach($node->link as $tag){
      $type = $tag->{'@attributes'}->type;
      if($type==='boardgamecategory' || $type==='boardgamemechanic'){
        $game['tags'][] = $tag->{'@attributes'}->value;
      }
    }

    return $game;
  }


  static function cache_get_data($type, $uid)
  {

  }


  static function cache_set_data($type, $uid, $data)
  {

  }


  static function get_games_by_ids($context, $games_list_ids=array())
  {
    $bggapi = $context->get('bgg_api');
    //print_r($games_list_ids);
    //$games_list_ids = array_slice($games_list_ids, 0, 50);
    $games_list_ids = implode(',', $games_list_ids);

    $context->curl->get(array(
      "url" => $bggapi['game'],
      "showHeaders" => false,
      "autofollow" => true,
      "data" => array(
        'type' => 'boardgame',
        'stats' => 1,
        'id' => $games_list_ids
      )
    ));

    try{

      $listxml = simplexml_load_string($context->curl->html);
      $listobj = json_decode(json_encode($listxml));
      $games_list = array();
      if(!is_array($listobj->item)){ $listobj->item = array($listobj->item); }

      foreach($listobj->item as $listgame){
        $games_list[] = self::game_xml_to_json($listgame);
      }
      //$games_list = self::sort_list_by($games_list, 'bggrate');

    }catch(Exception $e){
      print_r($e);
      error_log('CURL ERROR :: BGG multi game list');
      error_log($context->curl->html);
      die();
    }

    return $games_list;
  }


  static function search_games_by_term($context, $term, $exact=false, $full=false)
  {
    $bggapi = $context->get('bgg_api');

    $context->curl->get(array(
      "url" => $bggapi['search'],
      "showHeaders" => false,
      "autofollow" => true,
      "data" => array(
        'type' => 'boardgame',
        'query' => $term,
        'exact' => (int)$exact
      )
    ));

    $listxml = simplexml_load_string($context->curl->html);

    if(empty($listxml->item)){
      return array();
    }

    $listobjsearch = json_decode(json_encode($listxml));
    $games_list_ids = array();
    if(!is_array($listobjsearch->item)){ $listobjsearch->item = array($listobjsearch->item); }

    foreach($listobjsearch->item as $listgame){
      $game = self::game_xml_to_json($listgame);
      if($full===true){
        $games_list_ids[] = $game;
      }else{
        $games_list_ids[] = $game['id'];
      }
    }

    return $games_list_ids;
  }


  static function curl_get_user_collection($context, $username)
  {
    $bggapi = $context->get('bgg_api');

    $context->curl->get(array(
      "url" => $bggapi['collection'],
      "showHeaders" => false,
      "autofollow" => true,
      "data" => array(
        'subtype' => 'boardgame',
        'excludesubtype' => 'boardgameexpansion',
        'own' => 1,
        'brief' => 1,
        'username' => $username
      )
    ));

    $listxml = simplexml_load_string($context->curl->html);

    $listxml_parent = $listxml->getName();

    // if parent node is "message" (queued), or found collection is "games"
    if(empty($listxml->item))
    {
      if($listxml_parent === 'message'){
        $listobj = json_decode(json_encode(array('message'=>$listxml)));
      }else{
        $listobj = json_encode(array(
          'error'=>'No collection found for this user.'
        ));
      }
    }else{
      $listobj = json_decode(json_encode($listxml));
    }

    return $listobj;

    /*
    $games_list_ids = array();
    foreach($listobj->item as $listgame){ $games_list_ids[] = $listgame->{'@attributes'}->objectid; }
    $games_list_ids = implode(',', $games_list_ids);
    */
  }

} // end class
