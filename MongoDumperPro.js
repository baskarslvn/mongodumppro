/**
 * Library that extends the functionality of mongodump command.
 * Just give the server name and db name. voila! that db will be dumped.
 * Future functionality
 * includeCollections, excludeCollections, includeDbs, excludeDbs, 
 * query to be moved to args, authentications to be moved to args,
 * pause and resume from left spot.
 * 
 * requires child_process of NPM
 */
'use strict';
const { spawn } = require("child_process");
// const { exec } = require("child_process");
// const { eachSeries } = require("async");
const { series, eachSeries, eachOfSeries } = require("async");
const { strict } = require("assert");
const fs = require('fs');
const hostIP = "127.0.0.1";
const hostPort = "27017";
const hostUsrNm = "";
const hostPassWord = "";
const dumpDBNm = "";
const dumpQuery = "{}";
let dbNms = [];
let collNms = [];
let options = [];
const nameStore = {};
const avoidCollections = [];

//////////!fs functions////////////////
const fileFunction = (()=>{
    // let filePointer;
    let currentFileName;
    let currentProgress;
    return {
        createFile: (db, collections, next)=>{
            currentFileName = `${db}_dump_progress.json`;
            fs.open(currentFileName, "a+", (err, fdn)=>{
                if(err){
                    next();
                }else{
                    // filePointer = fdn;
                    const fileAsString = fs.readFileSync(currentFileName, "utf8");
                    let writeObj = {}
                    // console.log("fileAsStringh", fileAsString.length);
                    if(fileAsString.length>0){
                        writeObj = JSON.parse(fileAsString);
                        currentProgress = writeObj;
                        // console.log("current progress", currentProgress);
                        // console.log(currentProgress);
                        fs.close(fdn, ()=>{});
                        next();
                    }else{
                        for(let i=collections.length-1; i>=0; i--)
                            writeObj[collections[i]] = -1;
                        const buffer = new Buffer(JSON.stringify(writeObj));
                        // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^", fdn);
                        fs.write(fdn, buffer, 0, buffer.length, null, (err)=>{
                            currentProgress = writeObj;
                            fs.close(fdn, ()=>{});
                            // console.log("progress update attempted!!!");
                            next();
                        });
                    }
                }
            });
        },
        updateFile: (collection)=>{
            // fs.open(currentFileName, "w", (err, fdn)=>{
                // if(err){

                // }else{
                    // filePointer = fdn;
                    const writeObj = JSON.parse(fs.readFileSync(currentFileName+"", "utf8"));
                    writeObj[collection] = 0;
                    fs.writeFile(currentFileName, JSON.stringify(writeObj), (err)=>{
                        if(err){

                        }else{
                            currentProgress = writeObj;
                            // console.log("collection progress updated attempted!!!");
                        }
                    });
                // }
            // });
        },
        saveProgress: (collection, cb)=>{
            // fs.open(currentFileName, "w", (err, fdn)=>{
                // if(err){

                // }else{
                    // filePointer = fdn;
                    const writeObj = JSON.parse(fs.readFileSync(currentFileName, "utf8"));
                    writeObj[collection] = 1;
                    fs.writeFile(currentFileName, JSON.stringify(writeObj), (err)=>{
                        if(err){

                        }else{
                            currentProgress = writeObj;
                            console.log("dumping progress updated!!!");
                        }
                        cb();
                    });
                // }
            // });
        },
        getCurrentProgress:_=>currentProgress
    }
})();



////////////////////////////////////////

const dumpCollection = (collections, db, next)=>{
    series({
        createDbUpdateFile: (scb)=>{
            fileFunction.createFile(db, collections, scb);
        },
        dumpEachCollection: (scb)=>{
            eachSeries(collections, (coll, nextCollection)=>{
                // console.log(coll, fileFunction.getCurrentProgress()[coll])
                if(avoidCollections.indexOf(coll) != -1 || fileFunction.getCurrentProgress()[coll]==1){
                    console.log(`skipping by user pref/already dumped..${coll}`);
                    nextCollection();
                }else{
                    fileFunction.updateFile(coll);
                    console.log(`gonna dump...${coll} of ${db}`);
                    // console.log("pppppump options", options);
                    const dumpCmd = "mongodump";
                  
                    const dumpOptions = ["--db", db, "--collection", coll];
                    if(options["--host"]){
                        dumpOptions.push("--host");
                        dumpOptions.push(options["--host"]);
                    }
                    if(options["--port"]){
                        dumpOptions.push("--port");
                        dumpOptions.push(options["--port"]);
                    }
                    if(options["--username"]){
                        dumpOptions.push("--username");
                        dumpOptions.push(options["--username"]);
                    }
                    if(options["--password"]){
                        dumpOptions.push("--password");
                        dumpOptions.push(options["--password"]);
                        dumpOptions.push("--authenticationDatabase");
                        dumpOptions.push("admin");
                    }
                    if(options["--query"]){
                        dumpOptions.push("--query");
                        dumpOptions.push(options["--query"]);
                    }
                    
                    // console.log("dump options", dumpOptions);
                    //TODO outfolder and dumpOptions to be changes upon user input
                    // const dumpOptions = ["--host", hostIP, "--port", hostPort, "-d", dumpDBNm, "-c", collection, "--query", dumpQuery,
                    // "--username", hostUsrNm, "--password", hostPassWord, "--authenticationDatabase", "admin"];
                    
                    const ls = spawn(dumpCmd, dumpOptions);

                    ls.stdout.on("data", data => {
                        console.log(`stdout: ${data}`);
                    });
        
                    ls.stderr.on("error", data => {
                        console.log(`stderr: ${data}`);
                    });
        
                    ls.on('error', (error) => {
                        console.log(`error: ${error.message}`);
                        nextCollection(error);
                    });
        
                    ls.on("close", code => {
                        console.log("code", code);
                        if(code === 0 ){
                            fileFunction.saveProgress(coll, ()=>{
                                console.log(`success dumping ${coll} of ${db}`);
                                nextCollection();
                            });
                            // fs.writeFile(``, )
                        }else{
                            console.log(`error dumping ${coll} of ${db}`);
                            // console.log(`child process exited with code ${code}`);
                            nextCollection();
                        }
                    });
                }
            }, (err)=>{
                scb();
            });
        }
    }, (err)=>{
        next();
    });
}

const startDumping = ()=>{
    series({
        processInputs: ()=>{},
        dumpDbs: ()=>{

        }
    }, ()=>{});
}

/* eachSeries(testCollectionNames, dumpCollection, (err)=>{
    if(err){
        console.log(`error occured while dumping ${dumpDBNm}`);
        console.log(err);
    }else{
        console.log(`success dumping all given collections of ${dumpDBNm}`);
    }
}); */

let dbs;
let print = false;
let newArr = [];
// let count = 1;
const showOnCmd = ()=>{
    // console.log("final"+count);
    // count++;
    // console.log("##################", dbs.indexOf("+=boss=+"));
    print = (print || (dbs.indexOf("admin")!=-1) ||  (dbs.indexOf("+=boss=+")!=-1) ) && !dbs.startsWith("bye");
    let index=-1;
    if(print){
        index = dbs.indexOf("+=boss=+");
        // console.log(dbs);
        // newArr.push();
        let spaceStarts = false;
        let lineEnds = false;
        let dbNm = "";

        let afterBoss=false;
        for(let i=0; i<dbs.length; i++){
            // if(index>0 && i>index && ((afterBoss=afterBoss || (dbs[i]=='\n')) )){
            if(index>0 && i>index ){
                spaceStarts = (spaceStarts || dbs[i] == ' ' || dbs[i] == '\r');
                lineEnds = dbs[i] == "\n";
                if(!spaceStarts){
                    dbNm += dbs[i];
                    // console.log("adding line");
                    // console.log(dbNm);
                    // console.log(dbs[i]);
                }else if(lineEnds){
                    spaceStarts = false;
                    newArr.push(dbNm.trim());
                    // console.log("break line");
                    // console.log(dbNm);
                    dbNm ="";
                }
            }else{
                spaceStarts = (spaceStarts || dbs[i] == ' ');
                lineEnds = dbs[i] == "\n";
                if(!spaceStarts){
                    dbNm += dbs[i];
                    // console.log("adding line");
                    // console.log(dbNm);
                    // console.log(dbs[i]);
                }else if(lineEnds){
                    spaceStarts = false;
                    newArr.push(dbNm.trim());
                    // console.log("break line");
                    // console.log(dbNm);
                    dbNm ="";
                }
            }
           
        }
    }else{
        print = false;
        // newArr = []; //remove onn undesired results
    }
    // console.log("_____________________",newArr);
    dbs = "";
    return newArr;
    // for(let i=0; i<dbs.length;i++){
    //     console.log(dbs[i]);
    // }
};

// let cmdOutput = "";
//genearal functions
const excuteCommandInCMD = (()=>{
    let ls;
    return {
        execute : (command, options, subCmd, storeIn, next)=>{
            let cmdOutput = "";
            collNms = [];
            options.splice(options.indexOf("--query"), 2);
            ls = spawn(command, options);
            // console.log("options,,,,,,,,,,,"+ command+"==="+options);

            ls.on("spawn", ()=>{
                console.log("==============");
                // cb();
            });

            if(subCmd){
                if(Array.isArray(subCmd)){
                    newArr = [];
                    for(let i=0; i<subCmd.length; i++){
                        // console.log("subcmd",subCmd[i]);
                        if(i==1){
                            ls.stdin.write("print('+=boss=+') \n");
                        }
                        ls.stdin.write(subCmd[i]+"\n");
                    }
                    ls.stdin.end();
                }else{
                    newArr = [];
                    // console.log("subcmd",subCmd);
                    ls.stdin.write(subCmd);
                    ls.stdin.end();
                }
                // console.log("<!!");
            }

            ls.stdout.on("data", data => {
                // dbs = data.toString();
                cmdOutput+= data;
                // if(storeIn == "DB")
                //     dbNms = showOnCmd();
                // else
                //     collNms = showOnCmd();
                // console.log("()()()()()(");
                // console.log(`stdout: ${data}`);
            });

            ls.stderr.on("error", data => {
                console.error(`stderr: ${data}`);
            });

            ls.on('error', (error) => {
                console.log(`error: ${error.message}`);
                next(err);
            });

            ls.on("close", code => {
                // console.log("**************************************");
                // console.log(cmdOutput);
                dbNms = [];
                collNms = [];
                dbs += cmdOutput;
                if(storeIn == "DB")
                    dbNms = showOnCmd();
                else
                    collNms = showOnCmd();
                // console.log("()()()()()(");
                // console.log(`child process exited with code ${code}`);
                next();
            });
        },
        kill : ()=>{
            ls.stdin.end();
        },
        getProcess : ()=>{
            return ls;
        },
        execSubCmd : ()=>{
        // excuteCommandInCMD.getProcess().stdin.write("show dbs");
            ls.stdin.write("show dbs");
        }
    }
})();

////////////////////
// mongo client shell functions
const getAllDbs = (cb)=>{ 
    // const options = setServerCreds();
    excuteCommandInCMD.execute("mongo", options, "show dbs", "DB", (err)=>{
        dbNms.splice(0, dbNms.indexOf("admin"));
        console.log("DB List", dbNms);
        cb();
    });
  
};

const getAllCollections = (dbNm, cb)=>{
    let colOptions = JSON.parse(JSON.stringify(options));
    // colOptions.push("--db");
    // colOptions.push(dbNm);
    excuteCommandInCMD.execute("mongo", colOptions, [`use ${dbNm}`,"show collections"], undefined, (err)=>{
        // collNms.shift();
        collNms.splice(0, (collNms.indexOf("+=boss=+")+1));
        collNms.pop();
        // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
        // console.log(collNms);
        nameStore[dbNm] = collNms;
        collNms = [];
        cb();
    });
    // console.log(colOptions, "*********ALL COLLECTIONS************ "+ dbNm);
}

module.exports = function operate(inp){
    series({
        // setServerCreds: (scb)=>{
            // processInputs();
            // options = setServerCreds();
            // scb();
        // },
        getAllDbs: (scb)=>{
            options = inp;
            // console.log("options", options);
            if(!options["db"]){
                getAllDbs(scb);
                // scb();
            }else{
                dbNms = [options["db"]];
                scb();
            }
        }, 
        getAllCollections: (scb)=>{
            // if(!options["collection"] && options["db"]){
            //     getAllCollections(scb);
            //     // scb();
            // }else{
                if(!options["collection"]){
                    // console.log("fgeting al collections..........");
                    // console.log(dbNms);
                    eachSeries(dbNms, getAllCollections, (err)=>{
                        scb();
                    });
                }else{
                    for(let i=dbNms.length-1; i>=0; i--){
                        nameStore[dbNms[i]] = [options["collection"]];
                    }
                    // console.log("********************");
                    // console.log(nameStore);
                    scb();
                }
                
                // dbNms = options["collection"];
                // scb();
            // }
        },
        dumpCollections: (scb)=>{
            eachOfSeries(nameStore, dumpCollection, (err)=>{
                console.log(";-) :-p")
                scb();
            });
        }
    }, (err)=>{
        console.log("execution ended..................");
        console.log(nameStore);
    });
};




