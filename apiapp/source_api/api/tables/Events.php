<?php
namespace api\tables;

abstract class Events
{
  static function events_byday($pdo, $uid, $date)
  {
    $dbCheck = $pdo->prepare(
      "SELECT tb.id as table_id, tb.host as host_name, tb.player_id, tb.table_type, tb.subtype, tb.bgg_id, tb.seats, tb.table_location,
      tb.start_datetime, tb.playtime, tb.status, tb.allow_signups, tb.title, tb.description,
      (SELECT count(id) FROM game_signups WHERE table_id=tb.id AND player_id=:uid) as joined
      FROM game_tables tb
      WHERE tb.table_type='dtc_event'
      AND tb.start_datetime LIKE :date
      AND tb.start_datetime > NOW() - INTERVAL 30 MINUTE
      AND tb.status='ready'
      AND tb.private='0'
      GROUP BY tb.id
      ORDER BY tb.start_datetime ASC"
    );

    $dbCheck->execute(array(':uid' => $uid, ':date'=>$date.'%'));
    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  } // end events_byday
}
