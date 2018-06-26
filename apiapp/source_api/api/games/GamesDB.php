<?php
namespace api\games;

abstract class GamesDB
{

  protected static $search_defaults = array(
    'page' => 0,
    'limit' => 10,
    'term' => 'firefly',
    'tag' => '',
    'sort' => 'bggrate'
  );

  static function parse_game_result($game_results)
  {
    $game_list = array();
    foreach($game_results as $game){
      $game_list[] = array(
        'bgg_id' => $game['bgg_id'],
        'title' => $game['title'],
        'desc' => $game['description'],
        'year' => $game['year'],
        'image' => $game['image'],
        'players' => array($game['minplayers'], $game['maxplayers']),
        'playtime' => array($game['minplaytime'], $game['maxplaytime']),
        'rating' => $game['rating'],
        'bggrate' => $game['bggrate'],
        'tags' => explode(',', $game['tags']),
        'wtp' => $game['wtp'],
        'lfp' => $game['lfp'],
        'scheduled' => $game['scheduled']
      );
    }
    return $game_list;
  }

  static function parse_sort_by($sortby)
  {
    $sortby_sql = "";
    switch($sortby){
      case 'bggrate': $sortby_sql = 'ORDER BY bggrate DESC'; break;
      case 'wtp': $sortby_sql = 'HAVING wtp > 0 ORDER BY wtp DESC, bggrate DESC'; break;
      case 'lfp': $sortby_sql = 'HAVING lfp > 0 ORDER BY lfp DESC, bggrate DESC'; break;
      case 'scheduled': $sortby_sql = 'HAVING scheduled > 0 ORDER BY bggrate DESC'; break;
      case 'year': $sortby_sql = 'AND bggrate > 5 AND year < '.(date("Y")+1).' ORDER BY year DESC, bggrate DESC'; break;
      case 'maxplayers': $sortby_sql =  'AND bggrate > 5 AND maxplayers > 6 ORDER BY bggrate DESC, maxplayers DESC'; break;
      default: $sortby_sql = 'ORDER BY bggrate DESC'; break;
    }
    return $sortby_sql;
  }


  static function get_game_by_id($pdo, $bgg_id)
  {
    $exec_params = array(":bid" => $bgg_id);
    $dbCheck = $pdo->prepare(
      "SELECT *,
        (SELECT count(id) FROM game_wtp gw WHERE gw.bgg_id=db.bgg_id) as wtp,
        (SELECT count(id) FROM game_tables gt WHERE gt.bgg_id=db.bgg_id AND table_type='now' AND status='ready' AND start_datetime > NOW() - INTERVAL 20 MINUTE) as lfp,
        (SELECT count(id) FROM game_tables gt2 WHERE gt2.bgg_id=db.bgg_id AND table_type='future' AND status='ready' AND start_datetime > NOW()) as scheduled
        FROM bgg_game_db db
        WHERE bgg_id = :bid LIMIT 1"
    );
    $dbCheck->execute($exec_params);
    $games_list = $dbCheck->fetchAll();
    $games_list = self::parse_game_result($games_list);

    return array('game'=>$games_list[0]);
  }


  static function get_top_wtp($context)
  {
    $exec_params = array();

    $dbCheck = $context->db->prepare(
      "SELECT COUNT(w.id) AS wtp, w.bgg_id, db.*
        FROM game_wtp w
        LEFT JOIN bgg_game_db db ON db.bgg_id = w.bgg_id
        GROUP BY w.bgg_id
        ORDER BY wtp DESC LIMIT 10"
    );
    $dbCheck->execute($exec_params);
    $games_list = $dbCheck->fetchAll();
    $games_list = self::parse_game_result($games_list);

    return array('games'=>$games_list);
  }


  static function get_top_played($context)
  {
    $exec_params = array();

    $dbCheck = $context->db->prepare(
      "SELECT COUNT(gt.id) AS games, gt.bgg_id, db.*
        FROM game_tables gt
        LEFT JOIN bgg_game_db db ON db.bgg_id = gt.bgg_id
        GROUP BY gt.bgg_id
        ORDER BY games DESC LIMIT 10"
    );
    $dbCheck->execute($exec_params);
    $games_list = $dbCheck->fetchAll();
    $games_list = self::parse_game_result($games_list);

    return array('games'=>$games_list);
  }


  static function search_games_by_term($context, $options)
  {
    $opts = array_merge(self::$search_defaults, $options);
    $exec_params = array();
    $tag_sql = "";

    if(!empty($opts['tag'])){
      $tag_sql = " AND tags LIKE :tag";
      $exec_params[':tag'] = '%'.$opts['tag'].'%';
    }
    $exec_params[':term'] = '%'.$opts['term'].'%';

    $sortby_sql = self::parse_sort_by($opts['sort']);

    $dbCheck = $context->db->prepare(
      "SELECT
        SQL_CALC_FOUND_ROWS *,
        (SELECT count(id) FROM game_wtp gw WHERE gw.bgg_id=db.bgg_id) as wtp,
        (SELECT count(id) FROM game_tables gt WHERE gt.bgg_id=db.bgg_id AND table_type='now' AND status='ready' AND start_datetime > NOW() - INTERVAL 20 MINUTE) as lfp,
        (SELECT count(id) FROM game_tables gt2 WHERE gt2.bgg_id=db.bgg_id AND table_type='future' AND status='ready' AND start_datetime > NOW()) as scheduled
        FROM bgg_game_db db
        WHERE title LIKE :term AND title != 'EXPANSION' AND title IS NOT NULL $tag_sql $sortby_sql
        LIMIT ".($opts['page']*$opts['limit']).",{$opts['limit']}"
    );
    $dbCheck->execute($exec_params);
    $games_list = $dbCheck->fetchAll();
    $games_list = self::parse_game_result($games_list);

    $dbCount = $context->db->query("SELECT FOUND_ROWS()", \PDO::FETCH_COLUMN, 0)->fetch();

    return array('games'=>$games_list, 'count'=>$dbCount);
  }


  static function search_library_games($context, $options)
  {
    $opts = array_merge(self::$search_defaults, $options);
    $exec_params = array();
    $tag_sql = "";
    $term_sql = "";

    if(!empty($opts['term'])){
      $term_sql = " AND db.title LIKE :term";
      $exec_params[':term'] = '%'.$opts['term'].'%';
    }
    if(!empty($opts['tag'])){
      $tag_sql = " AND db.tags LIKE :tag";
      $exec_params[':tag'] = '%'.$opts['tag'].'%';
    }

    $sortby_sql = self::parse_sort_by($opts['sort']);

    $dbCheck = $context->db->prepare(
      //"SELECT * FROM bgg_game_db WHERE title LIKE '%:term%' AND title != 'EXPANSION' $tag_sql ORDER BY bggrate DESC"
      "SELECT
        SQL_CALC_FOUND_ROWS db.*,
        (SELECT count(id) FROM game_wtp gw WHERE gw.bgg_id=db.bgg_id) as wtp,
        (SELECT count(id) FROM game_tables gt WHERE gt.bgg_id=db.bgg_id AND table_type='now' AND status='ready' AND start_datetime > NOW() - INTERVAL 45 MINUTE) as lfp,
        (SELECT count(id) FROM game_tables gt2 WHERE gt2.bgg_id=db.bgg_id AND table_type='future' AND status='ready' AND start_datetime > NOW()) as scheduled
        FROM bgg_game_db db
        INNER JOIN library_dtc2018 lib ON lib.bgg_id = db.bgg_id
        WHERE db.title != 'EXPANSION' AND db.title IS NOT NULL AND db.title IS NOT NULL $tag_sql $term_sql $sortby_sql
        LIMIT ".($opts['page']*$opts['limit']).",{$opts['limit']}"
    );

    $dbCheck->execute($exec_params);
    $games_list = $dbCheck->fetchAll();
    $games_list = self::parse_game_result($games_list);

    $dbCount = $context->db->query("SELECT FOUND_ROWS()", \PDO::FETCH_COLUMN, 0)->fetch();

    return array('games'=>$games_list, 'count'=>$dbCount);
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
