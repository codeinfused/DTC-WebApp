<?php
namespace api\user;

abstract class User
{

  static function getUserInfo($pdo, $uid)
  {
    $req = $pdo->prepare("SELECT id, firstname, lastname, email, role, grant_type, fb_token, google_token, thumb FROM users WHERE id = :uid");
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
