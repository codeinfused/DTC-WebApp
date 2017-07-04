<?php
namespace api\tables;

abstract class Tables
{

  static function validate_date($date)
  {
    $d = \DateTime::createFromFormat('Y-m-d H:i:s', $date);
    return $d && $d->format('Y-m-d H:i:s') === $date;
  }

  static function my_tables($pdo, $uid)
  {
    $dbCheck = $pdo->prepare(
      "SELECT db.title, tb.id as table_id, tb.table_type, tb.seats, tb.table_location, tb.start_datetime, tb.lft, tb.allow_signups, tb.status FROM game_tables tb JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id WHERE tb.player_id=:uid AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE ORDER BY tb.start_datetime ASC"
    );
    $dbCheck->execute(array(':uid' => $uid));
    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  }

  static function my_plans($pdo, $uid)
  {
    $dbCheck = $pdo->prepare(
      "SELECT db.title, tb.id as table_id, tb.player_id, CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name, tb.table_type, tb.seats, tb.table_location, tb.start_datetime, tb.lft, tb.allow_signups, tb.status
      FROM game_tables tb
      LEFT JOIN game_signups gs ON gs.table_id = tb.id
      JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
      LEFT JOIN users u ON u.id = tb.player_id
      WHERE (tb.player_id=:uid OR gs.player_id=:uid)
      AND tb.table_type='future'
      AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE
      ORDER BY tb.start_datetime ASC"
    );
    $dbCheck->execute(array(':uid' => $uid));
    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  }



  /* EDIT CONTROLS
    ---------------------------------------------------------- */

  static function edit_table($pdo, $uid, $data)
  {
    $exec_params = array(
      ':uid' => $uid,
      ':bid' => $data['bgg_id'],
      ':table_type' => $data['table_type'],
      ':seats' => $data['seats'],
      ':table_location' => $data['table_location'],
      ':start_datetime' => $data['start_datetime'],
      ':lft' => $data['lft'] ? 1 : 0,
      ':allow_signups' => $data['allow_signups'] ? 1 : 0
    );

    if($data['table_type']==='now'){
      $exec_params[':start_datetime'] = date('Y-m-d H:i:s');
      $exec_params[':allow_signups'] = 0;
    }else{
      if( self::validate_date($data['start_datetime']) === false ){
        return new \ApiError('422', 'Invalid schedule data.');
      }
    }

    if(!empty($data['table_id'])){
      $exec_params[':table_id'] = $data['table_id'];
      $dbCheck = $pdo->prepare(
        "UPDATE game_tables SET bgg_id=:bid, table_type=:table_type, seats=:seats, table_location=:table_location, start_datetime=:start_datetime, lft=:lft, allow_signups=:allow_signups WHERE id=:table_id AND player_id=:uid"
      );
    }else{
      $dbCheck = $pdo->prepare(
        "INSERT INTO game_tables SET player_id=:uid, bgg_id=:bid, table_type=:table_type, seats=:seats, table_location=:table_location, start_datetime=:start_datetime, lft=:lft, allow_signups=:allow_signups"
      );
    }
    $dbCheck->execute($exec_params);

    return array('success'=>true);
  }

  static function refresh_table($pdo, $uid, $data)
  {
    $exec_params = array(
      ':table_id' => $data['table_id'],
      ':uid' => $uid,
      ':start_datetime' => date('Y-m-d H:i:s')
    );
    $dbCheck = $pdo->prepare(
      "UPDATE game_tables SET start_datetime=:start_datetime WHERE id=:table_id AND player_id=:uid AND table_type='now' LIMIT 1"
    );
    $dbCheck->execute($exec_params);
    return array('success'=>true);
  }

  static function cancel_table($pdo, $uid, $data)
  {
    $dbCheck = $pdo->prepare(
      "UPDATE game_tables SET status='cancelled' WHERE id=:table_id AND player_id=:uid LIMIT 1"
    );
    $dbCheck->execute(array(
      ':table_id' => $data['table_id'],
      ':uid' => $uid
    ));
    return array('success'=>true);
  }

  static function join_table($pdo, $uid, $data)
  {
    $dbCheck = $pdo->prepare("SELECT id FROM game_tables WHERE id=:table_id AND allow_signups=1 LIMIT 1");
    $dbCheck->execute(array(':table_id'=>$data['table_id']));
    $table_id = $dbCheck->fetchColumn();
    $dbCheck->closeCursor();

    if($table_id !== false){
      $dbCheck = $pdo->prepare(
        "INSERT INTO game_signups SET table_id=:table_id AND player_id=:uid"
      );
      $dbCheck->execute(array(
        ':table_id' => $data['table_id'],
        ':uid' => $uid
      ));
    }
    return array('success'=>true);
  }

  static function leave_table($pdo, $uid, $data)
  {
    $dbCheck = $pdo->prepare(
      "DELETE FROM game_signups WHERE table_id=:table_id AND player_id=:uid"
    );
    $dbCheck->execute(array(
      ':table_id' => $data['table_id'],
      ':uid' => $uid
    ));
    return array('success'=>true);
  }


}
