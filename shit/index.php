<?php
$playerid=109048742;
$heroes_json=json_decode(file_get_contents('https://dota2.weblamas.com/heroes.json'),true);
$heroes=array_keys($heroes_json);

$query=[];
$query['playerid']=$playerid;
$query['format']='json';
$filename=('C:\Program Files (x86)\Steam\userdata\\'.$playerid.'\570\remote\cfg\hero_grid_config.json');
$file=json_decode(file_get_contents($filename),true);

$query['position']='POSITION_1';
$query['bracket_id']=['ARCHON'];
$carry=json_decode(file_get_contents('https://dota2.weblamas.com/?'.http_build_query($query)),true);
$file['configs'][0]['categories'][2]['hero_ids']=array_slice(array_keys($carry),0,25);

$query['position']='POSITION_3';
$query['bracket_id']=['LEGEND'];
$pos3=json_decode(file_get_contents('https://dota2.weblamas.com/?'.http_build_query($query)),true);
$file['configs'][0]['categories'][3]['hero_ids']=array_slice(array_keys($pos3),0,18);

$query['position']='POSITION_5';
$query['bracket_id']=['LEGEND'];
$pos5=json_decode(file_get_contents('https://dota2.weblamas.com/?'.http_build_query($query)),true);
$file['configs'][0]['categories'][4]['hero_ids']=array_slice(array_keys($pos5),0,18);


$query['position']='POSITION_4';
$query['bracket_id']=['ARCHON'];
$pos4=json_decode(file_get_contents('https://dota2.weblamas.com/?'.http_build_query($query)),true);
$file['configs'][0]['categories'][0]['hero_ids']==array_slice(array_keys($pos4),0,30);

$file['configs'][0]['categories'][5]['hero_ids']=[];
foreach($file['configs'][0]['categories'] as $cat){
	$heroes=array_diff($heroes,$cat['hero_ids']);
}
$file['configs'][0]['categories'][5]['hero_ids']=array_values($heroes);

file_put_contents($filename,json_encode($file,JSON_PRETTY_PRINT));
