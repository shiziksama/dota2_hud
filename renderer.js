var hud=[];//поточний хад, з яким ми працюємо
var config=[];//отриманий конфіг, який збережений на цьому компі

const load_config = async()=>{
    config= await window.versions.getConfig();
}
const load_userlist = async () => {
  const response = await window.versions.userlist();
  var select = document.getElementById("userid");
    for(var i = 0; i < response.length; i++) {
        var opt = response[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
    load_hudlist();
}
const load_hudlist = async() =>{
    hud= await window.versions.getHud(document.getElementById("userid").value);
    const select = document.getElementById("hudname");
    for(let i=0;i<hud.configs.length;i++){
        var opt = hud.configs[i];
        var el = document.createElement("option");
        el.textContent = opt.config_name;
        el.value = i;
        select.appendChild(el);
    }
    load_hud();
}


const load_hud =()=>{
    const hud_div=document.getElementById('hud');
    //position,ratings,count;
    const list=hud.configs[document.getElementById('hudname').value]['categories'];
    hud_div.innerHtml='';
    const userid=document.getElementById('userid').value;
    
    const hudname=hud.configs[document.getElementById('hudname').value]['config_name'];
    let values={};
    if((config[userid])&&(config[userid][hudname])){
        values=config[userid][hudname];
    }
    for(let i=0;i<list.length;i++){
        const name=list[i].category_name;
        const element_values=values[name]??[];
        
        //console.log(element_values);
        hud_div.innerHTML += `<div class="hud_element">
            <span>${list[i].category_name}</span>
            <label><input type="checkbox" name="hud[${name}][dont_change]" value="1" ${element_values.dont_change?'checked':''}>Dont change</label>
            <label><input type="checkbox" name="hud[${name}][heroes_left]" value="1" ${element_values.heroes_left?'checked':''}>all other heroes,not in another lists</label>
            <div class="select"><select name="hud[${name}][position]">
            <option ${element_values.position=='POSITION_1'?'selected':''}>POSITION_1</option>
            <option ${element_values.position=='POSITION_2'?'selected':''}>POSITION_2</option>
            <option ${element_values.position=='POSITION_3'?'selected':''}>POSITION_3</option>
            <option ${element_values.position=='POSITION_4'?'selected':''}>POSITION_4</option>
            <option ${element_values.position=='POSITION_5'?'selected':''}>POSITION_5</option>
            </select></div>
            <div class="ratings">
            <label><input type="checkbox" name="hud[${name}][bracket_ids][]" ${element_values.bracket_ids?.includes('HERALD')?'checked':''} value="HERALD">HERALD</label>
            <label><input type="checkbox" name="hud[${name}][bracket_ids][]" ${element_values.bracket_ids?.includes('GUARDIAN')?'checked':''} value="GUARDIAN">GUARDIAN</label>
            <label><input type="checkbox" name="hud[${name}][bracket_ids][]" ${element_values.bracket_ids?.includes('CRUSADER')?'checked':''} value="CRUSADER">CRUSADER</label>
            <label><input type="checkbox" name="hud[${name}][bracket_ids][]" ${element_values.bracket_ids?.includes('ARCHON')?'checked':''} value="ARCHON">ARCHON</label>
            <label><input type="checkbox" name="hud[${name}][bracket_ids][]" ${element_values.bracket_ids?.includes('LEGEND')?'checked':''} value="LEGEND">LEGEND</label>
            <label><input type="checkbox" name="hud[${name}][bracket_ids][]" ${element_values.bracket_ids?.includes('ANCIENT')?'checked':''} value="ANCIENT">ANCIENT</label>
            <label><input type="checkbox" name="hud[${name}][bracket_ids][]" ${element_values.bracket_ids?.includes('DIVINE')?'checked':''} value="DIVINE">DIVINE</label>
            <label><input type="checkbox" name="hud[${name}][bracket_ids][]" ${element_values.bracket_ids?.includes('IMMORTAL')?'checked':''} value="IMMORTAL">IMMORTAL</label>
            </div>
            <div class="count">
                <input type="number" name="hud[${name}][count]" value="${element_values.count?element_values.count:''}">
            </div>
        </div>`;
        
    }
}
function serializeForm () {
    console.log(jQuery('#form').serialize());
   const form=document.getElementById('form');
  // Create a new FormData object
  const formData = new FormData(form);
    console.log(formData);
  // Create an object to hold the name/value pairs
  const pairs = {};
const ob=Object.fromEntries(formData);
console.log(ob);
  // Add each name/value pair to the object
  for (const [name, value] of formData) {
    pairs[name] = value;
  }

  // Return the object
  return pairs;
}

document.getElementById("hudname").addEventListener('change',load_hud);
document.getElementById('userid').addEventListener('change',load_hudlist);
document.getElementById('save').addEventListener('click',function(e){
    e.preventDefault();
    const formdata=jQuery('#form').serializeJSON();
    let conf_new=new Object();
    conf_new[document.getElementById("userid").value]=new Object();
    conf_new[document.getElementById("userid").value][hud.configs[document.getElementById('hudname').value]['config_name']]=formdata['hud'];
    window.versions.setConfig(conf_new);
});
document.getElementById('generate').addEventListener('click',function(e){
    e.preventDefault();
    window.versions.generate();
});
load_userlist();
load_config();