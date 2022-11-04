const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path')
const fs = require('fs');

const PORT = 8080;
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    console.log("URL : " + req.method + " " + req.originalUrl);
    console.log("  body raw: " + req.body);
    console.log("  body : " + JSON.stringify(req.body));
    console.log("  qs : " + JSON.stringify(req.query));
    next();
});

app.use(express.static(path.join(__dirname, './')));

app.listen(PORT, function (error, req, res, next) { console.log("Serveur démarré on " + PORT) });

app.get('/api/persons/badgeId', function (req, res) {
    // to read infos about client file
    console.log("get file:", path.join(__dirname + "/" + req.query.badgeId + ".json"));
    try {
        let data = fs.readFileSync(path.join(__dirname + "/" + req.query.badgeId + ".json"), { encoding: 'utf8', flag: 'r' });
        data = JSON.parse(data);
        console.log("retour de la fonction", data);
        res.status(200).json(data);
    } catch (e) {
        console.log("retour de la fonction: file not exists = default");
        let data = fs.readFileSync(path.join(__dirname + "/" + "default.json"), { encoding: 'utf8', flag: 'r' });
        data = JSON.parse(data);
        console.log("retour de la fonction", data);
        res.status(200).json(data);
    }
});

app.get('/api/persons/manager', function (req, res) {
    // to read infos about client file 
    console.log("get file for manager:", path.join(__dirname + "/" + req.query.badgeId + "_list.json"));
    try {
        let data = fs.readFileSync(path.join(__dirname + "/" + req.query.badgeId + "_list.json"), { encoding: 'utf8', flag: 'r' });
        data = JSON.parse(data);
        console.log("retour de la fonction", data);
        res.status(200).json(data);
    } catch (e) {
        console.log("retour de la fonction: file not exists", e);
        res.status(200).json([]);
    }
});

app.get('/api/persons', function (req, res) {
    // to read infos about client file 
    try {
        console.log("get file:", path.join(__dirname + "/" + req.query.surname + req.query.name + ".json"));
        let data = fs.readFileSync(path.join(__dirname + "/" + req.query.surname + req.query.name + ".json"), { encoding: 'utf8', flag: 'r' });
        data = JSON.parse(data);
        console.log("retour de la fonction", data);
        res.status(200).json(data);
    } catch (e) {
        console.log("retour de la fonction: file not exists", e);
        res.status(500).json({});
    }
});

app.get('/api/persons/avatar', function (req, res) {
    // to read infos about client file 
    res.download(path.join(__dirname + "/" + req.query.badgeId + ".png"), (err) => {
        if (err) {
            rand = Math.random() * 10;
            if (rand > 1)
                res.download(path.join(__dirname + "/" + "default" + ".png"));
            else
                res.sendStatus(500);
        }
    })
});

