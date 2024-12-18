import express from "express";
import fs from "fs";
import Handlebars from "handlebars";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

import { dirname, join as pathJoin } from "node:path";
import { fileURLToPath } from "node:url";
import path from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use("/public", express.static("public"));
app.use(bodyParser.json());
console.log(path);
const strFromFile = (path) => fs.readFileSync(path).toString();

const views = {
  index: Handlebars.compile(
    strFromFile(pathJoin(__dirname, "views", "templates", "index.hbs"))
  ),
  section: Handlebars.compile(
    strFromFile(pathJoin(__dirname, "views", "templates", "section.hbs"))
  ),
  add: Handlebars.compile(
    strFromFile(pathJoin(__dirname, "views", "templates", "add.hbs"))
  )
};

const partials = {
  header : Handlebars.registerPartial("header",
    strFromFile(pathJoin(__dirname, "views", "partials", "header.html"))
  ),
  footer : Handlebars.registerPartial("footer",
    strFromFile(pathJoin(__dirname, "views", "partials", "footer.html"))
  ),
  navigation : Handlebars.compile(
    strFromFile(pathJoin(__dirname, "views", "partials", "nav.hbs")))
};

const dataTitleRegister = JSON.parse(
  strFromFile(pathJoin(__dirname, "public", "titleRegister.json"))
);
const sendNavigation = partials.navigation({navSection: Object.keys(dataTitleRegister)});

function shortNote(longNote){
  let notesResized = "";
  if( longNote != undefined){
  const noteWordArr = longNote.split(' ');
  let i = 0;
  let noteSize = 0;
  while(i < noteWordArr.length && noteSize + noteWordArr[i].length < 100){
    notesResized = notesResized + " " + noteWordArr[i];
    noteSize += noteWordArr[i].length
    i += 1;
  }
  if(i < noteWordArr.length){
    notesResized = notesResized + "..."

  }
}
return(notesResized)
}


app.get("/", (req, res) => {
 let titleSelector=[];
 //console.log(dataTitleRegister);
// console.log(typeof(dataTitleRegister));
 let listSection = Object.keys(dataTitleRegister);

 //console.log(listSection);

 listSection.forEach(oneSection => {
    const sectionSize = dataTitleRegister[oneSection].length;
    
    let randomSelector = Math.floor(Math.random()*sectionSize);
 // coupe des notes aux mot pour limiter leur taille et qu'elle ne perturbent pas la mise en page
    
    const notesResized = shortNote(dataTitleRegister[oneSection][randomSelector].notes);

    titleSelector.push({"sectionName":oneSection,
    "sectionLength":sectionSize,
    "sectionRandomTitle":dataTitleRegister[oneSection][randomSelector].title,
    "sectionRandomDate":dataTitleRegister[oneSection][randomSelector].additionDate,
    "sectionRandomNotes":notesResized
 })

 });
  //console.log(titleSelector);
  
  res.send(views.index({navigation: sendNavigation , section: titleSelector }));
});

app.get("/section/:sectionName", (req, res) => {
  const section = dataTitleRegister[req.params.sectionName];
  section.forEach((element) => element.note = shortNote(element.note));
  console.log(section);
  res.send(
    views.section({
      navigation: sendNavigation,
      name: req.params.sectionName,
      piece: section,
    })
  );
});


app.get("/add", (req, res) => {
  res.send(views.add({navigation: sendNavigation}));
});



app.post("/api/add",(req, res) => {

  const request = req.body;

  if(request.title.trim() == ""){
    res.status(400).send("le titre est obligatoire");
    return;
  }

  if(request.section.trim() == ""){
    res.status(400).send("la section est obligatoire");
    return;
  }

  const storedSection = dataTitleRegister[req.body.section];
  if(storedSection
    && storedSection.map((a)=>a.title).includes(req.body.title)){
    res.status(400).send("Ce titre est deja en memoire");
    return;
  }
  // ok, maintenant que les checks sont fait, on passe au reste

  // plutot que d'avoir 2 strategies d'insertion (une quand la section et existe et une quand elle existe pas)
  // on check juste si elle existe pas, et si c'est la cas on la creer
  if(!(Object.keys(dataTitleRegister).includes(request.section))){
    dataTitleRegister[request.section] = [];
  }

  dataTitleRegister[request.section].push({
    "title":request.title,
    "additionDate":Date.now(),  // toujours les stocker sous forme de timestamp UTC+0 comme ca on peut generer toutes les version "lisibles par les humains" a partir de la. Mais on stocke la version "neutre" avec toutes les infos et puis c'est un entien 32bits, pas une string
    "notes": request.note
  });

  // TODO faudra que j'y pense lundi
  
  fs.writeFileSync(
    path.join(".", "output.json"),JSON.stringify(dataTitleRegister))

  res.send(200);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});




