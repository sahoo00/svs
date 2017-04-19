<?php

$conf = "/pyramid/sahoo/www/Explore/explore.conf";
$dataset = "CRC37.2";
$aid = "TCGA-AA-A00J";
$num = 0;
if (array_key_exists("dataset", $_GET)) {
  $dataset = $_GET["dataset"];
}
if (array_key_exists("aid", $_GET)) {
  $aid = $_GET["aid"];
}
if (array_key_exists("n", $_GET)) {
  $num = $_GET["n"];
}
$file = getFile($dataset, $aid, $conf, $num);
$model = array("dataset" => $dataset, "aid" => $aid,
        "conf" => $conf, "file" => $file);

$cmd = "";
if (array_key_exists("cmd", $_GET)) {
  $cmd = $_GET["cmd"];
}

$screenWidth = 640;
$screenHeight = 480;

if ($cmd == "") {
  printZoomBox($model);
}
if ($cmd == "home") {
  printHomeImage($file, $_GET["sw"], $_GET["sh"]);
}
if ($cmd == "zoom") {
  printZoomImage($file, $_GET["x"], $_GET["y"],
    $_GET["width"], $_GET["height"], $_GET["sw"], $_GET["sh"]);
}
if ($cmd == "zoomUrl") {
  printZoomImageUrl($model, $_GET["x"], $_GET["y"],
    $_GET["width"], $_GET["height"], $_GET["sw"], $_GET["sh"]);
}

function getConf($file) {
  if (($fp = fopen($file, "r")) === FALSE) {
    echo "Can't open file $file <br>";
    exit;
  }
  $n_id = "";
  $model = array();
  $global = array();
  while (!feof($fp))
  {
    $line = fgets($fp);
    $line = chop($line, "\r\n");
    if (strncmp($line, "[", 1) == 0) {
      $n_id = preg_replace('/^\s*\[(.+)\]\s*$/i', '$1', $line);
      $model[$n_id] = array();
    }
    elseif (!preg_match('/^\s*$/', $line) && strcmp($n_id, "") != 0) {
      list($k, $v) = split("=", $line, 2);
      $model[$n_id][$k] = $v;
    }
    elseif (!preg_match('/^\s*$/', $line) && strcmp($n_id, "") == 0) {
      list($k, $v) = split("=", $line, 2);
      $global[$k] = $v;
    }
  }
  fclose($fp);
  return array($global, $model);
}

function getFiles($dataset, $aid, $conf) {
  list($global, $explore) = getConf($conf);
  $res = null;
  if (array_key_exists("ann", $explore[$dataset])) {
    $afile = trim($explore[$dataset]['ann']);
    if (($fp = fopen($afile, "r")) === FALSE) {
      return null;
    }
    $head = fgets($fp);
    while (!feof($fp))
    {
      $line = fgets($fp);
      $line = chop($line, "\r\n");
      $list = split("\t", $line);
      if (count($list) > 3 && strcmp($aid, $list[0]) == 0) {
        $a = 1;
        while ($a < count($list)) {
          if (strcmp($list[$a], "TissueImages") == 0) {
            $a++;
            $res = array();
            for ($i = 0; $i < $list[$a]; $i++) {
              $res[$i] = $list[$a + $i + 1];
            }
            $a = $a + $list[$a];
            return $res;
          }
          else {
            $a++;
            $a = $a + $list[$a];
          }
        }
        return $res;
      }
    }
    fclose($fp);
  }
  return $res;
}

function getFile($dataset, $aid, $conf, $n) {
  $res = getFiles($dataset, $aid, $conf);
  $file = "/genedata/sahoo/Data/Colon/TCGA/Images/TCGA-AA-3695-01A-01-BS1.svs";
  $file = "/genedata/sahoo/Data/Colon/TCGA/Images/TCGA-AA-3511-01A-02-BS2.svs";
  $file = "/genedata/sahoo/booleanfs/sahoo/Data1/Colon/TCGA/Images/TCGA-AA-3511-01A-02-BS2.svs";
  if ($res != null) {
    $file = $res[$n];
  }
  return $file;
}

function getOutprefix() {
  $better_token = md5(uniqid(rand(), true));
  $outprefix = "tmpdir/tmp$better_token";
  return $outprefix;
}

function printZoomImageUrl($model, $x, $y, $width, $height, $sw, $sh) {
  $outprefix = getOutprefix();
  $outfile = "$outprefix.jpg";
  $file = $model["file"];
  $cmd = "./svszoom zoom $file $x $y $width $height $sw $sh $outfile";
  if ( ($fh = popen($cmd, 'r')) === false )
    die("Open failed: ${php_errormsg}\n");
  $line = fgets($fh);
  $line = chop($line, "\r\n");
  list($x, $y, $width, $height, $w, $h, $f) = split(" ", $line);
  pclose($fh);
  if (file_exists($outfile)) {
    unlink($outfile);
  }
  echo "zoom.php?dataset=".$model["dataset"]."&aid=".$model["aid"].
    "&cmd=zoom&x=$x&y=$y&width=$width&height=$height&sw=$w&sh=$h";
}

function printZoomImage($file, $x, $y, $width, $height, $sw, $sh) {
  $outprefix = getOutprefix();
  $outfile = "$outprefix.jpg";
  $cmd = "./svszoom zoom $file $x $y $width $height $sw $sh $outfile";
  if ( ($fh = popen($cmd, 'r')) === false )
    die("Open failed: ${php_errormsg}\n");
  pclose($fh);
  $outfile1 = "$outprefix.png";
  $cmd = "convert $outfile -resize $sw\x$sh $outfile1";
  if ( ($fh = popen($cmd, 'r')) === false )
    die("Open failed: ${php_errormsg}\n");
  pclose($fh);
  header("Content-type: image/png");
  $im     = imagecreatefrompng($outfile1);
  imagepng($im);
  imagedestroy($im);
  if (file_exists($outfile1)) {
    unlink($outfile1);
  }
  if (file_exists($outfile)) {
    unlink($outfile);
  }
}

function getSize($file) {
  $cmd = "./svszoom size $file";
  if ( ($fh = popen($cmd, 'r')) === false )
    die("Open failed: ${php_errormsg}\n");
  $line = fgets($fh);
  $line = chop($line, "\r\n");
  list($width, $height) = split(" ", $line);
  pclose($fh);
  return array($width, $height);
}

function getHomeImageUrl($model, $w, $h) {
  $file = $model["file"];
  list($width, $height)= getSize($file);
  $outprefix = getOutprefix();
  $outfile = "$outprefix.jpg";
  $cmd = "./svszoom zoom $file 0 0 $width $height $w $h $outfile";
  if ( ($fh = popen($cmd, 'r')) === false )
    die("Open failed: ${php_errormsg}\n");
  $line = fgets($fh);
  $line = chop($line, "\r\n");
  list($x, $y, $width, $height, $w, $h, $f) = split(" ", $line);
  pclose($fh);
  if (file_exists($outfile)) {
    unlink($outfile);
  }
  return "zoom.php?dataset=".$model["dataset"]."&aid=".$model["aid"].
    "&cmd=home&x=$x&y=$y&width=$width&height=$height&sw=$w&sh=$h";
}

function printHomeImage($file, $w, $h) {
  list($width, $height)= getSize($file);
  $outprefix = getOutprefix();
  $outfile = "$outprefix.jpg";
  $cmd = "./svszoom zoom $file 0 0 $width $height $w $h $outfile";
  if ( ($fh = popen($cmd, 'r')) === false )
    die("Open failed: ${php_errormsg}\n");
  pclose($fh);
  $outfile1 = "$outprefix.png";
  $cmd = "convert $outfile -resize $w\x$h $outfile1";
  if ( ($fh = popen($cmd, 'r')) === false )
    die("Open failed: ${php_errormsg}\n");
  pclose($fh);
  header("Content-type: image/png");
  $im     = imagecreatefrompng($outfile1);
  imagepng($im);
  imagedestroy($im);
  if (file_exists($outfile1)) {
    unlink($outfile1);
  }
  if (file_exists($outfile)) {
    unlink($outfile);
  }
}

function printZoomBox($model) {
  global $screenWidth, $screenHeight;
  list($global, $explore) = getConf($model["conf"]);
  $name = $explore[$model["dataset"]]['name'];
  $aid = $model["aid"];
echo "<html>
<head>
<title> Image Zoomer </title> 
<script src='zoom.js' type='text/javascript'></script>
</head>
<body onload='init();'>";

echo "<h1> Image $aid from $name </h1>\n";
echo "<table>
<style type='text/css'>
    <!-- .change:hover {background-color: #22aaaa;} -->
</style>
<tr>
<td><img src='icons/home-24.png' class='change' onclick='zoomHome();'/></td>
<td><img src='icons/minus-24.png' class='change' onclick='zoomOut();'/></td>
<td><img src='icons/plus-24.png' class='change' onclick='zoomIn();'/></td>
<td><input id='debug' type='text' size='50' style='visibility:hidden;'/></td>
<td><input id='debug1' type='text' size='20' style='visibility:hidden;'/></td>
</tr>
</table>\n";
$url = getHomeImageUrl($model, $screenWidth, $screenHeight);
echo "<div id='zoomContainer'>
<img id='img0' src='$url' onmousedown='rect_begin();'/>
</div>
<a id='img0link' href='$url'>Image link</a> 
<a id='img1link' href='$url' style='visibility:hidden;'>Zoom link</a> 
<div id='rect' style='
  position: absolute;
  top: 100px;
  left: 60px;
  background-color: transparent;
  width: 0px; 
  height: 0px;
  border: 1px #000000 solid;
  padding: 0 0 0 0;
  clear: both;
  visibility:hidden;
'/>
";
echo "</body></html>\n";
}

?>
