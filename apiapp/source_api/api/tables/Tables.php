<?php
namespace api\tables;

abstract class Tables
{

  static function validate_date($date)
  {
    $d = \DateTime::createFromFormat('Y-m-d H:i:s', $date);
    return $d && $d->format('Y-m-d H:i:s') === $date;
  }

  static function edit_table($pdo, $uid, $data)
  {
    $exec_params = array(
      ':uid' => $uid,
      ':bid' => $data['bgg_id'],
      ':table_type' => $data['table_type'],
      ':seats' => $data['seats'],
      ':table_location' => $data['table_location'],
      ':start' => $data['start_datetime'],
      ':lft' => $data['lft'] ? 1 : 0,
      ':allow_signups' => $data['allow_signups'] ? 1 : 0
    );

    if($data['table_type']==='now'){
      $exec_params[':start'] = date('Y-m-d H:i:s');
      $exec_params[':allow_signups'] = 0;
    }else{
      if( self::validate_date($data['start_datetime']) === false ){
        return new \ApiError('422', 'Invalid schedule data.');
      }
    }

    if(!empty($data['table_id'])){
      $exec_params[':table_id'] = $data['table_id'];
      $dbCheck = $pdo->prepare(
        "UPDATE game_tables SET bgg_id=:bid, table_type=:table_type, seats=:seats, table_location=:table_location, start_datetime=:start, lft=:lft, allow_signups=:allow_signups WHERE id=:table_id AND player_id=:uid"
      );
    }else{
      $dbCheck = $pdo->prepare(
        "INSERT INTO game_tables SET player_id=:uid, bgg_id=:bid, table_type=:table_type, seats=:seats, table_location=:table_location, start_datetime=:start, lft=:lft, allow_signups=:allow_signups"
      );
    }
    $dbCheck->execute($exec_params);

    return array('success'=>true);
  }

}
