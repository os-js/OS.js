<?php

namespace OSjs\Packages;

use OSjs\Core\Request;
use OSjs\Core\VFS;

use Exception;

if ( !defined('MUSICPLAYERCOMMAND') ) {
    define('MUSICPLAYERCOMMAND', '/usr/bin/mediainfo');
}

class ApplicationMusicPlayer
{

    public static function info(Request $request, Array $args = Array())
    {

        if ( !class_exists('SimpleXMLElement') ) {
            throw new Exception('Cannot get media information -- No XML parser found');
        }
        if ( !function_exists('exec') ) {
            throw new Exception('Cannot get media information -- Exec not allowed');
        }

        $fname = VFS::GetRealPath($args['filename']);
        $cmd = sprintf('%s --Output=XML %s', MUSICPLAYERCOMMAND, escapeshellcmd($fname));

        @exec($cmd, $content);
        if ( !$content ) {
            throw new Exception('Cannot get media information -- Query failed');
        }

        try {
            $xml = new SimpleXMLElement(implode('\n', preg_replace('/_+/', '', $content)));
        } catch ( Exception $e ) {
            $xml = $e;
        }

        if ($xml !== null) {
            if (isset($xml->File[0]) && isset($xml->File[0]->track) && ($node = $xml->File->track)) {
                return [
                    'Artist'  => isset($node->Performer)  ? htmlspecialchars($node->Performer)   : null,
                    'Album'   => isset($node->Album)      ? htmlspecialchars($node->Album)       : null,
                    'Track'   => isset($node->Track_name) ? htmlspecialchars($node->Track_name)  : null
                ];
            }
        }
        return false;
    }

}

return 'OSjs\\Packages\\ApplicationMusicPlayer';
