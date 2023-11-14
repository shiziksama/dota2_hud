const { app, BrowserWindow,ipcMain} = require('electron')
const fs = require("fs");
const path = require('node:path');
const process = require('process'); 
//import axios from "axios";
/*
const axiosInstance = axios.create({
    baseURL: 'https://dota2.weblamas.com/',
    timeout: 30000,
});
&*/


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}
const getConfig=()=>{
    const config=(app.getPath('userData'))+'/config.json';
    if(fs.existsSync(config)){
        return JSON.parse(fs.readFileSync(config))
    }else{
        return {};
    }
}
const getSteamFolder=()=>{
    if(fs.existsSync('C:/Program Files (x86)/Steam/userdata')){
        return 'C:/Program Files (x86)/Steam/userdata';
    }
    if(fs.existsSync('/mnt/c/Program Files (x86)/Steam/userdata')){
        return '/mnt/c/Program Files (x86)/Steam/userdata';
    }
}

function listDirectories(pth) {
  return fs.readdirSync(pth, {withFileTypes: true})
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}
async function get_heroids(playerid,position,bracket_ids,count){
//    $query['position']='POSITION_1';
//    $query['bracket_id']=['ARCHON'];
//    $query['playerid']=$playerid;
//    $query['format']='json';
    let params = new URLSearchParams({
        position:position,

        playerid:playerid,
        format:'keys'
    });
    bracket_ids.forEach(function(value){
        params.append('bracket_id[]',value);
    });
    const str = params.toString();
    const response=await fetch('https://dota2.weblamas.com/?'+params.toString()).then((response) => {return response.json(); });
    return response.slice(0,count);
}
async function generateHud(userid,base,config){
    let all_heroes=await fetch('https://dota2.weblamas.com/heroes.json').then((response) => {return response.json(); });
    all_heroes=Object.keys(all_heroes).map(numStr => parseInt(numStr));
    let left_id=-1;
    for(const [key,value] of Object.entries(base)){
        base[key]['x_position']=Math.round(value.x_position/10)*10;
        base[key]['y_position']=Math.round(value.y_position/10)*10;
        base[key]['width']=Math.round(value.width/10)*10;
        base[key]['height']=Math.round(value.height/10)*10;
        if(!config[value.category_name])continue;
        const curconfig=config[value.category_name];
        if(curconfig.dont_change)continue;
        if(curconfig.heroes_left){
            left_id=key;
            continue;
        }
        
        base[key]['hero_ids']=await get_heroids(userid,curconfig['position'],curconfig['bracket_ids'],curconfig['count']);
        all_heroes = all_heroes.filter(x => !base[key]['hero_ids'].includes(x));
    }
    all_heroes=all_heroes.filter(element => {
      return element;
    });
    base[left_id]['hero_ids']=all_heroes;
    
    return base;
}
async function generateUserHuds(userid,hud_config){
  const filename=getSteamFolder()+'/'+userid+'/570/remote/cfg/hero_grid_config.json';
  let huds=JSON.parse(fs.readFileSync(filename));
  for(const [key,value] of Object.entries(huds['configs'])){
      if(hud_config[value.config_name]){
          huds['configs'][key]['categories']=await generateHud(userid,value['categories'],hud_config[value.config_name]);
      }
  }
  fs.writeFileSync(filename,JSON.stringify(huds,null,2))
  console.log('written');
}
function generate(){
    const config=getConfig();
    for (const [key, value] of Object.entries(config)) {
        generateUserHuds(key,value);
    }
}


app.whenReady().then(() => {
    if(process.argv.includes('--silent')){
        generate();
        app.quit(); 
        return;
    }
    console.log(process.argv);
//    generate();    return;
    ipcMain.handle('generate', generate);
    ipcMain.handle('userlist', () => {
     const userlist=listDirectories(getSteamFolder());
     return userlist
    });
    ipcMain.handle('getHud',(event,userid)=>{
      console.log(userid);
      const filename=getSteamFolder()+'/'+userid+'/570/remote/cfg/hero_grid_config.json';
      return JSON.parse(fs.readFileSync(filename));
    });
    ipcMain.handle('getConfig',getConfig);
    ipcMain.handle('setConfig',(event,config)=>{
      const config_file=(app.getPath('userData'))+'/config.json';
      fs.writeFileSync(config_file,JSON.stringify(config));
    })
    const config=getConfig();
    const steam_folder=getSteamFolder();
    //path.sep;
    const filename=getSteamFolder();//'C:\Program Files (x86)\Steam\userdata\\'.$playerid.'\570\remote\cfg\hero_grid_config.json'
    const userids=listDirectories(filename);


    //console.log(userids);
    //console.log(filename);
    //console.log(config);
    createWindow()
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})