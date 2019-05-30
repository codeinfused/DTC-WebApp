<?php
namespace api\library;

abstract class Events
{
  static function parse_csv_import($pdo, $filename)
  {
    //die();
    $baseurl = __DIR__.'/../../../templates/';
    $filepath = $baseurl . $filename;

    /* CSV 2018 NOTES
    *** [0] = Day // 1.Wednesday - 5.Sunday
    *** [1] = start time // HH:MM PM/AM
    *** [2] = end time // could be "TBD", otherwise use to create length of event
    *** [3] = title // needs tests, reducing
    *** [4] = room
    *** [5] = Host 1
    *** [6] = Host 2
    *** [7] = Event Type [Event, Demo, Tournament, Panel, null]
    *** [8] = # of seats
    *** [9] = description/info
    *
    */

    if (($handle = fopen($filepath, "r")) === FALSE) {
      return;
    }

    $days = [
      null,
      '2019-07-03',
      '2019-07-04',
      '2019-07-05',
      '2019-07-06',
      '2019-07-07'
    ];

    $titlesIgnore = [
      "escape experience",
      "open gaming",
      "announcements",
      "convention is over",
      "last library checkouts",
      "library gathering of games",
      "library packing of games",
      "convention opens",
      "exhibitor hall opens"
    ];

    $row = 1;
    $events = [];

    function strpos_arr($haystack, $needle) {
      if(!is_array($needle)) $needle = array($needle);
      foreach($needle as $what) {
        if(($pos = strpos($haystack, $what))!==false) return $pos;
      }
      return false;
    }

    // LOOP EACH ROW
    while (($data = fgetcsv($handle, 2000, ",")) !== FALSE)
    {
      $num = count($data);
      if($row===1){ ++$row; continue; }
      $row++;

      $Ltitle = strtolower($data[3]);
      if( strtolower($data[8]) === 'cancelled' ){ continue; }
      if( strpos_arr($Ltitle, $titlesIgnore) !== false ){ continue; }

      $subtype = '';
      if( strpos($Ltitle, 'championship') !== false ){ $subtype = 'tournament'; }
      if( strpos($Ltitle, 'qualifier') !== false ){ $subtype = 'tournament'; }
      if( strpos($Ltitle, 'tournament') !== false ){ $subtype = 'tournament'; }
      if( strpos($Ltitle, 'panel') !== false ){ $subtype = 'panel'; }
      if( strpos($Ltitle, 'demo') !== false ){ $subtype = 'demo'; }

      if(strtolower($data[7]) === 'event'){ $subtype = 'event'; }
      if(strtolower($data[7]) === 'tournament'){ $subtype = 'tournament'; }
      if(strtolower($data[7]) === 'demo'){ $subtype = 'demo'; }
      if(strtolower($data[7]) === 'panel'){ $subtype = 'panel'; }

      /* override official events */
      if( strpos($Ltitle, 'dice tower') !== false ){ $subtype = 'dtc'; }
      if( strpos(strtolower($data[5]), 'tom vasel') !== false ){ $subtype = 'dtc'; }

      $dayindex = intval(substr($data[0], 0, 1));
      $timestart = (!empty($data[1]) && strtolower($data[1]!=='tbd')) ? date("H:i:00", strtotime($data[1])) : "";
      $timeend = (!empty($data[2]) && strtolower($data[2]!=='tbd')) ? date("H:i:00", strtotime($data[2])) : "";
      $datestart = !empty($timestart) ? ($days[$dayindex]." ".$timestart) : "";
      $dateend = !empty($timeend) ? ($days[$dayindex]." ".$timeend) : "";
      $seats = is_numeric($data[8]) ? $data[8] : 1;

      $length = 0;
      if(!empty($dateend) && !empty($datestart)){
        $length = abs(strtotime($dateend) - strtotime($datestart));
        $length = round(($length/60/60)*2) / 2;
      }

      $events[] = array(
        "title" => $data[3],
        "desc" => $data[9],
        "subtype" => $subtype,
        "seats" => $seats,
        "room" => $data[4],
        "start" => $datestart,
        "length" => $length,
        "host" => $data[5]
      );
    } // end row loop

    foreach($events as $i => $event)
    {
      $dbCheck = $pdo->prepare(
        "INSERT INTO game_tables SET table_type='dtc-event', allow_signups=1, seats=:seats, table_location=:table_location, start_datetime=:start_datetime, playtime=:playtime, title=:title, description=:description, host=:host, subtype=:subtype"
      );
      $dbCheck->execute(array(
        ':seats' => $event['seats'],
        ':table_location' => $event['room'],
        ':start_datetime' => $event['start'],
        ':playtime' => (!empty($event['length']) ? $event['length'].' hours' : null),
        ':title' => $event['title'],
        ':description' => $event['desc'],
        ':host' => $event['host'],
        ':subtype' => $event['subtype']
      ));
      $dbCheck->closeCursor();
      $events[$i]['done'] = true;
    }

    echo json_encode(array("events" => $events));

    fclose($handle);
  } // end parse_csv_import
}
