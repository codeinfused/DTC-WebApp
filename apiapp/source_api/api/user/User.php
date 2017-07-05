<?php
namespace api\user;

abstract class User
{

  static function getNotifications($pdo, $uid)
  {
    $req = $pdo->prepare("SELECT nt.id, nt.title, db.title as game_title, nt.message, nt.reference_id, nt.created_date, gt.start_datetime, gt.table_type, nt.link, CONCAT(u.firstname, ' ', SUBSTRING(u.lastname, 1, 1)) as host_name
      FROM notifications nt
      LEFT JOIN game_tables gt ON gt.id = nt.reference_id
      LEFT JOIN bgg_game_db db ON db.bgg_id = gt.bgg_id
      LEFT JOIN users u ON u.id = gt.player_id
      WHERE user_id=:uid AND dismissed=0 AND created_date > NOW() - INTERVAL 24 HOUR LIMIT 99");
    $req->execute(array(":uid"=>$uid));
    $wtps = $req->fetchAll();
    $req->closeCursor();

    return array('alerts' => $wtps);
  }

  static function dismissNotification($pdo, $uid, $alert_id)
  {
    if($alert_id==='all'){
      $req = $pdo->prepare("DELETE FROM notifications WHERE user_id=:uid");
      $req->execute(array(':uid'=>$uid, ':alert_id'=>$alert_id));
    }else{
      $req = $pdo->prepare("DELETE FROM notifications WHERE user_id=:uid AND id=:alert_id");
      $req->execute(array(':uid'=>$uid, ':alert_id'=>$alert_id));
    }
    $req->closeCursor();
    return true;
  }


  static function setNotifications($pdo, $uid, $state)
  {
    $allow = $state==true ? 1 : 0;
    $req = $pdo->prepare("UPDATE users SET allow_notifications=:allow WHERE id=:uid");
    $req->execute(array(':uid'=>$uid, ':allow'=>$allow));
    $req->closeCursor();
    return true;
  }

  static function getUserInfo($pdo, $uid)
  {
    $req = $pdo->prepare("SELECT id, firstname, lastname, email, role, grant_type, fb_token, google_token, thumb, allow_notifications FROM users WHERE id = :uid");
    $req->execute(array(":uid"=>$uid));
    $user = $req->fetch();
    $req->closeCursor();

    $req = $pdo->prepare("SELECT bgg_id, notify_flag FROM game_wtp WHERE player_id = :uid");
    $req->execute(array(":uid"=>$uid));
    $wtps = $req->fetchAll();
    $req->closeCursor();

    $user['wtp'] = array();
    $user['notify'] = array();
    foreach($wtps as $wtp){
      $user['wtp'][] = $wtp['bgg_id'];
      if($wtp['notify_flag'] == 1){ $user['notify'][] = $wtp['bgg_id']; }
    }

    if($user === false){
      return new \ApiError('406', 'User not found.');
    }
    return $user;
  }


  static function addWTP($pdo, $uid, $bgg_id)
  {
    $req = $pdo->prepare("INSERT INTO game_wtp (player_id, bgg_id) SELECT * FROM (SELECT :uid as uid, :bid as bid) as tmp WHERE NOT EXISTS( SELECT id FROM game_wtp WHERE player_id=:uid AND bgg_id=:bid ) LIMIT 1");
    $req->execute(array(":uid"=>$uid, ":bid"=>$bgg_id));
    $req->closeCursor();
    return true;
  }

  static function deleteWTP($pdo, $uid, $bgg_id)
  {
    $req = $pdo->prepare("DELETE FROM game_wtp WHERE player_id=:uid AND bgg_id=:bid");
    $req->execute(array(":uid"=>$uid, ":bid"=>$bgg_id));
    $req->closeCursor();
    return true;
  }

  static function addNotify($pdo, $uid, $bgg_id)
  {
    $req = $pdo->prepare("INSERT INTO game_wtp SET player_id=:uid, bgg_id=:bid, notify_flag=1 ON DUPLICATE KEY UPDATE notify_flag=1");
    $req->execute(array(":uid"=>$uid, ":bid"=>$bgg_id));
    $req->closeCursor();
    return true;
  }

  static function deleteNotify($pdo, $uid, $bgg_id)
  {
    $req = $pdo->prepare("UPDATE game_wtp SET notify_flag=0 WHERE player_id=:uid AND bgg_id=:bid");
    $req->execute(array(":uid"=>$uid, ":bid"=>$bgg_id));
    $req->closeCursor();
    return true;
  }

}
