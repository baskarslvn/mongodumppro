const showUrStuff = require('.');
const yargs = require('yargs');

const setServerCreds = ()=>{
    const options=[];
    if(yargs.argv){
        if(yargs.argv.host){
            options["--host"]=yargs.argv.host
        }
        if(yargs.argv.port){
            options["--port"] = yargs.argv.port;
        }

        // "--username", hostUsrNm, "--password", hostPassWord, "--authenticationDatabase", "admin"

        if(yargs.argv.username){
            options["--username"] = yargs.argv.username;
        }
        if(yargs.argv.query){
            options["--query"] = yargs.argv.query;
        }
        if(yargs.argv.password){
            options["--password"] = yargs.argv.password;
            // options.push("authenticationDatabase");
            // options.push("admin");
        }
        options["db"] = yargs.argv["db"];
        options["collection"] = yargs.argv["collection"];
        // console.log(`yo DUDE!!! ${options}`);
    }
    return options;
}

const processInputs = ()=>{
    // console.log(yargs.argv);
    if(yargs.argv && (yargs.argv['?'] || yargs.argv.h)){
        console.log(`
            Usage: mongodumperpro <options>

            Export the content of a running server into .bson files.(Using the mongodump library).

            general options:
                /?, /h                                                 print usage

            connection options:
                /host:<hostname>                                      mongodb host to
                                                                          connect to
                                                                          (setname/host1,host-
              
                                                                          2 for replica sets)
                    /port:<port>                                          server port (can
                                                                          also use --host
                                                                          hostname:port)
              
            authentication options:
                /u, /username:<username>                                  username for
                                                                          authentication
                /p, /password:<password>                                  password for
                                                                          authentication
                    /authenticationDatabase:<database-name>               database that holds
                                                                          the user's
                                                                          credentials
                    /authenticationMechanism:<mechanism>                  authentication
                                                                          mechanism to use
              
            namespace options:
                /d, /db:<database-name>                                   database to use
                /c, /collection:<collection-name>                         collection to use
        `);
    }else{
        showUrStuff(setServerCreds());
    }
}

processInputs();