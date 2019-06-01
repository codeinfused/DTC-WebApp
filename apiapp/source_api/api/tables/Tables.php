<?php
namespace api\tables;

abstract class Tables
{

  static function validate_date($date)
  {
    $d = \DateTime::createFromFormat('Y-m-d H:i:s', $date);
    return $d && $d->format('Y-m-d H:i:s') === $date;
  }


  static function table_player_data($pdo, $table_id)
  {
    $req = $pdo->prepare(
      "SELECT tb.seats, tb.start_datetime, tb.lft, tb.only_experienced, tb.table_location, tb.table_sublocation_alpha, tb.table_sublocation_num, CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name
      FROM game_tables tb
      LEFT JOIN users u ON u.id = tb.player_id
      WHERE tb.id = :table_id LIMIT 1");
    $req->execute(array(':table_id'=>$table_id));
    $table = $req->fetch();
    $req->closeCursor();

    $req = $pdo->prepare(
      "SELECT player_id, CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as player_name
      FROM game_signups gs
      LEFT JOIN users u ON u.id = player_id
      WHERE table_id = :table_id ORDER BY gs.id");
    $req->execute(array(':table_id'=>$table_id));
    $users = $req->fetchAll();

    return array('table'=>$table, 'players'=>$users);
  }


  static function tables_byday($pdo, $uid, $date)
  {
    $dbCheck = $pdo->prepare(
      "SELECT db.title, tb.id as table_id, tb.player_id, CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name, tb.table_type, tb.bgg_id, tb.seats, tb.table_location,
      tb.table_sublocation_alpha, tb.table_sublocation_num, tb.start_datetime, tb.lft, tb.only_experienced, tb.playtime, ROUND((db.minplaytime+db.maxplaytime)/2) as avgplay,
      COUNT(gs.id) AS signups, tb.allow_signups, tb.status,
      (SELECT count(id) FROM game_signups WHERE table_id=tb.id AND player_id=:uid) as joined
      FROM game_tables tb
      LEFT JOIN game_signups gs ON gs.table_id = tb.id
      JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
      LEFT JOIN users u ON u.id = tb.player_id
      LEFT JOIN game_ignore gi ON gi.bgg_id = tb.bgg_id
      LEFT JOIN game_ignore gi2 ON gi2.bad_player_id = tb.player_id
      WHERE tb.table_type='future'
      AND tb.start_datetime LIKE :date
      AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE
      AND tb.status='ready'
      AND tb.private='0'
      AND gi.id IS NULL
      AND gi2.id IS NULL
      GROUP BY tb.id
      ORDER BY tb.start_datetime ASC"
    );
    $dbCheck->execute(array(':uid' => $uid, ':date'=>$date.'%'));
    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  }


  static function get_all_table_data_by_id($pdo, $table_id, $uid)
  {
    $dbCheck = $pdo->prepare(
      "SELECT db.title, db.minplayers, db.maxplayers, tb.bgg_id, tb.id as table_id, tb.player_id, tb.table_type, tb.seats, tb.table_location, db.minplaytime, db.maxplaytime,
      tb.table_sublocation_alpha, tb.table_sublocation_num, tb.start_datetime, tb.lft, tb.only_experienced, tb.private, tb.allow_signups, tb.status, tb.playtime, ROUND((db.minplaytime+db.maxplaytime)/2) as avgplay,
      (SELECT count(id) FROM game_signups gs WHERE gs.table_id=tb.id AND gs.player_id=:uid) as joined
      FROM game_tables tb
      JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
      WHERE tb.id=:table_id"
    );
    $dbCheck->execute(array(':table_id' => $table_id, ':uid' => $uid));
    $table = $dbCheck->fetch();

    if($table)
    {
      $reserveCheck = $pdo->prepare("SELECT COUNT(id) as ct FROM game_signups WHERE table_id=:table_id AND player_id < 7");
      $reserveCheck->execute(array(
        ':table_id' => $table_id
      ));
      $current_reserves = $reserveCheck->fetch();

      $table['game'] = array(
        'title'=>$table['title'],
        'players'=>[$table['minplayers'], $table['maxplayers']],
        'playtime'=>[$table['minplaytime'], $table['maxplaytime']]
      );
      $table['allow_signups'] = (boolean) $table['allow_signups'];
      $table['lft'] = (boolean) $table['lft'];
      $table['only_experienced'] = (boolean) $table['only_experienced'];
      $table['joined'] = (boolean) $table['joined'];
      $table['private'] = (boolean) $table['private'];
      $table['reserved'] = $current_reserves['ct'];
    }
    return array('table'=>$table);
  }

  static function my_tables($pdo, $uid)
  {
    $dbCheck = $pdo->prepare(
      "SELECT db.title, tb.id as table_id, tb.table_type, tb.bgg_id, tb.seats, tb.table_location,
      tb.table_sublocation_alpha, tb.table_sublocation_num, tb.start_datetime, tb.lft, tb.only_experienced, tb.private, tb.allow_signups, tb.status, COUNT(gs.id) AS signups, tb.playtime, ROUND((db.minplaytime+db.maxplaytime)/2) as avgplay,
      (SELECT count(id) FROM game_signups WHERE table_id=tb.id AND player_id=:uid) as joined
      FROM game_tables tb JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
      LEFT JOIN game_signups gs ON gs.table_id = tb.id
      WHERE tb.player_id=:uid AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE
      GROUP BY tb.id
      ORDER BY tb.start_datetime ASC"
    );
    $dbCheck->execute(array(':uid' => $uid));
    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  }

  static function my_plans($pdo, $uid)
  {
    $dbCheck = $pdo->prepare(
      "SELECT db.title, tb.title as event_title, tb.id as table_id, tb.player_id, tb.host, tb.table_type, tb.subtype, tb.bgg_id, tb.seats, tb.table_location, tb.description,
      tb.table_sublocation_alpha, tb.table_sublocation_num, tb.start_datetime, tb.lft, tb.only_experienced, tb.private, tb.allow_signups, tb.status, tb.playtime, ROUND((db.minplaytime+db.maxplaytime)/2) as avgplay,
      CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name,
      (SELECT count(id) FROM game_signups WHERE table_id=tb.id AND player_id=:uid) as joined,
      (SELECT count(*) FROM game_signups WHERE table_id=tb.id) as signups
      FROM game_tables tb
      LEFT JOIN game_signups gs ON gs.table_id = tb.id
      LEFT JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
      LEFT JOIN users u ON u.id = tb.player_id
      WHERE (tb.player_id=:uid OR gs.player_id=:uid)
      AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE
      GROUP BY tb.id
      ORDER BY tb.start_datetime ASC"
    );
    $dbCheck->execute(array(':uid' => $uid));
    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  }

  static function my_soonest_plans($pdo, $uid)
  {
    $dbCheck = $pdo->prepare(
      "SELECT db.title, tb.id as table_id, tb.player_id, tb.table_type, tb.seats, tb.table_location, tb.table_sublocation_alpha, tb.table_sublocation_num, tb.start_datetime, tb.lft, tb.only_experienced, tb.private, tb.allow_signups, tb.status,
      CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name,
      (SELECT count(id) FROM game_signups WHERE table_id=tb.id AND player_id=:uid) as joined,
      (SELECT count(*) FROM game_signups WHERE table_id=tb.id) as signups
      FROM game_tables tb
      LEFT JOIN game_signups gs ON gs.table_id = tb.id
      JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
      LEFT JOIN users u ON u.id = tb.player_id
      WHERE (tb.player_id=:uid OR gs.player_id=:uid)
      AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE
      GROUP BY tb.id
      ORDER BY tb.start_datetime ASC LIMIT 10"
    );
    $dbCheck->execute(array(':uid' => $uid));
    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  }

  static function list_tables($pdo, $bgg_id, $table_type, $uid)
  {
    if($table_type==='table'){  // show a specific table
      $dbCheck = $pdo->prepare(
        "SELECT db.title, tb.id as table_id, tb.player_id, CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name, tb.table_type, tb.bgg_id, tb.seats, tb.table_location, tb.table_sublocation_alpha, tb.table_sublocation_num, tb.start_datetime, tb.lft, tb.only_experienced,
        COUNT(gs.id) AS signups, tb.allow_signups, tb.status, tb.playtime, ROUND((db.minplaytime+db.maxplaytime)/2) as avgplay,
        (SELECT count(id) FROM game_signups WHERE table_id=tb.id AND player_id=:uid) as joined
        FROM game_tables tb
        LEFT JOIN game_signups gs ON gs.table_id = tb.id
        JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
        LEFT JOIN users u ON u.id = tb.player_id
        WHERE tb.id=:bgg_id
        AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE
        AND tb.status='ready'
        GROUP BY tb.id
        ORDER BY tb.start_datetime ASC"
      ); // AND tb.private='0' (removed for ability to link private)
      $dbCheck->execute(array(':bgg_id' => $bgg_id, ':uid'=>$uid));
    }else{
      $dbCheck = $pdo->prepare(
        "SELECT db.title, tb.id as table_id, tb.player_id, CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name, tb.table_type, tb.bgg_id, tb.seats, tb.table_location, tb.table_sublocation_alpha, tb.table_sublocation_num, tb.start_datetime, tb.lft, tb.only_experienced,
        COUNT(gs.id) AS signups, tb.allow_signups, tb.status, tb.playtime, ROUND((db.minplaytime+db.maxplaytime)/2) as avgplay,
        (SELECT count(id) FROM game_signups WHERE table_id=tb.id AND player_id=:uid) as joined
        FROM game_tables tb
        LEFT JOIN game_signups gs ON gs.table_id = tb.id
        JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
        LEFT JOIN users u ON u.id = tb.player_id
        WHERE tb.bgg_id=:bgg_id
        AND tb.table_type=:table_type
        AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE
        AND tb.status='ready'
        AND tb.private='0'
        GROUP BY tb.id
        ORDER BY tb.start_datetime ASC"
      );
      $dbCheck->execute(array(':bgg_id' => $bgg_id, ':table_type' => $table_type, ':uid'=>$uid));
    }

    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  }


  static function list_lfp($pdo)
  {
    $dbCheck = $pdo->prepare(
      "SELECT db.title, tb.id as table_id, tb.bgg_id, tb.player_id, CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name,
      tb.table_type, tb.seats, tb.table_location, tb.table_sublocation_alpha, tb.table_sublocation_num, tb.start_datetime, tb.lft, tb.only_experienced, tb.allow_signups, tb.status, tb.playtime,
      ROUND((db.minplaytime+db.maxplaytime)/2) as avgplay
      FROM game_tables tb
      JOIN bgg_game_db db ON tb.bgg_id = db.bgg_id
      LEFT JOIN users u ON u.id = tb.player_id
      LEFT JOIN game_ignore gi ON gi.bgg_id = tb.bgg_id
      LEFT JOIN game_ignore gi2 ON gi2.bad_player_id = tb.player_id
      WHERE tb.table_type=:table_type
      AND tb.start_datetime > NOW() - INTERVAL 20 MINUTE
      AND tb.status='ready'
      AND tb.private='0'
      AND gi.id IS NULL
      AND gi2.id IS NULL
      GROUP BY tb.id
      ORDER BY tb.start_datetime ASC"
    );
    $dbCheck->execute(array(':table_type' => 'now'));
    $tables = $dbCheck->fetchAll();
    return array('tables'=>$tables);
  }


  /* EDIT CONTROLS
    ---------------------------------------------------------- */

  static function edit_table($pdo, $uid, $data)
  {
    $data['joined'] = $data['joined'] ? 1 : 0;

    $exec_params = array(
      ':uid' => $uid,
      ':bid' => $data['bgg_id'],
      ':table_type' => $data['table_type'],
      ':seats' => $data['seats'],
      ':table_location' => $data['table_location'],
      ':start_datetime' => $data['start_datetime'],
      ':lft' => $data['lft'] ? 1 : 0,
      ':only_experienced' => $data['only_experienced'] ? 1 : 0,
      ':private' => $data['private'] ? 1 : 0,
      ':playtime' => $data['playtime'],
      //':joined' => $data['joined'] ? 1 : 0,
      ':allow_signups' => $data['allow_signups'] ? 1 : 0,
      ':subloc_alpha' => $data['table_sublocation_alpha'],
      ':subloc_num' => $data['table_sublocation_num']
    );

    if($data['table_type']==='now'){
      $exec_params[':start_datetime'] = date('Y-m-d H:i:s');
      $exec_params[':allow_signups'] = 0;
      $data['joined'] = 0;
    }else{
      if( self::validate_date($data['start_datetime']) === false ){
        return new \ApiError('422', 'Invalid schedule data.');
      }
    }

    $inserting = false;
    if(!empty($data['table_id']))
    {
      // editing an existing table
      // $old_table_req = $pdo->prepare("SELECT * FROM game_tables WHERE id=:tid");
      // $old_table_req->execute(array(':tid'=>$data['table_id']));
      // $old_table = $old_table_req->fetch();
      // $old_table_req->closeCursor();

      $exec_params[':table_id'] = $data['table_id'];
      $dbCheck = $pdo->prepare(
        "UPDATE game_tables SET bgg_id=:bid, table_type=:table_type, seats=:seats, table_location=:table_location, start_datetime=:start_datetime, lft=:lft, only_experienced=:only_experienced, private=:private, playtime=:playtime, allow_signups=:allow_signups, table_sublocation_alpha=:subloc_alpha, table_sublocation_num=:subloc_num WHERE id=:table_id AND player_id=:uid"
      );
    }else{
      // inserting a new table
      $inserting = true;
      $dbCheck = $pdo->prepare(
        "INSERT INTO game_tables SET player_id=:uid, bgg_id=:bid, table_type=:table_type, seats=:seats, table_location=:table_location, start_datetime=:start_datetime, lft=:lft, only_experienced=:only_experienced, private=:private, playtime=:playtime, allow_signups=:allow_signups, table_sublocation_alpha=:subloc_alpha, table_sublocation_num=:subloc_num"
      );
    }
    $dbCheck->execute($exec_params);
    $dbCheck->closeCursor();

    // Handle the host joining own table
    // ---------------
    if($inserting === true)
    {
      $new_table_id = $pdo->lastInsertId();

      // if host has signups and wants to join their own game
      if($data['joined']===1){
        self::join_table($pdo, $uid, array(
          'table_id' => $new_table_id
        ));
      }

      $table_id = $new_table_id;

    }else{
      /* EXISTING */
      $table_id = $data['table_id'];

      if($data['joined']===1){
        self::join_table($pdo, $uid, array(
          'table_id' => $table_id
        ));
      }
      if($data['joined']===0){
        self::leave_table($pdo, $uid, array(
          'table_id' => $table_id
        ));
      }

    } // end join self

    // if table has reservations set, modify those
    // ---------------
    if(!empty($data['reserved'])){
      $reserved_max = intval($data['reserved']);
      self::join_reserved_spots($pdo, $table_id, $reserved_max);
    }else{
      self::delete_reserved_spots($pdo, $table_id, 1, 7);
    }

    // send notifications for either new table or edited data
    // ---------------
    if($inserting === true)
    {
      $gamereq = $pdo->prepare("SELECT title FROM bgg_game_db WHERE bgg_id=:bgg_id LIMIT 1");
      $gamereq->execute(array(':bgg_id'=>$data['bgg_id']));
      $game_title = $gamereq->fetchColumn();
      $gamereq->closeCursor();

      $userreq = $pdo->prepare("SELECT player_id FROM game_wtp WHERE bgg_id=:bgg_id AND notify_flag=1 AND player_id!=:my_id");
      $userreq->execute(array(
        ':bgg_id'=>$data['bgg_id'],
        ':my_id'=>$uid
      ));
      $users = $userreq->fetchAll();
      $userreq->closeCursor();

      //$title = $data['table_type']==='now' ? 'Players Wanted Alert' : 'New Scheduled Game Alert';
      $dt_start = strtotime($data['start_datetime']);
      $timemsg = date('D g:i a', $dt_start);
      if($data['table_type']==='now'){ $timemsg = 'NOW'; }
      $title = "New Table: ".$game_title;
      $message = "Starts " . $timemsg . ", " . $data['table_location'] . ' ' .$data['table_sublocation_alpha'].$data['table_sublocation_num'];

      $prep_fields = '(`player_id`, `dismissed`, `title`, `message`, `reference_id`, `reference_type`, `game_title`, `game_start`, `notify_type`)';
      $prep_values = array(
        /* player_id is merged later */
        '0', // dismissed
        $title, // title
        $message, // message
        $table_id, // reference_id
        'table', // reference_type
        $game_title, // game_title,
        $data['start_datetime'], // game_start,
        'new_table' // notify_type
      );

      if(count($users) > 0 && $data['private']==false)
      {
        foreach($users as $user){
          // prepend playerid to prepared values
          $values[] = '"' . implode('", "', array_merge(array($user['player_id']), $prep_values)) . '"';
        }

        $val_sql = '(' . implode('), (', $values) . ')';
        $req = $pdo->prepare(
          "INSERT INTO notifications $prep_fields VALUES $val_sql"
        );
        //$req->execute(array(":vals"=>$val_sql));
        $req->execute();
        $req->closeCursor();
      }

    }else{
      // send notifcation of edit, if changed
      $gamereq = $pdo->prepare("SELECT title FROM bgg_game_db WHERE bgg_id=:bgg_id LIMIT 1");
      $gamereq->execute(array(':bgg_id'=>$data['bgg_id']));
      $game_title = $gamereq->fetchColumn();
      $gamereq->closeCursor();

      $userreq = $pdo->prepare("SELECT player_id FROM game_signups WHERE table_id = :table_id AND player_id != :my_id");
      $userreq->execute(array(
        ':table_id'=>$table_id,
        ':my_id'=>$uid
      ));
      $users = $userreq->fetchAll();
      $userreq->closeCursor();

      //$title = $data['table_type']==='now' ? 'Players Wanted Alert' : 'New Scheduled Game Alert';
      $dt_start = strtotime($data['start_datetime']);
      $timemsg = date('D g:i a', $dt_start);
      $title = "Table Changed: ".$game_title;
      $message = "Now at: " . $timemsg . ", " . $data['table_location'] . ' ' .$data['table_sublocation_alpha'].$data['table_sublocation_num'];

      $prep_fields = '(`player_id`, `dismissed`, `title`, `message`, `reference_id`, `reference_type`, `game_title`, `game_start`, `notify_type`)';
      $prep_values = array(
        /* player_id is merged later */
        '0', // dismissed
        $title, // title
        $message, // message
        $table_id, // reference_id
        'table', // reference_type
        $game_title, // game_title,
        $data['start_datetime'], // game_start,
        'edit_table' // notify_type
      );

      if(count($users) > 0)
      {
        foreach($users as $user){
          // prepend playerid to prepared values
          $values[] = '"' . implode('", "', array_merge(array($user['player_id']), $prep_values)) . '"';
        }

        $val_sql = '(' . implode('), (', $values) . ')';
        $req = $pdo->prepare(
          "INSERT INTO notifications $prep_fields VALUES $val_sql"
        );
        //$req->execute(array(":vals"=>$val_sql));
        $req->execute();
        $req->closeCursor();
      }
    }

    return array('success'=>true);
  }

  static function join_reserved_spots($pdo, $table_id, $howmany)
  {
    $howmany_id = $howmany + 1;
    $dbCheck = $pdo->prepare("SELECT COUNT(id) as ct FROM game_signups WHERE table_id=:table_id AND player_id < 7");
    $dbCheck->execute(array(
      ':table_id' => $table_id
    ));
    $current_reserves = $dbCheck->fetch();
    $dbCheck->closeCursor();

    if($current_reserves['ct'] < $howmany){
      for($i=$current_reserves['ct']+2; $i<$howmany+2; $i++){
        self::join_table($pdo, $i, array('table_id'=>$table_id));
      }
    }else if($current_reserves['ct'] > $howmany){
      self::delete_reserved_spots($pdo, $table_id, $howmany+1, 7);
    }
  }

  static function delete_reserved_spots($pdo, $table_id, $min, $max)
  {
    $dbCheck = $pdo->prepare("DELETE FROM game_signups WHERE table_id=:table_id AND player_id > :min AND player_id <= :max");
    $dbCheck->execute(array(
      ':table_id' => $table_id,
      ':min' => $min,
      ':max' => $max
    ));
    $dbCheck->closeCursor();
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
    $dbCheck->closeCursor();
    return array('success'=>true);
  }

  static function cancel_table($pdo, $uid, $data)
  {
    $old_table_req = $pdo->prepare("SELECT * FROM game_tables WHERE id=:tid");
    $old_table_req->execute(array(':tid'=>$data['table_id']));
    $old_table = $old_table_req->fetch();
    $old_table_req->closeCursor();

    $dbCheck = $pdo->prepare("UPDATE game_tables SET status='cancelled' WHERE id=:table_id AND player_id=:uid LIMIT 1");
    $dbCheck->execute(array(
      ':table_id' => $data['table_id'],
      ':uid' => $uid
    ));
    $dbCheck->closeCursor();

    $dbCheck = $pdo->prepare("SELECT COUNT(*) FROM game_signups WHERE table_id=:table_id");
    $dbCheck->execute(array(':table_id' => $data['table_id']));
    $signups = $dbCheck->fetchColumn();

    if($signups === false || $signups < 1){
      $dbCheck = $pdo->prepare("DELETE FROM game_tables WHERE id=:table_id AND player_id=:uid LIMIT 1");
      $dbCheck->execute(array(
        ':table_id' => $data['table_id'],
        ':uid' => $uid
      ));
      $dbCheck->closeCursor();
    }

    //if($signups > 0)
    //{
      $gamereq = $pdo->prepare("SELECT title FROM bgg_game_db WHERE bgg_id=:bgg_id LIMIT 1");
      $gamereq->execute(array(':bgg_id'=>$old_table['bgg_id']));
      $game_title = $gamereq->fetchColumn();
      $gamereq->closeCursor();

      $userreq = $pdo->prepare("SELECT player_id FROM game_signups WHERE table_id = :table_id AND player_id != :my_id");
      $userreq->execute(array(
        ':table_id'=>$data['table_id'],
        ':my_id'=>$uid
      ));
      $users = $userreq->fetchAll();
      $userreq->closeCursor();

      //$title = $data['table_type']==='now' ? 'Players Wanted Alert' : 'New Scheduled Game Alert';
      $dt_start = strtotime($old_table['start_datetime']);
      $timemsg = date('D g:i a', $dt_start);
      $title = "Table Cancelled: ".$game_title;
      $message = $game_title . " on " . $timemsg . " was cancelled.";

      $prep_fields = '(`player_id`, `dismissed`, `title`, `message`, `reference_id`, `reference_type`, `game_title`, `game_start`, `notify_type`)';
      $prep_values = array(
        /* player_id is merged later */
        '0', // dismissed
        $title, // title
        $message, // message
        $data['table_id'], // reference_id
        'table', // reference_type
        $game_title, // game_title,
        $old_table['start_datetime'], // game_start,
        'cancel_table' // notify_type
      );

      if(count($users) > 0)
      {
        foreach($users as $user){
          // prepend playerid to prepared values
          $values[] = '"' . implode('", "', array_merge(array($user['player_id']), $prep_values)) . '"';
        }

        $val_sql = '(' . implode('), (', $values) . ')';
        $req = $pdo->prepare(
          "INSERT INTO notifications $prep_fields VALUES $val_sql"
        );
        //$req->execute(array(":vals"=>$val_sql));
        $req->execute();
        $req->closeCursor();
      }
    //}

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
        "INSERT INTO game_signups SET table_id=:table_id, player_id=:uid"
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
      "DELETE FROM game_signups WHERE table_id=:table_id AND player_id=:uid LIMIT 1"
    );
    $dbCheck->execute(array(
      ':table_id' => $data['table_id'],
      ':uid' => $uid
    ));
    return array('success'=>true);
  }


}
