require('dotenv').config({ debug: process.env.DEBUG })
const App = require('./app.js')
const log = require('./log.js')
const cmd = require('./cmd.js')
const isDev = (process.env.NODE_ENV === 'development')

// Paramètres par défaut
let args = {
	debug: (isDev || process.env.DEBUG),
	address: (process.env.address || ''),
	username: (process.env.user || ''),
	password: (process.env.password || ''),
	isUrlCall: false
}

// Récupère les arguments passés à l'app
let argv = process.argv[2]
if (argv) {
	args.isUrlCall = argv.includes('rdp://')
	if (args.isUrlCall) {
		argv = argv.replace('rdp://', '')
		argv = argv.substring(0, argv.length-1) // Retire le dernier '/' de l'URL
	}

	argv = argv.split('&')
	for (let index = 0; index < argv.length; index++) {
		const val = argv[index]
		if (val.includes('=')) {
			const arg = val.split('=')
			if (!isNaN(arg[1])) {
				args[arg[0]] = Number(arg[1])
			} else {
				args[arg[0]] = arg[1]
			}
		}
	}
}
if (args.debug) console.log(args)

// Vérification des arguments
if (!(args.address && args.username && args.password) && args.isUrlCall) {
	let error = 'Arguments incorrect\n'+process.argv[2] // mstsc.exe -help
	error += '\naddress='+args.address
	error += '\nusername='+args.username
	error += '\npassword='+args.password
	log(error, args.debug)
	return process.exit(error)
}

// Démarrage
async function start() {
	try {
		const app = new App(args)
		app.onEvent = (eventLog) => log(eventLog, args.debug)

		if (!args.isUrlCall && !process.argv[2]) {
			await app.install()

			// Suppression de l'installeur
			if ((!args.debug || !isDev) && !process.argv[0].includes(process.env.programData)) {
				await cmd.spawn(('echo "Installed successfully" && timeout /t 3 && del "'+process.argv[0]+'"'), [], {
					detached: true, shell: true
				})
			}
			setTimeout(() => process.exit(), 500)
		} else {
			await app.start()
			process.exit()
		}
	} catch (err) {
		if (args.isUrlCall) {
			log(JSON.stringify(err), args.debug)
		} else {
			console.error(err)
		}
		process.exit()
	}
}
start()
