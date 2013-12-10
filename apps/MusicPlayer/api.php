<?php

class MusicPlayer
{

  public static function call($method, $args) {
    if ( $method === 'info' ) {
      $fname = $args['filename'];
      if ( !$fname || strstr($fname, HOMEDIR) === false ) throw new Exception("Invalid file!");

      if ( !class_exists('SimpleXMLElement') ) {
        throw new Exception("Cannot get media information -- No XML parser found");
      }
      if ( !function_exists('exec') ) {
        throw new Exception("Cannot get media information -- Exec not allowed");
      }

      $cmd = sprintf("mediainfo --Output=XML %s", escapeshellcmd($fname));
      @exec($cmd, $content);
      if ( !$content ) {
        throw new Exception("Cannot get media information -- Query failed");
      }

      try {
        $xml = new SimpleXMLElement(implode("\n", $content));
      } catch ( Exception $e ) {
        $xml = null;
      }

      if ( $xml !== null ) {
        if ( isset($xml->File[0]) && isset($xml->File[0]->track) && ($node = $xml->File->track) ) {
          return Array(
            'Artist'  => isset($node->Performer)  ? htmlspecialchars($node->Performer)   : '',
            'Album'   => isset($node->Album)      ? htmlspecialchars($node->Album)       : '',
            'Track'   => isset($node->Track_name) ? htmlspecialchars($node->Track_name)  : ''
          );
        }
      }
    }

    return false;
  }

}

?>
