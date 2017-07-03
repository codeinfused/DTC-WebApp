<?php
namespace api\library;

abstract class Library
{

  static function next_library_bgg_single($context)
  {
    $bggapi = $context->get('bgg_api');
    $pdo = $context->db;

    $dbCheck = $pdo->prepare("SELECT id, title FROM library_dtc2017 WHERE bgg_id IS NULL ORDER BY id LIMIT 1");
    $dbCheck->execute();
    $games = $dbCheck->fetchAll();
    $dbCheck->closeCursor();

    $bgg_game = search_games_by_term($context, $games[0]['title'], false, true);
    return array(
      'id' => $games[0]['id'],
      'title' => $games[0]['title'],
      'bgg_ids' => $bgg_game
    );
  }

  static function update_library_bgg_ids($context)
  {
    $bggapi = $context->get('bgg_api');
    $pdo = $context->db;

    $dbCheck = $pdo->prepare("SELECT id, title FROM library_dtc2017 WHERE bgg_id IS NULL");
    $dbCheck->execute();
    $games = $dbCheck->fetchAll();
    $dbCheck->closeCursor();

    foreach($games as $game){
      $bgg_game = search_games_by_term($context, $game['title'], true);
      if(!empty($bgg_game)){
        $dbCheck = $pdo->prepare("UPDATE library_dtc2017 SET bgg_id=:bgg WHERE id=:id");
        $dbCheck->execute(array(
          ':bgg' => $bgg_game[0],
          ':id' => $game['id']
        ));
        $dbCheck->closeCursor();
      }
      usleep(200000);
    }

  }

}
