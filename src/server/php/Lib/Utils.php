<?php namespace OSjs\Lib;

abstract class Utils
{

    public static function getPackageMainFile($package) {
        $indexFile = 'api.php';

        if ( isset($package['main']) ) {
            if ( is_string($package['main']) ) {
                $indexFile = $package['main'];
            } else if ( is_array($package['main']) ) {
                $indexFile = $package['main']['php'];
            }
        }

        return $indexFile;
    }

}
