<?php
namespace api\tables;

abstract class Alerts
{

  static function create_game_alert($pdo, $my_uid, $bgg_id, $table_id)
  {
    // get table data
    $sql = $pdo->prepare(
      "SELECT gt.*, db.title as game_title FROM game_tables gt
      LEFT JOIN bgg_game_db db ON db.bgg_id = :bgg_id
      WHERE gt.id = :table_id"
    );
    $sql->execute(array(':table_id'=>$table_id));
    $table = $sql->fetch();
    $sql->closeCursor();

    // get players looking for games
    $sql = $pdo->prepare(
      "SELECT player_id FROM game_wtp
      WHERE notify_flag = 1 AND bgg_id = :bgg_id AND player_id != :my_uid"
    );
    $sql->execute(array(':my_uid'=>$my_uid, ':bgg_id'=>$bgg_id));
    $players = $sql->fetchAll();

    // set up notification data
    if($table['table_type']==='now'){
      $message = "looking for players now!";
    }
    if($table['table_type']==='future'){
      $message = "in [[time]]. Join?";
    }
    $insert_data = array(
      ':uid' => $player_id,
      ':ref_id' => $table_id,
      ':ref_type' => 'table',
      ':game_title' => $table['game_title'],
      ':game_start' => $table['start_datetime'],
      ':notify_type' => $table['table_type'],
      ':message' => $message
    );
  }

  static function create_table_alert($pdo, $my_uid, $bgg_id, $table_id, $change_text)
  {

  }

} // end Alerts class
