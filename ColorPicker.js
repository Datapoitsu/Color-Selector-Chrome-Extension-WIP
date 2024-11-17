var pressing = false;
const names = ["red","green","blue","hex","hue","saturation","lightness"];
var values = [255,255,255,"#FFFFFF",0,0,1];
var savedColor = [];
const zeroPad = (num, places) => String(num).padStart(places, '0');

function start()
{
    
    document.getElementById("selector").ondragstart = function() { return false; };
    document.getElementById("colorPie").addEventListener("mousedown", function myFunction()
    {
        pressing = true;
        pressedPie();
    });
    document.getElementById("colorPie").addEventListener("mousemove", function myFunction()
    {
        pressedPie();
    });
    document.getElementById("colorPie").addEventListener("mouseup", function myFunction()
    {
        pressing = false;
    });

    //Copy buttons
    for(let i = 0; i < names.length; i++)
    {
        document.getElementById("copy" + names[i]).addEventListener("click", function myFunction()
        {
            navigator.clipboard.writeText(values[i]);
        });
    }

    //Sliders
    for(let i = 0; i < 3; i++)
    {
        document.getElementById(names[i] + "Slider").addEventListener("mousemove", function myFunction()
        {
            if(parseInt(document.getElementById(names[i] + "Slider").value) == values[i])
            {
                return;
            }
            values[i] = parseInt(document.getElementById(names[i] + "Slider").value);
            document.getElementById(names[i]).value = values[i];
            rgbChange();
            writehsvValues(); 
        });    
    }
    for(let i = 4; i < 7; i++)
    {
        document.getElementById(names[i] + "Slider").addEventListener("mousemove", function myFunction()
        {
            if(parseFloat(fourDecimals(document.getElementById(names[i] + "Slider").value)) == fourDecimals(values[i]))
            {
                return;
            }
            values[i] = parseFloat(parseFloat(document.getElementById(names[i] + "Slider").value));
            document.getElementById(names[i]).value = values[i];
            hsvChange(fourDecimals(values[4]) * Math.PI * 2);
            writeRGBValues();
        });   
    }
    
    if (window.EyeDropper === undefined)
    {
        console.log("Unsupported!");
        return;
    }
    else
    {
        document.getElementById("eyeDropButton").addEventListener("click", pickColor, false);
    }
    document.getElementById("saveButton").addEventListener('click', saveColor, false);
    writeColorChange();
    
    chrome.storage.local.get("key").then((result) => {
        if(result.key != undefined)
        {
            savedColor = result.key;
        }
        setColorPresets();
    });
    
}

function saveColor()
{
    createOldColor(values[3]);
    setColorPresets();
}

function pressedPie()
{
    if(!pressing)
    {
        return;
    }
    var e = window.event;

    var posX = e.clientX - 30;
    var posY = e.clientY - 94;
    var dist = Math.sqrt(Math.pow(posX - 128,2) + Math.pow(posY - 128,2));
    
    var angle = Math.atan2(posX - 128,posY - 128) - Math.PI / 2;
    
    if(dist > 128){
        posX = 128 + 128 * Math.cos(angle);
        posY = 128 - 128 * Math.sin(angle);
        dist = 128;
    }
    values[5] = dist / 128;
    angle = (angle + Math.PI * 2) % (Math.PI * 2); // 0 <= angle < 2 * PI
    hsvChange(angle);
    writeRGBValues();
    rgbChange();
    writehsvValues();
    writeColorChange();
}

function hexadeciToDeci(hex) {
    return parseInt(hex, 16);
}

function hexChange()
{
    values[0] = hexadeciToDeci(values[3].substring(1,3));
    values[1] = hexadeciToDeci(values[3].substring(3,5));
    values[2] = hexadeciToDeci(values[3].substring(5,7));
    writeRGBValues();
    rgbChange();
    writehsvValues();
}

function rgbChange()
{
    var rHolder = values[0] / 255;
    var gHolder = values[1] / 255;
    var bHolder = values[2] / 255;
    var max = Math.max(rHolder,gHolder,bHolder);
    var min = Math.min(rHolder,gHolder,bHolder);
    if(max == min)
    {
        values[4] = 0;
    }
    else
    {
        if(rHolder == max)
        {
            values[4] = (gHolder - bHolder) / (max - min);
        }
        else if(gHolder == max)
        {
            values[4] = 2 + (bHolder - rHolder) / (max - min);
        }
        else if(bHolder == max)
        {
            values[4] = 4 + (rHolder - gHolder) / (max - min);
        }
        values[4] /= 6;
        if(values[4] < 0)
        {
            values[4]++;
        }
        values[4] = fourDecimals(values[4].toFixed(4));
    }
    values[6] = fourDecimals(max.toFixed(4));
    if(max == 0)
    {
        values[5] = 0;
    }
    else
    {
        values[5] = fourDecimals(((max - min) / max).toFixed(4));
    }
}

function writehsvValues()
{
    values[3] = ("#" + zeroPad(values[0].toString(16),2) + zeroPad(values[1].toString(16),2) + zeroPad(values[2].toString(16),2)).toUpperCase();
    document.getElementById("pie").style.filter = "brightness(" + (values[6] * 100) + "%)";
    document.getElementById("colorDisplay").style.backgroundColor = values[3];
    
    document.getElementById(names[3]).value = values[3];

    for(let i = 4; i < 7; i++)
    {
        document.getElementById(names[i]).value = fourDecimals(values[i]);
        document.getElementById(names[i] + "Slider").value = fourDecimals(values[i]);
    }
    writeColorChange();
}

function hsvChange(angle)
{
    var holder = calculateRGB(angle);
    for(let i = 0; i < 3; i++)
    {
        values[i] = holder[i];
    }
    for(let i = 0; i < 3; i++)
    {
        values[i] = Math.round(lerp(values[i], 255, 1 - values[5]));//saturation
        values[i] = Math.round(values[i] * values[6]);//lightness
    }
}

function calculateRGB(angle)
{
    var holder = [0,0,0];
    holder[0] = 255 * Math.min(Math.max(2-Math.min(angle,2*Math.PI-angle)/(1/3*Math.PI), 0), 1);
    holder[1] = 255 * Math.min(Math.max(2-(Math.abs(2/3*Math.PI-angle)/(1/3*Math.PI)), 0), 1);
    holder[2] = 255 * Math.min(Math.max(2-(Math.abs(4/3*Math.PI-angle)/(1/3*Math.PI)), 0), 1);
    return holder;
}

function writeRGBValues()
{
    values[3] = ("#" + zeroPad(values[0].toString(16),2) + zeroPad(values[1].toString(16),2) + zeroPad(values[2].toString(16),2)).toUpperCase();

    for(let i = 0; i < 4; i++)
    {
        document.getElementById(names[i]).value = values[i];
        if(i != 3)
        {
            document.getElementById(names[i] + "Slider").value = values[i];
        }
    }

    document.getElementById("pie").style.filter = "brightness(" + (values[6] * 100) + "%)";
    writeColorChange();
}

function writeColorChange()
{
    document.getElementById("colorDisplay").style.backgroundColor = values[3];
    var posX = 142 + Math.cos(-values[4] * Math.PI * 2) * 128 * values[5];
    var posY = 142 + Math.sin(-values[4] * Math.PI * 2) * 128 * values[5];
    document.getElementById("selector").style.top = posY.toString() + "px";
    document.getElementById("selector").style.left = posX.toString() + "px";


    document.getElementById("redSlider").style.background = "linear-gradient(to right, #00" + values[3].substring(3,7) + ", #FF" + values[3].substring(3,7) + ")";
    document.getElementById("greenSlider").style.background = "linear-gradient(to right, #" + values[3].substring(1,3) + "00" + values[3].substring(5,7) + ", #" + values[3].substring(1,3) + "FF" + values[3].substring(5,7) + ")";
    document.getElementById("blueSlider").style.background = "linear-gradient(to right, #" + values[3].substring(1,5) + "00, #" + values[3].substring(1,5) + "FF)";

    var holder = calculateRGB(values[4] * Math.PI * 2);
    for(let i = 0; i < 3; i++)
    {
        holder[i] = zeroPad(Math.round(holder[i]).toString(16),2);
    }
    var saturationColor = "#" + holder[0] + holder[1] + holder[2];
    document.getElementById("saturationSlider").style.background = "linear-gradient(to right, #FFFFFF," + saturationColor + ")";
    document.getElementById("lightnessSlider").style.background = "linear-gradient(to right, #000000," + saturationColor + ")";
}

function lerp(start,end,value)
{
    return start + (end - start) * value;
}

function fourDecimals(value)
{
    const formattedNumber = new Intl.NumberFormat('en', { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(value);
    return parseFloat(formattedNumber);
}

async function pickColor(event) {
    document.getElementById("body").style.display = "none";
    let eyeDropper = new EyeDropper();
    try {
      let pickedColor = await eyeDropper.open();
      values[3] = pickedColor.sRGBHex.toUpperCase();
      navigator.clipboard.writeText(values[3]);
      hexChange();
      createOldColor(values[3]);
      setColorPresets()
    }
    catch (error)
    {
        console.log(error);
    }
    document.getElementById("body").style.display = "inline-block";
}

function createColorPresets()
{
    for(var i = 0; i < 20; i++)
    {
        var div = document.createElement("div");
        div.className = "colorPreset";
        div.id = i.toString();
        document.getElementById("savedColors").appendChild(div);
    }
}

function removeColorPresets(){
    var a = document.getElementById("savedColors");
    while(a.firstChild != null){
        a.removeChild(a.firstChild);
    }
}

function setColorPresets()
{
    removeColorPresets();
    createColorPresets();
    for(let i = 0; i < savedColor.length; i++)
    {
        var div = document.getElementById(i.toString());
        div.style.backgroundColor = savedColor[i];
        div.addEventListener("click",function(){
            values[3] = savedColor[i];
            hexChange();    
        });
    }
    for(let i = savedColor.length; i < 20; i++)
    {
        var div = document.getElementById(i.toString());
        div.style.backgroundColor = "#2B2B2B";
        div.addEventListener("click",function(){
            values[3] = "#2B2B2B";
            hexChange();    
        });
    }
}

function createOldColor(colorValue)
{
    savedColor.unshift(colorValue);
    if(savedColor.length > 20)
    {
        savedColor = savedColor.splice(0,20);
    }
    chrome.storage.local.set({ "key" : savedColor}, function(){
        console.log("Saved data to session.");
    });
    console.log("Saved colors are",savedColor);
}

start();