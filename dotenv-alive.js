const fs = require('fs')
const path = require('path')

let cwd = require.main ? path.dirname(require.main.filename) : process.cwd()

let dotenvfiles = require('./dotenvfiles.json')
let localfiles = fs.readdirSync(cwd)
let validFile = dotenvfiles.filter(file => localfiles.includes(file)).shift()
let lastEnv = {}

// updateConfig returns true if it can parse the file. On success, watch file for changes.
updateConfig() && fs.watch(validFile, updateConfig)

function updateConfig(event, filename){
    if(validFile && event != 'rename'){
        try {
            console.log(`Updating environemnet from ${cwd}/${validFile}`)
            let fileBuffer = fs.readFileSync(validFile)
            let nextEnv = parseENVorJSON(fileBuffer.toString())
            for(var key in lastEnv){
                if(!nextEnv[key]) delete process.env[key]
            }
            for(var key in nextEnv){
                process.env[key] = nextEnv[key]
            }
            lastEnv = nextEnv
            return true // if file failed to open, this gets skipped, returns undefined, and fs.watch doesn't get invoked.
        } catch(e){
            switch(e.code){
                case 'ENOENT': console.error(`${cwd}/${validFile} does not exist`); break;
                case 'EACCES': console.error(`${cwd}/${validFile} is unable to be read due to file permissions`); break;
                default: console.error(`Unexpected Error:`, e)
            }
            return false
        }
    } else {
        console.error(`Unable to find a dotenv file in ${cwd}, skipping.`)
        return false
    }
}

function parseENVorJSON(fileContents){
    try {
        return JSON.parse(fileContents)
    } catch(e){
        return fileContents.split('\n').filter(line => {
            return line[0] != '#' && line.includes('=')
        }).map(line => {
            var key = line.slice(0, line.indexOf('=')).trim()
            var val = line.slice(line.indexOf('=') + 1).trim()
            return {[key]: val}
        }).reduce((a,b) => Object.assign(a,b), {})
    }
}